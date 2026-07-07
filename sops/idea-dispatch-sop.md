# SOP: Idea Dispatch (Harness Engineering)
> MEKONG_WRAPPER SOP | Status: Active | Owner: planner agent

## Purpose
Standard Operating Procedure for /idea dispatch — mints a CEO Solo Company state and routes the work through Mekongmind departments, not a single isolated agent.

## Trigger
- User calls `me idea "do something"`
- Auto-routing via `apply_harness_pattern()`

## Procedure

### Step 1: Department Resolution
**Agent:** `planner` (ceo-command)
**CLI:** `me idea "do something"`
**Mechanism:** create state with `Agentic Department Stack`, then resolve command ownership from `agents/registry.json`.

### Step 2: Pattern Selection
**Agent:** `planner` (ceo-command)
**Patterns:** pipeline, iterative-refiner, hierarchical, expert-pool, swarm, blackboard, critic-solution
**CLI (explicit):** `me idea --pattern pipeline "implement feature X"`
**CLI (auto):** `MEKONG_WRAPPER_PATTERN=expert-pool me idea "review PR #123"`

### Step 3: Department Execution
**CLI (explicit):** `MEKONG_WRAPPER_AGENT=code-reviewer me idea "Run Q2 audit"`
**CLI (auto):** `me solo sop quality-compliance` → inspect department owner and SOP chain before execution

## Acceptance Criteria
- [ ] Department resolved (or fallback to `ceo-command`)
- [ ] Pattern printed in verbose mode
- [ ] CLI invoked with resolved agent

## Rollback
If agent not found: fall back to `planner` agent.

## Harness Pattern: Expert-Pool (default)
```
[planner] expert-pool
  └─ Keyword match → specialist
CLI: me idea "Deploy v2.3.0 to prod"
```

## Owner
`planner` agent in CEO Command.

## Scope
Dispatch one `/idea` or direct `/goal` into the active project MekongMind department system.

## Preconditions
- Active project root confirmed with `pwd`.
- User intent is ready to become a governed objective, not loose brainstorming.
- No conflicting active company goal is being mutated.

## Evidence Contract
Dispatch is complete only when a scoped goal file exists with MekongMind Goal Contract, Agentic Department Stack, Department SOP Mesh, command chaos rules, revenue ladder, and inspection commands.

## Required Evidence Fields
- `goal_id`, `goal`, `solo_company_mode`, `revenue_target`, `current_gate`, `department_stack`, `sop_mesh`, `inspection_commands`.

## Stop Conditions
- Project scope is unclear.
- Intent lacks buyer, pain, target, or constraints.
- Dispatch would mutate another project's state.

## Failure Policy
Fail closed and request clarification. Do not create a thin task note as a substitute for a goal contract.

## Escalation
Escalate conflicting goals, missing target customer, or missing revenue objective to CEO Command.

## CLI Inspection Commands
```bash
pwd
me goal show
me solo gates verify --strict
me solo allow <command> <current-gate>
```
