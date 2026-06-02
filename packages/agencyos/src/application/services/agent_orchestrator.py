"""AgentOrchestrator — high-level orchestrator aligning with 6-layer agent stack."""
from __future__ import annotations
import logging
from typing import Any, Protocol, runtime_checkable
from pydantic import BaseModel, Field, ConfigDict

from domain.entities.agent import Agent, AgentRole, AgentStatus
from domain.value_objects.agent_id import AgentId

logger = logging.getLogger(__name__)


@runtime_checkable
class AgentPoolPort(Protocol):
    async def register(self, agent: Agent) -> None: ...
    async def get(self, agent_id: str) -> Agent | None: ...
    async def find_available(self, role: AgentRole) -> Agent | None: ...
    async def list_by_role(self, role: AgentRole) -> list[Agent]: ...


class AgentOrchestrator:
    def __init__(self, pool: AgentPoolPort) -> None:
        self._pool = pool
        self._logger = logging.getLogger(f"{__name__}.{id(self)}")

    async def bootstrap_agents(self, config: dict[str, Any]) -> dict[AgentRole, int]:
        counts: dict[AgentRole, int] = {}
        for role_str, count in config.get("agents_per_role", {}).items():
            role = AgentRole(role_str)
            for _ in range(count):
                agent = Agent(id=AgentId(), role=role)
                await self._pool.register(agent)
                counts[role] = counts.get(role, 0) + 1
                self._logger.info("Registered agent %s role=%s", agent.id, role.value)
        return counts

    async def dispatch(self, role: AgentRole, task_payload: dict[str, Any]) -> Agent | None:
        agent = await self._pool.find_available(role)
        if agent is None:
            self._logger.warning("No available agent for role=%s", role.value)
            return None
        agent.start()
        self._logger.info("Dispatched agent %s role=%s", agent.id, role.value)
        return agent
