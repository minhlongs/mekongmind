"""Pydantic models mirroring Dify Service API payloads — adapter-layer only."""
from __future__ import annotations
from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field


class DifyAppMode(str, Enum):
    CHAT = "chat"
    AGENT = "agent"
    COMPLETION = "completion"
    WORKFLOW = "workflow"
    ADVANCED_CHAT = "advanced-chat"
    RAG = "rag"


class DifyAppCreateRequest(BaseModel):
    """Matches POST /apps body."""
    model_config = ConfigDict(extra="forbid")
    name: str = Field(..., max_length=200)
    mode: DifyAppMode
    description: str | None = Field(default=None, max_length=5000)


class DifyAppCreateResponse(BaseModel):
    id: str
    name: str
    mode: str
    status: str
    created_at: str


class DifyMessageInput(BaseModel):
    query: str
    user: str
    response_mode: Literal["blocking", "streaming"] = "blocking"


class DifyChatResponse(BaseModel):
    """Minimal chat response — we only surface the assistant text and conversation id."""
    answer: str | None = None
    conversation_id: str | None = None
    message_id: str | None = None
