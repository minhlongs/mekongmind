"""Use-case: OptimizeRoute — given stops + vehicles, compute cheapest/fastest route plan.

This is the primary use-case invoked when an agent receives a delivery request.
Dependencies are injected via ports (no framework coupling).
"""
from __future__ import annotations

import time
import logging
from dataclasses import dataclass, field
from typing import Any, Protocol, runtime_checkable

from pydantic import BaseModel, Field, ConfigDict

from domain.entities.agent import Agent
from domain.entities.fleet import Fleet, Vehicle, VehicleType
from domain.value_objects.coordinates import Coordinates, GeoDistance
from domain.value_objects.money import Money, Currency
from domain.value_objects.route import RoutePlan, Waypoint, RouteStatus
from domain.events.route_events import RouteOptimizedEvent

logger = logging.getLogger(__name__)


# ─── DTOs ───────────────────────────────────────────────────────────────────

class RouteOptimizationRequest(BaseModel):
    model_config = ConfigDict(frozen=False)

    plan_id: str
    company_id: str
    depot: Coordinates
    waypoints: list[dict[str, Any]]
    fleet_ids: list[str] | None = None
    vehicle_types: list[VehicleType] | None = None
    algorithm: str = "ortools_cvrp"
    carrier: str = "internal"
    optimize_for: str = Field(default="cost", pattern="^(cost|time|balanced)$")
    constraints: dict[str, Any] = Field(default_factory=dict)


# ─── Port interfaces (injected) ──────────────────────────────────────────────

@runtime_checkable
class FleetRepositoryPort(Protocol):
    """Read-side: query fleets and vehicles."""

    async def get_fleet(self, company_id: str) -> Fleet | None: ...
    async def list_vehicles(self, fleet_id: str, *, vehicle_type: VehicleType | None = None) -> list[Vehicle]: ...
    async def save_route_plan(self, plan: RoutePlan) -> RoutePlan: ...


@runtime_checkable
class RouteSolverPort(Protocol):
    """Solve the VRP/CVRP/VRPTW problem."""

    async def solve(self, request: RouteOptimizationRequest, fleet: Fleet) -> RoutePlan: ...


@runtime_checkable
class LLMProviderPort(Protocol):
    """Optional: invoke LLM to pre-process ambiguous requests or post-process output."""

    async def complete(self, prompt: str, *, model: str | None = None, max_tokens: int = 1024) -> str: ...


@runtime_checkable
class EventBusPort(Protocol):
    async def publish(self, event: Any) -> None: ...


# ─── Use-case ────────────────────────────────────────────────────────────────

class OptimizeRouteUseCase:
    """OptimizeRouteUseCase — Compute an optimal route plan given depot, waypoints, and fleet.

    Flow:
      1. Resolve fleet + available vehicles via FleetRepositoryPort.
      2. Call RouteSolverPort to compute the plan (OR-Tools CVRP/TSP).
      3. Persist RoutePlan via FleetRepositoryPort.
      4. Optionally call LLMProviderPort to interpret / summarize the plan.
      5. Publish RouteOptimizedEvent.
    """

    def __init__(
        self,
        fleet_repo: FleetRepositoryPort,
        route_solver: RouteSolverPort,
        llm: LLMProviderPort | None = None,
        event_bus: EventBusPort | None = None,
    ) -> None:
        self._fleet_repo = fleet_repo
        self._route_solver = route_solver
        self._llm = llm
        self._event_bus = event_bus
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")

    async def execute(self, request: RouteOptimizationRequest) -> RoutePlan:
        t0 = time.perf_counter()
        self._logger.info("Optimizing route %s for company %s", request.plan_id, request.company_id)

        fleet = await self._fleet_repo.get_fleet(request.company_id)
        if fleet is None:
            raise ValueError(f"Fleet not found for company_id={request.company_id}")

        plan = await self._route_solver.solve(request, fleet)
        self._logger.info(
            "Solver produced plan %s: distance=%s, cost=%s, waypoints=%d",
            plan.plan_id, plan.total_distance, plan.total_cost, len(plan.waypoints),
        )

        plan = await self._fleet_repo.save_route_plan(plan)

        if self._llm and request.constraints.get("summarize"):
            prompt = (
                f"Summarize this delivery route plan in 3 bullet points:\n"
                f"- Plan: {plan.plan_id}\n"
                f"- Distance: {plan.total_distance}\n"
                f"- Est. cost: {plan.total_cost}\n"
                f"- Waypoints: {len(plan.waypoints)}\n"
                f"- Carrier: {plan.carrier}\n"
                f"- Algorithm: {plan.algorithm_used}\n"
            )
            try:
                summary = await self._llm.complete(prompt, max_tokens=256)
                self._logger.info("LLM summary: %s", summary[:200])
            except Exception as exc:  # noqa: BLE001
                self._logger.warning("LLM summary failed (non-fatal): %s", exc)

        if self._event_bus:
            event = RouteOptimizedEvent(
                plan_id=plan.plan_id,
                algorithm=plan.algorithm_used,
                distance_km=plan.total_distance.km,
                estimated_cost=float(plan.total_cost.amount),
                score=plan.optimization_score,
            )
            await self._event_bus.publish(event)

        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        self._logger.info("OptimizeRoute completed in %dms", elapsed_ms)
        return plan
