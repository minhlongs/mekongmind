"""Seed AgencyOS SQLite with a demo company (idempotent)."""
from __future__ import annotations
import asyncio
from pathlib import Path
from datetime import datetime, timezone

from application.interfaces.config import get_settings
from infrastructure.fleet.sqlite_fleet_repo import SQLiteFleetRepository


async def main() -> None:
    settings = get_settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    db_path = Path(str(settings.database_url).replace("sqlite+aiosqlite:///", ""))
    repo = SQLiteFleetRepository(db_path=str(db_path))
    fleet = await repo.get_fleet("demo")
    if fleet is None:
        import aiosqlite
        now = datetime.now(timezone.utc).isoformat()
        async with aiosqlite.connect(db_path) as db:
            await db.execute(
                "INSERT OR REPLACE INTO fleets (fleet_id, company_id, created_at) VALUES (?, ?, ?)",
                ("fleet-demo", "demo", now),
            )
            await db.commit()
        print(f"Seeded company=demo (fleet=fleet-demo)")
    else:
        print("Company=demo already exists")
    print(f"db={db_path}")


if __name__ == "__main__":
    asyncio.run(main())
