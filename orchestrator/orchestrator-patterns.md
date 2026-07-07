# MEKONG_WRAPPER Orchestrator Patterns

> Source: Solo-Platform architecture + awesome-harness-engineering + revfactory/harness

## Core Loop

1. Receive command via `me <cli> <cmd>` or `me idea <goal>`
2. Resolve agent from registry (or use override `MEKONG_WRAPPER_AGENT`)
3. Build agent context (definition path, tip, pattern)
4. Dispatch to underlying CLI with agent context injected
5. Persist state to `state/` (goals, chains, raas artifacts, sops)

## Harness Engineering Pattern Catalog (Phase 2)

The following 8 agent-team design patterns from `revfactory/harness` are mapped to MEKONG_WRAPPER CLI invocation primitives:

| Pattern ID | Description | CLI mapping | When to use |
|---|---|---|---|
| `pipeline` | Sequential stages (A → B → C) | `me chain "<cmd>;<cmd>;<cmd>"` | Multi-step deterministic flow |
| `fanout-fanin` | Parallel tasks → aggregate | `me chain "<cmd>|<cmd>|<cmd>"` | Independent parallelizable work |
| `producer-reviewer` | Two-pass (produce → score → refine) | `me idea <goal>` + `me step 1..N` | Quality-critical artifacts |
| `supervisor` | Leader delegates to workers, collects | `MEKONG_WRAPPER_AGENT=<pm|planner>` | Complex task with sub-tasks |
| `hierarchical` | Top-level → team → individual (3 tiers) | `me orchestrate <goal>` | Large initiative with workstreams |
| `expert-pool` | Specialist router by keyword | `MEKONG_WRAPPER_VERBOSE=1 me <cli> <cmd>` | Domain-specific routing |
| `iterative-refiner` | Loop produce → score → refine | `me idea <goal>` with `me step` repeat | Drafts needing polish |
| `orchestrator` | Team leader plans, assigns, synthesizes | `me plan`, `me step` | Goal-driven multi-phase work |

## Pattern: Pipeline (순차)

```
[Audit] → [Finance] → [DevOps]
```

- CLI: `me chain "audit-sox;accounting-daily;business-deploy"`
- State: each stage result appended to `state/chains/{id}.log`
- Failure: abort on first non-zero exit; resume with `me chain --resume {id}`

## Pattern: Fan-out/Fan-in (병렬 집계)

```
          ┌→ [Agent A] ┐
[Task] → ─┤            ├→ [Aggregate] → Result
          └→ [Agent B] ┘
```

- CLI: `me chain "backend-db task|frontend build|docs-generate"`
- Implementation: each task dispatched in background; main process waits for all
- Aggregation: concatenate `state/chains/{id}-{stamp}.result` files

## Pattern: Producer–Reviewer (생산-검증)

1. Producer agent generates artifact → `state/goal-{stamp}.md`
2. Reviewer agent scores against acceptance criteria
3. If score < threshold → loop back with feedback

- CLI: `me idea <goal>` (creates state/goal), then `me review <goal>`

## Pattern: Supervisor (감독)

- Supervisor agent (`project-manager` or `planner`) decomposes goal into sub-tasks
- Each sub-task dispatched via `me <cli> <cmd>` with appropriate agent override
- Supervisor collects results, synthesizes, decides next step

## Pattern: Hierarchical Delegation (계층 위임)

```
Orchestrator (CEO) → Team Lead (PM) → Worker (developer/tester/reviewer)
```

- Top: `MEKONG_WRAPPER_AGENT=orchestrator me idea <big-goal>`
- Tier 2: orchestrator decomposes → creates `state/goal-{stamp}.md` with sub-goals
- Tier 3: user runs `me step 1`, `me step 2`, ... each with auto-resolved agent

## Pattern: Expert Pool (전문가 풀)

- Registry: `agents/registry.json` is the expert pool definition
- Routing: `resolve_agent(cli, cmd)` consults the pool
- Fallback: `orchestrator` if no match

## Pattern: Iterative Refiner (반복 개선)

```
Draft v1 → Score (0-1) → if < threshold: feedback → Draft v2 → ...
```

- CLI loop: `me idea <goal>`; then repeat `me step` until user confirms

## Solo-Platform → MEKONG_WRAPPER Mapping (PDF line ~2281)

Solo-Platform component → MEKONG_WRAPPER equivalent:

| Solo-Platform | MEKONG_WRAPPER | Implementation |
|---|---|---|
| OpenClaw (Telegram CLI) | `me` binary | `/usr/local/bin/me` |
| Intent analyzer (LLM classify) | `resolve_agent()` | `lib/agent-patterns.sh` + registry |
| Manager agent | orchestrator layer | `orchestrator/orchestrator-patterns.md` |
| Worker agent (per task) | mekong/claudekit/claude | `agents/registry.json` routing |
| Memory layer | `state/` directory | `state/goal-*.md`, `state/chains/*.log` |
| Task queue | chained commands | `me chain "cmd1;cmd2"` |
| Team management | agent teams | `agents/registry.json` team definitions |

## State Schema

```
state/
├── goal-{stamp}.md       → active goals (one per /idea invocation)
├── raas/
│   └── {product}.md      → RaaS product definitions
├── sops/
│   └── {name}.md         → SOP definitions
└── chains/
    └── {id}.log          → chained execution logs (append-only)
```

## CLI Extension Points

- `MEKONG_WRAPPER_VERBOSE=1` — verbose routing log
- `MEKONG_WRAPPER_AGENT=<id>` — override agent selection
- `MEKONG_MODEL=claude-sonnet-4-20250514` — switch claude model (default: opus-4-7)
- `PROJECT_ROOT=/path` — override project root (default: /Users/macbook)
- `MEKONG_HARNESS_PATTERN=<pattern>` — force a harness pattern for next invocation
