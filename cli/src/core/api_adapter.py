"""ALGO 6 — API Adapter.

Unified interface for cloud LLM providers (Anthropic, Google, OpenAI).
Routes to correct SDK based on model_id detection.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, AsyncIterator
from urllib.error import HTTPError

from src.core.model_selector import ModelConfig

logger = logging.getLogger(__name__)

ANTHROPIC_DEFAULT_BASE_URL = "https://api.anthropic.com"


def _env_float(name: str, default: float) -> float:
    """Read a positive float env var, falling back on invalid values."""
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        value = float(raw)
    except ValueError:
        logger.warning("Invalid %s=%r; using %.1fs", name, raw, default)
        return default
    return value if value > 0 else default


def detect_provider(model_id: str) -> str:
    """Detect cloud provider from model ID."""
    if model_id.startswith("ollama:"):
        return "ollama"
    if "claude" in model_id:
        return "anthropic"
    if "gemini" in model_id:
        return "google"
    if "gpt" in model_id:
        return "openai"
    raise ValueError(f"Unknown provider for model: {model_id}")


def _get_api_key(provider: str) -> str:
    """Get API key for provider from environment."""
    key_map = {
        "anthropic": ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "LLM_API_KEY"),
        "google": ("GOOGLE_API_KEY",),
        "openai": ("OPENAI_API_KEY",),
    }
    env_vars = key_map.get(provider, ())
    for env_var in env_vars:
        key = os.getenv(env_var, "")
        if key:
            return key
    raise OSError(f"Missing API key: {' or '.join(env_vars) or provider}")


def _get_anthropic_base_url() -> str:
    """Resolve the Anthropic-compatible base URL.

    `ANTHROPIC_BASE_URL` is authoritative. As a compatibility bridge for
    Claude gateway deployments, accept `LLM_BASE_URL` only when it clearly
    points at an Anthropic/Claude endpoint, avoiding accidental use of generic
    OpenAI-compatible routers.
    """
    explicit = os.getenv("ANTHROPIC_BASE_URL", "").strip()
    if explicit:
        return _normalize_anthropic_base_url(explicit)

    universal = os.getenv("LLM_BASE_URL", "").strip()
    if universal and any(marker in universal.lower() for marker in ("anthropic", "claude")):
        return _normalize_anthropic_base_url(universal)

    return ANTHROPIC_DEFAULT_BASE_URL


def _normalize_anthropic_base_url(base_url: str) -> str:
    base = base_url.rstrip("/")
    if (
        os.getenv("ANTHROPIC_ZUNEF_PRESERVE_HOST") != "1"
        and base.lower().startswith("https://claude.zunef.com")
    ):
        return "https://claude-api.zunef.com" + base[len("https://claude.zunef.com"):]
    return base


def _anthropic_messages_url(base_url: str) -> str:
    """Build the Messages API URL without double-appending the path."""
    base = _normalize_anthropic_base_url(base_url)
    if base.endswith("/messages"):
        return base
    if "zunef.com" in base.lower():
        return f"{base}/messages"
    if base.endswith("/v1"):
        return f"{base}/messages"
    return f"{base}/v1/messages"


def _anthropic_headers(api_key: str) -> dict[str, str]:
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    custom = os.getenv("ANTHROPIC_CUSTOM_HEADERS", "").strip()
    if custom:
        for item in custom.replace("\n", ",").split(","):
            if ":" not in item:
                continue
            name, value = item.split(":", 1)
            if name.strip() and value.strip():
                headers[name.strip()] = value.strip()
    elif "zunef.com" in _get_anthropic_base_url().lower():
        headers["X-ZUNEF-CLIENT"] = "claude-code"
    return headers


def _streaming_timeout() -> dict[str, float]:
    return {
        "total": _anthropic_timeout(),
        "connect": _env_float("ANTHROPIC_CONNECT_TIMEOUT_SECONDS", 10.0),
        "sock_read": _env_float("ANTHROPIC_READ_TIMEOUT_SECONDS", 90.0),
    }


def _anthropic_timeout() -> float:
    """Total request timeout for sync and async Anthropic calls."""
    return _env_float("ANTHROPIC_TIMEOUT_SECONDS", _env_float("LLM_TIMEOUT_SECONDS", 300.0))


def _anthropic_text_from_body(raw_body: str) -> str:
    if not raw_body.lstrip().startswith("event:"):
        data = json.loads(raw_body)
        return "".join(b.get("text", "") for b in data.get("content", []))

    parts: list[str] = []
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
        if event.get("type") == "content_block_delta":
            delta = event.get("delta", {})
            if "text" in delta:
                parts.append(delta.get("text", ""))
    return "".join(parts)


def format_for_openai(messages: list[dict], system_prompt: str | None) -> list[dict]:
    """Format messages for OpenAI API (system as first message)."""
    result = []
    if system_prompt:
        result.append({"role": "system", "content": system_prompt})
    result.extend(messages)
    return result


def format_for_gemini(messages: list[dict], system_prompt: str | None) -> list[dict]:
    """Format messages for Gemini API."""
    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": system_prompt}]})
        contents.append({"role": "model", "parts": [{"text": "Understood."}]})
    for msg in messages:
        role = "model" if msg["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    return contents



class APIAdapter:
    """Unified adapter for cloud LLM providers with connection reuse."""

    def __init__(self) -> None:
        self._session: Any = None

    async def _get_session(self) -> Any:
        """Get or create a reused aiohttp session with connection pooling."""
        import aiohttp

        if self._session is None or getattr(self._session, "closed", False):
            session_kwargs: dict[str, Any] = {"headers": {"connection": "keep-alive"}}
            if hasattr(aiohttp, "TCPConnector"):
                session_kwargs["connector"] = aiohttp.TCPConnector(
                    limit=20,
                    limit_per_host=10,
                    ttl_dns_cache=300,
                    keepalive_timeout=30,
                )
            if hasattr(aiohttp, "ClientTimeout"):
                session_kwargs["timeout"] = aiohttp.ClientTimeout(**_streaming_timeout())
            try:
                self._session = aiohttp.ClientSession(**session_kwargs)
            except TypeError:
                self._session = aiohttp.ClientSession()
        return self._session

    async def close(self) -> None:
        """Close the underlying HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()

    async def __aenter__(self) -> "APIAdapter":
        return self

    async def __aexit__(self, *exc) -> None:
        await self.close()

    async def generate(
        self,
        model_config: ModelConfig,
        messages: list[dict],
        system_prompt: str | None = None,
    ) -> AsyncIterator[str]:
        """Stream generate from cloud provider."""
        provider = detect_provider(model_config.model_id)
        if provider == "anthropic":
            async for token in self._generate_anthropic(model_config, messages, system_prompt):
                yield token
        elif provider == "google":
            async for token in self._generate_google(model_config, messages, system_prompt):
                yield token
        elif provider == "openai":
            async for token in self._generate_openai(model_config, messages, system_prompt):
                yield token
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def _generate_anthropic(
        self, config: ModelConfig, messages: list[dict], system_prompt: str | None
    ) -> AsyncIterator[str]:
        """Generate via Anthropic API using HTTP with connection reuse."""
        api_key = _get_api_key("anthropic")
        base_url = _get_anthropic_base_url()
        url = _anthropic_messages_url(base_url)
        payload = {
            "model": config.model_id,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "messages": messages,
            "stream": True,
        }
        if system_prompt:
            payload["system"] = system_prompt
        headers = _anthropic_headers(api_key)
        session = await self._get_session()
        async with session.post(url, json=payload, headers=headers) as resp:
            if resp.status >= 400:
                body = await resp.text()
                raise OSError(f"Anthropic API error {resp.status}: {body[:500]}")

            yielded = False
            async for line in resp.content:
                text = line.decode("utf-8").strip()
                if not text or not text.startswith("data: "):
                    continue
                data_str = text[6:]
                if data_str == "[DONE]":
                    break
                try:
                    event = json.loads(data_str)
                    delta = event.get("delta", {})
                    content = delta.get("text", "")
                    if content:
                        yielded = True
                        yield content
                except json.JSONDecodeError:
                    continue
            if not yielded:
                raise OSError("Anthropic stream returned no content")

    async def _generate_google(
        self, config: ModelConfig, messages: list[dict], system_prompt: str | None
    ) -> AsyncIterator[str]:
        """Generate via Google Gemini API using HTTP with connection reuse."""
        api_key = _get_api_key("google")
        contents = format_for_gemini(messages, system_prompt)
        payload = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": config.max_tokens,
                "temperature": config.temperature,
            },
        }
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{config.model_id}:streamGenerateContent?alt=sse&key={api_key}"
        )
        session = await self._get_session()
        async with session.post(url, json=payload) as resp:
            async for line in resp.content:
                text = line.decode("utf-8").strip()
                if not text or not text.startswith("data: "):
                    continue
                try:
                    event = json.loads(text[6:])
                    candidates = event.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for part in parts:
                            if part.get("text"):
                                yield part["text"]
                except json.JSONDecodeError:
                    continue

    async def _generate_openai(
        self, config: ModelConfig, messages: list[dict], system_prompt: str | None
    ) -> AsyncIterator[str]:
        """Generate via OpenAI API using HTTP with connection reuse."""
        api_key = _get_api_key("openai")
        formatted = format_for_openai(messages, system_prompt)
        payload = {
            "model": config.model_id,
            "messages": formatted,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        session = await self._get_session()
        async with session.post(
            "https://api.openai.com/v1/chat/completions",
            json=payload,
            headers=headers,
        ) as resp:
            async for line in resp.content:
                text = line.decode("utf-8").strip()
                if not text or not text.startswith("data: "):
                    continue
                data_str = text[6:]
                if data_str == "[DONE]":
                    break
                try:
                    event = json.loads(data_str)
                    delta = event["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue

    def generate_sync(
        self,
        model_config: ModelConfig,
        messages: list[dict],
        system_prompt: str | None = None,
    ) -> str:
        """Synchronous generation (non-streaming)."""
        provider = detect_provider(model_config.model_id)
        api_key = _get_api_key(provider)
        if provider == "anthropic":
            return self._sync_anthropic(model_config, messages, system_prompt, api_key)
        if provider == "google":
            return self._sync_google(model_config, messages, system_prompt, api_key)
        if provider == "openai":
            return self._sync_openai(model_config, messages, system_prompt, api_key)
        return ""

    def _sync_anthropic(self, config, messages, system_prompt, api_key):
        import urllib.request
        base_url = _get_anthropic_base_url()
        url = _anthropic_messages_url(base_url)
        payload = {
            "model": config.model_id,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "messages": messages,
        }
        if system_prompt:
            payload["system"] = system_prompt
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers=_anthropic_headers(api_key),
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=_anthropic_timeout()) as resp:
                return _anthropic_text_from_body(resp.read().decode("utf-8", errors="replace"))
        except HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")[:500]
            logger.error("Anthropic sync failed: HTTP %s %s", e.code, body)
            return ""
        except Exception as e:
            logger.error("Anthropic sync failed: %s", e)
            return ""

    def _sync_google(self, config, messages, system_prompt, api_key):
        import urllib.request
        contents = format_for_gemini(messages, system_prompt)
        payload = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": config.max_tokens,
                "temperature": config.temperature,
            },
        }
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{config.model_id}:generateContent?key={api_key}"
        )
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read())
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    return "".join(p.get("text", "") for p in parts)
            return ""
        except Exception as e:
            logger.error("Google sync failed: %s", e)
            return ""

    def _sync_openai(self, config, messages, system_prompt, api_key):
        import urllib.request
        formatted = format_for_openai(messages, system_prompt)
        payload = {
            "model": config.model_id,
            "messages": formatted,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
        }
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read())
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error("OpenAI sync failed: %s", e)
            return ""
