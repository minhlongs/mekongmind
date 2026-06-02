"""SOP store — persist and retrieve StandardOperatingProcedure instances."""
from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Any
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class SOPStore:
    def __init__(self, data_dir: Path | str = "./data/sops") -> None:
        self._root = Path(data_dir)
        self._root.mkdir(parents=True, exist_ok=True)
        self._cache: dict[str, dict[str, Any]] = {}

    def register(self, sop: Any) -> None:
        key = sop.id
        self._cache[key] = sop.model_dump()
        path = self._root / f"{key}.json"
        path.write_text(json.dumps(sop.model_dump(), ensure_ascii=False, indent=2), encoding="utf-8")
        logger.info("SOP registered: %s -> %s", sop.id, path)

    def get(self, sop_id: str) -> dict[str, Any] | None:
        if sop_id in self._cache:
            return self._cache[sop_id]
        path = self._root / f"{sop_id}.json"
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            self._cache[sop_id] = data
            return data
        return None

    def list_active(self) -> list[dict[str, Any]]:
        return [v for v in self._cache.values() if v.get("is_active", True)]

    def find_by_trigger(self, context: dict[str, Any]) -> list[dict[str, Any]]:
        return [sop for sop in self.list_active() if any(c in context for c in sop.get("trigger_conditions", []))]
