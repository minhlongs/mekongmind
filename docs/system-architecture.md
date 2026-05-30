# MekongMind — System Architecture

## High-Level Architecture

6-layer hierarchical agent stack. Context flows top-to-bottom via Water Protocol. Each layer delegates downward and reports upward.

```
Studio → Founder → Business → Product → Engineering → Ops
```

- **Studio**: Agent workspace, IDE integration, command center, MCP client connections.
- **Founder**: Strategic planning, goal decomposition, company blueprint, VC/funding workflows.
- **Business**: BA scenarios, billing, CRM, marketplace, revenue operations, RaaS gateway.
- **Product**: Feature development, recipe generation, content writing, ROi analysis.
- **Engineering**: Code generation, deployment, CI/CD, infrastructure, engine management.
- **Ops**: Autonomous agents, monitoring, scheduling, swarm coordination, incident response.

## Monorepo Structure

```
mekongmind/
├── apps/                          # 32 applications
│   ├── api/                       # API gateway
│   ├── dashboard/                 # Main dashboard (Solid.js)
│   ├── ide/                       # Mekong IDE (CodeMirror + terminal)
│   ├── mekonmind-landing/         # Landing page (static HTML)
│   ├── raas-gateway/              # RaaS API gateway
│   ├── openclaw-worker/           # Background worker
│   └── ...                        # 26 additional apps
├── packages/                      # 57 shared TypeScript packages
│   ├── agent-core/                # Agent runtime kernel
│   ├── agent-forest/              # Multi-tenant orchestration
│   ├── openclaw-engine/           # Autonomous daemon
│   ├── mekong-engine/             # Engine bindings
│   ├── memory/                    # Memory and vector store
│   ├── observability/             # OpenTelemetry instrumentation
│   ├── billing/                   # Billing and metering
│   ├── vibe-*/                    # 12 Vibe framework packages
│   └── ...                        # 46 additional packages
├── cli/                           # Python CLI (v6.0.0, 319 commands)
│   ├── src/
│   │   ├── main.py                # Entry: mekong command
│   │   ├── cli/                   # 54 Typer command modules
│   │   │   ├── app_setup.py       # App factory wiring
│   │   │   ├── cook_command.py    # AI feature implementation
│   │   │   ├── studio_commands.py # Workspace commands
│   │   │   └── sdlc/              # SDLC scaffold
│   │   ├── core/                  # PEV engine (~149 modules)
│   │   │   ├── planner.py         # LLM task decomposition
│   │   │   ├── executor.py        # Shell/LLM/API execution
│   │   │   ├── verifier.py        # Quality gates + rollback
│   │   │   ├── orchestrator/      # PEV loop orchestration
│   │   │   ├── mcp_server.py      # 25-tool MCP server
│   │   │   ├── context_flow.py    # Water Protocol
│   │   │   ├── llm_client.py      # Universal LLM routing
│   │   │   └── agent_registry.py  # Agent dispatch
│   │   ├── agents/                # 20 agent implementations
│   │   └── commands/              # Flat command modules
│   └── tests/                     # pytest suite
├── engine/                        # Go + Rust safety FFI + Python quantization
│   ├── cmd/mekong/main.go         # Go entrypoint
│   ├── internal/internal/         # 10 packages: agents, llm, router, ffi, health, tools, config, cli, bootstrap, cashclaw
│   ├── rust_safety/               # Rust crate, C ABI via cbindgen
│   └── quantization/              # MLX polar quant, flash attention, KV cache, outlier quant
├── docs/                          # Documentation
├── plans/                         # Strategic plans
├── marketing/                     # Marketing content
└── scripts/                       # Utility scripts
```

## Python CLI Architecture

Typer v0.12+ with Rich. **App Factory**: 8 sub-apps (swarm, schedule, memory, goal, autonomous, tools, browse, collab), 4 SDLC scaffolds (spec, design, code, deploy), 5 flat command groups (cook, workflow, recipe, system, studio), 3 additional commands.

**PEV Engine** (~149 modules in `cli/src/core/`): Planner (LLM goal decomposition), Executor (shell/LLM/API, parallel), Verifier (quality gates, auto-rollback), Orchestrator (PEV loop with circuit breaker + retry), Checkpoint system (resumable workflows).

**Agent Framework** (20 agents in `cli/src/agents/`): shell, git, docs, database, network, browser, social, content writer, reviewer, monitor, plugin, workspace. Communicate via Water Protocol.

## Go Engine Architecture

