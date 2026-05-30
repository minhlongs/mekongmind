# Consolidation Analysis Report

**Date**: 2026-05-29
**Scope**: Full monorepo audit of `/Users/macbook/mekongmind/apps`

---

## Executive Summary

This monorepo has 39 apps dirs. ~17 are Mekong-branded apps; ~11 are unrelated side projects living in the monorepo; ~6 are empty stubs with `.mekong/company.json` planning artifacts only; and 3 marketing landing pages duplicate each other. The turbo pipeline is misconfigured — 3 key apps lack `package.json` yet fall under `apps/*` glob. `apps/web` is a broken Next.js stub with no build config. Real opportunity: remove ~12 dirs, merge 3 landing pages into 1, and fix workspace plumbing.

---

## 1. Landing Page Duplication (3 apps, same brand)

| Dimension | `apps/mekonmind-landing` | `apps/landing` | `apps/web` |
|-----------|--------------------------|----------------|------------|
| Type | Static HTML (31.5KB) | Static HTML (10.5KB) | Next.js stub (incomplete) |
| Theme | Dark green/emerald | Dark orange | None (no config) |
| Positioning | "Intelligent Model Router" API service | "AI Operating System" for companies | Mission Control UI |
| Files | `index.html`, `_headers`, `_redirects` | `index.html`, `pricing/index.html`, `_headers` | `next-env.d.ts`, `BraintreeCheckout.tsx`, `utils.ts`, `mission-control.html` |
| package.json | **Missing** | **Missing** | **Missing** |
| turbo cache | No `.turbo/` | Has `.turbo/` | Has `.turbo/` |
| Deployment | Cloudflare Pages (headers only, no config) | Cloudflare Pages (headers only, no config) | None |

**Overlap**: All three market the Mekong brand but target different angles:
- `mekonmind-landing` → RaaS model-routing API
- `landing` → AI OS for business automation
- `web` → app shell with mission control + checkout UI

**Key finding**: `mekonmind-landing` and `landing` are both static marketing sites that could merge into one with shared components. `web` is a separate app (dashboard/app vs marketing site). All three lack `package.json` but `apps/*` workspace glob includes them — this means pnpm/turbo may silently skip them but it's still a structural smell.

**Verdict**: **MERGE** `mekonmind-landing` and `landing` → single static landing site. Decide on ONE brand positioning. Keep `web` as separate dashboard app but give it a `package.json` or delete it.

---

## 2. Empty Stub Apps (6 apps, 2 with real content)

| App | `.mekong/` | Real Files | Verdict |
|-----|-----------|-----------|---------|
| `analytics/` | `company.json` | _none_ | **Empty stub** — delete |
| `crm/` | `company.json` | `dist/` (built HTML+JS+CSS) + `.wrangler/` | **Orphaned build** — no source code, only compile output |
| `tasks/` | `company.json` | _none_ | **Empty stub** — delete |
| `worker/` | `company.json` | `.env` (stale DB path) | **Mostly empty** — env file only |
| `saas-dashboard/` | `company.json` | `src/app/`, `src/components/`, `src/db/`, `src/lib/`, `src/types/`, `.env.local`, `tests/` | **Has real code** — not a stub |
| `developers/` | `company.json` | `__mocks__/` (empty) | **Empty stub** — delete |

**Key finding**: The `.mekong/company.json` files are AI-agent planning artifacts with identical structure (`goal: "$1M ARR via X"`, `mrr: 0`, `arr_target: 1000000`). They pollute the workspace without delivering any runtime value.

**Recommendation**: Delete `analytics/`, `tasks/`, `developers/`. Investigate `crm/` — has built `dist/` with `index.html` + bundled JS/CSS (likely a Vite/React build) but **no source code**, suggesting the source was removed post-build. `worker/` has a stale `.env` referencing a local path. `saas-dashboard/` is legitimate code.

---

## 3. Deployment Targets

Only **2 apps** have explicit deployment configs:

| App | Config | Platform | Domain |
|-----|--------|----------|--------|
| `apps/dashboard` | `wrangler.toml` | Cloudflare Pages | `ide.mekongmind.com` |
| `apps/well` | `wrangler.toml` + `netlify.toml` + `firebase.json` | Cloudflare + Netlify + Firebase | `wellnexus` |

Landing pages (`mekonmind-landing`, `landing`) rely on `_headers`/`_redirects` files (Cloudflare Pages convention) but have **no wrangler.toml, no vercel.json**. Deployment is manual or via external CI.

**Key findings**:
- `apps/crm` has a `.wrangler/` cache dir (was once deployed via wrangler) but no `wrangler.toml` remains
- `apps/well` has the most complex deployment (multi-platform)
- No app uses Vercel — all Cloudflare Pages

