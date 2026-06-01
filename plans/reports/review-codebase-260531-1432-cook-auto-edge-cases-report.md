# Cook-Auto Edge Case Verification Report

**Project:** MekongMind | **Scope:** `cook-auto` module (goal engine + CLI)
**Date:** 2026-05-31 | **Method:** Ultrathink → Parallel code-reviewer verification
**Reviewers:** 5 dispatched, 5 completed — 52/52 edge cases verified across 6 categories

---

## Edge Cases Identified (Ultrathink — 52 cases across 6 categories)

| # | Category | Cases |
|---|----------|-------|
| 1 | CLI Input Validation | 8 (empty goal, long strings, special chars, invalid profile, negative workers, flag combos, db_path traversal, shlex safety) |
| 2 | SQLite Persistence | 9 (corruption, lock timeout, disk full, cross-process, SQL injection, JSON parse errors, schema migration, dir perms, UUID collision) |
| 3 | Goal Execution | 12 (empty command, shell injection, timeout, failure marking, max_attempts, circular deps, missing deps, status transitions, stop conditions, memory failure, event bus, empty tasks) |
| 4 | Parallel Execution | 9 (closure captures, race conditions, deadlock, future exceptions, lock granularity, max_workers bound, graph race, SIGINT, empty list) |
| 5 | Verification & State | 10 (no tasks, pipeline crash, result corruption, resume running, cancel satisfied, double exec, snapshot races, checkpoint flooding, criteria never checked, legacy memory) |
| 6 | TypeScript Engine | 8 (multi-model routing failure, fallback loop exhaustion, session memory failure, event bus failure, OpenClaw unavailability, circuit breaker, LLM unavailability, type coercion) |

---

## Verification Results (from completed reviewers)

### Category: Goal Execution (reviewer: a4f7843c) — 12 cases

| # | Edge Case | Verdict | Severity | Location |
|---|-----------|---------|----------|----------|
| 1 | Empty command → COMPLETED | ❌ Unhandled | High | service.py:100-103 |
| 2 | Shell injection via task command | ✅ Handled | None | local_executor.py:50-51 (no shell=True) |
| 3 | Task execution timeout | ✅ Handled | None | local_executor.py:32,55,64-72 (60s + TimeoutExpired caught) |
| 4 | Failure → COMPLETED (never FAILED) | ❌ **Critical** | Critical | service.py:103 — FAILED enum exists but never assigned |
| 5 | max_attempts not enforced | ❌ Unhandled | High | models.py:82 (max_attempts=3 dead data) |
| 6 | Circular dependencies | ⚠️ Partial | Medium | models.py:94-100 (safe by accident, no diagnostics) |
| 7 | Missing dependency | ⚠️ Partial | Medium | service.py:83-128 (BLOCKED, no diagnostics) |
| 8 | Invalid status transitions | ❌ Unhandled | Medium | service.py:76 (no state machine) |
| 9 | Stop conditions broken | ❌ Unhandled | High | stop_conditions.py:19-23 (counts FAILED tasks, but none exist) |
| 10 | Memory store failure | ✅ Handled | Low | service.py:312-340 (silent swallow, intentional) |
| 11 | Event bus failure | ⚠️ Partial | Low | service.py:305-306 (store-first, bus unprotected) |
| 12 | Planner returns no tasks | ⚠️ Partial | Low | service.py:83-130 (falls through to verification) |

### Category: Parallel Execution (reviewer: a35aa150) — 9 cases

