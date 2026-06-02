"""AgentId value object — UUID-based, immutable, equality by value."""
from __future__ import annotations
import uuid
from pydantic import BaseModel, Field, ConfigDict


class AgentId(BaseModel):
    model_config = ConfigDict(frozen=True, validate_assignment=True)

    value: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier for an agent instance.",
    )

    def __str__(self) -> str:
        return self.value

    def __repr__(self) -> str:
        return f"AgentId({self.value[:8]}...)"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, AgentId):
            return NotImplemented
        return self.value == other.value

    def __hash__(self) -> int:
        return hash(self.value)
