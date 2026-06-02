"""System-level domain events."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SystemBootstrapEvent(BaseModel):
    model_config = ConfigDict(frozen=True)
    event_type: str = "system.bootstrap"
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    mode: str
    parallel: bool
    components_loaded: list[str] = Field(default_factory=list)


class SystemShutdownEvent(BaseModel):
    model_config = ConfigDict(frozen=True)
    event_type: str = "system.shutdown"
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    reason: str | None = None
