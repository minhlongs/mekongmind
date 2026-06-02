"""Use-case: DispatchFleet — execute a route plan through the fleet."""
from __future__ import annotations
import logging
from typing import Any, Protocol, runtime_checkable
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from domain.value_objects.route import RoutePlan, RouteStatus
from domain.value_objects.agent_id import AgentId
from domain.events.route_events import RouteDispatchedEvent

logger = logging.getLogger(__name__)


class DispatchRequest(BaseModel):
    model_config = ConfigDict(frozen=False)
    plan_id: str
    company_id: str
    dispatch_time: datetime = Field(default_factory=datetime.utcnow)
    notify_drivers: bool = True


@runtime_checkable
class DispatchGatewayPort(Protocol):
    async def send_dispatch(self, vehicle_id: str, route_plan: RoutePlan) -> dict[str, Any]: ...
    async def notify_agent(self, agent_id: AgentId, message: str) -> None: ...


@runtime_checkable
class EventBusPort(Protocol):
    async def publish(self, event: Any) -> None: ...


class DispatchFleetUseCase:
    def __init__(self, dispatch_gw: DispatchGatewayPort, event_bus: EventBusPort | None = None) -> None:
        self._gw = dispatch_gw
        self._event_bus = event_bus
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")

    async def execute(self, request: DispatchRequest) -> dict[str, Any]:
        self._logger.info("Dispatching plan %s", request.plan_id)
        results: dict[str, Any] = {"plan_id": request.plan_id, "dispatched_at": request.dispatch_time.isoformat(), "vehicle_results": []}
        # In production: iterate vehicles, send_dispatch, notify_agent
        if self._event_bus:
            await self._event_bus.publish(RouteDispatchedEvent(route_id=request.plan_id, vehicle_ids=[]))
        return results