Go 1.22 with Cobra CLI and Viper config. 10 internal packages: agents (Go-native runtime), llm (streaming bindings), router (request routing), ffi (Rust FFI), health (diagnostics), tools (capability system), config (Viper), cli (Cobra commands), bootstrap (init), cashclaw (payments).

**Rust Safety FFI** (`engine/rust_safety/`): Rust crate exposing memory-safe operations via C ABI. `cbindgen.toml` auto-generates C headers. `build.rs` + `build.sh` handle cross-compilation. Used for sandboxed execution and memory-critical agent ops.

**Quantization** (`engine/quantization/`): Python MLX modules for polar quantization, flash attention, KV cache, outlier quant, and sparse value optimization.

## TypeScript Packages Overview

57 packages by function: agent-core + agent-forest (runtime, multi-tenant orchestration), openclaw-engine + openclaw-agents (autonomous daemon), mekong-cli-core + cli-adapter (CLI integration), 12 vibe-* packages (vibe-agents, vibe-analytics, vibe-auth, vibe-crm, vibe-embedded-finance, vibe-money, vibe-payment, vibe-payos-billing-types, vibe-stripe, vibe-subscription, vibe-supabase, vibe-ui — composable business modules), infrastructure (billing, memory, observability, core, shared, sdk, ui, tooling, tokens), platform (mekong-engine, mekong-sdk, mekongd, mekong-reports, mekong-docs), RaaS (raas-sdk, raas-dashboard, raas-marketplace, raas-landing), specialized (agi-evolution, alphaear, build-optimizer, business, cleo, i18n, integrations, license-sdk, solo-os, trading-core, vc-governance, zalo-parser).

## Water Protocol (水) — Context Flow

Governs context passing between agents. Implementation in `cli/src/core/context_flow.py`.

- `ContextFlow` class tracks task context across all participating agents.
- Each `AgentContribution` records: agent role, output, status (DONE/BLOCKED/NEEDS_CONTEXT), concerns, timestamp.
- `flow.add(role, output)` appends to the stream. `flow.get_context_for(agent)` assembles accumulated context.

**Principles**: (1) Previous agent output becomes next agent input. (2) Shared facts accumulate — no duplicate questions. (3) Each agent adds to the stream rather than starting fresh. (4) Status flags enable branching: blocked triggers escalation, needs_context triggers additional rounds.

## CheetahClaws MCP Server Architecture

Located at `cli/src/core/mcp_server.py`. Exposes 25 tools via Model Context Protocol.

**Transport**: Stdio (default) or SSE (HTTP) mode. Built on `mcp.server.fastmcp.FastMCP`.

**Tool Categories**: Agent Management (registry, dispatch, status), Memory (vector store, search, retrieval), Task Management (CRUD, completion), Planning (prompt contracts, constraints), Monitoring (health, metrics, telemetry), Execution (shell, file, git ops), Billing (metering, credits, cost), Deployment (Cloudflare Pages deploy, environment mgmt).

**Dependency Detection**: Each tool checks its own dependencies at import time. Missing deps produce actionable error messages instead of crashes.

## Deployment Architecture

All apps deploy to Cloudflare Pages with per-app config.

```
User → Cloudflare CDN → Cloudflare Pages
                           ├── dashboard → ide.mekongmind.com
                           ├── api → api.mekongmind.com
                           ├── mekonmind-landing → mekongmind.com
                           └── 29 apps → *.pages.dev
```

**CLI Deploy**: `mekong deploy` triggers Pages deployment. **Engine**: Go binary deployed alongside CLI or standalone. **Database**: PostgreSQL (production, cloud-hosted), SQLite + bbolt (local dev, edge caching).

## Data Flow: User to Output

```
User Input → CLI (mekong) → Typer parse → Command handler → PEV Engine
    → Planner (LLM → steps + dependency graph)
    → Executor (shell/LLM/API → agents)
    → Verifier (quality gates: pass=continue, fail=retry/rollback)
    → LLM Router (primary provider → fallback → cache)
    → Agent Output → ContextFlow accumulates → next agent
    → Formatted output (Rich/JSON/raw) → User
```

Sequence: User runs `mekong <command>` → Typer routes to handler → PEV Engine initializes → Planner LLM-decomposes goal into steps with dependency graph → Executor runs steps via shell/LLM/API through agents → Verifier checks output against quality gates, retries or rolls back on failure → LLM Router selects provider with fallback chains and caching → Agent output flows through ContextFlow accumulating shared facts → Final output formatted via Rich/JSON/raw and returned.