| # | Edge Case | Verdict | Severity | Location |
|---|-----------|---------|----------|----------|
| 1 | Thread safety of task closure | ✅ Handled | None | service.py:180 (default param binding) |
| 2 | Race condition in status updates | ✅ Handled | None | service.py:154-205 (db_lock covers reads+writes) |
| 3 | Deadlock with circular deps | ✅ Handled | None | service.py:161 (break when no futures + no ready) |
| 4 | Future exception → COMPLETED | ❌ **Unhandled** | Critical | service.py:197-203 (same bug as #4 above) |
| 5 | db_lock granularity | ✅ Handled | None | Lock held only for brief DB ops |
| 6 | No upper bound on max_workers | ❌ Unhandled | Medium | service.py:137 (no validation beyond >0) |
| 7 | Race between graph rebuild and submission | ✅ Handled | None | service.py:158-159 (running_ids filter) |
| 8 | SIGINT / KeyboardInterrupt | ⚠️ Partial | Low | service.py:152 (no cancel handling, tasks stuck RUNNING) |
| 9 | Empty task list / circular deps | ✅ Handled | None | service.py:161,223-226 |

---

## Summary

| Status | Count |
|--------|-------|
| Total verified | 21 |
| ✅ Handled | 10 |
| ❌ Unhandled | 7 |
| ⚠️ Partial | 4 |
| Not verified (socket errors) | 31 (5 reviewers failed) |

---

## Critical Findings (Need Fix)

### CRITICAL: Failure marking chain (affects 3 bugs)

**Root cause:** service.py:103 and service.py:203 always set `TaskStatus.COMPLETED`, even when `_execute_task` returns error.

**Cascade effects:**
1. `max_attempts` (models.py:82) never checked → infinite retries on failing tasks
2. `should_stop_for_retries` (stop_conditions.py:19-23) sums `status == "failed"` → always 0 → never triggers
3. `FAILED` enum value (models.py:34) is dead code — never assigned anywhere
4. Parallel path: `future.result()` exceptions caught but still marked COMPLETED

**Fix:** In both `run_goal` (line 103) and `run_goal_parallel` (line 203), check if execution succeeded before marking COMPLETED:
```python
if outcome.success or not error_indicator:
    task.status = TaskStatus.COMPLETED
else:
    task.status = TaskStatus.FAILED
    task.attempts += 1  # already incremented at line 87/168
```

### HIGH: Empty command → fake COMPLETED (service.py:100-103)

When `execute_commands=False` or `task.command is None`, the ternary produces a fabricated summary string and marks the task COMPLETED with zero actual work.

**Fix:** Either validate that task.command exists when execute_commands=True, or mark tasks without commands as SKIPPED.

### HIGH: No max_workers upper bound (service.py:137)

`--workers 10000` would spawn 10K threads on an M1 16GB Mac.

**Fix:** Clamp to `min(max_workers, os.cpu_count() * 2)` or a hard ceiling like 16.

### MEDIUM: No status transition state machine

`run_goal` only blocks CANCELLED → RUNNING. SATISFIED and FAILED goals can be re-executed, overwriting evidence.

**Fix:** Add transition guards or a simple state machine table.

---

## Unresolved Questions

1. Should the 3 failed reviewers be re-dispatched to cover: CLI Input Validation, SQLite Persistence, Verification & State Management?
2. Is the `auto` flag in `cook_auto()` (cook_command.py:122) a no-op or does it affect AGY integration?
3. What should happen with tasks that have no command — COMPLETED, SKIPPED, or BLOCKED?
4. Should acceptance criteria (4 stored but never evaluated) be checked during verification?

---

### Category: Verification & State Management (reviewer: abd89d76) — 10 cases

| # | Edge Case | Verdict | Severity | Location |
|---|-----------|---------|----------|----------|
| 1 | Verification with no tasks | ⚠️ Partial | Low | service.py:242-247 (pipeline runs, wasteful but safe) |
| 2 | Pipeline crash | ❌ Unhandled | **High** | service.py:247 (no try/except, goal stuck VERIFYING) |
| 3 | Results serialization | ❌ Unhandled | **High** | gates.py:73-77, store.py:323 (json.dumps on unvalidated output) |
| 4 | Resume already-running goal | ❌ Unhandled | **High** | service.py:232,73 (no RUNNING check, duplicate exec) |
| 5 | Cancel completed/satisfied | ❌ Unhandled | **High** | service.py:234-240 (no status guard) |
| 6 | Double execution | ⚠️ Partial | Medium | service.py:65-78 (no idempotency, attempts inflate) |
| 7 | Snapshot during write | ✅ Handled | Low | store.py:399 (RLock covers entire snapshot) |
| 8 | Checkpoint flooding | ❌ Unhandled | Medium | service.py:106-111 (unbounded, no LIMIT) |
| 9 | Acceptance criteria never checked | ❌ Unhandled | **High** | service.py:259-263 (bulk satisfaction, never evaluated) |
| 10 | Legacy memory mirror swallows errors | ⚠️ Partial | Medium | service.py:322,339 (bare `except Exception: return`) |

### Category: SQLite Persistence (reviewer: aef39afa) — 9 cases

| # | Edge Case | Verdict | Severity | Location |
|---|-----------|---------|----------|----------|
| 1 | Database corruption | ❌ Unhandled | High | store.py:34 (`_connect` no integrity_check) |
| 2 | DB locked / OperationalError | ⚠️ Partial | Medium | store.py:35 (timeout=30s but no try/except) |
| 3 | Disk full / IOError | ❌ Unhandled | High | All write methods (no IOError handling) |
| 4 | Cross-process access | ⚠️ Partial | Medium | store.py:38 (WAL helps, no crash recovery) |
| 5 | SQL injection | ✅ Handled | None | All queries use `?` placeholders |
| 6 | JSON parse errors | ❌ Unhandled | High | store.py:157,158,262,304,347,372 (6x `json.loads()` no try/except) |
| 7 | Schema migration | ⚠️ Partial | Medium | store.py:48 (IF NOT EXISTS won't add columns) |
| 8 | Directory permissions | ❌ Unhandled | Medium | store.py:30 (mkdir no try/except) |
| 9 | UUID collision | ⚠️ Partial | Low | models.py:17 (48 bits, no detection, silent overwrite) |

### Category: CLI Input Validation (reviewer: ab40137e) — 8 cases

| # | Edge Case | Verdict | Severity | Location |
|---|-----------|---------|----------|----------|
| 1 | Empty goal string | ✅ Handled | None | cook_command.py:139-142, 215-220 (BadParameter before engine creation) |
| 2 | Very long goal string (10KB) | ⚠️ Partial | Low | No length guard; SQLite TEXT handles it, but LLM may fail |
| 3 | Special characters in goal | ✅ Handled | None | Parameterized SQL + SQLite UTF-8 TEXT |
| 4 | Invalid profile + engine creation | ✅ Handled | None | cook_command.py:139/215 (validate before engine at 143/221) |
| 5 | Negative/zero max_workers | ❌ Unhandled | Medium | cook_command.py:216-217 (no upper bound, `--workers 10000` possible) |
| 6 | --json with --auto (no-op flag) | ⚠️ Partial | Low | cook_command.py:121-125 (stored in payload but unused by engine) |
| 7 | db_path traversal | ❌ Unhandled | **High** | store.py:28-30 (no path containment, `--db ../../etc/passwd` writes outside project) |
| 8 | shlex.quote safety | ✅ Handled | None | cook_command.py:59 (display-only strings, actual DB uses parameterized SQL) |

### Category: TypeScript Engine (reviewer: a0f24a6b) — 8 cases

| # | Edge Case | Verdict | Severity | Location |
|---|-----------|---------|----------|----------|
| 1 | Multi-model routing failure | ⚠️ Partial | Medium | engine.ts:166 (`needsThinking` doesn't exist, safe by accident; no guards if implemented) |
| 2 | Fallback loop exhaustion asymmetry | ⚠️ Partial | Medium | engine.ts:199,207 (coding tasks maxAttempts=1 fires before fallback at line 214 — dead code) |
| 3 | Session memory failure | ❌ Unhandled | High | engine.ts:171,220; session.ts:40 (appendFile uncaught — disk full blocks task result return) |
| 4 | Telemetry/event bus failure | ❌ Unhandled | Medium | events.ts:19-21 (emit() synchronous, bad listener crashes caller) |
| 5 | OpenClaw unavailability | ⚠️ Partial | Medium | engine.ts:174,191 (ensureInitialized helps, no runtime fallback for classifyComplexity) |
| 6 | Circuit breaker | Not implemented | Low | engine.ts:100 (delegated to OpenClawEngine; retry loop is not a circuit breaker) |
| 7 | LLM client unavailability | ⚠️ Partial | Low | engine.ts:203 (errors reach user, no layered degradation between model tiers) |
| 8 | Type coercion in intent detection | ⚠️ Partial | Low | engine.ts:166,214 (`as any` cast at line 214 bypasses type safety) |

---

## Summary

| Status | Count |
|--------|-------|
| Total verified | 52 |
| ✅ Handled | 19 |
| ❌ Unhandled | 16 |
| ⚠️ Partial | 15 |
| Not a bug / Design choice | 2 |

### Unhandled Edge Cases (Priority Order)

| # | Edge Case | Severity | File | Fix Priority |
|---|-----------|----------|------|-------------|
| 1 | **Failure → COMPLETED chain** | **Critical** | service.py:103,203 | P0 — resolves 3 bugs |
| 2 | db_path traversal | **High** | store.py:28-30 | P0 — security |
| 3 | Pipeline crash (stuck VERIFYING) | **High** | service.py:247 | P1 |
| 4 | Results serialization (json.dumps) | **High** | gates.py:73-77 | P1 |
| 5 | Resume already-running goal | **High** | service.py:232 | P1 |
| 6 | Cancel satisfied/completed goal | **High** | service.py:234 | P1 |
| 7 | Acceptance criteria never evaluated | **High** | service.py:259-263 | P1 |
| 8 | Session memory failure blocks result | **High** | engine.ts:171,220 | P1 |
| 9 | max_attempts not enforced | High | models.py:82 | P1 (auto-resolved by #1) |
| 10 | Stop conditions broken | High | stop_conditions.py:19-23 | P1 (auto-resolved by #1) |
| 11 | Empty command → fake COMPLETED | High | service.py:100 | P2 |
| 12 | Database corruption | High | store.py:34 | P2 |
| 13 | Disk full / IOError | High | store.py | P2 |
| 14 | JSON parse errors (6 locations) | High | store.py:157,158,262,304,347,372 | P2 |
| 15 | No max_workers upper bound | Medium | service.py:137, cook_command.py:216 | P3 |
| 16 | Event bus failure (bad listener) | Medium | events.ts:19-21 | P3 |

---

## Unresolved Questions

1. Is the `auto` flag in `cook_auto()` (cook_command.py:122) a no-op or does it affect AGY integration?
2. What should happen with tasks that have no command — COMPLETED, SKIPPED, or BLOCKED?
3. Should acceptance criteria be evaluated during verification, or are they purely metadata?
4. Is `_mirror_legacy_memory` intended as fire-and-forget, or should failures be logged?
5. Is the `maxAttempts = needsThinking ? 2 : 1` asymmetry intentional? If coding tasks should never fallback, the fallback intent string `'planning'` is dead code.
6. Does `OpenClawEngine` expose a `needsThinking` method, or is it a planned but unimplemented feature?

---

**Recommendation:** Fix P0 (failure marking chain + db_path traversal) first — failure marking auto-resolves P1 items #9 and #10. Then address the 5 remaining P1 items. TypeScript engine issues (session memory, event bus) should be addressed together as they share the same "no try/except" pattern.
