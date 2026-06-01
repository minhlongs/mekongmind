from __future__ import annotations

"""Mekong CLI - LLM Provider Abstractions.

Pluggable provider interface. Subclass LLMProvider to add new backends.
Built-in: GeminiProvider, OpenAICompatibleProvider, OfflineProvider.
"""

from abc import ABC, abstractmethod  # noqa: E402
from dataclasses import dataclass  # noqa: E402
from typing import Any, Optional  # noqa: E402

import json  # noqa: E402
import logging  # noqa: E402
import os  # noqa: E402
import random  # noqa: E402
import time  # noqa: E402
import urllib.error  # noqa: E402
import urllib.request  # noqa: E402

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Response from LLM call."""

    content: str
    model: str = ""
    usage: Optional[dict[str, int]] = None
    raw: Optional[dict[str, Any]] = None

    def __post_init__(self) -> None:
        if self.usage is None:
            self.usage = {}
        if self.raw is None:
            self.raw = {}


class LLMProvider(ABC):
    """Abstract LLM provider. Subclass to add new providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique provider identifier (used as circuit-breaker key)."""
        ...

    @abstractmethod
    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        """Send chat request. Raise on failure (caller handles failover)."""
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if provider is configured and usable."""
        ...


# ---------------------------------------------------------------------------
# GeminiProvider
# ---------------------------------------------------------------------------