---

## 4. Monorepo Health

**Issues found**:

1. **3 apps missing `package.json`**: `mekonmind-landing`, `landing`, `web` — all fall under `apps/*` workspace glob in `pnpm-workspace.yaml`. pnpm ignores dirs without `package.json`, but this is confusing and means zero turbo pipeline integration for them.

2. **Workspace pattern duplication**: The workspace patterns are defined identically in both `pnpm-workspace.yaml` AND `package.json` → maintenance burden.

3. **turbo.json is minimalist**: Only `build`, `test`, `lint`, `format`, `type-check`, `dev`, `clean`. No custom pipeline optimization, no output caching strategy, no dependency graph awareness beyond `^build`.

4. **`.mekong/` metadata sprawl**: 12+ apps have `.mekong/company.json` planning artifacts — these provide no runtime value but consume dev attention.

5. **`apps/web` is broken**: Has `next-env.d.ts` (proving Next.js was intended) but no `package.json`, no `next.config.*`, no `tsconfig.json`. Cannot build.

6. **pnpm catalog duplication**: 100+ dependency pins duplicated in both `pnpm-workspace.yaml` and `package.json` — these should live in one place.

---

## 5. Mekong vs Non-Mekong Apps

### Mekong-branded apps (17)
`admin`, `agencyos-landing`, `agencyos-web`, `agi-sops`, `algo-trader`, `algo-trader-remote`, `api`, `dashboard`, `digital`, `docs`, `engine`, `ide`, `landing`, `mekonmind-landing`, `web`, `openclaw-worker`, `raas-demo`, `raas-gateway`, `raas-gateway-cli`, `raas-landing`, `roi-calculator`, `saas-dashboard`, `well`

### Mekong empty stubs (4)
`analytics`, `tasks`, `worker`, `developers` — `.mekong/` files only, no real code

### Mekong orphaned build (1)
`crm` — dist/ output exists, source does not

### Non-Mekong apps (11)
| App | Real? | Notes |
|-----|-------|-------|
| `anima119` | Yes | Separate project (docs, src, supabase) |
| `antigravity-cli` | Yes | Separate CLI tool (api, backend, mobile) |
| `apex-os` | Yes | Separate OS project (apps, assets, packages) |
| `com-anh-duong-10x` | Minimal | `images/`, `infrastructure/`, `plans/` — mostly planning |
| `gemini-proxy-clone` | Minimal | `plans/` only — planning artifact |
| `nhipdieuxanh` | Yes | Full project (src, prisma, api, supabase) |
| `nhipdieuxanh-landing` | Migrated | `apps`, `plans`, `public` — landing page |
| `nhipdieuxanh-orchestrator` | Yes | Full orchestrator (src, plans, tests) |
| `sa-dec-flower-hunt` | Yes | Full project (images, infrastructure, plans) |
| `vibe-coding-cafe` | Minimal | `plans/` only |
| `starter-template` | Minimal | Empty dir |

**Total waste**: ~6 empty/planning-only apps could be removed. ~3 landing pages could be consolidated. Removing non-Mekong projects would shrink the workspace by ~28% but that's a policy decision, not a technical one.

---

## Recommendations (ordered by impact)

1. **IMMEDIATE**: Give `apps/web`, `apps/landing`, `apps/mekonmind-landing` proper `package.json` files or move them outside `apps/*` workspace glob
2. **MERGE**: Combine `apps/mekonmind-landing` + `apps/landing` into a single static site (decide on ONE brand: "MekongMind API" vs "Mekong IDE AI OS")
3. **DELETE**: `apps/analytics`, `apps/tasks`, `apps/developers` — empty stubs
4. **INVESTIGATE**: `apps/crm` — orphaned build artifacts, source is gone; either revive or delete
5. **CONSIDER**: Extract non-Mekong apps (`anima119`, `antigravity-cli`, `apex-os`, etc.) into separate repos — they bring no value to this monorepo and add noise
6. **FIX**: Deduplicate workspace config — keep patterns in `pnpm-workspace.yaml` only, remove from `package.json`
7. **EVALUATE**: Whether `apps/web` (broken Next.js stub) should be revived as the actual dashboard or deleted

---

## Unresolved Questions

- Why does `apps/crm` have built `dist/` but no source? Was it deleted intentionally?
- Is `apps/well` still active? It has the most deployment configs (3 platforms) and a full codebase — worth keeping or pruning?
- Which brand direction wins — "MekongMind" (model router) or "Mekong IDE" (business AI OS)? This decides which landing page survives.
- Who owns each of the 11 non-Mekong apps? Are they experiments or active projects?
