---
title: "Phase 2: Cleanup — .env.example + Stale Goals + Old References"
description: "Clean .env.example references to agencyos.network, remove stale nhipdieuxanh-agent goals, fix any remaining old brand references"
status: pending
priority: P1
effort: 30-45m
tags: [cleanup, env, goals, branding]
---

# Phase 2: Cleanup

## Context

The overhaul completed the major structural cleanup, but some artifact-level cleanup remains:
- `.env.example` still references "Mekong CLI v5.0" header and `agencyos.network` URLs
- 3 stale goals from `nhipdieuxanh-agent` project remain in `~/.config/opencode/goals/active/`
- Some config files may still reference old patterns

## Task 2.1: Clean `.env.example`

**File:** `/Users/macbook/mekongmind/.env.example` (171 lines)

**Changes needed:**

| # | Line(s) | Current | Replace with |
|---|---------|---------|--------------|
| 1 | 1-3 | `# Mekong CLI v5.0 — Environment Configuration` | `# MekongMind — Environment Configuration` |
| 2 | 47-48 | `POLAR_SUCCESS_URL=https://agencyos.network/success` | `POLAR_SUCCESS_URL=https://mekongmind.com/success` |
| 3 | 48 | `POLAR_CANCEL_URL=https://agencyos.network/pricing` | `POLAR_CANCEL_URL=https://mekongmind.com/pricing` |
| 4 | 99-100 | `# RaaS landing URL (default: https://agencyos.network)` / `RAAS_URL=https://agencyos.network` | `# RaaS landing URL (default: https://mekongmind.com)` / `RAAS_URL=https://mekongmind.com` |
| 5 | 55-57 | Comment mentions `polar.sh/mekong-cli/checkout` | Optionally update product URLs if migrated |

**Note:** Keep POLAR_* structure intact — only change URL values from agencyos.network to mekongmind.com. The `agencyos.network` domain may still be valid as a redirect — verify before changing or use mekongmind.com as the canonical URL.

## Task 2.2: Remove Stale Goals

**Directory:** `~/.config/opencode/goals/active/`

**Stale goals (nhipdieuxanh-agent, not mekongmind):**

| File | Reason to Remove |
|------|-----------------|
| `goal_20260521_111235.json` | nhipdieuxanh-agent project goal (docs backfill for different repo) |
| `goal_20260521_183000.json` | nhipdieuxanh-agent project goal (autonomous parallel mode) |
| `goal_20260522_044035.json` | nhipdieuxanh-agent daily status goal |

**Keep (mekongmind-relevant):**

| File | Reason to Keep |
|------|---------------|
| `goal_20260529_152734.json` | MekongMind overhaul active goal (in_progress) |
| `goal_20260529_180842.json` | MekongMind codebase review goal (pending) |

**Recommendation:** Archive rather than delete. Move to `~/.config/opencode/goals/archived/` if that directory exists, or simply delete. These are 3 goals from a completely different project (`nhipdieuxanh-agent`).

## Task 2.3 (Optional): Scan for Remaining Old Brand References

**Files to scan:**
- `Makefile` — check for agencyos references
- `.github/workflows/*.yml` — check for old domain references
- `apps/*/wrangler.toml` — check for old project names
- `docs/**/*.md` — quick grep for `agencyos.network` references

**Command:**
```bash
grep -rn "agencyos\.network\|AgencyOS\|v5\.0" --include="*.md" --include="*.yml" --include="*.toml" . | grep -v node_modules | grep -v archive/
```

## Implementation Steps

1. Edit `.env.example` — replace header and 4 agencyos.network URLs
2. Remove 3 stale goal files from `~/.config/opencode/goals/active/`
3. Optional: Scan for remaining old references, fix if found

## Success Criteria

- [ ] `.env.example` header reads "MekongMind" not "Mekong CLI v5.0"
- [ ] No `agencyos.network` URLs in `.env.example`
- [ ] 3 stale nhipdieuxanh-agent goals removed from active goals
- [ ] No broken config from goal removal

## Files to Modify

| Action | Path | Type |
|--------|------|------|
| Edit | `/Users/macbook/mekongmind/.env.example` | Text edits (5 changes) |
| Delete | `~/.config/opencode/goals/active/goal_20260521_111235.json` | File delete |
| Delete | `~/.config/opencode/goals/active/goal_20260521_183000.json` | File delete |
| Delete | `~/.config/opencode/goals/active/goal_20260522_044035.json` | File delete |