class GeminiProvider(LLMProvider):
    """Google GenAI (Gemini) provider via google-genai SDK."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-pro") -> None:
        self._api_key = api_key
        self._default_model = model
        self._client = None
        self._available = False

        if not api_key:
            return

        # Lazy import — catch if SDK not installed
        try:
            from google import genai  # type: ignore

            # Remove GOOGLE_API_KEY to prevent SDK conflict
            os.environ.pop("GOOGLE_API_KEY", None)
            self._client = genai.Client(api_key=api_key)
            self._available = True
        except ImportError:
            logger.warning("[GeminiProvider] google-genai not installed — disabled")

    @property
    def name(self) -> str:
        return "gemini"

    def is_available(self) -> bool:
        return self._available

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        if not self._client:
            msg = "GeminiProvider not available (SDK missing or no key)"
            raise RuntimeError(msg)

        # Remove GOOGLE_API_KEY at call time too
        os.environ.pop("GOOGLE_API_KEY", None)

        # Ensure client is initialized (may be needed after key set post-init)
        if not self._client:
            from google import genai  # type: ignore
            self._client = genai.Client(api_key=self._api_key)

        system_instruction = None
        prompt_parts: list[str] = []

        for m in messages:
            role = m.get("role", "")
            content = m.get("content", "")
            if role == "system":
                system_instruction = content
            elif role == "user":
                prompt_parts.append(content)

        prompt_text = "\n\n".join(prompt_parts) if prompt_parts else ""

        if not prompt_text.strip():
            logger.warning("[GeminiProvider] Empty prompt")
            msg = "Empty prompt"
            raise ValueError(msg)

        config: dict[str, Any] = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        }
        if json_mode:
            config["response_mime_type"] = "application/json"
        if system_instruction:
            config["system_instruction"] = system_instruction

        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.debug(
                    "[GeminiProvider] %s attempt %d/%d", model, attempt + 1, max_retries,
                )
                response = self._client.models.generate_content(
                    model=model,
                    contents=prompt_text,
                    config=config,
                )

                text = None
                try:
                    text = response.text
                except (ValueError, AttributeError):
                    if (
                        response.candidates
                        and response.candidates[0].content
                        and response.candidates[0].content.parts
                    ):
                        text = response.candidates[0].content.parts[0].text

                finish_reason = "unknown"
                if response.candidates:
                    finish_reason = str(response.candidates[0].finish_reason)

                if not text:
                    logger.warning(
                        "[GeminiProvider] Empty response (attempt %d), reason=%s",
                        attempt + 1, finish_reason,
                    )
                    if attempt < max_retries - 1:
                        time.sleep(random.uniform(0, 2 ** attempt))
                        continue
                    msg = f"Empty response after {max_retries} attempts"
                    raise RuntimeError(msg)

                tokens = 0
                if response.usage_metadata:
                    tokens = response.usage_metadata.total_token_count

                return LLMResponse(
                    content=text,
                    model=model,
                    usage={"total_tokens": tokens},
                    raw={"finish_reason": finish_reason},
                )

            except Exception as e:
                error_str = str(e).lower()
                retryable = any(
                    kw in error_str
                    for kw in ["429", "resource_exhausted", "quota", "503", "500",
                               "deadline", "timeout", "unavailable"]
                )
                if retryable and attempt < max_retries - 1:
                    delay = random.uniform(0, 2 ** attempt)
                    logger.warning(
                        "[GeminiProvider] Retryable error (attempt %d): %s. Retry in %.1fs",
                        attempt + 1, e, delay,
                    )
                    time.sleep(delay)
                    continue
                logger.exception("[GeminiProvider] Failed: %s", e)
                raise

        msg = "GeminiProvider: all retries exhausted"
        raise RuntimeError(msg)


# ---------------------------------------------------------------------------
# OpenAICompatibleProvider
# ---------------------------------------------------------------------------

class OpenAICompatibleProvider(LLMProvider):
    """OpenAI-compatible REST provider.

    Works with: OpenAI, Anthropic proxy, Ollama, vLLM, any OpenAI-compatible,
    and any endpoint that implements /chat/completions.
    Uses urllib (stdlib) — no requests dependency.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str = "",
        model: str = "",
        provider_name: str = "openai_compatible",
        timeout: int = 60,
    ) -> None:
        self._base_url = base_url.rstrip("/") if base_url else ""
        self._api_key = api_key
        self._default_model = model
        self._provider_name = provider_name
        self._timeout = timeout

    @property
    def name(self) -> str:
        return self._provider_name

    def is_available(self) -> bool:
        return bool(self._base_url)

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        if not self._base_url:
            msg = f"{self.name}: no base_url configured"
            raise RuntimeError(msg)

        # === MODEL ALIAS RESOLUTION ===
        from src.core.model_alias import resolve_model
        use_model = resolve_model(model or self._default_model, self._provider_name)
        # === END MODEL ALIAS ===
        payload: dict[str, Any] = {
            "model": use_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        url = f"{self._base_url}/chat/completions"
        logger.debug("[%s] POST %s model=%s", self.name, url, use_model)

        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            msg = f"{self.name} HTTP {e.code}: {e.reason}"
            raise RuntimeError(
                msg,
            ) from e
        except urllib.error.URLError as e:
            msg = f"{self.name} connection error: {e}"
            raise RuntimeError(msg) from e

        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})

        return LLMResponse(
            content=content,
            model=data.get("model", use_model),
            usage=usage,
            raw=data,
        )


# ---------------------------------------------------------------------------
# AnthropicCompatibleProvider
# ---------------------------------------------------------------------------

