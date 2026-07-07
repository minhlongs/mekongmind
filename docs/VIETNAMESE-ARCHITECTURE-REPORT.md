# Báo Cáo Kiến Trúc MEKONG_WRAPPER v1.0.0
## CEO Solo Company Orchestrator — Kiến trúc, Ánh xạ & Trạng thái Triển khai

---

## 1. Tổng quan

**MEKONG_WRAPPER** là universal CLI wrapper để một CEO duy nhất điều khiển toàn công ty qua ba lớp:

```
CLI Entrypoint:  /usr/local/bin/me       (v1.0.0, 312 dòng)
Agent Resolver:  lib/agent-patterns.sh  (168 dòng, Harness Engineering patterns)
Registry:        agents/registry.json   (canonical source of truth)
State Layer:     state/                 (Markdown + log artifacts)
```

**Công nghệ nền:**
- Bash POSIX (portable, zero deps)
- Python 3 (registry JSON query fallback)
- Harness Engineering (8 patterns: pipeline, fanout/fanin, producer-reviewer, supervisor, hierarchical, expert-pool, iterative-refiner, orchestrator)
- Solo-Platform architecture mapping (PDF spec → CLI)

---

## 2. Ánh xạ Solo-Platform → MEKONG_WRAPPER

Dựa trên `SOLO-MIGRATION.md` (124 dòng) và `orchestrator/orchestrator-patterns.md`:

| Solo-Platform component | MEKONG_WRAPPER equivalent | File / Location |
|---|---|---|
| OpenClaw (Telegram CLI) | `me` binary | `/usr/local/bin/me` |
| Intent Analyzer (LLM classify) | `resolve_agent()` | `lib/agent-patterns.sh` |
| Manager Agent | Orchestrator layer | `orchestrator/orchestrator-patterns.md` |
| Worker Agent (per task) | mekong / claudekit / claude | `agents/registry.json` routing |
| Memory Layer | `state/` directory | `state/goal-*.md`, `state/chains/*.log` |
| Task Queue | chained commands | `me chain "cmd1;cmd2"` |
| Team Management | agent teams | `agents/registry.json` team definitions |

---

## 3. Danh mục Lệnh

### 3.1 Basic Routing

```bash
me mekong cook                  # auto: department engineering-factory → fullstack-developer
me mekong audit-plan            # auto: department quality-compliance → code-reviewer
me mekong revenue               # auto: department sales-revenue → business-analyst
me ck lint                      # auto: resolve_agent claudekit lint → code-quality-linting-expert
me ck code-review src/          # auto: resolve_agent claudekit code-review → code-review-expert
me claude "review file.py"      # auto: resolve_agent claude review → code-reviewer
```

### 3.2 Goal / Idea (Harness Engineering `/goal` paradigm)

```bash
me idea "Build user auth API"    # → creates state/goal-<stamp>.md, suggests steps
me idea "Audit SOX compliance"   # → quality-compliance / code-reviewer gate
me step 1                        # execute step 1 of current goal
me step 2                        # execute step 2
me step --all                    # execute all remaining steps
```

### 3.3 Chaining (Pipeline + Fan-out)

```bash
# Sequential (Pipeline pattern)
me chain "audit-sox;accounting-daily;business-deploy"
# Parallel (Fan-out pattern) — split by |
me chain "backend-db|frontend build|docs-generate"
# With override
MEKONG_WRAPPER_AGENT=orchestrator me chain "cmd1;cmd2"
```

### 3.4 Project Scoping

```bash
me scope <project> init         # create project scope doc in state/
me scope <project> plan         # generate execution plan
```

### 3.5 RaaS (Product as a Service)

```bash
me raas <product> create        # create RaaS product spec
me raas <product> deploy        # deploy a RaaS product
me raas <product> monitor       # monitor a RaaS product
```

### 3.6 SOP (Standard Operating Procedure)

```bash
me sop <name> create            # create an SOP
me sop <name> run               # execute an SOP
me sop list                     # list available SOPs
```

### 3.7 Helpers

```bash
me agents --all                 # list all agents (mekong + claudekit + harness patterns)
me agents --mekong              # list mekong-only agents
me agents --ck                  # list claudekit-only agents
me agents --harness             # list harness engineering patterns
me agent <id>                   # show domain|source|path for agent
me --verbose                    # verbose routing trace
```

---

## 4. Harness Engineering Pattern Catalog

