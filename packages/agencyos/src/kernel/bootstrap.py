"""AgencyOS kernel — bootstrap entry point.

Usage:
    python -m agencyos.kernel.bootstrap              # manual wiring
    python -m agencyos.kernel.bootstrap --auto       # auto-detect hardware
    python -m agencyos.kernel.bootstrap --auto --parallel  # parallel component init
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import sys
from pathlib import Path
from typing import Any

from application.interfaces.config import get_settings
from application.services.context_router import ContextRouter, ContextBudget
from application.services.event_bus import EventBus
from domain.events.system_events import SystemBootstrapEvent


def _configure_logging() -> logging.Logger:
    root = logging.getLogger("agencyos")
    level = getattr(logging, get_settings().log_level, logging.INFO)
    root.setLevel(level)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s", datefmt="%H:%M:%S"))
    root.addHandler(handler)
    return root


async def _init_component(name: str, init_fn: Any) -> tuple[str, Any]:
    try:
        instance = await init_fn() if asyncio.iscoroutinefunction(init_fn) else init_fn()
        return name, instance
    except Exception as exc:  # noqa: BLE001
        logging.getLogger("agencyos.kernel").exception("Failed to init %s: %s", name, exc)
        return name, None


async def bootstrap_parallel(settings: Any) -> dict[str, Any]:
    log = logging.getLogger("agencyos.kernel")
    log.info("Parallel bootstrap starting (mode=%s)", settings.env)

    event_bus = EventBus()
    context_router = ContextRouter(ContextBudget(max_tokens=settings.context_window_max_tokens))

    components: dict[str, Any] = {
        "event_bus": event_bus,
        "context_router": context_router,
        "settings": settings,
    }

    inits: dict[str, Any] = {
        "llm_provider": lambda: _build_llm(settings),
        "fleet_repo": lambda: _build_fleet_repo(settings),
        "route_solver": lambda: _build_route_solver(settings),
        "sop_store": lambda: _build_sop_store(settings),
    }

    results = await asyncio.gather(*[_init_component(n, fn) for n, fn in inits.items()])
    for name, instance in results:
        if instance is not None:
            components[name] = instance
            log.info("Loaded component: %s", name)

    event_bus.subscribe("system.bootstrap", lambda e: log.info("Bootstrap event: %s", e))

    use_case_reqs = {
        "use_case.optimize_route": lambda: _build_optimize_route(components),
        "use_case.run_agent_task": lambda: _build_run_agent_task(components),
    }
    uc_results = await asyncio.gather(*[_init_component(n, fn) for n, fn in use_case_reqs.items()])
    for name, instance in uc_results:
        if instance is not None:
            components[name] = instance

    log.info("AgencyOS kernel bootstrap complete. Loaded: %s", sorted(components.keys()))
    return components


async def bootstrap(settings: Any, *, parallel: bool = False) -> dict[str, Any]:
    if parallel:
        return await bootstrap_parallel(settings)
    # Sequential fallback
    comps: dict[str, Any] = {"settings": settings}
    for name, fn in [
        ("event_bus", lambda: EventBus()),
        ("context_router", lambda: ContextRouter(ContextBudget(max_tokens=settings.context_window_max_tokens))),
        ("llm_provider", lambda: _build_llm(settings)),
        ("fleet_repo", lambda: _build_fleet_repo(settings)),
        ("route_solver", lambda: _build_route_solver(settings)),
        ("sop_store", lambda: _build_sop_store(settings)),
    ]:
        n, inst = await _init_component(name, fn)
        if inst is not None:
            comps[n] = inst
    for name, fn in [
        ("use_case.optimize_route", lambda: _build_optimize_route(comps)),
        ("use_case.run_agent_task", lambda: _build_run_agent_task(comps)),
    ]:
        n, inst = await _init_component(name, fn)
        if inst is not None:
            comps[n] = inst
    return comps


def _build_llm(settings: Any) -> Any:
    from infrastructure.llm.unified import UnifiedLLM, LLMMode
    mode_map = {
        "vertex": LLMMode.VERTEX,
        "openai": LLMMode.OPENAI,
        "anthropic": LLMMode.ANTHROPIC,
        "local": LLMMode.LOCAL,
        "litellm": LLMMode.LITELLM,
    }
    mode = mode_map.get(settings.llm_provider, LLMMode.VERTEX)
    return UnifiedLLM(
        mode=mode,
        vertex_project_id=settings.vertex_project_id,
        vertex_location=settings.vertex_location,
        vertex_model=settings.vertex_model,
        openai_api_key=settings.openai_api_key,
        anthropic_api_key=settings.anthropic_api_key,
        local_mlx_model=settings.local_mlx_model,
        litellm_api_base=settings.litellm_api_base,
    )


def _build_fleet_repo(settings: Any) -> Any:
    from infrastructure.fleet.sqlite_fleet_repo import SQLiteFleetRepository
    return SQLiteFleetRepository(settings.sqlite_path)


def _build_route_solver(settings: Any) -> Any:
    from infrastructure.routing.ortools_solver import ORToolsRouteSolver
    return ORToolsRouteSolver(timeout_s=settings.route_optimization_timeout_s)


def _build_sop_store(settings: Any) -> Any:
    from infrastructure.sops.sop_store import SOPStore
    return SOPStore(settings.data_dir / "sops")


def _build_optimize_route(comps: dict[str, Any]) -> Any:
    from application.use_cases.optimize_route import OptimizeRouteUseCase
    return OptimizeRouteUseCase(
        fleet_repo=comps["fleet_repo"],
        route_solver=comps["route_solver"],
        llm=comps.get("llm_provider"),
        event_bus=comps.get("event_bus"),
    )


def _build_run_agent_task(comps: dict[str, Any]) -> Any:
    from application.use_cases.run_agent_task import RunAgentTaskUseCase
    # In real boot, agent registry + runtime would be passed here
    return RunAgentTaskUseCase(runtime=None, registry=None, event_bus=comps.get("event_bus"))


class AgencyOSKernel:
    """Lazy bootstrap wrapper — call .start() once, then access components."""

    def __init__(self) -> None:
        self._components: dict[str, Any] | None = None
        self._settings = get_settings()

    async def start(self, *, parallel: bool = False) -> dict[str, Any]:
        _configure_logging()
        self._components = await bootstrap(self._settings, parallel=parallel)
        return self._components

    @property
    def components(self) -> dict[str, Any]:
        if self._components is None:
            raise RuntimeError("Kernel not started — call await kernel.start() first")
        return self._components

    def get(self, name: str) -> Any:
        return self.components.get(name)


async def _run_cli() -> int:
    parser = argparse.ArgumentParser(prog="agencyos", description="AgencyOS kernel bootstrap")
    parser.add_argument("--auto", action="store_true", help="auto-detect hardware")
    parser.add_argument("--parallel", action="store_true", help="parallel component init")
    parser.add_argument("--dry-run", action="store_true", help="dry-run (no actual wiring)")
    args = parser.parse_args()
    kernel = AgencyOSKernel()
    comps = await kernel.start(parallel=args.parallel)
    print(f"AgencyOS bootstrap OK. Components loaded: {sorted(comps.keys())}")
    return 0


# ---------------------------------------------------------------------------
# CLI factory helpers — rebuild use-cases with fresh deps on each invocation.
# ---------------------------------------------------------------------------

from application.use_cases.optimize_route import OptimizeRouteUseCase
from application.use_cases.run_agent_task import RunAgentTaskUseCase
from application.use_cases.dispatch_fleet import DispatchFleetUseCase
from application.services.agent_orchestrator import AgentOrchestrator


def build_optimize_route() -> OptimizeRouteUseCase:
    """Factory: fresh OptimizeRouteUseCase wired to current config."""
    settings = get_settings()
    fleet_repo = _build_fleet_repo(settings)
    route_solver = _build_route_solver(settings)
    return OptimizeRouteUseCase(fleet_repo=fleet_repo, route_solver=route_solver)


def build_run_agent_task() -> RunAgentTaskUseCase:
    """Factory: fresh RunAgentTaskUseCase wired to current config."""
    settings = get_settings()
    llm = _build_llm(settings)
    event_bus = EventBus()
    orchestrator = AgentOrchestrator(
        llm=llm,
        fleet_repo=_build_fleet_repo(settings),
        agent_repo=None,
        task_repo=None,
        event_bus=event_bus,
        context_router=ContextRouter(ContextBudget(max_tokens=settings.context_window_max_tokens)),
    )
    return RunAgentTaskUseCase(orchestrator=orchestrator, event_bus=event_bus)


def build_dispatch_fleet() -> DispatchFleetUseCase:
    """Factory: fresh DispatchFleetUseCase wired to current config."""
    settings = get_settings()
    return DispatchFleetUseCase(fleet_repo=_build_fleet_repo(settings))


if __name__ == "__main__":
    sys.exit(asyncio.run(_run_cli()))
