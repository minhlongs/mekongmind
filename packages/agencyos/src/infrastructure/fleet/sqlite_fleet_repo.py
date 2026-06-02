"""SQLite-backed FleetRepositoryPort implementation."""
from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Any
from pydantic import BaseModel, Field, ConfigDict

from domain.entities.fleet import Fleet, Vehicle, VehicleType, FleetRoute
from domain.value_objects.money import Money, Currency
from domain.value_objects.coordinates import Coordinates
from domain.value_objects.route import RoutePlan

logger = logging.getLogger(__name__)


class SQLiteFleetRepository:
    def __init__(self, db_path: str | Path = "./data/agencyos.db") -> None:
        self._db_path = Path(db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialized = False

    async def _ensure(self) -> None:
        if self._initialized:
            return
        import aiosqlite
        async with aiosqlite.connect(self._db_path) as db:
            await db.executescript("""
                CREATE TABLE IF NOT EXISTS fleets (
                    fleet_id TEXT PRIMARY KEY, company_id TEXT NOT NULL, created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS vehicles (
                    vehicle_id TEXT PRIMARY KEY, fleet_id TEXT, vehicle_type TEXT, plate TEXT,
                    capacity_units INTEGER, status TEXT, lat REAL, lng REAL, carrier TEXT,
                    current_route_id TEXT, driver_agent_id TEXT, fuel_cost_per_km REAL
                );
                CREATE TABLE IF NOT EXISTS route_plans (
                    plan_id TEXT PRIMARY KEY, company_id TEXT, carrier TEXT, algorithm_used TEXT,
                    total_distance_km REAL, total_cost_amount REAL, total_cost_currency TEXT,
                    status TEXT, solver_metadata TEXT, created_at TEXT
                );
                CREATE TABLE IF NOT EXISTS route_waypoints (
                    plan_id TEXT, ord INTEGER, name TEXT, lat REAL, lng REAL,
                    demand_units INTEGER, service_time_min INTEGER, vehicle_id TEXT
                );
            """)
            await db.commit()
        self._initialized = True

    async def get_fleet(self, company_id: str) -> Fleet | None:
        await self._ensure()
        import aiosqlite
        async with aiosqlite.connect(self._db_path) as db:
            async with db.execute("SELECT fleet_id FROM fleets WHERE company_id = ?", (company_id,)) as cur:
                row = await cur.fetchone()
                if not row:
                    return None
                fleet_id = row[0]
                async with db.execute("SELECT * FROM vehicles WHERE fleet_id = ?", (fleet_id,)) as cur:
                    rows = await cur.fetchall()
                    cols = [d[0] for d in cur.description]
                    vehicles = [self._row_to_vehicle(dict(zip(cols, r))) for r in rows]
                return Fleet(fleet_id=fleet_id, company_id=company_id, vehicles=vehicles)

    async def list_vehicles(self, fleet_id: str, *, vehicle_type: VehicleType | None = None) -> list[Vehicle]:
        await self._ensure()
        import aiosqlite
        async with aiosqlite.connect(self._db_path) as db:
            query = "SELECT * FROM vehicles WHERE fleet_id = ?"
            params: tuple = (fleet_id,)
            if vehicle_type:
                query += " AND vehicle_type = ?"
                params = (fleet_id, vehicle_type.value)
            async with db.execute(query, params) as cur:
                rows = await cur.fetchall()
                cols = [d[0] for d in cur.description]
                return [self._row_to_vehicle(dict(zip(cols, r))) for r in rows]

    async def save_route_plan(self, plan: RoutePlan) -> RoutePlan:
        await self._ensure()
        import aiosqlite, json
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute(
                "INSERT OR REPLACE INTO route_plans (plan_id, company_id, carrier, algorithm_used, total_distance_km, total_cost_amount, total_cost_currency, status, solver_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    plan.plan_id, "", plan.carrier, plan.algorithm_used, plan.total_distance.km,
                    float(plan.total_cost.amount), plan.total_cost.currency.value, plan.status.value,
                    json.dumps(plan.solver_metadata), plan.created_at.isoformat(),
                ),
            )
            await db.executemany(
                "INSERT OR REPLACE INTO route_waypoints (plan_id, ord, name, lat, lng, demand_units, service_time_min, vehicle_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [(plan.plan_id, w.order, w.name, w.coordinates.lat, w.coordinates.lng, w.demand_units, w.service_time_min, w.vehicle_id) for w in plan.waypoints],
            )
            await db.commit()
        return plan

    def _row_to_vehicle(self, row: dict[str, Any]) -> Vehicle:
        return Vehicle(
            vehicle_id=row["vehicle_id"],
            vehicle_type=VehicleType(row.get("vehicle_type", "van")),
            plate=row.get("plate"),
            capacity_units=row.get("capacity_units", 0),
            status=row.get("status", "available"),
            depot=Coordinates(lat=row.get("lat", 0.0), lng=row.get("lng", 0.0)),
            carrier=row.get("carrier", "internal"),
            current_route_id=row.get("current_route_id"),
            driver_agent_id=row.get("driver_agent_id"),
        )
