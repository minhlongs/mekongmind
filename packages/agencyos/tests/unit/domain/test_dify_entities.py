"""Tests for LLMApp and LLMConversation aggregates."""
import pytest
from datetime import datetime
from domain.entities.dify_entities import (
    LLMApp,
    LLMAppStatus,
    LLMConversation,
    LLMMessage,
    LLMConversationRole,
)


def test_llm_app_lifecycle():
    app = LLMApp(name="demo", mode="chat")
    assert app.status == LLMAppStatus.DRAFT

    app.publish()
    assert app.status == LLMAppStatus.ACTIVE

    app.archive()
    assert app.status == LLMAppStatus.ARCHIVED

    app.mark_error("boom")
    assert app.status == LLMAppStatus.ERROR
    assert app.error == "boom"


def test_llm_app_immutable_model_config():
    app = LLMApp(name="demo", mode="chat")
    app.update_model_config({"provider": "openai"})
    assert app.llm_model_config["provider"] == "openai"
    assert app.status == LLMAppStatus.DRAFT


def test_llm_conversation_add_message():
    conv = LLMConversation(app_id="app1")
    conv.add_message(LLMMessage(role=LLMConversationRole.USER, content="hi"))
    assert len(conv.messages) == 1
    assert conv.messages[0].content == "hi"


def test_llm_message_immutable():
    m = LLMMessage(role=LLMConversationRole.ASSISTANT, content="hello")
    with pytest.raises(Exception):
        m.role = LLMConversationRole.USER  # frozen


import pytest
