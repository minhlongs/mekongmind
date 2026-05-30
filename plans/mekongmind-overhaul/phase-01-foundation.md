---
title: "Phase 1: Foundation"
description: "Resolve stage/brand mismatch, fix workspace config, add root README"
status: completed
completed: 2026-05-29
priority: P0
effort: 2-4h
tags: [foundation, workspace, branding]
---

# Phase 1: Foundation

## Context

- **Existing plans**: `plans/company-blueprint/plan.md` — says "Zero→PSF" stage
- **Codebase reality**: CLI v6.0.0 (319 commands), Go/Rust engine running, 41 apps, 57 packages
- **Brand conflict**: root `package.json` says "MekongMind", `index.html`s say "AgencyOS"/"Mekong IDE"
- **Workspace**: `pnpm-workspace.yaml` glob `apps/*` tries to include all 41 dirs — 30 lack `package.json`
- **No `.opencode/`**: No agent goals pipeline configured at repo root

## Overview

Date: 2026-05-29 | Priority: P0 | Status: ✅ Completed | Effort: 2-4h

## Key Insights

- `turbo` will fail or warn on any workspace glob match without `package.json` — 30/41 apps affected
- Brand is the #1 blocker: can't write README, can't merge landings, can't GTM until it's settled
- Stage mismatch means wrong metrics being tracked — "Zero→PSF" metrics don't apply to v6 CLI

## Requirements

1. [ ] **Resolve brand with user**: MekongMind vs AgencyOS vs Mekong IDE — pick one canonical name
2. [ ] **Update stage description**: Replace "Zero→PSF" with current stage (probably "Product-Market Fit / Growth")
3. [ ] **Fix workspace config**: Either add `package.json` to apps that need it, or exclude dirs that don't
4. [ ] **Add root `README.md`**: One-pager — what this repo is, how to use it, CLI invocation
5. [ ] **Create `.opencode/` directory**: Ready for Phase 5 goals pipeline

## Architecture

```
Before: pnpm-workspace.yaml globs apps/* (41 dirs, 11 have package.json)
After:  Exclude empty/stub app dirs, fix workspace globs, or add package.json to active apps
```

## Related Code Files

- `/Users/macbook/mekongmind/pnpm-workspace.yaml`
- `/Users/macbook/mekongmind/package.json`
- `/Users/macbook/mekongmind/turbo.json`
- `/Users/macbook/mekongmind/plans/company-blueprint/plan.md`
- `/Users/macbook/mekongmind/cli/pyproject.toml`

## Implementation Steps

1. **Brand resolution meeting** (with user): Look at all 4 landing pages + CLI branding → decide canonical name
2. **Update plan docs**: Change stage in company-blueprint from "Zero→PSF" to actual stage
3. **Map active apps**: Inventory which apps have actual code vs are empty stubs (see Phase 2)
4. **Exclude empty stubs** from workspace: Add `!apps/analytics`, `!apps/tasks`, `!apps/developers`, `!apps/crm` to `pnpm-workspace.yaml`
5. **Write root README.md**: Include project description, CLI quickstart, architecture, contributing
6. **Create `.opencode/` dir**: Empty directory with `.gitkeep` to be populated in Phase 5

## Todo List

- [ ] Resolve canonical brand name with user
- [ ] Update stage description in company-blueprint
- [ ] Add `!apps/analytics`, `!apps/tasks`, `!apps/developers`, `!apps/crm` to workspace
- [ ] Write root README.md
- [ ] Create `.opencode/` directory
- [ ] Run `pnpm install` to verify workspace doesn't error

## Success Criteria

- `pnpm install` runs without errors (no glob miss on missing package.json)
- `turbo run build` succeeds for all active apps
- Root README.md exists and is accurate
- Brand name is used consistently in one place

## Risk Assessment

- **Brand decision paralysis**: If user can't decide, ship with "MekongMind" (it's the root package name) and file issue for rebrand
- **Workspace exclusions too aggressive**: Apps excluded from workspace won't get turbo task orchestration — verify each stub is truly dead

## Security Considerations

None — no secrets, no config changes, no network services touched.

## Next Steps

Phase 2: Consolidation — merge landings, delete stubs, clean crm build output.
