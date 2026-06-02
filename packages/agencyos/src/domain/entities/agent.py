"""Agent entity — core invariant: Agent is an autonomous worker bound to a role."""

from __future__ import annotations

import time
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, ConfigDict, PrivateAttr

from domain.value_objects.agent_id import AgentId
from domain.value_objects.agent_metadata import AgentMetadata


class AgentRole(str, Enum):
    """Six-layer hierarchy aligned with MekongMind stack."""

    FOUNDER = "founder"  # L0 — strategy, vision
    BUSINESS = "business"  # L1 — revenue, ops, compliance
    PRODUCT = "product"  # L2 — specs, roadmap
    ENGINEERING = "engineering"  # L3 — build, deploy
    DATA = "data"  # L4 — analytics, ML
    OPERATIONS = "operations"  # L5 — fleet, logistics, routing


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    BLOCKED = "blocked"
    ERROR = "error"
    RETIRED = "retired"


class Agent(BaseModel):
    """Pure domain entity — no I/O, no framework coupling.

    Invariants:
      - Agent MUST have a non-empty role.
      - Agent MUST have a unique AgentId.
      - State transitions: IDLE → RUNNING → (IDLE | BLOCKED | ERROR | RETIRED).
    """

    model_config = ConfigDict(frozen=False, validate_assignment=True)

    id: AgentId
    role: AgentRole
    status: AgentStatus = AgentStatus.IDLE
    metadata: AgentMetadata = Field(default_factory=AgentMetadata)
    parent_id: AgentId | None = None
    capabilities: list[str] = Field(default_factory=list)
    _started_at: float = PrivateAttr(default_factory=time.time)
    _completed_at: float | None = PrivateAttr(default=None)

    def start(self) -> None:
        """Transition to RUNNING. Invariant: must be IDLE or BLOCKED."""
        if self.status not in (AgentStatus.IDLE, AgentStatus.BLOCKED):
            raise ValueError(f"Cannot start agent in status {self.status}")
        self.status = AgentStatus.RUNNING
        self._started_at = time.time()

    def complete(self, result: str | None = None) -> None:
        """Mark as completed, return to IDLE."""
        self.status = AgentStatus.IDLE
        self._completed_at = time.time()
        if result:
            self.metadata.last_output = result[:4096]

    def retire(self) -> None:
        """Permanently remove from pool."""
        self.status = AgentStatus.RETIRED

    def fail(self, error: str) -> None:
        self.status = AgentStatus.ERROR
        self.metadata.last_error = error[:2048]

    def block(self, reason: str) -> None:
        self.status = AgentStatus.BLOCKED
        self.metadata.block_reason = reason

    @property
    def uptime_seconds(self) -> float:
        return time.time() - self._started_at

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": str(self.id),
            "role": self.role.value,
            "status": self.status.value,
            "uptime": self.uptime_seconds,
            "capabilities": self.capabilities,
            "last_error": self.metadata.last_error,
        }
