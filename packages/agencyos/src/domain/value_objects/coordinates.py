"""Coordinates and GeoDistance — geospatial primitives for route optimization."""
from __future__ import annotations
import math
from pydantic import BaseModel, Field, ConfigDict


class Coordinates(BaseModel):
    model_config = ConfigDict(frozen=True, validate_assignment=True)

    lat: float = Field(ge=-90, le=90, description="Latitude in decimal degrees.")
    lng: float = Field(ge=-180, le=180, description="Longitude in decimal degrees.")
    name: str | None = Field(default=None, max_length=200)

    def haversine_km(self, other: Coordinates) -> float:
        R = 6371.0
        phi1 = math.radians(self.lat)
        phi2 = math.radians(other.lat)
        dphi = math.radians(other.lat - self.lat)
        dlambda = math.radians(other.lng - self.lng)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 3)

    def to_wkt(self) -> str:
        return f"POINT({self.lng} {self.lat})"


class GeoDistance(BaseModel):
    model_config = ConfigDict(frozen=True)

    km: float = Field(ge=0, description="Distance in kilometres.")
    metres: int = Field(ge=0, description="Distance in metres (integer).")

    @classmethod
    def from_km(cls, km: float) -> GeoDistance:
        return cls(km=round(km, 3), metres=int(km * 1000))

    @classmethod
    def from_metres(cls, metres: int) -> GeoDistance:
        return cls(km=metres / 1000, metres=metres)

    def __str__(self) -> str:
        if self.km < 1:
            return f"{self.metres}m"
        return f"{self.km}km"
