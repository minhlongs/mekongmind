"""AgentMetadata — metadata bundle for an agent (runtime info, last output, errors)."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AgentMetadata(BaseModel):
    model_config = ConfigDict(frozen=False, validate_assignment=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_output: str | None = Field(default=None, max_length=4096)
    last_error: str | None = Field(default=None, max_length=2048)
    block_reason: str | None = Field(default=None, max_length=512)
    tags: list[str] = Field(default_factory=list)
    extra: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
