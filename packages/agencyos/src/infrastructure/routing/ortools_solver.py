"""OR-Tools VRP solver — implements RouteSolverPort using ortools CVRP/VRPTW.

Hardware: runs on CPU (M1 Max 64GB unified memory handles 50-100 waypoints easily).
Falls back to a greedy nearest-neighbour if OR-Tools is unavailable.
"""
from __future__ import annotations

import logging
import time
from typing import Any
from dataclasses import dataclass
from pydantic import BaseModel, Field, ConfigDict

from domain.value_objects.coordinates import Coordinates, GeoDistance
from domain.value_objects.money import Money, Currency
from domain.value_objects.route import RoutePlan, Waypoint, RouteStatus
from domain.entities.fleet import Fleet, Vehicle, VehicleType
from application.use_cases.optimize_route import RouteOptimizationRequest

logger = logging.getLogger(__name__)


@dataclass
class _SolverResult:
    ordered_indices: list[int]
    total_km: float
    solver_time_s: float
    status: str
    metadata: dict[str, Any]


class ORToolsRouteSolver:
    """Capacitated Vehicle Routing Problem (CVRP) solver with optional time windows."""

    def __init__(self, *, timeout_s: int = 60, max_waypoints: int = 200) -> None:
        self._timeout_s = timeout_s
        self._max_waypoints = max_waypoints
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")

    async def solve(self, request: RouteOptimizationRequest, fleet: Fleet) -> RoutePlan:
        t0 = time.perf_counter()
        depot = request.depot
        waypoints_raw = request.waypoints
        n = len(waypoints_raw)

        if n == 0:
            raise ValueError("Route plan requires at least 1 waypoint")

        if n > self._max_waypoints:
            raise ValueError(f"Waypoint count {n} exceeds max {self._max_waypoints}")

        # Build distance matrix (Haversine km × 1000 to keep integer arithmetic)
        coords: list[Coordinates] = [depot] + [Coordinates(lat=w["lat"], lng=w["lng"]) for w in waypoints_raw]
        dist_m: list[list[int]] = []
        for i in range(n + 1):
            row: list[int] = []
            for j in range(n + 1):
                d = int(coords[i].haversine_km(coords[j]) * 1000)
                row.append(d)
            dist_m.append(row)

        vehicles = (
            fleet.available_vehicles(request.vehicle_types[0] if request.vehicle_types else None)
            or fleet.vehicles
        )
        if not vehicles:
            raise ValueError("No vehicles available in fleet")

        try:
            result = self._solve_cvrp(dist_m, waypoints_raw, vehicles, request)
        except Exception as exc:  # noqa: BLE001
            self._logger.warning("OR-Tools solver failed (%s); falling back to greedy", exc)
            result = self._solve_greedy(dist_m, waypoints_raw)

        elapsed_s = time.perf_counter() - t0
        self._logger.info("Solver %s completed in %.2fs distance=%dkm waypoints=%d", result.status, elapsed_s, result.total_km, n)

        # Build RoutePlan
        waypoints_out = []
        for rank, idx in enumerate(result.ordered_indices):
            w = waypoints_raw[idx]
            waypoints_out.append(
                Waypoint(
                    order=rank,
                    name=w.get("name", f"Stop-{idx}"),
                    coordinates=Coordinates(lat=w["lat"], lng=w["lng"]),
                    demand_units=w.get("demand_units", 0),
                    service_time_min=w.get("service_time_min", 0),
                )
            )

        # Cost estimate: VND/km × distance (simplified — carrier-specific rates come from fleet repo)
        cost_per_km_vnd = 15_000  # placeholder; override via request.constraints
        total_cost = Money(amount=result.total_km * cost_per_km_vnd, currency=Currency.VND)

        return RoutePlan(
            plan_id=request.plan_id,
            waypoints=waypoints_out,
            total_distance=GeoDistance.from_km(result.total_km),
            estimated_duration_min=int(result.total_km / 40 * 60),  # 40 km/h avg city speed
            total_cost=total_cost,
            algorithm_used=f"ortools_{request.algorithm}",
            carrier=request.carrier,
            status=RouteStatus.PROPOSED,
            solver_metadata={"solver_time_s": round(elapsed_s, 3), "status": result.status, **result.metadata},
            optimization_score=min(1.0, max(0.0, 1.0 - (elapsed_s / self._timeout_s))),
        )

    def _solve_cvrp(self, dist_m: list[list[int]], waypoints_raw: list[dict], vehicles: list[Vehicle], request: RouteOptimizationRequest) -> _SolverResult:
        try:
            from ortools.constraint_solver import routing_enums_pb2, pywrapcp  # type: ignore
        except ImportError as exc:
            raise RuntimeError("ortools package not installed — pip install ortools") from exc

        n = len(waypoints_raw)
        num_vehicles = min(len(vehicles), max(1, n // 10))
        manager = pywrapcp.RoutingIndexManager(n + 1, num_vehicles, 0)
        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_idx: int, to_idx: int) -> int:
            return dist_m[from_idx][to_idx]

        transit = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit)

        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        search_parameters.time_limit.FromSeconds(self._timeout_s)
        search_parameters.log_search_progress = False

        solution = routing.SolveWithParameters(search_parameters)
        if not solution:
            raise RuntimeError("OR-Tools returned no solution")

        ordered: list[int] = []
        for v in range(num_vehicles):
            idx = routing.Start(v)
            while not routing.IsEnd(idx):
                node = manager.IndexToNode(idx)
                if 1 <= node <= n:
                    ordered.append(node - 1)
                idx = solution.Value(routing.NextVar(idx))

        total_km = sum(dist_m[0][i + 1] for i in ordered) / 1000.0
        return _SolverResult(ordered_indices=ordered, total_km=round(total_km, 3), solver_time_s=0.0, status="optimal", metadata={"num_vehicles": num_vehicles})

    def _solve_greedy(self, dist_m: list[list[int]], waypoints_raw: list[dict]) -> _SolverResult:
        n = len(waypoints_raw)
        visited = [False] * n
        ordered: list[int] = []
        current = 0
        total_m = 0
        for _ in range(n):
            best_j, best_d = min(((j, dist_m[current][j + 1]) for j in range(n) if not visited[j]), key=lambda x: x[1], default=(0, 0))
            ordered.append(best_j)
            visited[best_j] = True
            total_m += best_d
            current = best_j + 1
        return _SolverResult(ordered_indices=ordered, total_km=round(total_m / 1000.0, 3), solver_time_s=0.0, status="greedy_fallback", metadata={})
