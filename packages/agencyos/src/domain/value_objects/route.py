"""RoutePlan + Waypoint + RouteStatus - route planning VO."""

from __future__ import annotations

from enum import Enum
from typing import Self
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from domain.value_objects.coordinates import Coordinates, GeoDistance
from domain.value_objects.money import Money


class RouteStatus(str, Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    DISPATCHED = "dispatched"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Waypoint(BaseModel):
    model_config = ConfigDict(frozen=True)

    order: int = Field(ge=0, description="Visit order (0 = depot).")
    name: str = Field(min_length=1, max_length=200)
    coordinates: Coordinates
    demand_units: int = Field(ge=0, default=0, description="Pickup/delivery units at this stop.")
    service_time_min: int = Field(ge=0, default=0)
    vehicle_id: str | None = None

    def __lt__(self, other: Self) -> bool:
        return self.order < other.order


class RoutePlan(BaseModel):
    model_config = ConfigDict(validate_assignment=True)

    plan_id: str = Field(min_length=1)
    waypoints: list[Waypoint] = Field(min_length=1)
    total_distance: GeoDistance
    estimated_duration_min: int = Field(ge=0)
    total_cost: Money
    algorithm_used: str = Field(min_length=1)
    carrier: str = Field(min_length=1)
    status: RouteStatus = RouteStatus.PROPOSED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    solver_metadata: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    optimization_score: float | None = Field(ge=0.0, le=1.0, default=None, description="0..1 quality score")

    def waypoint_by_order(self, order: int) -> Waypoint | None:
        return next((w for w in self.waypoints if w.order == order), None)

    def legs(self) -> list[tuple[Coordinates, Coordinates]]:
        return [(w.coordinates, self.waypoints[i + 1].coordinates) for i, w in enumerate(self.waypoints[:-1])]
