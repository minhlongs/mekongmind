"""Extended coverage tests for src/core/api_adapter.py.

Targets uncovered paths:
- _get_api_key (missing key raises, known/unknown providers)
- format_for_gemini (system prompt branch, role mapping)
- APIAdapter.generate_sync (all three provider branches + error paths)
- APIAdapter._sync_anthropic / _sync_google / _sync_openai (urllib mocking)
"""
from __future__ import annotations

import json
import sys
import types
from unittest.mock import MagicMock, patch

import pytest

from src.core.api_adapter import (
    APIAdapter,
    _anthropic_messages_url,
    _get_anthropic_base_url,
    _get_api_key,
    format_for_gemini,
    format_for_openai,
)
from src.core.model_selector import ModelConfig


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_config(model_id: str = "claude-opus-4-6") -> ModelConfig:
    return ModelConfig(
        model_id=model_id,
        provider="anthropic",
        max_tokens=256,
        temperature=0.7,
    )


# ---------------------------------------------------------------------------
# _get_api_key
# ---------------------------------------------------------------------------

class TestGetApiKey:
    def test_anthropic_key_returned(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "ant-test-key")
        assert _get_api_key("anthropic") == "ant-test-key"

    def test_google_key_returned(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_API_KEY", "ggl-test-key")
        assert _get_api_key("google") == "ggl-test-key"

    def test_openai_key_returned(self, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "oai-test-key")
        assert _get_api_key("openai") == "oai-test-key"

    def test_missing_key_raises_oserror(self, monkeypatch):
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        with pytest.raises(OSError, match="Missing API key"):
            _get_api_key("anthropic")

    def test_unknown_provider_raises_oserror(self, monkeypatch):
        # key_map.get returns "" for unknown provider → env var "" → OSError
        with pytest.raises(OSError):
            _get_api_key("unknown_provider")

    def test_anthropic_key_falls_back_to_universal_key(self, monkeypatch):
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        monkeypatch.setenv("LLM_API_KEY", "universal-key")
        assert _get_api_key("anthropic") == "universal-key"

    def test_anthropic_key_accepts_auth_token(self, monkeypatch):
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        monkeypatch.delenv("LLM_API_KEY", raising=False)
        monkeypatch.setenv("ANTHROPIC_AUTH_TOKEN", "auth-token")
        assert _get_api_key("anthropic") == "auth-token"


# ---------------------------------------------------------------------------
# Anthropic gateway URL handling
# ---------------------------------------------------------------------------

class TestAnthropicGatewayConfig:
    def test_messages_url_appends_path_for_gateway_root(self):
        assert (
            _anthropic_messages_url("https://claude.zunef.com/v1/ai")
            == "https://claude-api.zunef.com/v1/ai/messages"
        )
        assert (
            _anthropic_messages_url("https://claude-api.zunef.com/v1/ai")
            == "https://claude-api.zunef.com/v1/ai/messages"
        )

    def test_messages_url_does_not_double_append_path(self):
        assert (
            _anthropic_messages_url("https://claude.zunef.com/v1/ai/messages")
            == "https://claude-api.zunef.com/v1/ai/messages"
        )

    def test_messages_url_handles_official_v1_base(self):
        assert (
            _anthropic_messages_url("https://api.anthropic.com/v1")
            == "https://api.anthropic.com/v1/messages"
        )

    def test_anthropic_base_url_prefers_explicit_env(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_BASE_URL", "https://explicit.example/v1/ai")
        monkeypatch.setenv("LLM_BASE_URL", "https://claude.zunef.com/v1/ai")
        assert _get_anthropic_base_url() == "https://explicit.example/v1/ai"

    def test_anthropic_base_url_accepts_claude_universal_env(self, monkeypatch):
        monkeypatch.delenv("ANTHROPIC_BASE_URL", raising=False)
        monkeypatch.setenv("LLM_BASE_URL", "https://claude.zunef.com/v1/ai")
        assert _get_anthropic_base_url() == "https://claude-api.zunef.com/v1/ai"

    def test_anthropic_base_url_ignores_openai_compatible_universal_env(self, monkeypatch):
        monkeypatch.delenv("ANTHROPIC_BASE_URL", raising=False)
        monkeypatch.setenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
        assert _get_anthropic_base_url() == "https://api.anthropic.com"

    @pytest.mark.asyncio
    async def test_stream_http_error_raises_instead_of_empty_success(self, monkeypatch):
        class FakeContent:
            def __aiter__(self):
                return self

            async def __anext__(self):
                raise StopAsyncIteration

        class FakeResponse:
            status = 401
            content = FakeContent()

            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, tb):
                return False

            async def text(self):
                return '{"error":{"message":"Missing API key"}}'

        class FakeSession:
            last_url = ""
            last_kwargs = {}

            async def __aenter__(self):
                return self

            async def __aexit__(self, exc_type, exc, tb):
                return False

            def post(self, url, **kwargs):
                FakeSession.last_url = url
                FakeSession.last_kwargs = kwargs
                return FakeResponse()

        fake_aiohttp = types.SimpleNamespace(
            ClientSession=FakeSession,
            ClientTimeout=lambda **kwargs: kwargs,
        )

        monkeypatch.setenv("ANTHROPIC_API_KEY", "key")
        monkeypatch.setenv("ANTHROPIC_BASE_URL", "https://claude.zunef.com/v1/ai")
        monkeypatch.setitem(sys.modules, "aiohttp", fake_aiohttp)

        adapter = APIAdapter()
        config = _make_config("claude-opus-4-6")

        with pytest.raises(OSError, match="Anthropic API error 401"):
            [token async for token in adapter._generate_anthropic(config, [], None)]

        assert FakeSession.last_url == "https://claude-api.zunef.com/v1/ai/messages"
        assert FakeSession.last_kwargs["headers"]["X-ZUNEF-CLIENT"] == "claude-code"


# ---------------------------------------------------------------------------
# format_for_gemini
# ---------------------------------------------------------------------------

class TestFormatForGemini:
    def test_with_system_prompt_adds_preamble(self):
        result = format_for_gemini([], "Be concise.")
        assert result[0] == {"role": "user", "parts": [{"text": "Be concise."}]}
        assert result[1] == {"role": "model", "parts": [{"text": "Understood."}]}

    def test_without_system_prompt_no_preamble(self):
        msgs = [{"role": "user", "content": "Hello"}]
        result = format_for_gemini(msgs, None)
        assert len(result) == 1
        assert result[0]["role"] == "user"

    def test_assistant_role_mapped_to_model(self):
        msgs = [{"role": "assistant", "content": "Hi"}]
        result = format_for_gemini(msgs, None)
        assert result[0]["role"] == "model"
        assert result[0]["parts"][0]["text"] == "Hi"

    def test_user_role_preserved(self):
        msgs = [{"role": "user", "content": "Question?"}]
        result = format_for_gemini(msgs, None)
        assert result[0]["role"] == "user"

    def test_system_prompt_with_messages(self):
        msgs = [{"role": "user", "content": "go"}]
        result = format_for_gemini(msgs, "sys")
        # preamble (2) + message (1)
        assert len(result) == 3
        assert result[2]["role"] == "user"


# ---------------------------------------------------------------------------
# format_for_openai (edge cases)
# ---------------------------------------------------------------------------

class TestFormatForOpenAIEdge:
    def test_multiple_messages_preserved_order(self):
        msgs = [
            {"role": "user", "content": "a"},
            {"role": "assistant", "content": "b"},
            {"role": "user", "content": "c"},
        ]
        result = format_for_openai(msgs, None)
        assert len(result) == 3
        assert result[0]["role"] == "user"
        assert result[1]["role"] == "assistant"

    def test_empty_messages_with_system(self):
        result = format_for_openai([], "sys")
        assert len(result) == 1
        assert result[0]["role"] == "system"


# ---------------------------------------------------------------------------
# APIAdapter.generate_sync — anthropic path
# ---------------------------------------------------------------------------

class TestGenerateSyncAnthropic:
    def _fake_urlopen(self, response_body: dict):
        """Return a mock that behaves like urllib.request.urlopen context manager."""
        cm = MagicMock()
        cm.__enter__ = MagicMock(return_value=cm)
        cm.__exit__ = MagicMock(return_value=False)
        cm.read.return_value = json.dumps(response_body).encode()
        return cm

    def test_happy_path_returns_text(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "key")
        response = {"content": [{"text": "Hello"}, {"text": " world"}]}
        fake_cm = self._fake_urlopen(response)

        with patch("urllib.request.urlopen", return_value=fake_cm):
            adapter = APIAdapter()
            config = _make_config("claude-opus-4-6")
            result = adapter._sync_anthropic(
                config, [{"role": "user", "content": "hi"}], None, "key"
            )
        assert result == "Hello world"

    def test_with_system_prompt(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "key")
        response = {"content": [{"text": "ok"}]}
        fake_cm = self._fake_urlopen(response)

        with patch("urllib.request.urlopen", return_value=fake_cm):
            adapter = APIAdapter()
            config = _make_config("claude-opus-4-6")
            result = adapter._sync_anthropic(
                config, [{"role": "user", "content": "hi"}], "Be helpful", "key"
            )
        assert result == "ok"

    def test_exception_returns_empty_string(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "key")
        with patch("urllib.request.urlopen", side_effect=Exception("network error")):
            adapter = APIAdapter()
            config = _make_config("claude-opus-4-6")
            result = adapter._sync_anthropic(
                config, [{"role": "user", "content": "hi"}], None, "key"
            )
        assert result == ""

    def test_custom_base_url(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "key")
        monkeypatch.setenv("ANTHROPIC_BASE_URL", "https://custom.endpoint.com")
        response = {"content": [{"text": "custom"}]}
        fake_cm = self._fake_urlopen(response)

        with patch("urllib.request.urlopen", return_value=fake_cm) as mock_open:
            adapter = APIAdapter()
            config = _make_config("claude-opus-4-6")
            adapter._sync_anthropic(config, [], None, "key")
            call_args = mock_open.call_args
            req = call_args[0][0]
            assert "custom.endpoint.com" in req.full_url

    def test_sse_body_returns_text(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "key")
        sse = "\n".join([
            "event: content_block_delta",
            'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"OK"}}',
            "",
        ])
        cm = MagicMock()
        cm.__enter__ = MagicMock(return_value=cm)
        cm.__exit__ = MagicMock(return_value=False)
        cm.read.return_value = sse.encode()

        with patch("urllib.request.urlopen", return_value=cm):
            adapter = APIAdapter()
            config = _make_config("claude-sonnet-4-6")
            result = adapter._sync_anthropic(config, [], None, "key")

        assert result == "OK"


# ---------------------------------------------------------------------------
# APIAdapter.generate_sync — google path
# ---------------------------------------------------------------------------

class TestGenerateSyncGoogle:
    def _fake_urlopen(self, response_body: dict):
        cm = MagicMock()
        cm.__enter__ = MagicMock(return_value=cm)
        cm.__exit__ = MagicMock(return_value=False)
        cm.read.return_value = json.dumps(response_body).encode()
        return cm

    def test_happy_path_returns_text(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_API_KEY", "gkey")
        response = {
            "candidates": [{"content": {"parts": [{"text": "Gemini reply"}]}}]
        }
        fake_cm = self._fake_urlopen(response)

        with patch("urllib.request.urlopen", return_value=fake_cm):
            adapter = APIAdapter()
            config = ModelConfig(
                model_id="gemini-2.0-flash",
                provider="google",
                max_tokens=256,
                temperature=0.5,
            )
            result = adapter._sync_google(
                config, [{"role": "user", "content": "hi"}], None, "gkey"
            )
        assert result == "Gemini reply"

    def test_empty_candidates_returns_empty(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_API_KEY", "gkey")
        response = {"candidates": []}
        fake_cm = self._fake_urlopen(response)

        with patch("urllib.request.urlopen", return_value=fake_cm):
            adapter = APIAdapter()
            config = ModelConfig(
                model_id="gemini-2.0-flash", provider="google", max_tokens=256, temperature=0.5
            )
            result = adapter._sync_google(config, [], None, "gkey")
        assert result == ""

    def test_exception_returns_empty_string(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_API_KEY", "gkey")
        with patch("urllib.request.urlopen", side_effect=Exception("timeout")):
            adapter = APIAdapter()
            config = ModelConfig(
                model_id="gemini-2.0-flash", provider="google", max_tokens=256, temperature=0.5
            )
            result = adapter._sync_google(config, [], None, "gkey")
        assert result == ""


# ---------------------------------------------------------------------------
# APIAdapter.generate_sync — openai path
# ---------------------------------------------------------------------------

class TestGenerateSyncOpenAI:
    def _fake_urlopen(self, response_body: dict):
        cm = MagicMock()
        cm.__enter__ = MagicMock(return_value=cm)
        cm.__exit__ = MagicMock(return_value=False)
        cm.read.return_value = json.dumps(response_body).encode()
        return cm

    def test_happy_path_returns_message_content(self, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "okey")
        response = {
            "choices": [{"message": {"content": "GPT reply"}}]
        }
        fake_cm = self._fake_urlopen(response)

        with patch("urllib.request.urlopen", return_value=fake_cm):
            adapter = APIAdapter()
            config = ModelConfig(
                model_id="gpt-4o", provider="openai", max_tokens=256, temperature=0.5
            )
            result = adapter._sync_openai(
                config, [{"role": "user", "content": "hi"}], None, "okey"
            )
        assert result == "GPT reply"

    def test_exception_returns_empty_string(self, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "okey")
        with patch("urllib.request.urlopen", side_effect=Exception("conn refused")):
            adapter = APIAdapter()
            config = ModelConfig(
                model_id="gpt-4o", provider="openai", max_tokens=256, temperature=0.5
            )
            result = adapter._sync_openai(config, [], None, "okey")
        assert result == ""


# ---------------------------------------------------------------------------
# APIAdapter.generate_sync — routing
# ---------------------------------------------------------------------------

class TestGenerateSyncRouting:
    def test_routes_to_anthropic(self, monkeypatch):
        monkeypatch.setenv("ANTHROPIC_API_KEY", "key")
        adapter = APIAdapter()
        with patch.object(adapter, "_sync_anthropic", return_value="ant") as m:
            config = _make_config("claude-opus-4-6")
            result = adapter.generate_sync(config, [])
        assert result == "ant"
        m.assert_called_once()

    def test_routes_to_google(self, monkeypatch):
        monkeypatch.setenv("GOOGLE_API_KEY", "key")
        adapter = APIAdapter()
        with patch.object(adapter, "_sync_google", return_value="ggl") as m:
            config = ModelConfig(
                model_id="gemini-2.0-flash", provider="google", max_tokens=256, temperature=0.5
            )
            result = adapter.generate_sync(config, [])
        assert result == "ggl"
        m.assert_called_once()

    def test_routes_to_openai(self, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "key")
        adapter = APIAdapter()
        with patch.object(adapter, "_sync_openai", return_value="oai") as m:
            config = ModelConfig(
                model_id="gpt-4o", provider="openai", max_tokens=256, temperature=0.5
            )
            result = adapter.generate_sync(config, [])
        assert result == "oai"
        m.assert_called_once()

    def test_missing_key_raises(self, monkeypatch):
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        adapter = APIAdapter()
        config = _make_config("claude-opus-4-6")
        with pytest.raises(OSError, match="Missing API key"):
            adapter.generate_sync(config, [])
