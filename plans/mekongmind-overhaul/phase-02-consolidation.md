---
title: "Phase 2: Consolidation"
description: "Merge 4 duplicate landing pages, delete empty stubs, clean orphaned build output"
status: completed
completed: 2026-05-29
priority: P0
effort: 4-6h
tags: [cleanup, consolidation, landing]
---

# Phase 2: Consolidation

## Context

- **Landing file sizes**: `mekonmind-landing/index.html` 504L, `landing/index.html` 70L, `agencyos-landing/index.html` 24L, `agencyos-web/` framework app
- **Empty stubs**: `analytics/`, `tasks/`, `developers/` — only have `.mekong/company.json` meta
- **Partial stub**: `crm/` has `.mekong/`, `.turbo/`, `.wrangler/`, and `dist/` with orphaned build output
- **Pricing page**: `landing/pricing/index.html` 130L — Mekong IDE branded, $49/mo

## Overview

Date: 2026-05-29 | Priority: P0 | Status: ✅ Completed | Effort: 4-6h

## Key Insights

- 3 static HTML pages + 1 framework app all market the same thing under different brands = confusion
- The `landing/` app is the most complete (has pricing subpage, proper structure)
- `web/` (mission-control.html, 2856L) is NOT a landing — it's a dashboard shell, keep separate
- Empty stubs with `.mekong/company.json` were probably scaffolded by a generator and never built

## Requirements

1. [ ] **Merge 3 static landing apps** into 1 canonical landing app
2. [ ] **Pick the survivor**: Recommend `landing/` as the canonical dir (has pricing, proper structure)
3. [ ] **Keep or merge** `agencyos-web/` — decide if it's a marketing page or product shell
4. [ ] **Delete** `analytics/`, `tasks/`, `developers/` directories
5. [ ] **Clean** `crm/` — remove orphaned `dist/` (keep `.mekong/` config if referenced elsewhere)
6. [ ] **Audit** other dirs without `package.json` — mark as "needs attention" or delete

## Architecture

```
Before:
  apps/
    mekonmind-landing/   (MekongMind brand, 504L HTML)
    landing/             (agencyos.network brand, 70L HTML + pricing/)
    agencyos-landing/    (AgencyOS brand, 24L HTML)
    agencyos-web/        (framework app, index.html)
    web/                 (mission-control.html — NOT a landing, keep)
    analytics/           (empty stub)
    tasks/               (empty stub)
    developers/          (empty stub)
    crm/                 (partial — has dist/ build output)

After:
  apps/
    landing/             (canonical landing, merged HTML + pricing)
    web/                 (unrelated — mission control)
    (stubs deleted)
    crm/                 (cleaned — keep dir, remove dist/)
```

## Related Code Files

- `/Users/macbook/mekongmind/apps/mekonmind-landing/index.html`
- `/Users/macbook/mekongmind/apps/landing/index.html`
- `/Users/macbook/mekongmind/apps/landing/pricing/index.html`
- `/Users/macbook/mekongmind/apps/agencyos-landing/index.html`
- `/Users/macbook/mekongmind/apps/agencyos-web/`
- `/Users/macbook/mekongmind/apps/analytics/`
- `/Users/macbook/mekongmind/apps/tasks/`
- `/Users/macbook/mekongmind/apps/developers/`
- `/Users/macbook/mekongmind/apps/crm/`
- `/Users/macbook/mekongmind/pnpm-workspace.yaml`

## Implementation Steps

1. **Inventory all 4 "landing" apps**: Read their index.html to understand unique content
2. **Merge content** into `apps/landing/`:
   - Port unique sections from `mekonmind-landing/` into `landing/index.html`
   - Port unique sections from `agencyos-landing/`
   - Port pricing page from `landing/pricing/` — update brand references
   - Update footer, meta tags, OG tags to use canonical brand
3. **Delete** `apps/mekonmind-landing/`, `apps/agencyos-landing/`
4. **Delete** `apps/analytics/`, `apps/tasks/`, `apps/developers/`
5. **Clean** `apps/crm/dist/` — delete build artifacts, keep directory if placeholder
6. **Update workspace exclusions** in `pnpm-workspace.yaml` for deleted dirs
7. **Update** GitHub deploy workflows (`deploy-landing.yml`) to target `apps/landing/`

## Todo List

- [ ] Inventory all landing HTML content
- [ ] Merge unique content into `apps/landing/`
- [ ] Update brand references to canonical name
- [ ] Delete mekonmind-landing, agencyos-landing
- [ ] Delete analytics, tasks, developers stubs
- [ ] Remove crm/dist/ orphaned build
- [ ] Update workspace exclusions
- [ ] Update deploy-landing workflow

## Success Criteria

- Single canonical landing app exists at `apps/landing/` with all unique content
- No content loss from merged pages
- `pnpm install` succeeds (deleted dirs not attempted)
- `turbo run build` succeeds
- Zero empty stub directories remain

## Risk Assessment

- **Content loss**: Must read all 4 HTML files before merging — could miss unique copy
- **Git history**: Deleting dirs loses commit history — consider `git mv` for merge
- **Deploy breakage**: `deploy-landing.yml` references a removed app — must update

## Security Considerations

- Check deleted dirs don't contain secrets, env files, or credentials before removal
- `crm/dist/` — verify no API keys or config leaks in build artifacts

## Next Steps

Phase 3: GTM Ready — add waitlist, polish landing, prepare for public launch.
