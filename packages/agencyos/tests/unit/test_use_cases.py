"""Unit tests for use-cases."""
from __future__ import annotations

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock

from application.use_cases.optimize_route import OptimizeRouteUseCase, RouteOptimizationRequest
from application.use_cases.dispatch_fleet import DispatchFleetUseCase, DispatchRequest
from domain.value_objects.route import RoutePlan, Waypoint, RouteStatus
from domain.value_objects.money import Money, Currency
from domain.value_objects.coordinates import Coordinates, GeoDistance


class FakeFleetRepo:
    def __init__(self, fleet):
        self._fleet = fleet
        self._saved = None

    async def get_fleet(self, company_id: str):
        return self._fleet

    async def list_vehicles(self, fleet_id: str, *, vehicle_type=None):
        return []

    async def save_route_plan(self, plan):
        self._saved = plan
        return plan


class FakeSolver:
    def __init__(self, plan):
        self._plan = plan

    async def solve(self, request, fleet):
        return self._plan


@pytest.mark.asyncio
async def test_optimize_route_happy_path():
    fleet = MagicMock()
    plan = RoutePlan(
        plan_id="p1",
        waypoints=[Waypoint(order=0, name="Depot", coordinates=Coordinates(lat=10.0, lng=106.0))],
        total_distance=GeoDistance.from_km(10.0),
        estimated_duration_min=30,
        total_cost=Money(amount=150_000, currency=Currency.VND),
        algorithm_used="ortools_cvrp",
        carrier="internal",
    )
    repo = FakeFleetRepo(fleet)
    solver = FakeSolver(plan)
    uc = OptimizeRouteUseCase(fleet_repo=repo, route_solver=solver)
    req = RouteOptimizationRequest(plan_id="p1", company_id="c1", depot=Coordinates(lat=10.0, lng=106.0), waypoints=[])
    out = await uc.execute(req)
    assert out.plan_id == "p1"
    assert repo._saved is not None
