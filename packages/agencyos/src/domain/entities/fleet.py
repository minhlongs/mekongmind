"""Fleet entity — managed collection of vehicles for delivery/logistics operations."""

from __future__ import annotations

from enum import Enum
from typing import Self
from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict

from domain.entities.task import TaskId
from domain.value_objects.agent_id import AgentId
from domain.value_objects.coordinates import Coordinates
from domain.value_objects.money import Money


class VehicleType(str, Enum):
    VAN = "van"
    TRUCK = "truck"
    MOTORBIKE = "motorbike"
    BUS = "bus"  # e.g. FUTA Bus Lines
    INTERNAL_TRUCK = "internal_truck"


class VehicleStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    IN_TRANSIT = "in_transit"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"


class Vehicle(BaseModel):
    model_config = ConfigDict(frozen=False, validate_assignment=True)

    vehicle_id: str = Field(min_length=1)
    vehicle_type: VehicleType
    plate: str | None = Field(default=None, max_length=20)
    capacity_units: int = Field(ge=0, default=0)
    status: VehicleStatus = VehicleStatus.AVAILABLE
    depot: Coordinates
    driver_agent_id: AgentId | None = None
    carrier: str = Field(min_length=1)  # e.g. "FUTA Bus Lines", "internal"
    current_route_id: str | None = None
    fuel_cost_per_km: Money | None = None
    last_maintenance: datetime | None = None

    def is_available(self) -> bool:
        return self.status == VehicleStatus.AVAILABLE

    def assign(self, route_id: str, driver_agent_id: AgentId) -> None:
        if not self.is_available():
            raise ValueError(f"Vehicle {self.vehicle_id} is not available")
        self.status = VehicleStatus.ASSIGNED
        self.current_route_id = route_id
        self.driver_agent_id = driver_agent_id

    def complete_route(self) -> None:
        self.status = VehicleStatus.AVAILABLE
        self.current_route_id = None
        self.driver_agent_id = None


class FleetRoute(BaseModel):
    """Link between a RoutePlan and the vehicles executing it."""

    route_id: str = Field(min_length=1)
    plan_id: str = Field(min_length=1)
    vehicle_ids: list[str] = Field(min_length=1)
    dispatched_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    actual_distance_km: float | None = None
    actual_duration_min: int | None = None
    actual_cost: Money | None = None
    deviation_notes: str | None = None


class Fleet(BaseModel):
    """Aggregate root for a company's fleet of vehicles."""

    model_config = ConfigDict(frozen=False)

    fleet_id: str = Field(min_length=1)
    company_id: str = Field(min_length=1)
    vehicles: list[Vehicle] = Field(default_factory=list)
    routes: list[FleetRoute] = Field(default_factory=list)

    def available_vehicles(self, vehicle_type: VehicleType | None = None) -> list[Vehicle]:
        result = [v for v in self.vehicles if v.is_available()]
        if vehicle_type:
            result = [v for v in result if v.vehicle_type == vehicle_type]
        return result

    def register_vehicle(self, vehicle: Vehicle) -> None:
        if any(v.vehicle_id == vehicle.vehicle_id for v in self.vehicles):
            raise ValueError(f"Vehicle {vehicle.vehicle_id} already registered")
        self.vehicles.append(vehicle)
