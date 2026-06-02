"""Route-related domain events."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class RouteOptimizedEvent(BaseModel):
    model_config = ConfigDict(frozen=True)
    event_type: str = "route.optimized"
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    plan_id: str
    algorithm: str
    distance_km: float
    estimated_cost: float
    score: float | None = None


class RouteDispatchedEvent(BaseModel):
    model_config = ConfigDict(frozen=True)
    event_type: str = "route.dispatched"
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    route_id: str
    vehicle_ids: list[str]


class RouteCompletedEvent(BaseModel):
    model_config = ConfigDict(frozen=True)
    event_type: str = "route.completed"
    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    route_id: str
    actual_distance_km: float
    actual_duration_min: int
