# Solo-Platform → MEKONG_WRAPPER v1.0.0 Migration Guide

## Source of Truth
- `~/Documents/DeepSeek - Solo-Platform.pdf` (original spec)
- `https://martinfowler.com/articles/harness-engineering.html` (paradigm)
- `https://github.com/walkinglabs/awesome-harness-engineering` (reference)
- `/tmp/solo-platform.txt` (extracted text from PDF)

## Architecture Mapping

| Solo-Platform Component | MEKONG_WRAPPER Equivalent | Implementation |
|---|---|---|
| `SoloCompanyOrchestrator` | `/usr/local/bin/me` main loop | `run_command()` dispatches CLI |
| `AgentRole` (CEO, Developer, Analyst...) | `agents/registry.json` agents + departments | 66 registered agents/patterns, plus Mekongmind departments |
| `Task` dataclass + `TaskQueue` | `state/goal-{stamp}.md` + `state/chains/` | Goal-then-execute workflow |
| `Memory` (codebase, history, decisions) | `state/` directory | Persistent per-project memory |
| OpenClaw CLI ("tay chân") | `mekong` via `me mekong` | Wrapped directly |
| PaperClip orchestrator ("b não") | `me idea` + `me agents suggest` | Intent analysis + routing |
| CEO Agent | `me solo departments` + `me idea` | `planner`, `project-manager`, `business-analyst` |
| Developer Agent | Engineering Factory department | `fullstack-developer`, `framework-nextjs-expert`, `nestjs-expert` |
| Tool-Enabled Agent | Platform Operations department | `infrastructure-github-actions-expert`, `devops-expert`, `infrastructure-docker-expert` |
| FastAPI Gateway | `me project <scope>` | Multi-project scope runner |
| Temporal Worker Pool | `me chain '<c1> && <c2>'` | Sequential pipeline |
| Docker Compose stack | `me mekong bridge` + `me mekong cook` | Container orchestration |
| LLM (Ollama) | `claude` via `me claude` | Claude Opus/Sonnet/Haiku |
| RaaS SaaS products | `raas/` templates (TODO) | Product management commands |
| SOPs | `sops/` templates (TODO) | Standard operating procedures |

## Command Parity

### Solo-Platform → MEKONG_WRAPPER

```bash
# Solo-Platform                              → MEKONG_WRAPPER
python seed/main.py "build feature X"       → me idea "Build feature X"
python agents/ceo.py --task "...            → me mekong <cmd> (auto CEO agent)
python agents/developer.py --task "..."     → me mekong cook
python agents/tool_agent.py --cmd "..."     → me mekong bridge
python api/gateway.py                        → me project <scope>
```

## Phase Plan

### Phase 1: Core Orchestrator (DONE)
- [x] `/usr/local/bin/me` installed as universal wrapper
- [x] `agents/registry.json` with 29 agents
- [x] `lib/agent-patterns.sh` with routing
- [x] `state/` directory for memory
- [x] `me idea`, `me goal`, `me agents`, `me project`, `me chain`, `me solo`

### Phase 2: SoloCompanyOrchestrator Implementation (TODO)
- [ ] Python re-implementation of `SoloCompanyOrchestrator`
- [ ] Async task queue backed by `state/`
- [ ] Agent role → CLI command mapping
- [ ] Memory layer: codebase, history, decisions
- [ ] CLI commands: `me solo start`, `me solo stop`, `me solo task`

### Phase 3: RaaS (TODO)
- [ ] `raas/` template directory
- [ ] `me raas <product> [create|deploy|monitor]`
- [ ] Solo Platform Gateway re-implementation
- [ ] Stripe integration (payment)
- [ ] Multi-tenant product deployment

### Phase 4: SOPs (TODO)
- [ ] `sops/` template directory
- [ ] `me sop <name> [create|run|status]`
- [ ] SOP → agent chain mapping

### Phase 5: Integration (TODO)
- [ ] Telegram bot (OpenClaw channel)
- [ ] Temporal workflow engine integration
- [ ] Redis-backed task queue
- [ ] Prometheus + Grafana monitoring
- [ ] K8s deployment manifest

## Solo-Platform Key Classes to Port

| Class | Status | MEKONG_WRAPPER Location |
|---|---|---|
| `AgentRole` enum | MAPPED | `registry.json` roles field |
| `Task` dataclass | TODO | `state/goal-{stamp}.md` |
| `Memory` class | TODO | `lib/memory.sh` |
| `SoloCompanyOrchestrator` | TODO | `lib/orchestrator.sh` |
| `BaseAgent` | MAPPED | Existing mekong/claudekit agents |
| `CEOAgent` | MAPPED | `planner` + CEO Command department |
| `DeveloperAgent` | MAPPED | `fullstack-developer` + Engineering Factory department |
| `ToolEnabledAgent` | MAPPED | `infrastructure-github-actions-expert` + Platform Operations department |
| `gateway.py` FastAPI | TODO | `me project <scope>` |
| `worker.py` | TODO | `me chain` |
| `database.py` SQLAlchemy | TODO | `state/*.json` |
| `auth.py` Stripe | TODO | `raas/auth.sh` |

## Commands Reference

### Existing (v1.0.0)
```bash
me mekong <cmd>           # Run mekong command with auto agent
me claudekit <cmd>        # Run claudekit command with auto agent
me claude [--model]       # Run claude with model selection
me agents list            # List registered agents from registry
me agents suggest <cmd>   # Suggest agent for command
me idea <goal>            # Create goal with harness-engineering paradigm
me goal show              # Show active goal
me project <scope> <cmd>  # Run at project scope
me chain '<c1> && <c2>'   # Chain commands
me solo [status|pdf]      # Solo Company status
me help                   # Full help
```

### Planned (v2.0.0)
```bash
me solo start             # Start the SoloCompanyOrchestrator loop
me solo stop              # Stop the orchestrator
me solo task "<desc>"     # Submit a task to the queue
me solo status            # Show task queue status
me raas <product> create  # Create a new RaaS product
me raas <product> deploy  # Deploy a RaaS product
me raas <product> monitor # Monitor a RaaS product
me sops list              # List department SOP chains and SOP files
me sops show <name>       # Inspect department SOP or SOP file
```
