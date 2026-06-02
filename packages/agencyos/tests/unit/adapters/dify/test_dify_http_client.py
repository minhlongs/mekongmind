"""Unit tests for DifyHTTPClient using httpx MockTransport."""
from __future__ import annotations

import httpx
import pytest

from domain.value_objects.dify_client_config import DifyClientConfig


# -------- helpers --------
def _app_transport(req: httpx.Request) -> httpx.Response:
    if req.url.path == "/v1/apps" and req.method == "POST":
        return httpx.Response(201, json={"id": "app-1", "name": "demo", "mode": "chat", "status": "draft", "created_at": "2026-06-02T00:00:00Z"})
    if req.url.path == "/v1/apps/app-1" and req.method == "GET":
        return httpx.Response(200, json={"id": "app-1", "name": "demo", "mode": "chat", "status": "active", "created_at": "2026-06-02T00:00:00Z"})
    if req.url.path == "/v1/apps/app-1/publish" and req.method == "POST":
        return httpx.Response(200, json={"id": "app-1", "status": "active"})
    if req.url.path == "/v1/chat-messages" and req.method == "POST":
        return httpx.Response(200, json={"answer": "hi", "conversation_id": "c1", "message_id": "m1"})
    if req.url.path == "/v1/datasets" and req.method == "GET":
        return httpx.Response(200, json={"data": [{"id": "ds-1", "name": "KB1"}]})
    return httpx.Response(404, json={"detail": "not found"})


def _cfg() -> DifyClientConfig:
    return DifyClientConfig(api_url="http://localhost:5001", api_key="k", timeout_seconds=1.0, max_retries=0)


def test_headers_and_base():
    cfg = _cfg()
    assert cfg.base_url == "http://localhost:5001"
    assert cfg.api_key == "k"


def test_create_app(monkeypatch: pytest.MonkeyPatch) -> None:
    from adapters.dify.dify_http_client import DifyHTTPClient
    from adapters.dify.models import DifyAppCreateRequest

    cfg = _cfg()
    original_init = httpx.Client.__init__
    def _patched_init(self: object, **kwargs: dict) -> None:
        kwargs.setdefault("base_url", cfg.base_url)
        original_init(self, transport=httpx.MockTransport(_app_transport), **kwargs)  # type: ignore[arg-type]
    monkeypatch.setattr(httpx.Client, "__init__", _patched_init)

    client = DifyHTTPClient(cfg)
    resp = client.create_app(DifyAppCreateRequest(name="demo", mode="chat"))
    assert resp.id == "app-1"
    client.close()


def test_chat(monkeypatch: pytest.MonkeyPatch) -> None:
    from adapters.dify.dify_http_client import DifyHTTPClient

    cfg = _cfg()
    original_init = httpx.Client.__init__
    def _patched_init(self: object, **kwargs: dict) -> None:
        kwargs.setdefault("base_url", cfg.base_url)
        original_init(self, transport=httpx.MockTransport(_app_transport), **kwargs)  # type: ignore[arg-type]
    monkeypatch.setattr(httpx.Client, "__init__", _patched_init)

    client = DifyHTTPClient(cfg)
    resp = client.chat(query="hi", user="cli-user")
    assert resp.answer == "hi"
    assert resp.conversation_id == "c1"
    client.close()
