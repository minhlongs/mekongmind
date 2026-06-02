"""Tests for Dify models (syntax + pydantic validation)."""
from adapters.dify.models import (
    DifyAppMode,
    DifyAppCreateRequest,
    DifyAppCreateResponse,
    DifyChatResponse,
    DifyMessageInput,
)


def test_modes():
    assert DifyAppMode.CHAT.value == "chat"
    assert DifyAppMode.WORKFLOW.value == "workflow"


def test_create_request_roundtrip():
    body = DifyAppCreateRequest(name="demo", mode=DifyAppMode.CHAT, description="hello")
    payload = body.model_dump()
    assert payload["mode"] == "chat"


def test_create_response():
    r = DifyAppCreateResponse(id="a1", name="demo", mode="chat", status="active", created_at="2026-01-01T00:00:00Z")
    assert r.id == "a1"
    assert r.status == "active"


def test_chat_response_optional_fields():
    r = DifyChatResponse(answer="hi", conversation_id="c1", message_id="m1")
    assert r.answer == "hi"
    assert r.conversation_id == "c1"

    empty = DifyChatResponse()
    assert empty.answer is None
    assert empty.conversation_id is None
