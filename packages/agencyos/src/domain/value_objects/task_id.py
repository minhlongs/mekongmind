"""TaskId value object."""
from __future__ import annotations
import uuid
from pydantic import BaseModel, Field, ConfigDict


class TaskId(BaseModel):
    model_config = ConfigDict(frozen=True)

    value: str = Field(default_factory=lambda: str(uuid.uuid4()))

    def __str__(self) -> str:
        return self.value

    def __repr__(self) -> str:
        return f"TaskId({self.value[:8]}...)"
