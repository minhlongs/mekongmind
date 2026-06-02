"""Use-case: RunAgentTask — execute a task through the agent runtime."""
from __future__ import annotations
import logging
import time
from typing import Any, Protocol, runtime_checkable
from pydantic import BaseModel, Field, ConfigDict

from domain.entities.task import Task, TaskId, TaskStatus, TaskResult, TaskPriority
from domain.value_objects.llm_provider import ModelId
from domain.events.task_events import TaskCreatedEvent

logger = logging.getLogger(__name__)


class AgentTaskRequest(BaseModel):
    model_config = ConfigDict(frozen=False)
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    role: str = "operations"
    priority: TaskPriority = TaskPriority.MEDIUM
    payload: dict[str, Any] = Field(default_factory=dict)
    parent_task_id: TaskId | None = None
    timeout_s: int = Field(gt=0, default=300)
    max_retries: int = Field(ge=0, default=3)


@runtime_checkable
class AgentRuntimePort(Protocol):
    async def run(self, task: Task) -> TaskResult: ...
    async def enqueue(self, task: Task) -> None: ...


@runtime_checkable
class AgentRegistryPort(Protocol):
    async def get_agent(self, agent_id: str) -> Any | None: ...
    async def find_available(self, role: str) -> Any | None: ...


@runtime_checkable
class EventBusPort(Protocol):
    async def publish(self, event: Any) -> None: ...


class RunAgentTaskUseCase:
    def __init__(self, runtime: AgentRuntimePort, registry: AgentRegistryPort, event_bus: EventBusPort | None = None) -> None:
        self._runtime = runtime
        self._registry = registry
        self._event_bus = event_bus
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")

    async def execute(self, req: AgentTaskRequest) -> Task:
        t0 = time.perf_counter()
        task = Task(
            title=req.title,
            description=req.description,
            role=req.role,
            priority=req.priority,
            payload=req.payload,
            parent_id=req.parent_task_id,
            timeout_s=req.timeout_s,
            max_retries=req.max_retries,
        )
        self._logger.info("Submitting task %s (role=%s, priority=%s)", task.id, task.role, task.priority.name)
        agent = await self._registry.find_available(req.role)
        if agent is None:
            raise RuntimeError(f"No available agent for role={req.role}")
        task.assigned_to = agent.id
        task.enqueue()
        if self._event_bus:
            await self._event_bus.publish(TaskCreatedEvent.from_task(task))
        try:
            task.start()
            result = await self._runtime.run(task)
            task.complete(result)
        except Exception as exc:  # noqa: BLE001
            task.fail(str(exc))
            self._logger.exception("Task %s failed", task.id)
        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        self._logger.info("Task %s final status=%s in %dms", task.id, task.status.value, elapsed_ms)
        return task
