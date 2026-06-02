"""Dify domain aggregates — LLMApp and LLMConversation."""
from __future__ import annotations
import uuid
from datetime import datetime
from enum import Enum
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class LLMAppStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    ERROR = "error"


class LLMApp(BaseModel):
    """Aggregate: a managed Dify application."""
    model_config = ConfigDict(validate_assignment=True, extra="forbid")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dify_app_id: str | None = None
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    mode: str = Field(..., description="chat / workflow / agent / completion")
    status: LLMAppStatus = LLMAppStatus.DRAFT
    llm_model_config: dict[str, Any] = Field(default_factory=dict)
    config: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    archived_at: datetime | None = None
    error: str | None = None
    tags: list[str] = Field(default_factory=list)

    # Invariants ---------------------------------------------------------
    def publish(self) -> None:
        if self.status != LLMAppStatus.DRAFT:
            raise ValueError(f"Cannot publish app in status {self.status}")
        self.status = LLMAppStatus.ACTIVE
        self.updated_at = datetime.utcnow()

    def archive(self) -> None:
        if self.status == LLMAppStatus.ARCHIVED:
            return
        self.status = LLMAppStatus.ARCHIVED
        self.archived_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def mark_error(self, error: str) -> None:
        self.status = LLMAppStatus.ERROR
        self.error = error
        self.updated_at = datetime.utcnow()

    def update_model_config(self, patch: dict[str, Any]) -> None:
        self.llm_model_config.update(patch)
        self.updated_at = datetime.utcnow()


class LLMConversationRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class LLMMessage(BaseModel):
    """Single chat message — domain object, not Dify wire format."""
    model_config = ConfigDict(frozen=True, extra="forbid")
    role: LLMConversationRole
    content: str = Field(..., min_length=1)
    metadata: dict[str, Any] = Field(default_factory=dict)


class LLMConversation(BaseModel):
    """Aggregate: a chat session tied to an LLMApp."""
    model_config = ConfigDict(validate_assignment=True, extra="forbid")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    app_id: str
    title: str | None = None
    end_user_id: str | None = None
    messages: list[LLMMessage] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    tokens_used: int = 0
    cost: Any | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def add_message(self, msg: LLMMessage) -> None:
        self.messages.append(msg)
        self.updated_at = datetime.utcnow()
