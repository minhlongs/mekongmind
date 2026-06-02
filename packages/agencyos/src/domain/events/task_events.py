"""Task-related domain events."""
from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field, ConfigDict

from domain.value_objects.task_id import TaskId
from domain.value_objects.agent_id import AgentId


class DomainEvent(BaseModel):
    model_config = ConfigDict(frozen=True)

    event_id: str = Field(default_factory=lambda: str(__import__("uuid").uuid4()))
    event_type: str
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    aggregate_id: str
    payload: dict[str, Any] = Field(default_factory=dict)


class TaskCreatedEvent(DomainEvent):
    event_type: str = "task.created"

    @classmethod
    def from_task(cls, task: Any) -> "TaskCreatedEvent":
        return cls(aggregate_id=str(task.id), payload=task.to_dict())


class TaskEnqueuedEvent(DomainEvent):
    event_type: str = "task.enqueued"


class TaskCompletedEvent(DomainEvent):
    event_type: str = "task.completed"
    result: dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def from_task(cls, task: Any) -> "TaskCompletedEvent":
        return cls(aggregate_id=str(task.id), result=task.result.model_dump() if task.result else {})


class TaskFailedEvent(DomainEvent):
    event_type: str = "task.failed"
    error: str = ""
