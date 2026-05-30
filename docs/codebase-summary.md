# MekongMind — Codebase Summary

**Version:** 1.0.0 | **Stage:** Post-MVP, Pre-Revenue | **Last Updated:** 2026-05-29

> Unified AI Operating System — multi-agent orchestration platform with Water Protocol (水) context flow, CheetahClaws MCP server, and 6-layer agent architecture.

---

## Executive Overview

MekongMind is a monorepo combining a Python CLI agent framework, Go core engine, and 57 shared TypeScript packages across 33 apps. The platform enables autonomous agent orchestration with Plan-Execute-Verify (PEV) across 6 business layers (Studio, Founder, Business, Product, Engineering, Ops).

**Key Stats:**
- **33 apps** | 57 packages | Python CLI | Go engine | TypeScript frontends
- **Monorepo:** pnpm workspaces + Turbo repo
- **Deployment:** Cloudflare Pages for all apps
- **License:** MIT (packages) / BSL 1.1 (CLI) / Apache 2.0 (engine)

---

## Directory Structure

```
mekongmind/
├── apps/                  # 33 applications
│   ├── api/               # API gateway
│   ├── dashboard/         # Main dashboard
│   ├── ide/               # Mekong IDE
│   ├── mekonmind-landing/ # Landing page
│   ├── nhipdieuxanh/      # Lead capture app
│   ├── raas-*/            # RaaS platform apps
│   └── ...                # Additional apps
├── packages/              # 57 shared TypeScript packages
│   ├── agent-core/        # Agent runtime kernel
│   ├── agent-forest/      # Multi-tenant orchestration
│   ├── mekong-cli-core/   # CLI core library
│   ├── openclaw-engine/   # Autonomous daemon
│   ├── vibe-*/            # Vibe framework packages
│   └── ...                # Additional packages
├── cli/                   # Python CLI (Typer, v6.0.0)
│   ├── src/               # CLI source (cli/src/)
│   │   ├── core/          # PEV engine, LLM client, etc.
│   │   ├── cli/           # CLI commands
│   │   ├── agents/        # Agent implementations
│   │   ├── api/           # API routes
│   │   └── ...
│   ├── tests/             # Test suite
│   └── pyproject.toml
├── engine/                # Go core + Rust safety FFI + Python quantization
│   ├── cmd/               # CLI entrypoints
│   ├── internal/          # Internal packages
│   ├── rust_safety/       # Rust FFI safety layer
│   └── quantization/      # Quantization module
├── docs/                  # Documentation
│   ├── api/               # API documentation
│   ├── mekong-cli/        # CLI and platform docs
│   ├── mekong-digital/    # Agency ops, templates, runbooks
│   └── archive/           # Archived stale/upstream docs
├── plans/                 # Strategic plans
│   ├── company-blueprint/ # Company blueprint
│   ├── marketing/         # Marketing strategy
│   └── mekongmind-overhaul/ # Implementation phases
├── marketing/             # Marketing content
└── scripts/               # Utility scripts
```

### Applications (33)

| App | Description |
|-----|-------------|
| `admin` | Admin panel |
| `agencyos-landing` | AgencyOS landing page |
| `agencyos-web` | AgencyOS web app |
| `agi-sops` | AGI SOPs management |
| `algo-trader` | Algorithmic trading bot |
| `algo-trader-remote` | Remote trading dashboard |
| `anima119` | Anima 119 app |
| `antigravity-cli` | Anti-gravity CLI tool |
| `apex-os` | Apex OS platform |
| `api` | API gateway |
| `com-anh-duong-10x` | 10x content app |
| `dashboard` | Main dashboard |
| `digital` | Digital agency app |
| `docs` | Documentation site |
| `engine` | Engine management |
| `gemini-proxy-clone` | Gemini proxy |
| `ide` | Mekong IDE |
| `mekonmind-landing` | Landing page |
| `nhipdieuxanh` | NDX lead capture |
| `nhipdieuxanh-landing` | NDX smart landing page |
| `nhipdieuxanh-orchestrator` | NDX orchestration |
| `openclaw-worker` | OpenClaw worker |
| `raas-demo` | RaaS demo app |
| `raas-gateway` | RaaS gateway |
| `raas-gateway-cli` | RaaS gateway CLI |
| `raas-landing` | RaaS landing page |
| `roi-calculator` | ROI calculator |
| `sa-dec-flower-hunt` | Sa Dec flower hunt |
| `saas-dashboard` | SaaS dashboard template |
| `starter-template` | Starter template |
| `vibe-coding-cafe` | Vibe Coding Cafe |
| `well` | Wellness app |
| `worker` | Background worker |

### Packages (57)

Core packages include: `agent-core`, `agent-forest`, `agents`, `mekong-cli-core`, `openclaw-engine`, `vibe-agents`, `vibe-analytics`, `vibe-payment`, `vibe-ui`, `core`, `ui`, `shared`, `billing`, `sdk`, `memory`, `observability`, and 42 more.

---

## Architecture

### 6 Agent Layers

```
Studio → Founder → Business → Product → Engineering → Ops
```

### PEV Engine (cli/src/core/)

The Plan-Execute-Verify engine provides:
- **Planner**: LLM task decomposition
- **Executor**: shell/LLM/API execution
- **Verifier**: quality gates + rollback
- **Orchestrator**: Plan→Execute→Verify loop

### Tech Stack

| Layer | Technology |
|-------|------------|
| CLI | Python (Typer) |
| Engine | Go + Rust FFI |
| Frontends | Next.js, TypeScript, Tailwind CSS |
| Packages | TypeScript, pnpm workspaces |
| Deployment | Cloudflare Pages |
| Database | PostgreSQL, SQLite |
| LLM | Universal via 3 env vars (LLM_BASE_URL, LLM_API_KEY, LLM_MODEL) |

---

## Key Commands

```bash
mekong ai-os start          # Start MCP server
mekong cook <feature>       # AI-powered feature implementation
mekong doctor check         # System health check
mekong deploy               # Deploy to Cloudflare Pages
```

## Deployment

Cloudflare Pages for all apps. `dashboard` → `ide.mekongmind.com`.

## Documentation

- **API Docs:** `docs/api/`
- **CLI Reference:** `docs/mekong-cli/CLI_REFERENCE.md`
- **Architecture:** `docs/mekong-cli/system-architecture.md`
- **Code Standards:** `docs/mekong-cli/code-standards.md`

## Next Steps

- Complete Phase 3 (GTM-Ready) and Phase 4 (Docs Cleanup)
- Move toward first revenue and paying customers
- Continue consolidating upstream `mekong-cli` docs into MekongMind-native content