Từ `revfactory/harness` (đã clone về `/tmp/harness`), 8 patterns được map như sau:

| Pattern | Description | CLI mapping | Use case |
|---|---|---|---|
| `pipeline` | Sequential stages | `me chain "cmd;cmd"` | Multi-step deterministic flow |
| `fanout-fanin` | Parallel → aggregate | `me chain "cmd|cmd"` | Independent parallel tasks |
| `producer-reviewer` | Two-pass produce→review | `me idea` + `me review` | Quality-critical artifacts |
| `supervisor` | Leader delegates workers | `MEKONG_WRAPPER_AGENT=planner` | Complex multi-subtask |
| `hierarchical` | 3-tier: CEO→PM→worker | `me orchestrate <goal>` | Large initiative |
| `expert-pool` | Specialist router by keyword | `MEKONG_WRAPPER_VERBOSE=1 me <cli>` | Domain routing |
| `iterative-refiner` | Loop produce→score→refine | `me idea` + `me step` loop | Drafts needing polish |
| `orchestrator` | Team leader plan/assign/synth | `me plan`, `me step` | Goal-driven multi-phase |

---

## 5. Registry — Source of Truth

**File:** `agents/registry.json` (77 dòng, canonical)

**Mekong agents (23):** ai-sdk-expert, brainstormer, business-analyst, cli-expert, code-review-expert, code-reviewer, code-search, code-simplifier, debugger, docs-manager, fullstack-developer, gemini-analyzer, git-manager, journal-writer, nestjs-expert, oracle, planner, project-manager, research-expert, researcher, tester, triage-expert, ui-ux-designer

**ClaudeKit agents (35):** ai-sdk-expert, build-tools-vite-expert, build-tools-webpack-expert, cli-expert, code-quality-linting-expert, code-review-expert, code-search, database-expert, database-mongodb-expert, database-postgres-expert, devops-expert, documentation-expert, e2e-playwright-expert, framework-nextjs-expert, frontend-accessibility-expert, frontend-css-styling-expert, git-expert, infrastructure-docker-expert, infrastructure-github-actions-expert, jest-testing-expert, kafka-expert, loopback-expert, nestjs-expert, nodejs-expert, oracle, react-expert, react-performance-expert, refactoring-expert, research-expert, testing-expert, triage-expert, typescript-build-expert, typescript-expert, typescript-type-expert, vitest-testing-expert

**Harness patterns (8):** pipeline, fanout-fanin, producer-reviewer, supervisor, hierarchical, expert-pool, iterative-refiner, orchestrator

**Unique ID count:** Registry snapshot hiện tại = **58 unified agents**. Earlier 56-agent count is superseded by `agents/registry.json`.

---

## 6. State Schema

```
state/
├── goal-{YYYYMMDD-HHMMSS}.md      # Active goals (one per /idea invocation)
├── raas/
│   └── {product}.md               # RaaS product definitions
├── sops/
│   └── {name}.md                  # SOP definitions
└── chains/
    └── {id}.log                   # Chained execution logs (append-only)
```

**Schema (goal file):**
```markdown
# Goal: <description>
Created: <ISO timestamp>
Status: active | completed | failed
Steps: []
- [ ] step 1 description → agent: <id>
- [x] step 2 description → agent: <id>
```

---

## 7. Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `MEKONG_WRAPPER_VERBOSE=1` | off | Verbose routing trace |
| `MEKONG_WRAPPER_AGENT=<id>` | auto | Override agent selection |
| `MEKONG_MODEL=...` | opus-4-7 | Switch claude model |
| `PROJECT_ROOT=/path` | Wrapper repo root derived from `bin/me` | Override project root |
| `MEKONG_HARNESS_PATTERN=<pattern>` | none | Force harness pattern for next invocation |

---

## 8. Directory Structure

```
/Users/macbook/Documents/me-deep-wrapper/
├── README.md                        # Vietnamese + English usage guide (76 dòng)
├── SOLO-MIGRATION.md                # Solo-Platform → MEKONG_WRAPPER migration (124 dòng)
├── bin/
│   └── me                           # [empty — using /usr/local/bin/me instead]
├── lib/
│   └── agent-patterns.sh            # Agent resolution + harness patterns (168 dòng)
├── agents/
│   └── registry.json                # Canonical agent + pattern registry (77 dòng)
├── orchestrator/
│   └── orchestrator-patterns.md     # Pattern catalog + Solo-Platform mapping (121 dòng)
├── state/
│   └── goal-20260601-105749.md      # Active goal example
├── templates/
│   └── template.md                  # Goal/SOP/RaaS template
├── ideas/                           # Idea scratch space (.gitkeep)
├── sops/                            # SOP definitions (.gitkeep)
└── raas/
    └── template.md                  # RaaS product template

/usr/local/bin/me                    # Installed entrypoint (312 dòng)
/Users/macbook/.local/bin/me         # User-writable copy (patched LIB_DIR)
```

