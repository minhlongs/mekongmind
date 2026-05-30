# Autonomous Goal Engine

`mekong goal` is the first local-first vertical slice for MekongCLI as an
autonomous engineering operating system.

## Command Flow

```bash
mekong goal create "Build production-grade forex multi-agent trading platform"
mekong goal run <goal_id> --profile smoke --json
mekong goal status <goal_id> --json
mekong goal resume <goal_id> --profile standard --json
mekong goal verify <goal_id> --profile standard --json
mekong goal cancel <goal_id>
```

For one-shot autonomous execution, `cook-auto` is the flat command wrapper
around the same durable engine:

```bash
mekong cook-auto "Build production-grade forex multi-agent trading platform" --profile smoke --auto
mekong cook-auto "Build demo app" --profile none --auto --json
```

It creates a persisted goal, runs ready tasks, records checkpoints/events/memory,
then writes a verification run. The command exits nonzero when the final goal
status is not `satisfied`.

Automation output includes `verification_passed`, `failed_gates`,
`status_command`, `resume_command`, `verify_command`, `status_json_command`,
`resume_json_command`, and `verify_json_command`. Use the JSON commands for
follow-up automation; blocked goals remain persisted and can be inspected,
resumed, or re-verified from the same SQLite store.

`--auto` is accepted for AGY and slash-command compatibility. `cook-auto` is
already non-interactive; explicit task commands still require
`--execute-commands`.

`--profile standard` runs the blocking gate set:

```bash
pytest
ruff check .
mypy .
bandit -r .
coverage run -m pytest
```

`--profile smoke` imports the CLI for fast local proof. `--profile none` is for
unit tests and controlled dry integration paths.

## Runtime Model

```
Goal
  -> SQLiteGoalStore (.mekong/goals.sqlite3)
  -> GoalPlanner deterministic task graph
  -> RoleRegistry assigns Architect/Backend/Infra/QA/Security/Docs/Reviewer
  -> LocalExecutor for explicit task commands
  -> VerificationPipeline blocks satisfaction on failed required gates
  -> Checkpoints + events + memory records survive sessions
```

The canonical package is `src.mekongcli`. Legacy imports remain available
through `src.core.goal_engine` so existing code can migrate gradually.

## Persistence

The default store is SQLite:

- goals
- acceptance criteria
- tasks
- checkpoints
- verification runs
- goal events
- memory records

External memory backends are optional. `docker compose --profile memory up -d`
starts Redis, Postgres, Qdrant, and Neo4j for adapter development, but `/goal`
does not require them for local use.

## Agent Roles

| Role | Responsibility |
| --- | --- |
| Architect | module boundaries, event-driven patterns |
| Backend | APIs, services, persistence, orchestration |
| Frontend | dashboard and visualization work |
| Infra | Docker, CI/CD, observability |
| QA | tests, edge cases, adversarial checks |
| Security | command safety, secrets, dependency risk |
| Docs | README, architecture docs, API specs |
| Quant | algorithmic logic and simulations |
| Reviewer | final consistency and duplication review |

## Stop Conditions

The v1 policy records and enforces these named stop conditions:

- secrets exposed
- verification repeatedly fails
- unsafe shell execution detected
- dependency conflicts unresolved
- memory corruption detected

## Parallel Execution

To run autonomous goals concurrently using a thread pool scheduler, use the `cook-auto-parallel` command:

```bash
mekong cook-auto-parallel "Ship Sophia AI Video Factory" --profile smoke --workers 3
```

This uses a `ThreadPoolExecutor` to run independent paths in the task graph concurrently. SQLite is configured in WAL (Write-Ahead Logging) mode to safely handle concurrent reads and serialized writes from the main thread.

## Compose Profiles

```bash
docker compose up --build
docker compose --profile memory up -d redis postgres qdrant neo4j
docker compose --profile observability up -d prometheus grafana
```

Grafana from the root compose profile is exposed on `127.0.0.1:3001` to avoid
colliding with the IDE on port `3000`.
