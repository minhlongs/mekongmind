"""Use-case: BootstrapAgencyOS — the entry point that wires all components together."""
from __future__ import annotations
import logging
from typing import Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict

from domain.events.system_events import SystemBootstrapEvent

logger = logging.getLogger(__name__)


class BootstrapMode(str, Enum):
    AUTO = "auto"
    MANUAL = "manual"
    PARALLEL = "parallel"


class BootstrapRequest(BaseModel):
    model_config = ConfigDict(frozen=False)
    mode: BootstrapMode = BootstrapMode.AUTO
    parallel: bool = False
    config_path: str | None = None
    dry_run: bool = False
    components: list[str] = Field(default_factory=lambda: [
        "database",
        "event_bus",
        "llm_provider",
        "agent_registry",
        "route_solver",
        "fleet_repo",
        "workflow_engine",
        "telemetry",
    ])


class BootstrapAgencyOSUseCase:
    def __init__(self, components: dict[str, Any], event_bus: Any | None = None) -> None:
        self._components = components
        self._event_bus = event_bus
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")
        self._loaded: list[str] = []

    async def execute(self, req: BootstrapRequest) -> dict[str, Any]:
        self._logger.info("Bootstrapping AgencyOS mode=%s parallel=%s", req.mode.value, req.parallel)
        if req.dry_run:
            self._logger.info("DRY RUN — skipping actual wiring")
            return {"mode": req.mode.value, "dry_run": True, "components": req.components}
        # Each component should implement a `start()` coroutine
        failed: list[str] = []
        for name in req.components:
            comp = self._components.get(name)
            if comp is None:
                self._logger.warning("Component %s not registered — skipping", name)
                continue
            try:
                if hasattr(comp, "start"):
                    await comp.start()
                self._loaded.append(name)
                self._logger.info("Component loaded: %s", name)
            except Exception as exc:  # noqa: BLE001
                failed.append(name)
                self._logger.exception("Failed to load %s: %s", name, exc)
        result = {"mode": req.mode.value, "loaded": self._loaded, "failed": failed}
        if self._event_bus:
            await self._event_bus.publish(SystemBootstrapEvent(mode=req.mode.value, parallel=req.parallel, components_loaded=self._loaded))
        if failed:
            self._logger.error("Bootstrap partially failed: %s", failed)
        return result
