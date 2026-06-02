"""Agent-related domain events."""
from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, ConfigDict

from domain.value_objects.agent_id import AgentId


class AgentStartedEvent(BaseModel):
    model_config = ConfigDict(frozen=True)
    event_type: str = "agent.started"
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    agent_id: AgentId
    role: str


class AgentCompletedEvent(BaseModel):
    model_config = ConfigDict(frozen=True)
    event_type: str = "agent.completed"
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    agent_id: AgentId
    result_summary: str = ""


class AgentFailedEvent(BaseModel):
    model_config = ConfigDict(frozen=True)
    event_type: str = "agent.failed"
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    agent_id: AgentId
    error: str = ""
