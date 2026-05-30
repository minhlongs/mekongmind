# Roadmap Validation Report — MekongMind

**Date:** 2026-05-29
**Scope:** `plans/`, `tasks/`, `docs/`, active goals, codebase reconciliation
**Author:** Researcher Agent

---

## Executive Summary

Plans and tasks were **all created today** (2026-05-29) — they are aspirational blueprints, not actionable backlog items. The company blueprint describes a pre-ship "Zero→PSF" startup, yet the codebase is a mature monorepo (41 apps, 59 packages, ~30K+ lines of docs). Major disconnect: **plans describe what should be built; codebase is already built.** The 3 active OpenCode goals target a different project (nhipdieuxanh-agent). Docs are bloated, partially outdated, and reference non-existent directory structures.

---

## Key Findings

### 1. Plan Freshness: All Plans Are Hours Old

| Plan | Created | Commits since | Verdict |
|------|---------|--------------|---------|
| `company-blueprint/plan.md` | 2026-05-29 (1 commit) | 0 | Fresh but untested |
| `marketing/*` (6 files) | 2026-05-29 (1 commit) | 0 | Fresh but untested |
| `tasks/*` (5 files) | 2026-05-29 (1 commit) | 0 | Fresh but untested |

Total git history: 10 commits. The plans directory has **zero update history** — no iteration, no execution tracking.

### 2. Marketing/GTM Strategy: Aspirational, Not Operational

- **Branding mismatch:** Strategy positions "MekongMind" as product, but the actual landing page (`agencyos-landing`) brands as "AgencyOS" — different name, different messaging.
- **No waitlist exists** — `find . -name "*waitlist*"` returns nothing. Yet plan assumes 500 CLI installs Month 1.
- **No pricing page**, no Promotional/sales pipeline implemented.
- **Marketing content** = 1 file (`linkedin_posts.md`) + 1 file (`discount_codes.md`). 0 posts published, 0 campaigns launched.
- **GitHub repo is NOT public** — zero stars, zero open-source community. GTM channels (GitHub OSS, Hacker News, Product Hunt) are pre-launch.
- **Realistic assessment:** Plans are aspirational docs, not executed strategy. Current GTM readiness = 5%.

### 3. Tasks: Missing Status & Ownership

All 5 `HIGH_mission_*.txt` files:
- **No completion markers** — no checkboxes, no status fields, no dates
- **No assignees** — field says "ASSIGNEE: CEO Agent" but this is a role label, not an actionable assignment
- **No subtasks completed** — tasks list 3-4 items each, zero progress tracking
- **Example gap:** "Deploy Astro landing page to Cloudflare" — the landing page is Vite+React, not Astro. Deployment config and wrangler setup are inconsistent with actual code.

Tasks are **mission statements, not project management artifacts.**

### 4. Active Goals: All Misdirected

| Goal | Project | Relevance to MekongMind |
|------|---------|------------------------|
| `goal_20260521_111235` | nhipdieuxanh-agent | **Zero** — different repo, different stack |
| `goal_20260521_183000` | nhipdieuxanh-agent | **Zero** — Vietnamese real estate sales agent |
| `goal_20260522_044035` | daily ops report | **Zero** — generic daily standup |

**None of the 3 active goals are relevant to mekongmind.** They were inherited from parent config.

### 5. Plans vs Codebase: Critical Structural Mismatches

| What Plans Say | What Codebase Actually Is | Gap SeverITY |
|----------------|--------------------------|-------------|
| "Pre-seed, zero revenue" | 41 apps, 59 packages, 7 CLI commands | **HIGH** — stage mismatch |
| "Need SQLite MVP" | `cli/src/` has full Python package with 25+ submodules | **HIGH** — MVP already built |
| "Need multi-provider routing" | Already in `cli/src/core/llm_client.py` | **MEDIUM** — already done |
| `src/core/`, `src/agents/`, `seed/` paths | These **do not exist**. Real path: `cli/src/core/` | **HIGH** — docs reference phantom structure |
| "Need CLI" | `cli/` directory is fully implemented | **MEDIUM** — unclear what needs building |
| "Zero→PSF stage" | Actual codebase is Seed→Tree→Forest→Land architecture | **HIGH** — phase mismatch |

### 6. Docs Audit: Bloated & Partially Stale

- **docs/mekong-cli/**: 95+ files, ~31K total lines — largest content in the repo
- Refers to `seed/`, `src/core/`, `src/agents/` — **none exist** in current tree
- Deployment guide references `api.mekongmind.com`, `app.mekongmind.com` — these may not be live (no Cloudflare deployment verified)
- Many files inherited from `longtho638-jpg/mekong-cli` upstream — not curated for this repo
- **No root README.md** — entry point for new developers/agents is missing
- **No llms.txt** — despite being called out in SEO plans
- **Wireframe/ dirs** contain static HTML, not integrated into app

### 7. Marketing Deliverables Verification

| Planned (in marketing plans) | Actual Status |
|------------------------------|--------------|
| Waitlist form | ❌ Not created |
| Product Hunt assets | ❌ Not created |
| LinkedIn posts | ⚠️ 1 draft post in `marketing/content/posts/` |
| Pricing page | ❌ Not created |
| GitHub stars | ❌ No public repo |
| llms.txt | ❌ Not present |

---

## What's Outdated

1. **All docs/ referencing `src/`, `seed/`, `src/core/`** — need path updates to `cli/src/`
2. **Deployment guide** — deployment URLs unverified; Cloudflare projects may not exist
3. **Company blueprint stage** — says "Zero→PSF" but actual codebase is post-MVP
4. **codebase-summary.md** — describes old structure, doesn't match current monorepo layout
5. **Marketing plans** — assume public GitHub presence; repo is private

## What's Actionable

| Action | Priority | Owner |
|--------|----------|-------|
| **Update stage detection** from "Zero→PSF" to "MVP built, pre-GTM launch" | P0 | Founder |
| **Add README.md** to root — entry point for all agents/humans | P0 | Dev |
| **Align goals** — add mekongmind-specific active goal; clean unrelated goals | P0 | Lead |
| **Create task tracking system** — add status, assignees, completeness to tasks/ | P0 | PM |
| **Cull stale docs** — remove or archive 30+ inherited docs from old CLI | P1 | Docs |
| **Resolve brand** — MekongMind vs AgencyOS naming conflict | P1 | Founder |
| **Build waitlist** — before GTM plans make sense | P1 | Dev |
| **Update codebase-summary.md** to match real `cli/src/` tree | P1 | Docs |
| **Convert tasks to executable format** (checklists, dependencies, priorities) | P2 | PM |
| **Publish GitHub repo or acknowledge it's private** in plans | P2 | Founder |

---

## Recommendations

1. **Acknowledge the real stage.** This is not Zero→PSF. The MVP exists. The repo has ~3MB of code across 90+ modules. Plans should reflect a **pre-GTM launch** stage with existing product.
2. **Resolve brand identity.** Two names (MekongMind, AgencyOS) create confusion. The landing page says AgencyOS; the blueprint says MekongMind. Pick one.
3. **Create a mekongmind-specific goal** via OpenCode. The 3 active goals are irrelevant.
4. **Build the waitlist first.** GTM strategy without capture mechanism is fictional.
5. **Prune docs.** Inherited mekong-cli docs are overwhelming (31K lines). Keep only what matches current structure. Archive the rest.
6. **Add README.md** — critical gap for developer/agent onboarding.

**Unresolved question:** Is "MekongMind" the same project as "AgencyOS" (the landing page brand), or are these different products? This needs founder clarification before any planning makes sense.
