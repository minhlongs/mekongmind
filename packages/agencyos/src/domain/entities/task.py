"""Task entity — a unit of work routed through the multi-agent system."""

from __future__ import annotations
from datetime import datetime
from typing import Any
from enum import Enum

from pydantic import BaseModel, Field, ConfigDict

from domain.value_objects.agent_id import AgentId
from domain.value_objects.task_id import TaskId
from domain.value_objects.llm_provider import LLMProvider, ModelId
from domain.value_objects.money import Money


class TaskPriority(int, Enum):
    CRITICAL = 0
    HIGH = 1
    MEDIUM = 2
    LOW = 3
    BACKGROUND = 4


class TaskStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class TaskResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    output: str | bytes | None = None
    exit_code: int = 0
    tokens_used: int = 0
    cost: Money | None = None
    latency_ms: int = 0
    model_used: ModelId | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class Task(BaseModel):
    model_config = ConfigDict(validate_assignment=True)

    id: TaskId = Field(default_factory=TaskId)
    parent_id: TaskId | None = None
    title: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=10000)
    role: str = Field(min_length=1)  # AgentRole.value
    assigned_to: AgentId | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    payload: dict[str, Any] = Field(default_factory=dict)
    result: TaskResult | None = None
    max_retries: int = Field(ge=0, default=3)
    retry_count: int = Field(ge=0, default=0)
    timeout_s: int = Field(gt=0, default=300)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    error_message: str | None = None
    tags: list[str] = Field(default_factory=list)

    def enqueue(self) -> None:
        if self.status not in (TaskStatus.PENDING, TaskStatus.RETRYING):
            raise ValueError(f"Cannot enqueue task in status {self.status}")
        self.status = TaskStatus.QUEUED
        self.updated_at = datetime.utcnow()

    def start(self) -> None:
        if self.status != TaskStatus.QUEUED:
            raise ValueError(f"Cannot start task in status {self.status}")
        self.status = TaskStatus.RUNNING
        self.updated_at = datetime.utcnow()

    def complete(self, result: TaskResult) -> None:
        if self.status != TaskStatus.RUNNING:
            raise ValueError(f"Cannot complete task in status {self.status}")
        self.status = TaskStatus.COMPLETED
        self.result = result
        self.completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def fail(self, error: str, retry: bool = True) -> None:
        self.status = TaskStatus.FAILED
        self.error_message = error
        self.updated_at = datetime.utcnow()
        if retry and self.retry_count < self.max_retries:
            self.retry_count += 1
            self.status = TaskStatus.RETRYING
            self.error_message = None

    def block(self, reason: str) -> None:
        self.status = TaskStatus.BLOCKED
        self.error_message = reason
        self.updated_at = datetime.utcnow()

    def should_retry(self) -> bool:
        return self.status == TaskStatus.FAILED and self.retry_count < self.max_retries

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": str(self.id),
            "title": self.title,
            "status": self.status.value,
            "priority": self.priority.name,
            "role": self.role,
            "retry": f"{self.retry_count}/{self.max_retries}",
            "created_at": self.created_at.isoformat(),
        }
