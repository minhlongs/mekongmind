---
title: "Mekong CLI 3-Pane Sovereign Workbench (#servo Visual Pinout & 10x4 Radar Redesign)"
status: in_progress
branch: feat/cli-workbench-servo
created_at: 2026-10-27
---

# Plan: Mekong CLI 3-Pane Sovereign Workbench (#servo Visual Pinout & 10x4 Radar Redesign)

## 1. Objective
Redesign `https://www.mekongmind.com/cli` (`mvp/src/app/(landing)/cli/page.tsx`) from a 4-tier vertical wall of text into a focused, single-screen **3-Pane Sovereign Workbench** inspired by `https://learn-arduino-red.vercel.app/#servo`, cutting ~80% of repetitive card text while preserving all 197 commands, 0ms search, numbered pagination, and the core invariant (`Command -> Owner Agent -> Department (L0–L5) -> SOP Chain -> SHA-256 Evidence Gate`).

## 2. Acceptance Criteria
1. **3-Pane Workbench Shell**: Desktop renders a 12-column split workbench (`lg:grid-cols-12`: Left Dock = 3 cols, Center Visual Stage = 5 cols, Right Inspector Tabs = 4 cols) that cleanly stacks to `grid-cols-1` on mobile.
2. **Left Dock (`#command-registry-explorer`)**: Displays compact 1-line command items (`#id` + command + layer badge), instant 0ms search across all 197 commands, cluster filter pills (`All`, `A. C-Suite`, `B. SDLC`, `C. BizOps`, `D. VN 130+`), L0–L5 layer pills, page-size selector (`PAGE_SIZE_OPTIONS: PageSizeOption[] = [12, 24, 48, 'all']`), and top/bottom numbered pagination (`BOTTOM NUMBERED PAGINATION BAR`).
3. **Center Visual Stage (5-Pin IC Circuit + 10×4 Radar Matrix)**:
   - Renders an interactive SVG **5-Pin Sovereign IC Circuit Board** for the active `inspectedCommand` (`PIN 1` CLI Input -> `IC #<id>` -> `PIN 2` Owner & Support Agents -> `PIN 3` L0–L5 Department -> `PIN 4` 4-Step SOP LED Chain -> `PIN 5` SHA-256 Gate Artifact).
   - Includes a `▶ Run Simulation` button that triggers a sequential animated signal pulse across PIN 1 -> PIN 5 and switches/syncs the terminal trace.
   - Includes a compact **10 Departments × 4 Business Clusters Radar Matrix** below the circuit board that highlights the active command's coordinate cell and lets the user click any cell or department row to filter and inspect its command.
4. **Right Inspector Pane (4 Focused Tabs)**: Replaces the simultaneous text blocks with 4 clean tabs (`Overview` | `Pinout` | `Simulator` | `Specs`) showing 100% of the active command's metadata, aliases, SOP steps, and simulated terminal output with copy buttons.
5. **URL Hash Deep-Linking**: Selecting a command updates `window.location.hash` (`#<id>`, e.g. `/cli#cfo`, `/cli#thue`), and loading `/cli#<id>` or firing `hashchange` automatically selects that command.
6. **Zero Regressions**: `npm run build` in `mvp/` passes with 0 errors (zero `any` types), and `pytest tests/test_cli_full_registry_cross_mapping.py` passes all tests.

## 3. Implementation Steps
- **Phase 1 (State, Deep-Linking & Simulation Hookup)**: Extend `mvp/src/app/(landing)/cli/page.tsx` with `activeTab` (`'overview' | 'pinout' | 'simulator' | 'specs'`), `simStep` (`0..5` for animated 5-pin signal pulse), and `useEffect` syncing `window.location.hash` <-> `inspectedCommand`.
- **Phase 2 (3-Pane Sovereign Workbench UI)**: Replace the 4 vertical tiers in `mvp/src/app/(landing)/cli/page.tsx` with the compact top header bar + `lg:grid-cols-12` 3-pane workbench (Left Compact Dock with numbered pagination, Center SVG 5-Pin Circuit Board + 10×4 Radar Matrix, Right 4-Tab Inspector).
- **Phase 3 (Tests & Build Verification)**: Add workbench, 5-pin circuit, 4-tab, and hash deep-link assertions to `tests/test_cli_full_registry_cross_mapping.py`, run `npm run build` and `pytest`, ship PR, merge, and deploy to Cloudflare Pages.
