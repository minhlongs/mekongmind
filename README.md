# MekongMind — Unified AI Operating System

**mekongmind.com** — Multi-agent orchestration platform with Water Protocol (水) context flow, CheetahClaws MCP server, and a 6-layer agent architecture.

## Quick Start

```bash
pip install -e .           # Python CLI (319 commands)
pnpm install               # JS/TS packages
mekong doctor check         # Health check
```

## Architecture

```
Studio → Founder → Business → Product → Engineering → Ops
```

6 layers, 290+ commands. Universal LLM via 3 env vars (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`).

## Monorepo Structure

| Dir | Contents |
|-----|----------|
| `apps/` | 34 apps (web, API, IDE, dashboard, docs, landing) |
| `packages/` | 57 shared TypeScript packages |
| `cli/` | Python CLI (Typer, v6.0.0) |
| `engine/` | Go core + Rust safety FFI + Python quantization |
| `docs/` | API references, CLI guides, deployment docs |
| `plans/` | Company blueprint, marketing strategy, implementation plans |

## Key Commands

```bash
mekong ai-os start          # Start MCP server
mekong cook <feature>       # AI-powered feature implementation
mekong doctor check         # System health check
mekong deploy               # Deploy to Cloudflare Pages
```

## Deployment

Cloudflare Pages for all apps. `dashboard` → `ide.mekongmind.com`.

## License

MIT (packages) / BSL 1.1 (CLI) / Apache 2.0 (engine)
