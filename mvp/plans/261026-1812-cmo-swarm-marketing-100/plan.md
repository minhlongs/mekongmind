---
title: "CMO Swarm 4-Pillar Marketing & Growth Engine (100% Full Business Logic)"
status: completed
branch: feat/cmo-swarm-marketing-100
date: 2026-10-26
---

# Plan: CMO Swarm 4-Pillar Marketing & Growth Engine

## Objective
Activate 100% full business operations for `/cmo` of Mekong CLI Kit and the Marketing Team across `mekong-cli` and `mekongmind/mvp`, replacing all stubs in `src/commercial/marketing.py` and `src/commercial/growth.py`, wiring the 4-Pillar CMO Swarm (`cmo-run` & `outreach`), generating the 14-field SOP `repeatable-channel.json` artifact, and upgrading the UI surfaces to interactive OPC 2027 standard.

## Phases
- **Phase 1 (mekong-cli Core & Commercial Layer)**:
  - Upgrade `src/core/marketing_engine.py` with `outreach_leads` SQLite table, ICP qualification scoring, `run_outreach()`, and `run_cmo_swarm()` (producing the 14-field `repeatable-channel.json` contract).
  - Replace `"stub": True` in `src/commercial/marketing.py` and `src/commercial/growth.py` with real `MarketingEngine` backed implementations.
  - Add `outreach` and `cmo-run` subcommands to `src/cli/commands/marketing_command.py` and enhance `src/cli/csuite_commands.py` (`_run_cmo`).
- **Phase 2 (Dashboard Content Factory & MVP Marketing Cockpit)**:
  - Upgrade `apps/dashboard/app/dashboard/content/page.tsx` in `mekong-cli` to an interactive CMO Swarm & Content Factory (live bilingual VN/EN copy generation, SEO audit preview, SDR outreach scoring, and 30-day calendar filter).
  - Add `/cmo` interactive CMO Swarm & Growth Marketing Cockpit route (`src/app/(landing)/cmo/page.tsx`) and navigation link in `mekongmind/mvp`.
- **Phase 3 (Tests, Verification & Ship)**:
  - Add unit and integration tests for `src/commercial/marketing.py`, `src/commercial/growth.py`, `MarketingEngine.run_cmo_swarm()`, and `mvp` CMO page.
  - Run `pytest`, `npm test`, `npm run build`, open PRs, merge, and deploy to Cloudflare Pages.

## Acceptance Criteria
- [x] Zero `"stub": True` in `src/commercial/marketing.py` and `src/commercial/growth.py`.
- [x] `repeatable-channel.json` generated with all 14 SOP required fields (`audience`, `positioning`, `channel`, `campaign`, `campaign_asset`, `email_sequence`, `outreach_log`, `cta`, `qualification_rule`, `opt_out_compliance`, `leads`, `conversion`, `learning`, `sales_handoff`).
- [x] `mekong marketing cmo-run`, `mekong marketing outreach`, and `mekong cmo` execute end-to-end with SQLite persistence.
- [x] Interactive CMO Swarm UI in `mekong-cli/apps/dashboard` and `mekongmind/mvp`.
- [x] All tests and production builds pass with 0 errors.
