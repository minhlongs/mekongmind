# Cook Plan - FnB-Container-Caffe UI Overhaul (Bazi-Aura)
> ck:cook + ck:team | mode: auto | goal-id: goal_47d8052641a5
> Created: 2026-06-02T07:26Z | Author: Claude Opus 4.7 / me-deep-wrapper

## Goal
Deep-check, refactor and synchronize the F&B Container Caffe UI/UX to align with the Bazi-aligned Aura Cafe concept:
- 11 HTML pages share ONE theme engine.
- Day mode: Pearl-Silver & Jade (06:00-18:00).
- Night mode: Deep-Sea Navy & Chrome (18:00-06:00).
- Instant JS engine (no FOVT / flash of unstyled theme).
- 560 Jest tests green.
- Vite build clean (0 errors).

## Baseline
- Static site (vanilla JS + Vite + Cloudflare Worker).
- `js/theme.js` already exists (localStorage-only, naive toggle).
- `js/shared-nav.js` exists (navbar + footer, theme toggle).
- `css/styles.css` + 14 extra CSS modules.
- `worker/` (Cloudflare) excluded from cook scope unless needed.
- ORIGINAL_REQUEST.md 464 lines = detailed acceptance criteria.

## Phases (ck:team parallel)
Phase 1: INTENT / PLAN (this doc)
Phase 2: THEME ENGINE (3 parallel subagents)
  - P2-A `js/theme.js` instant day/night engine (system-hour + localStorage, no FOVT).
  - P2-B CSS tokens: Pearl-Silver/Jade (day) vs Deep-Sea Navy/Chrome (night) in `css/styles.css` + extra CSS modules.
  - P2-C `js/shared-nav.js` react to theme on <html> load, preserve manual toggle across pages.
Phase 3: VALIDATE
  - `npm test` (target 560 green).
  - `npm run build` (Vite clean).
  - Page load FOVT check via grep for inline style blockers.
Phase 4: GATE / REPORT
  - Evidence under `state/gates/goal-47d8052641a5-*.json` and `state/revenue/...`.
