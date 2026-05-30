---
title: "MekongMind Overhaul — From Stale Monolith to Ship-Ready"
description: "6-phase cleanup: fix workspace, merge landings, delete stubs, prep GTM, prune docs, set goals pipeline"
status: completed
priority: P0
effort: 3-5d
branch: main
tags: [cleanup, foundation, gtm, docs, monorepo]
created: 2026-05-29
---

# MekongMind Overhaul Plan

## Current State

Codebase is **post-MVP** (CLI v6, 319 commands, Go/Rust engine, 41 apps, 57 pkgs) but plans describe **pre-MVP** ("Zero→PSF"). 3 brands co-exist. Landings are duplicated. 30 of 41 apps lack `package.json`. No README. 135 docs files, many stale.

## Phase Summary

| # | Phase | Pri | Dep | Effort | Impact | Status |
|---|-------|-----|-----|--------|--------|--------|
| 1 | [Foundation](phase-01-foundation.md) | P0 | None | 2-4h | High | ✅ Done |
| 2 | [Consolidation](phase-02-consolidation.md) | P0 | P1 | 4-6h | High | ✅ Done |
| 3 | [GTM Ready](phase-03-gtm-ready.md) | P1 | P2 | 4-8h | High | ✅ Done |
| 4 | [Docs Cleanup](phase-04-docs-cleanup.md) | P1 | P1 | 6-12h | Medium | ✅ Done |
| 5 | [Goals Pipeline](phase-05-goals-pipeline.md) | P2 | P1 | 1-2h | Medium | ✅ Done |
| 6 | [Orchestration](phase-06-orchestration.md) | P2 | P2-3 | 4-8h | Low | ✅ Done |

## Dependency Graph

```
Phase 1 (Foundation)
  ├── Phase 2 (Consolidation) — must have fixed workspace + resolved brand
  │     └── Phase 3 (GTM Ready) — must have merged landings + clean stubs
  └── Phase 4 (Docs Cleanup) — can start in parallel after Phase 1
        └── Phase 5 (Goals Pipeline) — needs updated docs context
              └── Phase 6 (Orchestration) — needs Phase 2-3 for deploy targets
```

## Guiding Principles

- **YAGNI**: Delete before you build. Fix what's broken, not what's aspirational.
- **DRY**: 4 landing pages marketing the same thing → merge to 1.
- **KISS**: Static HTML landing > framework SPA for a marketing page. No Next.js for a brochure.
- **Honesty**: Brand ambiguity must be resolved before any GTM work. Period.
