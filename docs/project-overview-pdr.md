# MekongMind — Product Development Requirements

## Product Vision

MekongMind is the Unified AI Operating System for building, deploying, and orchestrating AI agents at scale. It provides a complete agent lifecycle platform with a 6-layer architecture, universal LLM routing, Plan-Execute-Verify (PEV) engine, and a 319-command CLI. The platform enables teams to move from idea to production-grade agent workflows without switching tools.

## Value Proposition

One platform for the entire agent development lifecycle. From planning and coding to deployment and monitoring, MekongMind unifies LLM routing, context management, multi-agent orchestration, and infrastructure deployment behind a single CLI and MCP server. Teams reduce context-switching, eliminate vendor lock-in through universal LLM support, and ship agent systems faster.

## Target Users

- **Developers** building AI agent systems who need multi-LLM routing, agent orchestration, and context management out of the box.
- **Teams** building autonomous agent workflows across multiple layers (business, product, engineering, operations).
- **Agency operators** managing client-facing agent deployments with tenant isolation and branded workspaces.
- **Solo founders and startups** needing an all-in-one agent platform without stitching together disparate tools.

## Core Problems Solved

- **Multi-LLM routing**: Universal LLM abstraction via 3 environment variables (LLM_BASE_URL, LLM_API_KEY, LLM_MODEL). Swap providers without code changes.
- **Agent orchestration**: 6-layer hierarchical stack (Studio through Ops) with Water Protocol context flow between layers.
- **Context management**: Water Protocol ensures agent outputs flow as inputs to downstream agents. Shared facts accumulate across the chain.
- **Plan-Execute-Verify loop**: LLM-powered task decomposition, shell/LLM/API execution, automated quality verification with rollback.
- **MCP integration**: 25-tool MCP server exposing core services to AI IDEs and external agents.
- **Deployment friction**: One-command Cloudflare Pages deployment for all apps.
- **Tool sprawl**: Single CLI with 319 commands covering development, deployment, monitoring, billing, and operations.

## Key Features

- **6-Layer Agent Architecture**: Studio, Founder, Business, Product, Engineering, Ops — hierarchical agent stack with cross-layer context flow.
- **Water Protocol (水)**: Context flows like water between agents. Each agent's output becomes the next agent's input, accumulating shared facts.
- **PEV Engine**: Plan-Execute-Verify loop for structured agent execution with planner (LLM decomposition), executor (shell/LLM/API), verifier (quality gates + rollback), and orchestrator (loop controller).
- **CheetahClaws MCP Server**: 25 tools exposing AI OS capabilities — agent registry, memory store, task management, health monitoring, telemetry, billing, deployment. Runs in stdio or SSE mode.
- **319-Command CLI**: Python/Typer-based CLI covering cook, plan, recipe, schedule, swarm, memory, goal, autonomous, billing, deployment, and system commands.
- **Universal LLM Routing**: Provider-agnostic LLM client with model selection, fallback chains, cost tracking, and caching.
- **Autonomous Agent Framework**: Swarm mode, goal-driven execution, Telegram integration, scheduled commands, and self-healing agents.
- **IDE Integration**: Mekong IDE with CodeMirror-based multi-language editor, integrated terminal, and MCP-powered agent panel.

## Technical Stack Summary

| Layer | Technology |
|-------|------------|
| CLI | Python 3.9+ with Typer |
| Engine | Go 1.22 with Rust safety FFI + Python quantization |
| Frontends | TypeScript, Solid.js, Tailwind CSS |
| Packages | 57 TypeScript packages, pnpm workspaces |
| Build | Turbo repo v2.8 |
| Deployment | Cloudflare Pages |
| Databases | PostgreSQL, SQLite, bbolt |
| LLM | Universal via 3 env vars |
| Observability | OpenTelemetry, Prometheus, structlog |

## Constraints & Dependencies

- Python 3.9-3.12 required for CLI. Go 1.22+ for engine. pnpm v9.15+ for packages.
- LLM providers require valid API keys set via environment variables. No bundled LLM inference.
- Cloudflare Pages for app deployment. Self-hosted runners for engine builds.
- Rust toolchain required for safety FFI layer compilation.
- PostgreSQL for production data stores. SQLite for local development.

## Success Metrics

- **Adoption**: Active installations, CLI command invocations per day, unique developers using the platform.
- **Usage**: Commands executed per session, agents deployed, PEV loops completed, MCP tools invoked.
- **Reliability**: CLI uptime, PEV success rate, MCP server availability, error rate below 1%.
- **Performance**: Average command response time under 500ms, PEV loop completion under 30s for standard tasks.
- **Developer experience**: Command completion rate, help documentation accuracy, setup success rate.

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM provider dependency | High — platform is non-functional without external LLM APIs | Universal routing with fallback chains, local fallback for basic commands |
| Monorepo complexity | Medium — 32 apps, 79 packages, polyglot stack | Turbo repo task orchestration, strict package boundaries, CI/CD gates |
| BSL 1.1 CLI license | Medium — may limit enterprise adoption | MIT for packages, Apache 2.0 for engine, clear licensing per component |
| CLI scope creep | Medium — 319 commands risks bloat | Active command audit, deprecation policy, alias consolidation |
| Post-MVP feature surface | Medium — pre-revenue, limited engineering bandwidth | Prioritized roadmap, community contributions, phased rollout |

## Current Stage: Post-MVP, Pre-Revenue

The platform is functional and deployed. Core CLI, PEV engine, MCP server, and agent framework are operational. Focus areas: product-market fit, documentation completeness, first revenue, and reducing time-to-value for new users.
