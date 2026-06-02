"""StandardOperatingProcedure + SOPTemplate — repeatable workflows."""

from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, ConfigDict


class StandardOperatingProcedure(BaseModel):
    model_config = ConfigDict(frozen=False, validate_assignment=True)

    id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=200)
    version: str = Field(min_length=1, max_length=20)
    trigger_conditions: list[str] = Field(default_factory=list)
    steps: list[dict[str, Any]] = Field(default_factory=list)
    expected_output_schema: dict[str, Any] | None = None
    timeout_s: int = Field(gt=0, default=600)
    retry_policy: dict[str, int] = Field(default_factory=lambda: {"max_retries": 3, "backoff_s": 5})
    tags: list[str] = Field(default_factory=list)
    created_by: str = Field(min_length=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    def matches_trigger(self, context: dict[str, Any]) -> bool:
        return any(cond in context for cond in self.trigger_conditions)


class SOPTemplate(BaseModel):
    model_config = ConfigDict(frozen=True)

    template_id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    parameter_schema: dict[str, Any] = Field(default_factory=dict)
    default_steps: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def instantiate(self, parameters: dict[str, Any]) -> StandardOperatingProcedure:
        return StandardOperatingProcedure(
            id=f"sop_{self.template_id}_{int(datetime.utcnow().timestamp())}",
            name=self.name,
            version="1.0.0",
            steps=self.default_steps,
            created_by=parameters.get("created_by", "system"),
            tags=parameters.get("tags", []),
        )
