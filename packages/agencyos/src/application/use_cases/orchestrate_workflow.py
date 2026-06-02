"""Use-case: OrchestrateWorkflow — run a defined workflow end-to-end."""
from __future__ import annotations
import logging
from typing import Any, Protocol, runtime_checkable
from pydantic import BaseModel, Field, ConfigDict

from domain.entities.task import TaskId, TaskPriority
from domain.events.task_events import TaskCompletedEvent

logger = logging.getLogger(__name__)


class WorkflowDefinition(BaseModel):
    model_config = ConfigDict(frozen=True)
    workflow_id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=200)
    steps: list[dict[str, Any]] = Field(min_length=1)
    trigger_conditions: list[str] = Field(default_factory=list)


class WorkflowRequest(BaseModel):
    model_config = ConfigDict(frozen=False)
    workflow_id: str
    context: dict[str, Any] = Field(default_factory=dict)
    parent_task_id: TaskId | None = None


@runtime_checkable
class WorkflowEnginePort(Protocol):
    async def run_workflow(self, definition: WorkflowDefinition, context: dict[str, Any]) -> dict[str, Any]: ...


@runtime_checkable
class EventBusPort(Protocol):
    async def publish(self, event: Any) -> None: ...


class OrchestrateWorkflowUseCase:
    def __init__(self, engine: WorkflowEnginePort, event_bus: EventBusPort | None = None) -> None:
        self._engine = engine
        self._event_bus = event_bus
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")

    async def execute(self, req: WorkflowRequest) -> dict[str, Any]:
        self._logger.info("Running workflow %s", req.workflow_id)
        # Workflow definition resolution (from SOP store) would go here
        # For now delegate to the engine which resolves the definition
        result = await self._engine.run_workflow(
            WorkflowDefinition(workflow_id=req.workflow_id, name=req.workflow_id, steps=[]),
            req.context,
        )
        if self._event_bus and req.parent_task_id:
            await self._event_bus.publish(TaskCompletedEvent(aggregate_id=str(req.parent_task_id), result=result))
        return result
