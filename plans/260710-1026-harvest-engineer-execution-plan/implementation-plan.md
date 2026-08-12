---
title: "Harness Engineer — Execution Plan cho MEKONG Wrapper v2"
description: "Implementation plan: goal execution, step runner, goal chain, CEO patterns, RaaS, SOPs — phân pha 5 phases với P0/P1/P2/P3"
status: pending
priority: P0
effort: 14h
branch: main
tags: [me-deep-wrapper, harness-engineering, execution-engine, ceo-patterns, raas]
created: 2026-07-10
---

# Plan: Harness Engineer — MEKONG Execution Engine

## Table of Contents

1. [Context & Target](#1-context--target)
2. [Current State Analysis](#2-current-state-analysis)
3. [Architecture Decision](#3-architecture-deed)
4. [Phase 0 — Solidify Foundation (P0)](#4-phase-0--solidify-foundation-p0)
5. [Phase 1 — Goal Execution Engine (P0)](#5-phase-1--goal-execution-engine-p0)
6. [Phase 2 — Goal Chain & Watch (P1)](#6-phase-2--goal-chain--watch-p1)
7. [Phase 3 — CEO-Level Patterns (P1)](#7-phase-3--ceo-level-patterns-p1)
8. [Phase 4 — RaaS + SOPs + Chains (P2)](#8-phase-4--raas--sops--chains-p2)
9. [Phase 5 — Documentation & Polish (P3)](#9-phase-5--documentation--polish-p3)
10. [Risk & Mitigation](#10-risk--mitigation)
11. [Dependency Graph](#11-dependency-graph)
12. [Success Criteria](#12-success-criteria)
13. [Unresolved Questions](#13-unresolved-questions)

---

## 1. Context & Target

### Input Sources (đã verify)
- `TASK-BRIEF-FOR-AGENT.md` — task brief gốc từ session 2026-06-01
- `HARVEST_PLAN.md` — sections B, C, D, E chi tiết triển khai
- `WORKFLOW-100.md` — v2.0.0 workflow đã deployed (SessionStart hooks, 9-gate pipeline, session-intel)
- `CLAUDE_ARCHITECTURE.md` — kiến trúc 4-layer + Claude Code integration
- `bin/me` (3322 lines, ~35 functions) — CLI entrypoint
- `lib/agent-patterns.sh` (962 lines) — pattern routing + agent resolver
- `agents/registry.json` — 58 unified agents across 10 departments

### Target Output
MEKONG wrapper từ **goal creation only** → **goal execution engine**:
- `me step N` — execute individual goal steps
- `me goal show [--watch]` — inspect + live-monitor goals
- `me goal chain <file>` — execute goal chains
- 4 CEO-level patterns (`ceo-strategy`, `boardroom`, `delegation`, `emergency`)
- `me role create/list/run` — Role as a Service
- `me sops create/run` — Standard Operating Procedures
- `me chain run <file>` — Macro orchestration chains

### Constraint: Bash Only
Không đổi sang Python/Node. Tất cả implement trong `bin/me` + `lib/*.sh`.

---

## 2. Current State Analysis

### What Already Exists
| Component | Location | Status |
|---|---|---|
| CLI entrypoint | `bin/me` (3322 lines) | deployed `/usr/local/bin/me` |
| Pattern engine | `lib/agent-patterns.sh` (962 lines) | `apply_harness_pattern()`, `resolve_agent()` |
| Goal creation | `bin/me:171` `run_idea()` → `create_goal()` | works, writes `state/goal-*.md` |
| Agent registry | `agents/registry.json` | 58 agents, 10 departments |
| 9-gate pipeline | `state/gates/*.json` | 8+ evidence files passed |
| SessionStart hooks | `.claude/settings.json` v2.0.0 | `session-intel.sh`, hooks configured |
| Solo loop | `bin/me:544` `solo_loop_pass()` | exists, needs integration |
| Chains (partial) | `bin/me:519` `cmd_chain()` | stub, needs real implementation |

### What's Missing (Gaps)
1. **Step execution** — `create_goal()` writes `Steps: []` (empty). No runner exists.
2. **Goal show** — `show_goal()` at `bin/me:109` prints basic info, no `--watch`, no progress.
3. **Goal chain** — `cmd_chain()` at `bin/me:519` is stub.
4. **CEO patterns** — 4 new patterns needed in registry + execution logic.
5. **RaaS** — `raas/template.md` exists but no CLI commands.
6. **SOPs** — `state/sops/` empty, no runner.
7. **Chain runner** — YAML chain file parser + executor missing.

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bash complexity grows unmaintainable | Medium | High | Extract new libs (`lib/step-runner.sh`, `lib/goal-chain.sh`) early |
| Step execution diverges per pattern | High | Medium | Define step templates in registry.json per pattern |
| Goal file corruption on partial step | Medium | High | Write to temp + atomic rename; backup before write |
| Infinite loop in watch mode | Low | Medium | Signal trap on SIGINT, max iteration count |
| Regex in goal file parsing breaks on format change | Medium | Low | Version field in goal file format |

---

## 3. Architecture Decision

### Decision: Extract Execution Engine to `lib/`

**Why:** `bin/me` đã 3322 lines. Thêm step execution + chain + RaaS + SOPs inline sẽ exceed 5000 lines — không maintainable.

**How:** Tạo 3 new lib files:
- `lib/step-runner.sh` — step execution logic
- `lib/goal-chain.sh` — chain parser + runner
- `lib/raas-sop.sh` — RaaS + SOP commands

`bin/me` chỉ làm CLI parsing → dispatch to lib functions.

### Goal File Format v2
```
---
pattern: orchestrator
status: running
steps_completed: 1
steps_total: 4
version: 2
created_at: 2026-07-10T...
---
# Goal: build REST API

## Step 1: Plan (completed)
Output: ... (appended after each step)

## Step 2: Allocate (pending)
## Step 3: Supervise (pending)
## Step 4: Report (pending)
```

### Step Templates (in registry.json per pattern)
```json
{
  "orchestrator": {
    "steps": ["Plan", "Allocate", "Supervise", "Report"],
    "executor": "mekong <agent> <step-desc>"
  },
  "fanout-fanin": {
    "steps": ["Dispatch", "Parallel exec", "Fan-in", "Finalize"],
    "executor": "mekong <agent-list> parallel"
  }
}
```

---

## 4. Phase 0 — Solidify Foundation (P0)

**Mục tiêu:** Prepare codebase trước khi thêm features mới.

### Iterations: 2

---

#### Task 0.1: Refactor `bin/me` — extract lib stubs

**Acceptance Criteria:**
- [ ] Tạo `lib/step-runner.sh` với stub functions: `run_step()`, `show_goal()`, `goal_show_watch()`
- [ ] Tạo `lib/goal-chain.sh` với stub: `run_goal_chain()`
- [ ] Tạo `lib/raas-sop.sh` với stub: `cmd_role()`, `cmd_sops()`, `cmd_chain_run()`
- [ ] `bin/me` source 3 libs mới (dùng `.` or `source`)
- [ ] `me --help` vẫn chạy, output đúng
- [ ] `me idea --pattern orchestrator "test"` vẫn tạo goal file

**Files to touch:**
- `lib/step-runner.sh` (new)
- `lib/goal-chain.sh` (new)
- `lib/raas-sop.sh` (new)
- `bin/me` (add `source` lines)

**Effort:** 1h

---

#### Task 0.2: Version goal file format + add migration

**Acceptance Criteria:**
- [ ] `create_goal()` thêm `version: 2` vào frontmatter
- [ ] `read_goal()` detect version, handle v1 (backward compat) → v2
- [ ] v1 goals (no version, no steps list) → auto-migrate khi đọc (không ghi file)
- [ ] Unit test: v1 file parse → v2 structure in memory

**Files to touch:**
- `bin/me` (`create_goal()` at line ~107-132 range, `read_goal()` or inline parsing)

**Effort:** 1h

---

## 5. Phase 1 — Goal Execution Engine (P0)

**Mục tiêu:** `me step N` chạy thực — core execution loop hoạt động với orchestrator pattern.

### Iterations: 4

---

#### Task 1.1: Implement step template engine

**Acceptance Criteria:**
- [ ] `lib/agent-patterns.sh` thêm `get_step_template()` — lookup steps array per pattern từ registry.json
- [ ] Registry JSON mỗi pattern có field `"steps": [...]` (8 patterns hiện có)
- [ ] `bin/me` `run_step()` parse `N`, validate trong range
- [ ] Nếu pattern chưa có steps → fallback `["Execute", "Review", "Report"]`

**Files to touch:**
- `agents/registry.json` — add `"steps"` vào mỗi pattern
- `lib/agent-patterns.sh` — add `get_step_template()`
- `bin/me` — add `run_step()` (sau `run_idea()`)
- `lib/step-runner.sh` — actual step runner body

**Effort:** 1.5h

---

#### Task 1.2: Implement step execution per pattern

**Acceptance Criteria:**
- [ ] `run_step(N)` đọc goal file, lấy pattern, lấy step template
- [ ] Step N được đánh dấu `running`, output được ghi vào goal file
- [ ] Executor pattern: `mekong <agent> "<step-desc>"` được gọi, stdout capture
- [ ] Output được append: `Step N Output:\n<captured>`
- [ ] Step N đánh dấu `completed`, `steps_completed` increment
- [ ] Nếu step fail → ghi `failed`, không increment, exit 1
- [ ] Atomic write: write to `state/goal-*.md.tmp` → mv

**Failure modes handled:**
- Agent not found → error message, step marked `failed`
- mekong CLI not available → error, step `failed`
- Goal file locked by another process → exit with retry hint

**Files to touch:**
- `lib/step-runner.sh` — core execution
- `bin/me` — `run_step()` dispatch

**Effort:** 3h

---

#### Task 1.3: Implement `me goal show` với progress display

**Acceptance Criteria:**
- [ ] `me goal show` hiện: Pattern, Status, Steps (checkmarks), Output preview
- [ ] Màu: ✅ completed, 🔄 running, ⏳ pending, ❌ failed
- [ ] `--json` flag → JSON output cho scripting
- [ ] `--last N` → show last N goals

**Files to touch:**
- `lib/step-runner.sh` — `show_goal()` body (relocate from bin/me)
- `bin/me` — dispatch to `show_goal()`

**Effort:** 1h

---

#### Task 1.4: Implement `me goal show --watch`

**Acceptance Criteria:**
- [ ] Poll goal file mỗi 2s, redraw progress
- [ ] Ctrl+C → clean exit, không để background process
- [ ] Detect file change via mtime — skip nếu unchanged
- [ ] Max 100 iterations (200s) rồi auto-exit nếu chưa stop

**Files to touch:**
- `lib/step-runner.sh` — `show_goal_watch()`

**Effort:** 1h

---

#### Task 1.5: Smoke tests cho Phase 1

**Acceptance Criteria:**
- [ ] `tests/test_step_execution.sh` chạy full flow:
  1. `me idea --pattern orchestrator "build test API"`
  2. `me step 1` → expect output captured, step 1 completed
  3. `me step 2` → expect step 2 runs
  4. `me goal show` → expect 2/4 completed
  5. `me goal show --watch` → Ctrl+C sau 3s, exit 0
- [ ] All tests pass zero errors
- [ ] `which me` → `/usr/local/bin/me`

**Files to touch:**
- `tests/test_step_execution.sh` (new)

**Effort:** 1.5h

---

## 6. Phase 2 — Goal Chain & Watch (P1)

**Mục tiêu:** `me goal chain` + `me goal show --watch` hoàn chỉnh.

### Iterations: 2

---

#### Task 2.1: Implement `me goal chain` — sequential goal execution

**Acceptance Criteria:**
- [ ] `me goal chain "build API" "write tests" "deploy"` → tạo 3 goals liên kết
- [ ] Mỗi goal có `chain_prev` và `chain_next` trong frontmatter
- [ ] Chạy tuần tự: goal 1 done → goal 2 starts → goal 3 starts
- [ ] Nếu goal fail → hỏi `continue? (y/N)` qua stdin
- [ ] `me goal chain run` → execute latest chain
- [ ] `me goal chain show` → hiện chain status

**Files to touch:**
- `lib/goal-chain.sh` — main chain engine
- `bin/me` — `run_goal_chain()` dispatch

**Effort:** 2h

---

#### Task 2.2: Chain file format + YAML parser (bash)

**Acceptance Criteria:**
- [ ] Chain file `chains/ceo-daily.yaml`:
  ```yaml
  name: "CEO Daily Routine"
  goals:
    - desc: "Review yesterday metrics"
      pattern: "fanout-fanin"
    - desc: "Plan today priorities"
      pattern: "orchestrator"
  ```
- [ ] Parser đọc YAML (dùng `python3 -c` hoặc regex đơn giản — 2-3 fields thôi)
- [ ] File validation: must have `name` + `goals[]` with `desc`
- [ ] `me chain run chains/ceo-daily.yaml` → execute chain

**Decision:** Dùng `python3 -c` cho YAML parsing vì bash YAML là unstable. Python đã có sẵn trong macOS.

**Files to touch:**
- `lib/goal-chain.sh` — YAML parser
- `bin/me` — `cmd_chain()` extend

**Effort:** 2h

---

#### Task 2.3: Chain state tracking + resume

**Acceptance Criteria:**
- [ ] `state/chain-<id>.json` lưu chain execution state
- [ ] Nếu chain bị interrupt → `me goal chain resume` tiếp tục từ goal bị gián đoạn
- [ ] `me goal chain status` hiện chain progress

**Files to touch:**
- `lib/goal-chain.sh` — state management

**Effort:** 1.5h

---

#### Task 2.4: Chain integration tests

**Acceptance Criteria:**
- [ ] `tests/test_goal_chain.sh`: tạo chain file, run, verify 3 goals created + executed
- [ ] Test resume từ interrupted chain
- [ ] Test fail + continue prompt

**Files to touch:**
- `tests/test_goal_chain.sh` (new)

**Effort:** 1.5h

---

## 7. Phase 3 — CEO-Level Patterns (P1)

**Mục tiêu:** 4 CEO-specific patterns vào registry + execution logic.

### Iterations: 3

---

#### Task 3.1: Define CEO patterns trong registry.json

**Acceptance Criteria:**
- [ ] `ceo-strategy`: steps = ["Define Objective", "Decompose to OKRs", "Assign Patterns", "Review Output"]
- [ ] `boardroom`: steps = ["Propose Options", "Debate (parallel agents)", "CEO Vote", "Execute Winner"]
- [ ] `delegation`: steps = ["Define Task", "Select Agent", "Assign + Track", "Collect Result"]
- [ ] `emergency`: steps = ["Triage", "Isolate Issue", "Parallel Fix", "Verify + Report"]
- [ ] Mỗi pattern có `executor` field định nghĩa cách invoke agents
- [ ] Mỗi pattern có `agents` field (list of agent IDs to use)

**Files to touch:**
- `agents/registry.json` — add 4 CEO patterns

**Effort:** 1h

---

#### Task 3.2: Implement boardroom pattern (multi-agent debate)

**Acceptance Criteria:**
- [ ] `me idea --pattern boardroom "Should we pivot to RaaS?"`
- [ ] Boardroom spawns 3 agents (e.g., `business-analyst`, `market-researcher`, `tech-lead`)
- [ ] Mỗi agent produce proposal → captured
- [ ] Summary hiện: all proposals → user picks winner
- [ ] Winner được executed as next step

**This is the hardest pattern** — requires parallel agent invocation + synthesis.

**Files to touch:**
- `lib/step-runner.sh` — `exec_boardroom_step()`
- `agents/registry.json` — boardroom config

**Effort:** 2.5h

---

#### Task 3.3: Implement emergency pattern (fast-trigger)

**Acceptance Criteria:**
- [ ] `me idea --pattern emergency "Production DB down"`
- [ ] Triage: classify severity (P0=parallel all, P1=fast sequential)
- [ ] Isolate: identify affected agents/services
- [ ] Parallel fix: invoke relevant agents concurrently (max 3)
- [ ] Verify: run health check after fixes

**Files to touch:**
- `lib/step-runner.sh` — `exec_emergency_step()`

**Effort:** 2h

---

#### Task 3.4: Implement ceo-strategy + delegation

**Acceptance Criteria:**
- [ ] `ceo-strategy`: decompose goal → OKR format → store
- [ ] `delegation`: tạo delegation record → track → deliver report

**Files to touch:**
- `lib/step-runner.sh` — `exec_ceo_strategy_step()`, `exec_delegation_step()`

**Effort:** 1.5h

---

#### Task 3.5: CEO pattern tests

**Acceptance Criteria:**
- [ ] `tests/test_ceo_patterns.sh` — test all 4 patterns end-to-end
- [ ] Boardroom: spawn → proposals → vote → execute
- [ ] Emergency: mock P0 → parallel agents → verify

**Files to touch:**
- `tests/test_ceo_patterns.sh` (new)

**Effort:** 2h

---

## 8. Phase 4 — RaaS + SOPs + Chains (P2)

**Mục tiêu:** Role as a Service, SOP runner, Chain executor — full macro orchestration.

### Iterations: 3

---

#### Task 4.1: Implement RaaS (Role as a Service)

**Acceptance Criteria:**
- [ ] `me role create <name> --agent <id> --pattern <id>` → tạo role từ template
- [ ] Lưu vào `state/raas/<name>.md`
- [ ] `me role list` — list all roles
- [ ] `me role run <name>` — execute role with given agent + pattern
- [ ] Role template: `raas/template.md` expanded với fields: agent, pattern, description, config

**Files to touch:**
- `lib/raas-sop.sh` — `cmd_role()` group
- `raas/template.md` — update template

**Effort:** 2h

---

#### Task 4.2: Implement SOPs (Standard Operating Procedures)

**Acceptance Criteria:**
- [ ] `me sops create <name>` — create SOP from template
- [ ] `me sops run <name>` — execute SOP steps sequentially
- [ ] `me sops list` — list available SOPs
- [ ] `me sops show <name>` — display SOP content
- [ ] Default SOPs: `deploy-prod.md`, `code-review.md`
- [ ] SOPs stored in `state/sops/<name>.md`
- [ ] Each SOP step has: description, agent, expected output

**Files to touch:**
- `lib/raas-sop.sh` — `cmd_sops()` group
- `state/sops/deploy-prod.md` (new)
- `state/sops/code-review.md` (new)

**Effort:** 2.5h

---

#### Task 4.3: Implement `me chain run <file>`

**Acceptance Criteria:**
- [ ] `me chain run chains/full-pipeline.yaml` → execute full chain
- [ ] Chain node types: `goal`, `sop`, `role`, `condition`
- [ ] Conditional branching: `if: previous.status == "passed"` → next node
- [ ] Parallel nodes: `parallel: [goal1, goal2]` → fanout-fanin
- [ ] Chain state persisted in `state/chain-<id>.json`
- [ ] Resume after interruption

**Files to touch:**
- `lib/goal-chain.sh` — chain executor (extend)

**Effort:** 3h

---

#### Task 4.4: RaaS + SOPs + Chain integration tests

**Acceptance Criteria:**
- [ ] `tests/test_raas.sh` — create → list → run role
- [ ] `tests/test_sops.sh` — create → run → verify SOP executed
- [ ] `tests/test_chain_run.sh` — run chain file → verify node sequence

**Files to touch:**
- `tests/test_raas.sh` (new)
- `tests/test_sops.sh` (new)
- `tests/test_chain_run.sh` (new)

**Effort:** 2h

---

## 9. Phase 5 — Documentation & Polish (P3)

**Mục tiêu:** Docs, polish, deploy verification.

### Iterations: 2

---

#### Task 5.1: HARVEST-ENGINEERING.md docs

**Acceptance Criteria:**
- [ ] `docs/HARVEST-ENGINEERING.md` với:
  - Architecture overview (updated)
  - Goal execution lifecycle
  - Step runner internals
  - Chain format spec
  - RaaS usage guide
  - SOPs reference
  - CEO patterns quick reference
- [ ] Bilingual: Vietnamese + English ( Sophia doctrine)
- [ ] `me --help` updated with new commands

**Files to touch:**
- `docs/HARVEST-ENGINEERING.md` (new)
- `bin/me` — update `show_help()`

**Effort:** 2h

---

#### Task 5.2: Deploy + verification

**Acceptance Criteria:**
- [ ] `which me` → `/usr/local/bin/me`
- [ ] `me --help` shows all new commands
- [ ] `me idea --pattern orchestrator "test"` → goal file created
- [ ] `me step 1` → executes step 1
- [ ] `me goal show` → displays goal
- [ ] `me goal show --watch` → live progress (Ctrl+C clean)
- [ ] `me goal chain "a" "b"` → creates linked goals
- [ ] `me role create test --agent planner` → creates role
- [ ] `me sops run deploy-prod` → executes SOP
- [ ] All smoke tests pass
- [ ] Git commit: `feat(me): implement step execution, goal chain, CEO patterns, RaaS, SOPs`

**Files to touch:**
- Deploy via symlink update

**Effort:** 1h

---

## 10. Risk & Mitigation

| ID | Risk | Phase | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | Bash complexity — bin/me grows beyond 5000 lines | All | High | High | Extract libs immediately (Phase 0). Each lib < 500 lines. |
| R2 | Goal file corruption — partial write during step execution | Phase 1 | Medium | High | Atomic write: write tmp → rename. Backup before write. |
| R3 | Infinite loop in `--watch` mode | Phase 1 | Low | Medium | Signal trap, max iterations (200), mtime check for no-change skip |
| R4 | Boardroom pattern complexity — parallel agent spawn | Phase 3 | Medium | High | Use existing `max_parallel=3` limit. Simplify: sequential proposal display + single vote. |
| R5 | Registry.json grows unwieldy with CEO patterns | Phase 3 | Low | Medium | Keep registry flat; CEO patterns are config, not code. |
| R6 | YAML parser in bash unreliable | Phase 2 | Medium | Medium | Use python3 one-liner; validate minimal fields only |
| R7 | Breaking existing `me idea` / `me mekong` / `me claude` | Phase 0 | Low | High | Phase 0 smoke test: run all existing commands. No behavior changes. |
| R8 | No error recovery for interrupted step execution | Phase 1 | Medium | High | Each step: check for `status: running` > 5min → mark `failed`, allow `me step N --retry` |

---

## 11. Dependency Graph

```
Phase 0 (Lib extraction + format migration)
  │
  ├──▶ Phase 1 (Step execution engine)
  │       │
  │       ├──▶ Phase 2 (Goal chain + watch)
  │       │       │
  │       │       ├──▶ Phase 3 (CEO patterns)
  │       │       │       │
  │       │       │       └──▶ Phase 4 (RaaS + SOPs + Chains)
  │       │       │               │
  │       │       │               └──▶ Phase 5 (Docs + Deploy)
```

**Blockers:**
- Phase 1 cannot start until Phase 0 completes (lib stubs + format ready)
- Phase 3 cannot start until Phase 1 completes (step runner is dependency)
- Phase 4 cannot start until Phase 2 completes (chain runner needed)
- Phase 5 is last — depends on all previous phases

**Parallel opportunities:**
- Phase 1 tasks 1.1-1.3 can overlap (different files)
- Phase 3 tasks 3.1 (registry config) can run parallel with 3.2 (boardroom impl)
- Tests within each phase run concurrently with next phase tasks (different test files)

---

## 12. Success Criteria

### Measurable "Done" Criteria

| Criterion | How to Measure |
|---|---|
| `me step N` executes without error | `me idea --pattern orchestrator "X"` → `me step 1` → exit 0, output in goal file |
| All 8 patterns have step templates | `agents/registry.json` → each pattern has `"steps": [...]` |
| Goal chain runs 3+ goals sequentially | `me goal chain "a" "b" "c"` → 3 goal files, 3 steps executed |
| `--watch` runs 10s without crash | `timeout 10 me goal show --watch` → exit 143 (SIGTERM) |
| 4 CEO patterns registered + runnable | `me idea --pattern boardroom "Q"` → goal file created |
| RaaS create/run works end-to-end | `me role create test --agent planner` → `me role run test` |
| SOPs runnable | `me sops run deploy-prod` → executes steps |
| Full test suite passes | `bash tests/test_*.sh` → all exit 0 |
| Deploy verified | `which me` → `/usr/local/bin/me`, `me --help` shows new commands |
| No regressions | All existing commands (`me idea`, `me mekong`, `me claude`, `me solo`) still work |

---

## 13. Unresolved Questions

1. **Boardroom user interaction:** Should the CEO vote be interactive (prompt user) or auto-determined? Current plan assumes interactive `read -p "Pick winner (1-3):"` — acceptable for solo CEO use case.
2. **SOP template format:** Plain Markdown vs YAML frontmatter? Recommend YAML frontmatter for machine-parseable metadata (agent, steps), Markdown body for human-readable instructions.
3. **Goal file lock mechanism:** Bash has no file locking. For multi-instance safety: use `flock` if available, fallback to mtime-based optimistic concurrency.
4. **Step output size:** If agent output > 100KB, goal file grows large. Should we cap output? Recommendation: store full output in `state/outputs/<goal-id>-step<N>.txt`, reference in goal file.
5. **mekong CLI availability:** `run_step()` calls `mekong <cmd>`. Need to verify `mekong` is in PATH during step execution. Should we fallback to `me mekong`?

---

## Files Modified Summary

| File | Action | Phase |
|---|---|---|
| `bin/me` | Modify — add `source` for 3 libs, add `run_step()` dispatch | Phase 0 |
| `lib/agent-patterns.sh` | Modify | Phase 1 |
| `lib/step-runner.sh` | **NEW** | Phase 0 |
| `lib/goal-chain.sh` | **NEW** | Phase 0 |
| `lib/raas-sop.sh` | **NEW** | Phase 0 |
| `agents/registry.json` | Modify — add steps to 8 patterns + 4 CEO patterns | Phase 1+3 |
| `raas/template.md` | Modify | Phase 4 |
| `state/sops/deploy-prod.md` | **NEW** | Phase 4 |
| `state/sops/code-review.md` | **NEW** | Phase 4 |
| `tests/test_step_execution.sh` | **NEW** | Phase 1 |
| `tests/test_goal_chain.sh` | **NEW** | Phase 2 |
| `tests/test_ceo_patterns.sh` | **NEW** | Phase 3 |
| `tests/test_raas.sh` | **NEW** | Phase 4 |
| `tests/test_sops.sh` | **NEW** | Phase 4 |
| `tests/test_chain_run.sh` | **NEW** | Phase 4 |
| `docs/HARVEST-ENGINEERING.md` | **NEW** | Phase 5 |

---

## Effort Summary

| Phase | Priority | Est. Hours |
|---|---|---|
| Phase 0 — Foundation | P0 | 2h |
| Phase 1 — Step Execution | P0 | 7h |
| Phase 2 — Goal Chain | P1 | 7h |
| Phase 3 — CEO Patterns | P1 | 9h |
| Phase 4 — RaaS + SOPs | P2 | 9.5h |
| Phase 5 — Docs + Deploy | P3 | 3h |
| **Total** | | **~37.5h** |

---

*Plan generated by planner agent | Date: 2026-07-10 | Status: Pending Approval*