---

## 9. Integration Points

### 9.1 Mekong-CLI (mekong-cli)
- Binary: `/usr/local/bin/mekong`
- Agent definitions: `/Users/macbook/.claude/agents/*.md` (23 files)
- Routing: `resolve_agent "mekong" "<cmd>"` → agent id → inject `--agent <id>` or tip

### 9.2 ClaudeKit (claudekit)
- Source: `/Users/macbook/projects/claudekit/src/`
- Agent definitions: `/Users/macbook/projects/claudekit/src/agents/*.md` (35 files)
- Binary: auto-detected via `which claudekit` or `/opt/homebrew/bin/claudekit`
- Routing: `resolve_agent "claudekit" "<cmd>"` → agent id

### 9.3 Claude (claude)
- Binary: auto-detected via `which claude`
- Agent override: `--agent <id>` (custom .claude/agents/<id>.md)
- Model override: `MEKONG_MODEL` env var

### 9.4 revfactory/harness
- Source: `/tmp/harness/` (cloned 2026-06-01, depth=1)
- Skills: `/tmp/harness/skills/harness/` (SKILL.md + 6 references)
- Patterns incorporated: 8 agent team design patterns (pipeline, fanout-fanin, producer-reviewer, supervisor, hierarchical, expert-pool, iterative-refiner, orchestrator)
- Mapping: `apply_harness_pattern()` in `lib/agent-patterns.sh`

---

## 10. Current Implementation Status (2026-06-01)

| Component | Status | File |
|---|---|---|
| Entrypoint `me` | ✅ Operational (312 dòng) | `/usr/local/bin/me` |
| Agent Registry | ✅ Updated (58 unified agents) | `agents/registry.json` |
| Agent Resolver | ✅ Harness patterns added | `lib/agent-patterns.sh` (168 dòng) |
| Orchestrator Patterns | ✅ Cataloged 8 patterns | `orchestrator/orchestrator-patterns.md` (121 dòng) |
| Solo-Platform Migration | ✅ Documented | `SOLO-MIGRATION.md` (124 dòng) |
| State Layer | ✅ Active (1 goal file) | `state/goal-20260601-105749.md` |
| RaaS Templates | ✅ Created | `raas/template.md` |
| SOP Templates | ⏳ Pending | `sops/` (empty, .gitkeep) |
| awesome-harness-engineering | ✅ Cloned | `/tmp/awesome-harness-engineering/` |
| revfactory/harness | ✅ Cloned | `/tmp/harness/` |
| Vietnamese Report | ✅ This document | `docs/VIETNAMESE-ARCHITECTURE-REPORT.md` |
| LIB_DIR sync (installed → src) | ⚠️ Partial | `~/.local/bin/me` patched; `/usr/local/bin/me` requires sudo |

---

## 11. Quick Reference (Cheatsheet)

```bash
# === Basic ===
me mekong <cmd>                    # mekong-cli + auto agent
me ck <cmd>                        # claudekit + auto agent
me claude "prompt"                 # claude + auto agent
me agents --all                    # list all agents

# === Goal-Driven (Harness Engineering) ===
me idea "<goal>"                   # create goal plan → state/goal-*.md
me step 1                          # execute step 1
me step --all                      # execute all

# === Pipeline / Fan-out ===
me chain "cmd1;cmd2;cmd3"          # sequential
MEKONG_HARNESS_PATTERN=fanout-fanin me chain "cmd1|cmd2|cmd3"

# === RaaS ===
me raas <product> create
me raas <product> deploy

# === SOP ===
me sop <name> create
me sop <name> run
me sop list

# === Debug / Inspect ===
me agents --harness                # list 8 harness patterns
me agent <id>                      # show agent domain|source|path
MEKONG_WRAPPER_VERBOSE=1 me ...    # verbose routing
```

---

*Generated: 2026-06-01 | MEKONG_WRAPPER v1.0.0 | Source: me-deep-wrapper + revfactory/harness + walkinglabs/awesome-harness-engineering*
