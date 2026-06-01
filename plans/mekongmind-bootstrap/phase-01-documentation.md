---
title: "Phase 1: Documentation — Create Missing Bootstrap Docs"
description: "Create project-overview-pdr, code-standards, system-architecture, project-roadmap, design-guidelines at docs/ + update docs/README.md"
status: pending
priority: P1
effort: 1.5-2h
tags: [docs, bootstrap]
---

# Phase 1: Documentation

## Context

- Standard bootstrap docs don't exist at `docs/` root level
- `docs/mekong-cli/` has detailed versions but they're CLI-focused, not monorepo-level
- Archived `docs/archive/mekong-cli/project-overview-pdr.md` references old upstream repo (`longtho638-jpg/mekong-cli`) — unusable
- `docs/README.md` exists but doesn't reference the new docs being created
- `opencode.json` references `docs/architecture/*.md`, `docs/cli/*.md`, `docs/operations/*.md` but these dirs don't exist yet (leftover from Phase 4 restructure plan)
- CLI is at `cli/` (Python Typer), engine at `engine/` (Go + Rust), 32 apps, 79 packages

## Docs to Create (5 files + 1 update)

### File 1: `docs/project-overview-pdr.md` (~80-120 lines)

**What it should cover:**
- Project name: MekongMind
- Tagline: Unified AI Operating System / Intelligent Model Router as a Service
- Stage: Post-MVP, Pre-Revenue
- Core problem: Route developer missions to optimal LLMs automatically
- Monorepo structure summary (apps/, packages/, cli/, engine/)
- Key technologies: Python (Typer CLI), Go (engine), TypeScript (apps/packages), Cloudflare Pages
- 6-layer architecture: Studio → Founder → Business → Product → Engineering → Ops
- License: MIT (packages) / BSL 1.1 (CLI) / Apache 2.0 (engine)
- Target users: Developers, platform creators, enterprises, researchers
- Key features: 319 CLI commands, Plan-Execute-Verify engine, DAG scheduler, multi-LLM routing, MCP server

**Source material:**
- `README.md` at root
- `docs/codebase-summary.md`
- `docs/mekong-cli/system-architecture.md` (lines 1-50 for high-level)

### File 2: `docs/code-standards.md` (~80-100 lines)

**What it should cover:**
- Python (CLI): Black (88 chars), Ruff linting, mypy strict, pytest (7000+ tests), Typer framework
- TypeScript (apps/packages): Prettier, ESLint + @typescript-eslint, strict mode, Vitest
- Go (engine): `gofmt`, `go vet`, language-idiomatic patterns
- General: Conventional commits, meaningful PR descriptions, docs alongside code
- References `docs/mekong-cli/code-standards.md` for detailed standards

**Source material:**
- `docs/mekong-cli/code-standards.md` (421 lines) — distill to essentials
- `.editorconfig`, `.prettierrc`, `eslint.config.mjs`, `tsconfig.json`

### File 3: `docs/system-architecture.md` (~80-120 lines)

**What it should cover:**
- High-level architecture overview (not the 1652-line detail doc)
- 6-layer agent architecture diagram (text-based)
- Monorepo structure: apps/ (landing, dashboard, IDE, API), packages/, cli/, engine/
- Platform endpoints table (landing, IDE, API gateway, webhooks, docs)
- Deployment: Cloudflare Pages (landing, IDE, dashboard) + Workers (API)
- References `docs/mekong-cli/system-architecture.md` for deep dive

**Source material:**
- `docs/mekong-cli/system-architecture.md` (lines 1-70 for high level)
- `docs/codebase-summary.md`

### File 4: `docs/project-roadmap.md` (~60-80 lines)

**What it should cover:**
- Current stage: Post-MVP, Pre-Revenue
- What's built: CLI v6 (319 commands), PEV engine, DAG scheduler, multi-LLM, MCP server, billing
- What's next: GTM launch, revenue, community growth
- Short-term milestones: Launch marketing site, first paying users, open source growth

**Source material:**
- `docs/mekong-cli/project-roadmap.md` (262 lines) — distill current status
- `docs/mekong-cli/project-changelog.md` (1091 lines) — for context
- Current `package.json` version `1.0.0`

### File 5: `docs/design-guidelines.md` (~40-60 lines)

**What it should cover:**
- Brand: MekongMind
- Colors: Emerald/teal scale (#059669, #10B981, #064E3B) — already used in landing page
- Font: Inter (headings/body), JetBrains Mono (code) — already used in landing
- Style: Minimal, dark-first, developer-focused
- The existing `docs/mekong-cli/design-guidelines.md` is for a real estate landing page (Nhịp Điệu Xanh Cần Thơ) — COMPLETELY UNRELATED, must create fresh
- No design system specs needed — this is a CLI/infra tool with 1 static landing page

### File 6: Update `docs/README.md`

- Add entries for the 5 new docs at root level
- Ensure cross-links work

## Implementation Steps

1. Create `docs/project-overview-pdr.md` — synthesize from README.md + codebase-summary.md
2. Create `docs/code-standards.md` — distill from mekong-cli version, add monorepo context
3. Create `docs/system-architecture.md` — high-level overview referencing mekong-cli deep dive
4. Create `docs/project-roadmap.md` — current stage, what's built, what's next
5. Create `docs/design-guidelines.md` — brand colors, fonts, style (emerald/teal theme)
6. Update `docs/README.md` — add entries for new files

## Success Criteria

- [ ] All 5 new docs exist at `docs/` root
- [ ] Each doc is <200 lines (KISS principle)
- [ ] No duplicate content — root docs reference `docs/mekong-cli/*` for details
- [ ] `docs/README.md` indexes all new files
- [ ] Content accurately reflects current codebase (no aspirational features)
- [ ] `docs/design-guidelines.md` is MekongMind-branded (not real estate)
- [ ] Cross-links between docs are valid paths

## Files to Create/Modify

| Action | Path | Type |
|--------|------|------|
| Create | `docs/project-overview-pdr.md` | New file |
| Create | `docs/code-standards.md` | New file |
| Create | `docs/system-architecture.md` | New file |
| Create | `docs/project-roadmap.md` | New file |
| Create | `docs/design-guidelines.md` | New file |
| Update | `docs/README.md` | Edit existing |

## Notes

- The CLI is at `cli/` (Python), NOT at `mekong-cli/` — ensure all references use correct paths
- `docs/mekong-cli/` is the detailed CLI docs subdirectory, not the actual CLI location
- Some CI workflows may still reference old paths — Phase 2 handles that
