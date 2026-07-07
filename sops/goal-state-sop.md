# SOP: Goal State Management > MEKONG_WRAPPER SOP | Status: Active | Owner: planner agent

## Purpose
Standard Operating Procedure for creating, advancing, querying, and archiving scoped MekongMind goal state files under `state/`. A goal is not a task note. It is the operating contract for one CEO Solo Company loop in the current project.

## Trigger
- `me idea "<description>"` — creates a new goal.
- `me goal "<description>"` — creates a direct MekongMind Goal Contract.
- `me step <N>` — advances a goal to step N.
- `me goal show` — queries goal state.
- `me goal archive` — archives a completed goal.
- Any agent action that mutates goal state.

## Scope Doctrine

Goal state is project-scoped.

- The terminal's current repository root is the project boundary.
- Do not create or advance a goal for another project from this terminal.
- Do not run `/goal` repeatedly as brainstorming. Use it only when the intent is ready to become a governed Solo Company objective.
- If the active goal or project scope is unclear, stop at inspection: `pwd`, `me goal show`, `me solo bottlenecks --strict`, `me solo gates verify --strict`.
- Any command generated from a goal must pass the current gate doctrine through `me solo allow <command> <current-gate>`.
- A goal cannot be marked complete because code shipped. It completes only when the relevant gate, MRR, fulfillment, and clone-memory evidence are present for the objective.

## Harness Pattern: Sequential (State Machine)
```
[Create] → [Execute] → [Verify] → [Archive]
```

## State Machine
| Status    | Allowed transitions           | Meaning                                      |
|-----------|-------------------------------|----------------------------------------------|
| `active`  | `active → completed`          | Goal created; no steps executed yet.         |
| `active`  | `active → failed`             | A step errored; goal can be retried.         |
| `completed` | (terminal)                   | All steps executed successfully.             |
| `failed`  | `failed → active` (retry)     | Operator or orchestrator retried the goal.   |

## Goal/Gate Reconciliation

Before any report claims a gate, phase, or goal complete, run:

```bash
me solo gates reconcile
me solo gates verify --strict
```

Reconciliation is read-only and must block success claims on `DRIFT`.

Drift conditions:

- Goal `CurrentGate` and `state/gates/<goal-id>.json.current_gate` disagree.
- Gate state uses non-canonical IDs, including numeric legacy gates.
- A later gate is active or passed while any earlier canonical gate is still pending.
- Gate JSON has a legacy/non-canonical shape that cannot be reconciled.

Policy: detect and report drift. Do not auto-create artifacts, auto-pass gates, or rewrite old goal state from reports.

## Steps
1. **Create** — `me idea "<description>"` or `me goal "<description>"` writes `state/goal-<YYYYmmdd>-<HHMMSS>.md` with:
   - `# Goal: <description>`
   - `Created: <ISO-8601 UTC>`
   - `Status: active`
   - `Steps: []`
   - `Pattern: <pattern_label>` (if `apply_harness_pattern` returned non-empty)
   - `Agent: <resolved_agent>`
   - `SoloCompanyMode: autonomous`
   - `RevenueTarget: 1000000`
   - `CurrentGate: idea-intake`
   - `## MekongMind Goal Contract`
   - `## Agentic Department Stack`
   - `## Department SOP Mesh`
   - `## Command Chaos Resolution`
   - `## Required Inspection Commands`
2. **Scope Check** — before any mutation, confirm the goal file belongs to the current project state directory and not another repository.
3. **Advance** — `me step <N>` reads the current goal, appends `Step <N>: <timestamp> <status>` to `Steps`, and updates the goal file. Step numbers are 1-indexed and monotonic.
4. **Gate Verify** — before marking any stage done, confirm the department artifact exists and passes the relevant evidence contract.
5. **Allow Check** — before running a command from the goal, run `me solo allow <command> <current-gate>`. A routed command that is not allowed must be blocked.
6. **Complete** — before marking `completed`, confirm each step in `Steps` has a `done` or `completed` marker and the required gate/revenue/fulfillment/clone evidence exists for the objective.
7. **Archive** — `me goal archive` moves a `completed` goal from `state/` to `state/archive/<YYYY>/<MM>/`. The archive path is derived from the goal's `Created` date. Archiving a `failed` or `active` goal is rejected.
8. **Query** — `me goal show` prints the current goal's description, status, agent, pattern, current gate, revenue target, and step list. If multiple active goals exist, print the most recently created in this project.

## File Layout
```
state/
├── goal-YYYYmmdd-HHMMSS.md      # active/in-flight goal
├── logs/<goal-id>/              # step logs (stdout/stderr)
└── archive/<YYYY>/<MM>/         # archived goals
```

## Success Criteria
- A new goal created via `me idea` exists in `state/` within 1 second.
- A new direct goal created via `me goal "<description>"` includes the MekongMind Goal Contract sections.
- Goal file contains non-empty `Pattern` when `apply_harness_pattern` returned a label.
- `me step <N>` appends exactly one new step entry; existing entries are not modified.
- Any command derived from a goal has route, allow, department, gate, SOP, and artifact proof.
- `me goal archive` succeeds only when Status is `completed`.

## Failure Policy
- If `state/` is not writable, fail with "state directory not writable" and do not write a partial goal file.
- If the goal file is corrupt (missing `Status:` line), report "corrupt goal file" and abort the step; do not overwrite without confirmation.
- Concurrent `me idea` calls within the same second: append a counter suffix `-NN` to the goal-id to avoid collisions.
- If `CurrentGate` is missing, treat the goal as under-specified and block mutation until the contract is repaired.
- If the command belongs to another project, block it. Terminal project roaming is not allowed in goal execution.

## CLI
```bash
me idea "Launch Q3 revenue engine"
me goal "Build $1M RaaS engine"
me step 1
me step 2
me goal show
me goal archive
```

## Owner
`planner` agent in CEO Command.

## Preconditions
- Active project root confirmed with `pwd`.
- Goal mutation belongs to this project's `state/` directory.
- Current gate doctrine is known before command execution.

## Procedure
Use the existing `## Steps` section as the procedure.

## Evidence Contract
Goal state is valid only when the goal file, gate-state file, department ledger, revenue state, and required evidence artifacts agree for the active project.

## Required Evidence Fields
- `goal_id`, `status`, `current_gate`, `gate_state_path`, `department_ledger_path`, `revenue_state_path`, `next_department`.

## Acceptance Criteria
Use the existing `## Success Criteria` section as acceptance criteria.

## Stop Conditions
- Goal file is corrupt or lacks `CurrentGate`.
- Goal path is outside the active project.
- Reconciliation returns `DRIFT`.

## Escalation
Escalate strategic ambiguity, corrupt state, or cross-project command attempts to CEO Command.

## CLI Inspection Commands
```bash
pwd
me goal show
me solo gates verify --strict
me solo gates reconcile
me solo bottlenecks --strict
```