class AnthropicCompatibleProvider(LLMProvider):
    """Anthropic Messages API provider.

    Works with direct Anthropic and Claude gateways such as
    https://claude.zunef.com/v1/ai. This is intentionally separate from
    OpenAICompatibleProvider because these gateways expose /v1/messages, not
    /chat/completions.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str = "",
        model: str = "",
        provider_name: str = "anthropic",
        timeout: int = 60,
        api_version: str = "2023-06-01",
    ) -> None:
        self._base_url = _normalize_anthropic_base_url(base_url) if base_url else ""
        self._api_key = api_key
        self._default_model = model or _default_anthropic_model(self._base_url)
        self._provider_name = provider_name
        self._timeout = timeout
        self._api_version = api_version

    @property
    def name(self) -> str:
        return self._provider_name

    def is_available(self) -> bool:
        return bool(self._base_url)

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        if not self._base_url:
            msg = f"{self.name}: no base_url configured"
            raise RuntimeError(msg)

        use_model = model or self._default_model
        system_prompt = "\n\n".join(
            m.get("content", "") for m in messages if m.get("role") == "system"
        )
        chat_messages = [
            {
                "role": "assistant" if m.get("role") == "assistant" else "user",
                "content": m.get("content", ""),
            }
            for m in messages
            if m.get("role") != "system"
        ]

        payload: dict[str, Any] = {
            "model": use_model,
            "messages": chat_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if system_prompt:
            payload["system"] = system_prompt
        if json_mode:
            payload["system"] = (
                f"{system_prompt}\n\nReturn valid JSON only.".strip()
                if system_prompt else "Return valid JSON only."
            )

        headers: dict[str, str] = {
            "Content-Type": "application/json",
            "anthropic-version": self._api_version,
        }
        if self._api_key:
            headers["x-api-key"] = self._api_key
        headers.update(_anthropic_custom_headers(self._base_url))

        url = _anthropic_messages_url(self._base_url)
        logger.debug("[%s] POST %s model=%s", self.name, url, use_model)

        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                raw_body = resp.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8", errors="replace")[:500]
            msg = f"{self.name} HTTP {e.code}: {error_body or e.reason}"
            raise RuntimeError(msg) from e
        except urllib.error.URLError as e:
            msg = f"{self.name} connection error: {e}"
            raise RuntimeError(msg) from e

        data, text = _parse_anthropic_response(raw_body)

        usage_raw = data.get("usage", {})
        usage = {
            "prompt_tokens": usage_raw.get("input_tokens", 0),
            "completion_tokens": usage_raw.get("output_tokens", 0),
            "total_tokens": (
                usage_raw.get("input_tokens", 0)
                + usage_raw.get("output_tokens", 0)
            ),
        }

        return LLMResponse(
            content=text,
            model=data.get("model", use_model),
            usage=usage,
            raw=data,
        )


def _anthropic_messages_url(base_url: str) -> str:
    base = _normalize_anthropic_base_url(base_url)
    if base.endswith("/messages"):
        return base
    if "zunef.com" in base.lower():
        return f"{base}/messages"
    if base.endswith("/v1"):
        return f"{base}/messages"
    return f"{base}/v1/messages"


def _normalize_anthropic_base_url(base_url: str) -> str:
    base = base_url.rstrip("/")
    if (
        os.getenv("ANTHROPIC_ZUNEF_PRESERVE_HOST") != "1"
        and base.lower().startswith("https://claude.zunef.com")
    ):
        return "https://claude-api.zunef.com" + base[len("https://claude.zunef.com"):]
    return base


def _default_anthropic_model(base_url: str) -> str:
    configured = os.getenv("ANTHROPIC_MODEL", "") or os.getenv("LLM_MODEL", "")
    if configured:
        return configured
    if "zunef.com" in base_url.lower():
        return "claude-sonnet-4-6-20250514"
    return "claude-sonnet-4-6-20250514"


def _anthropic_custom_headers(base_url: str) -> dict[str, str]:
    headers: dict[str, str] = {}
    custom = os.getenv("ANTHROPIC_CUSTOM_HEADERS", "").strip()
    if custom:
        for item in custom.replace("\n", ",").split(","):
            if ":" not in item:
                continue
            name, value = item.split(":", 1)
            if name.strip() and value.strip():
                headers[name.strip()] = value.strip()
    elif "zunef.com" in base_url.lower():
        headers["X-ZUNEF-CLIENT"] = "claude-code"
    return headers


def _parse_anthropic_response(raw_body: str) -> tuple[dict[str, Any], str]:
    if not raw_body.lstrip().startswith("event:"):
        data = json.loads(raw_body)
        content_blocks = data.get("content", [])
        text = "".join(
            block.get("text", "")
            for block in content_blocks
            if block.get("type") == "text"
        )
        return data, text

    text_parts: list[str] = []
    model = ""
    usage: dict[str, int] = {}
    for line in raw_body.splitlines():
        line = line.strip()
        if not line.startswith("data: "):
            continue
        data_str = line[6:]
        if data_str == "[DONE]":
            continue
        try:
            event = json.loads(data_str)
        except json.JSONDecodeError:
            continue
        if event.get("type") == "message_start":
            message = event.get("message", {})
            model = message.get("model", model)
            usage.update(message.get("usage", {}) or {})
        elif event.get("type") == "message_delta":
            usage.update(event.get("usage", {}) or {})
        elif event.get("type") == "content_block_delta":
            delta = event.get("delta", {})
            if "text" in delta:
                text_parts.append(delta.get("text", ""))

    return {
        "content": [{"type": "text", "text": "".join(text_parts)}],
        "model": model,
        "usage": usage,
        "raw_sse": True,
    }, "".join(text_parts)


# ---------------------------------------------------------------------------
# OfflineProvider
# ---------------------------------------------------------------------------

class OfflineProvider(LLMProvider):
    """Placeholder provider — returns offline messages when no LLM is available."""

    @property
    def name(self) -> str:
        return "offline"

    def is_available(self) -> bool:
        return True  # Always "available" as last-resort fallback

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        user_msg = "unknown"
        for m in reversed(messages):
            if m.get("role") == "user":
                user_msg = m.get("content", "")
                break

        content = f"[OFFLINE MODE] LLM unavailable. Request: {user_msg[:200]}"
        return LLMResponse(content=content, model="offline")


# ---------------------------------------------------------------------------
# LiteLLMProvider (Proxy)
# ---------------------------------------------------------------------------

class LiteLLMProvider(LLMProvider):
    """LiteLLM proxy provider — unified gateway with auto-failback."""

    def __init__(
        self,
        base_url: str = "http://localhost:4000",
        api_key: str = "sk-mekong-local",
        model: str = "default",
    ) -> None:
        self._base_url = base_url.rstrip("/") if base_url else ""
        self._api_key = api_key
        self._default_model = model
        self._available = False

        # Test connection
        if self._base_url:
            try:
                import httpx
                resp = httpx.get(f"{self._base_url}/health", timeout=2.0)
                self._available = resp.status_code == 200
            except Exception:
                self._available = False

    @property
    def name(self) -> str:
        return "litellm"

    def is_available(self) -> bool:
        return self._available

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool,
    ) -> LLMResponse:
        """Send chat through LiteLLM proxy with auto-failback."""
        if not self._base_url:
            msg = "LiteLLM: no base_url configured"
            raise RuntimeError(msg)

        # Lazy import httpx
        try:
            import httpx
        except ImportError:
            logger.warning("[LiteLLMProvider] httpx not installed — falling back")
            return LLMResponse(content="[LiteLLM] httpx not installed", model="litellm")

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model or self._default_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        url = f"{self._base_url}/v1/chat/completions"
        logger.debug("[LiteLLM] POST %s model=%s", url, model)

        try:
            client = httpx.Client(timeout=120.0)
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            cost = data.get("_hidden_params", {}).get("response_cost", 0)

            logger.debug("[LiteLLM] Cost: $%.6f", cost)

            return LLMResponse(
                content=content,
                model=data.get("model", model),
                usage=usage,
                raw={"cost": cost, **data},
            )

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning("[LiteLLM] Budget exceeded — falling back to local")
            else:
                logger.exception("[LiteLLM] HTTP error: %s", e)
            raise
        except httpx.ConnectError:
            logger.warning("[LiteLLM] Proxy unreachable — falling back")
            raise
        finally:
            if "client" in locals():
                client.close()


__all__ = [
    "GeminiProvider",
    "LLMProvider",
    "LLMResponse",
    "LiteLLMProvider",
    "OfflineProvider",
    "OpenAICompatibleProvider",
]
