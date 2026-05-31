"""Goal engine service tying planning, execution, verification, and memory."""

from __future__ import annotations

import concurrent.futures
import threading
from pathlib import Path
from typing import Any

from src.core.memory import MemoryEntry, MemoryStore
from src.mekongcli.core.execution import LocalExecutor
from src.mekongcli.core.governance import StopConditionPolicy
from src.mekongcli.core.swarm import RoleRegistry
from src.mekongcli.core.telemetry import GoalEventBusAdapter
from src.mekongcli.core.verification import VerificationPipeline

from .models import (
    Checkpoint,
    Goal,
    GoalStatus,
    TaskGraph,
    TaskStatus,
    VerificationRun,
    new_id,
)
from .planner import GoalPlanner
from .store import SQLiteGoalStore

_VALID_TRANSITIONS: dict[GoalStatus, set[GoalStatus]] = {
    GoalStatus.CREATED: {GoalStatus.PLANNED},
    GoalStatus.PLANNED: {GoalStatus.RUNNING},
    GoalStatus.RUNNING: {GoalStatus.VERIFYING, GoalStatus.BLOCKED, GoalStatus.CANCELLED},
    GoalStatus.VERIFYING: {GoalStatus.SATISFIED, GoalStatus.BLOCKED},
    GoalStatus.SATISFIED: set(),
    GoalStatus.BLOCKED: {GoalStatus.RUNNING},
    GoalStatus.CANCELLED: set(),
    GoalStatus.FAILED: {GoalStatus.RUNNING},
}
_MAX_CHECKPOINTS = 100


