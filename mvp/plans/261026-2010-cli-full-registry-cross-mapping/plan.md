# Plan: Full 100% Mekong CLI Registry (194+ Command Groups) & 10-Department Cross-Mapping UI/UX

- **Status**: validated
- **Branch**: `feat/cli-full-registry-cross-mapping`
- **Route**: `feature`
- **Ship Mode**: `official`

## 1. Objective
Upgrade `https://www.mekongmind.com/cli` (`mvp/src/app/(landing)/cli/page.tsx`) to display 100% of the Mekong CLI ecosystem (194+ command groups & registered commands from `mekong-cli/src/cli/app_setup.py`), paired with an interactive 4-Tier UI/UX Architecture Explorer that cross-maps every command across **6 Operating Layers (`L0`–`L5`)**, **10 Departments (`agents/registry.json`)**, **4 Operational Clusters**, **58 Unified Agents**, **4-Step SOP Chains**, and **SHA-256 Evidence Gates**.

## 2. Phases & File Ownership
- **Phase 1 — Data Layer (`mvp/src/data/cli-full-registry.ts`)**:
  - Export typed definitions for 6 Operating Layers (`L0`–`L5`), 10 Departments (`ceo-command` through `knowledge-memory`), 4 Clusters (`csuite`, `sdlc`, `bizops`, `vn_statutory`), and all 194+ command entries extracted from `mekong-cli/src/cli/app_setup.py`.
- **Phase 2 — Interactive 4-Tier UI (`mvp/src/app/(landing)/cli/page.tsx`)**:
  - Tier 1: Interactive 6 Operating Layers (`L0`–`L5`) & Revenue Ladder Architecture Pipeline.
  - Tier 2: Interactive 2D Cross-Mapping Matrix (`10 Departments × 4 Business Clusters`).
  - Tier 3: Live Command-to-Gate Inspector (`Command -> Agent -> Department -> SOP Chain -> Evidence Gate`) + Live Terminal Simulator.
  - Tier 4: Full 194+ Command Registry Explorer with 0ms instant search (English commands, Vietnamese aliases, statutes, agents, departments).
- **Phase 3 — Verification & Unit Tests (`mvp/src/__tests__/cli-full-registry.test.ts`)**:
  - Verify >= 189 commands, all 10 departments populated, all 6 layers populated, all 4 clusters populated, and zero orphan commands (`No command is naked` invariant).
  - Run `npm test` and `npm run build`.

## 3. Acceptance Criteria
- [x] `mvp/src/data/cli-full-registry.ts` contains >= 189 command groups matching `mekong-cli/src/cli/app_setup.py`.
- [x] Every command entry maps to a valid department (`1..10`), layer (`L0..L5`), cluster (`csuite | sdlc | bizops | vn_statutory`), owner agent, 4-step SOP chain, and gate artifact (`state/evidence/*.json`).
- [x] `mvp/src/app/(landing)/cli/page.tsx` renders all 4 interactive tiers with 0 TypeScript `:any` types.
- [x] `npm test` and `npm run build` pass with 0 errors.
