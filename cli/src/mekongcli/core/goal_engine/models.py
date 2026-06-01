"""Typed models for persistent autonomous goals."""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


def _now() -> float:
    return time.time()


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class GoalStatus(str, Enum):
    CREATED = "created"
    PLANNED = "planned"
    RUNNING = "running"
    VERIFYING = "verifying"
    SATISFIED = "satisfied"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"
    FAILED = "failed"


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"
    SKIPPED = "skipped"


class AgentRole(str, Enum):
    ARCHITECT = "architect"
    BACKEND = "backend"
    FRONTEND = "frontend"
    INFRA = "infra"
    QA = "qa"
    SECURITY = "security"
    DOCS = "docs"
    QUANT = "quant"
    REVIEWER = "reviewer"


@dataclass
class AcceptanceCriterion:
    id: str
    description: str
    satisfied: bool = False
    evidence: str = ""


@dataclass
class Goal:
    id: str
    title: str
    status: GoalStatus = GoalStatus.CREATED
    created_at: float = field(default_factory=_now)
    updated_at: float = field(default_factory=_now)
    retry_limit: int = 3
    stop_conditions: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class GoalTask:
    id: str
    goal_id: str
    title: str
    description: str
    role: AgentRole
    status: TaskStatus = TaskStatus.PENDING
    depends_on: list[str] = field(default_factory=list)
    attempts: int = 0
    max_attempts: int = 3
    command: str | None = None
    result_summary: str = ""
    created_at: float = field(default_factory=_now)
    updated_at: float = field(default_factory=_now)


@dataclass
class TaskGraph:
    goal_id: str
    tasks: list[GoalTask]

    def ready_tasks(self) -> list[GoalTask]:
        completed = {task.id for task in self.tasks if task.status == TaskStatus.COMPLETED}
        cycle = self._detect_cycle()
        if cycle:
            raise ValueError(f"Circular dependency detected in task graph: {' -> '.join(cycle)}")
        return [
            task
            for task in self.tasks
            if task.status == TaskStatus.PENDING and all(dep in completed for dep in task.depends_on)
        ]

    @staticmethod
    def _detect_cycle(tasks: list | None = None) -> list[str] | None:
        """Detect circular dependencies using DFS with WHITE/GRAY/BLACK coloring."""
        from enum import Enum, auto
        class _Color(Enum):
            WHITE = auto()
            GRAY = auto()
            BLACK = auto()

        node_map: dict[str, list[str]] = {}
        if tasks is None:
            tasks = []
        for task in tasks:
            node_map[task.id] = list(task.depends_on)

        WHITE, GRAY, BLACK = _Color.WHITE, _Color.GRAY, _Color.BLACK
        color = {tid: WHITE for tid in node_map}
        path: list[str] = []

        def dfs(node: str) -> list[str] | None:
            color[node] = GRAY
            path.append(node)
            for dep in node_map.get(node, []):
                if dep not in color:
                    continue
                if color[dep] == GRAY:
                    cycle_start = path.index(dep)
                    return path[cycle_start:] + [dep]
                if color[dep] == WHITE:
                    result = dfs(dep)
                    if result:
                        return result
            path.pop()
            color[node] = BLACK
            return None

        for tid in list(node_map.keys()):
            if color[tid] == WHITE:
                result = dfs(tid)
                if result:
                    return result
        return None


@dataclass
class Checkpoint:
    id: str
    goal_id: str
    task_id: str | None
    label: str
    state: dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=_now)


@dataclass
class VerificationRun:
    id: str
    goal_id: str
    profile: str
    passed: bool
    results: list[dict[str, Any]]
    created_at: float = field(default_factory=_now)