class GoalEngine:
    """Persistent, local-first autonomous goal execution service."""

    def __init__(
        self,
        store: SQLiteGoalStore | None = None,
        cwd: str | Path = ".",
        memory_store: MemoryStore | None = None,
    ) -> None:
        self.store = store or SQLiteGoalStore()
        self.cwd = Path(cwd)
        self.planner = GoalPlanner()
        self.roles = RoleRegistry()
        self.events = GoalEventBusAdapter()
        self.stop_policy = StopConditionPolicy()
        self.memory_store = memory_store

    def create_goal(self, title: str) -> Goal:
        goal = Goal(
            id=new_id("goal"),
            title=title,
            stop_conditions=list(StopConditionPolicy.DEFAULTS),
        )
        tasks, criteria = self.planner.decompose(goal.id, title)
        goal.status = GoalStatus.PLANNED
        self.store.save_goal(goal)
        self.store.save_tasks(tasks)
        self.store.save_criteria(goal.id, criteria)
        self._checkpoint(goal.id, None, "goal-created", {"tasks": len(tasks)})
        self._event(goal.id, "goal.created", {"title": title})
        self._memory(goal.id, "goal_created", title)
        return goal

    def run_goal(
        self,
        goal_id: str,
        verification_profile: str = "standard",
        execute_commands: bool = False,
    ) -> Goal:
        VerificationPipeline.validate_profile(verification_profile)
        goal = self._require_goal(goal_id)
        terminal = {GoalStatus.SATISFIED, GoalStatus.CANCELLED}
        if goal.status in terminal:
            raise RuntimeError(f"Goal {goal_id} is already {goal.status.value}")
        self._assert_transition(goal, GoalStatus.RUNNING)

        goal.status = GoalStatus.RUNNING
        self.store.save_goal(goal)
        self._event(goal.id, "goal.started", {"profile": verification_profile})

        tasks = self.store.get_tasks(goal.id)
        graph = TaskGraph(goal_id=goal.id, tasks=tasks)
        changed = True
        while changed:
            tasks_for_stop = self.store.get_tasks(goal.id)
            stop_reason = self.stop_policy.should_stop_for_retries(goal, tasks_for_stop)
            if stop_reason:
                goal.status = GoalStatus.BLOCKED
                self.store.save_goal(goal)
                self._event(goal.id, "goal.blocked", {"reason": stop_reason})
                return goal
            changed = False
            for task in graph.ready_tasks():
                if task.attempts >= task.max_attempts:
                    task.status = TaskStatus.FAILED
                    task.result_summary = f"max_attempts ({task.max_attempts}) exceeded"
                    self.store.save_tasks([task])
                    self._event(goal.id, "task.skipped", {"task_id": task.id, "reason": "max_attempts"})
                    continue
                task.status = TaskStatus.RUNNING
                task.attempts += 1
                self.store.save_tasks([task])
                assignment = self.roles.assign(task)
                self._event(
                    goal.id,
                    "task.started",
                    {
                        "task_id": task.id,
                        "role": assignment.role.value,
                        "rationale": assignment.rationale,
                    },
                )

                if execute_commands and task.command:
                    success, summary = self._execute_task(task.command)
                    task.status = TaskStatus.COMPLETED if success else TaskStatus.FAILED
                else:
                    summary = f"{assignment.role.value} completed directive: {task.title}"
                    task.status = TaskStatus.COMPLETED
                task.result_summary = summary
                self.store.save_tasks([task])
                self._checkpoint(
                    goal.id,
                    task.id,
                    f"task-completed:{task.title}",
                    {"role": task.role.value, "summary": summary},
                )
                self._event(goal.id, "task.completed", {"task_id": task.id, "summary": summary})
                changed = True
                graph = TaskGraph(goal_id=goal.id, tasks=self.store.get_tasks(goal.id))

        tasks = self.store.get_tasks(goal.id)
        if any(t.status == TaskStatus.FAILED for t in tasks):
            goal.status = GoalStatus.BLOCKED
            self.store.save_goal(goal)
            self._event(goal.id, "goal.blocked", {"reason": "tasks_failed"})
            return goal

        return self.verify_goal(goal.id, verification_profile)

    def run_goal_parallel(
        self,
        goal_id: str,
        verification_profile: str = "standard",
        execute_commands: bool = False,
        max_workers: int = 3,
    ) -> Goal:
        VerificationPipeline.validate_profile(verification_profile)
        goal = self._require_goal(goal_id)
        terminal = {GoalStatus.SATISFIED, GoalStatus.CANCELLED}
        if goal.status in terminal:
            raise RuntimeError(f"Goal {goal_id} is already {goal.status.value}")
        self._assert_transition(goal, GoalStatus.RUNNING)

        goal.status = GoalStatus.RUNNING
        self.store.save_goal(goal)
        self._event(goal.id, "goal.started", {"profile": verification_profile, "mode": "parallel"})

        db_lock = threading.Lock()
        active_futures: dict[concurrent.futures.Future, Goal] = {}

        def make_runner(t: Goal, role_val: str):
            def run() -> tuple[TaskStatus, str]:
                if t.attempts >= t.max_attempts:
                    return TaskStatus.FAILED, f"max_attempts ({t.max_attempts}) exceeded"
                if execute_commands and t.command:
                    success, summary = self._execute_task(t.command)
                    return TaskStatus.COMPLETED if success else TaskStatus.FAILED, summary
                summary = f"{role_val} completed directive: {t.title}"
                return TaskStatus.COMPLETED, summary
            return run

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            while True:
                with db_lock:
                    tasks = self.store.get_tasks(goal.id)
                    graph = TaskGraph(goal_id=goal.id, tasks=tasks)
                    ready = graph.ready_tasks()
                    running_ids = {t.id for t in active_futures.values()}
                    new_ready = [t for t in ready if t.id not in running_ids]

                    if not active_futures and not new_ready:
                        break

                    for task in new_ready:
                        task.status = TaskStatus.RUNNING
                        task.attempts += 1
                        self.store.save_tasks([task])
                        assignment = self.roles.assign(task)
                        self._event(
                            goal.id,
                            "task.started",
                            {
                                "task_id": task.id,
                                "role": assignment.role.value,
                                "rationale": assignment.rationale,
                            },
                        )
                        runner = make_runner(task, assignment.role.value)
                        future = executor.submit(runner)
                        active_futures[future] = task

                done, _ = concurrent.futures.wait(
                    active_futures.keys(),
                    return_when=concurrent.futures.FIRST_COMPLETED,
                )

                for future in done:
                    task = active_futures.pop(future)
                    try:
                        task_status, summary = future.result()
                    except Exception as exc:
                        task_status, summary = TaskStatus.FAILED, f"Error: {exc}"

                    with db_lock:
                        task.status = task_status
                        task.result_summary = summary
                        self.store.save_tasks([task])
                        self._checkpoint(
                            goal.id,
                            task.id,
                            f"task-{task_status.value}:{task.title}",
                            {"role": task.role.value, "summary": summary, "status": task_status.value},
                        )
                        self._event(
                            goal.id,
                            f"task.{task_status.value}",
                            {"task_id": task.id, "summary": summary, "role": task.role.value},
                        )

                with db_lock:
                    tasks = self.store.get_tasks(goal.id)
                    if any(t.status == TaskStatus.FAILED for t in tasks):
                        for future, task in list(active_futures.items()):
                            if not future.done():
                                future.cancel()
                        goal.status = GoalStatus.BLOCKED
                        self.store.save_goal(goal)
                        self._event(goal.id, "goal.blocked", {"reason": "tasks_failed"})
                        return goal

        return self.verify_goal(goal.id, verification_profile)

    def resume_goal(self, goal_id: str, verification_profile: str = "standard") -> Goal:
        goal = self._require_goal(goal_id)
        resumable = {GoalStatus.PLANNED, GoalStatus.BLOCKED}
        if goal.status not in resumable:
            raise RuntimeError(f"Cannot resume goal {goal_id} from {goal.status.value}")
        self._assert_transition(goal, GoalStatus.RUNNING)
        return self.run_goal(goal_id, verification_profile=verification_profile)

    def cancel_goal(self, goal_id: str) -> Goal:
        goal = self._require_goal(goal_id)
        cancellable = {GoalStatus.RUNNING, GoalStatus.PLANNED, GoalStatus.BLOCKED, GoalStatus.FAILED}
        if goal.status not in cancellable:
            raise RuntimeError(f"Cannot cancel goal {goal_id} already {goal.status.value}")
        self._assert_transition(goal, GoalStatus.CANCELLED)
        goal.status = GoalStatus.CANCELLED
        self.store.save_goal(goal)
        self._checkpoint(goal.id, None, "goal-cancelled", {})
        self._event(goal.id, "goal.cancelled", {})
        return goal

    def verify_goal(self, goal_id: str, verification_profile: str = "standard") -> Goal:
        VerificationPipeline.validate_profile(verification_profile)
        goal = self._require_goal(goal_id)
        self._assert_transition(goal, GoalStatus.VERIFYING)
        goal.status = GoalStatus.VERIFYING
        self.store.save_goal(goal)

        try:
            passed, results = VerificationPipeline.for_profile(verification_profile, self.cwd).run()
        except Exception as exc:
            goal.status = GoalStatus.BLOCKED
            self.store.save_goal(goal)
            self._event(goal.id, "goal.verification", {"passed": False, "error": str(exc)})
            return goal

        run = VerificationRun(
            id=new_id("verify"),
            goal_id=goal.id,
            profile=verification_profile,
            passed=passed,
            results=results,
        )
        self.store.save_verification_run(run)
        self._checkpoint(goal.id, None, "verification-completed", {"passed": passed})
        self._event(goal.id, "goal.verification", {"passed": passed, "profile": verification_profile})

        criteria = self.store.get_criteria(goal.id)
        for item in criteria:
            if item.description:
                criterion_passed = passed and any(
                    r.get("passed") for r in results if r.get("name", "").lower() in item.description.lower()
                )
                item.satisfied = criterion_passed
                item.evidence = f"verification:{run.id}" if criterion_passed else "no matching gate passed"
            else:
                item.satisfied = passed
                item.evidence = f"verification:{run.id}" if passed else "verification failed"
        self.store.save_criteria(goal.id, criteria)

        self._assert_transition(goal, GoalStatus.SATISFIED if passed else GoalStatus.BLOCKED)
        goal.status = GoalStatus.SATISFIED if passed else GoalStatus.BLOCKED
        self.store.save_goal(goal)
        status = "success" if passed else "failed"
        self._memory(goal.id, "verification", f"{verification_profile}:{status}")
        self._mirror_legacy_memory(goal, status, results)
        self._event(goal.id, "goal.completed", {"status": goal.status.value})
        return goal

    def status(self, goal_id: str) -> dict[str, Any]:
        return self.store.snapshot(goal_id)

    def list_goals(self) -> list[Goal]:
        return self.store.list_goals()

    def _execute_task(self, command: str | None) -> tuple[bool, str]:
        if not command:
            return False, "no command configured"
        outcome = LocalExecutor(self.cwd).run(command)
        if not outcome.success:
            return False, outcome.blocked_reason or outcome.stderr or f"exit {outcome.exit_code}"
        return True, outcome.stdout.strip() or "command completed"

    def _require_goal(self, goal_id: str) -> Goal:
        goal = self.store.get_goal(goal_id)
        if goal is None:
            raise KeyError(goal_id)
        return goal

    def _assert_transition(self, goal: Goal, target: GoalStatus) -> None:
        allowed = _VALID_TRANSITIONS.get(goal.status, set())
        if target not in allowed:
            raise RuntimeError(
                f"Cannot transition goal {goal.id} from {goal.status.value} to {target.value}"
            )

    def _checkpoint(
        self,
        goal_id: str,
        task_id: str | None,
        label: str,
        state: dict[str, Any],
    ) -> None:
        self._enforce_checkpoint_limit(goal_id)
        self.store.add_checkpoint(
            Checkpoint(id=new_id("checkpoint"), goal_id=goal_id, task_id=task_id, label=label, state=state)
        )

    def _enforce_checkpoint_limit(self, goal_id: str) -> None:
        checkpoints = self.store.get_checkpoints(goal_id)
        if len(checkpoints) >= _MAX_CHECKPOINTS:
            oldest = min(checkpoints, key=lambda c: c.created_at)
            self.store.delete_checkpoint(oldest.id)

    def _event(self, goal_id: str, event_name: str, payload: dict[str, Any]) -> None:
        self.store.add_event(goal_id, event_name, payload)
        try:
            self.events.emit(event_name, {"goal_id": goal_id, **payload})
        except Exception:
            pass

    def _memory(self, goal_id: str, kind: str, content: str) -> None:
        self.store.add_memory(goal_id, kind, content)
        try:
            self.events.emit("memory.recorded", {"goal_id": goal_id, "kind": kind})
        except Exception:
            pass

    def _mirror_legacy_memory(
        self,
        goal: Goal,
        status: str,
        results: list[dict[str, Any]],
    ) -> None:
        memory_store = self.memory_store
        if memory_store is None:
            try:
                memory_store = MemoryStore()
            except Exception:
                return
        errors = [
            str(item.get("stderr") or item.get("blocked_reason") or "")
            for item in results
            if not item.get("passed")
        ]
        try:
            memory_store.record(
                MemoryEntry(
                    goal=goal.title,
                    status=status,
                    error_summary="; ".join(errors)[:500],
                    recipe_used="goal-engine-v1",
                    context={"goal_id": goal.id},
                )
            )
        except Exception:
            return
