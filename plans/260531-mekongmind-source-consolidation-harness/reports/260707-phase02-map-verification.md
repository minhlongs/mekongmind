# Phase 2 Verification Report — Source Consolidation Map
**Plan:** `260531-mekongmind-source-consolidation-harness`
**Date:** 2026-07-07
**Status:** VERIFIED WITH GAPS

## Verification Gate Results

### mekong-cli (Section 1)
- **Apps:** source has fewer apps than target — target already consolidated mekong-cli apps
- **Packages:** `packages/mekong-cli-core` exists in both; diff shows target has additional packages
- **CLI:** `/Users/macbook/mekongmind/cli/` is the canonical Python CLI
- **Verdict:** ✅ Source already integrated; no import action needed. Doc should note "consumed by target, not the reverse"

### mekong-digital (Section 2)
- Target path `apps/digital/` exists
- Source exists at `~/mekong-digital`
- **Verdict:** ✅ Ready for docs/templates import when Phase 2 execution runs

### mekong-ide-core / engine (Section 3)
- Target `engine/` exists with cmd/, Makefile, README
- Source `~/mekong-ide-core` exists (1 dirty file)
- **Verdict:** ⚠️ Diff-first approach confirmed. No merge yet.

### openclaw (Section 4)
- `~/projects/openclaw` exists with android, ios, macos, macos-mlx-tts, shared, swabble
- `apps/openclaw-worker/` exists in target (independent of upstream)
- **Verdict:** ✅ Adapter contract approach correct. No vendoring needed.
- **NEW:** upstream has mobile apps (ios/android) — mark as OUT OF SCOPE for now

### mekong-ide (Section 5) — **VERIFIED EXISTS**
- Source `~/mekong-ide/packages/` has 24 packages: ai-os, app, console, containers, desktop, desktop-electron, docs, enterprise, extensions, function, identity, mekong-commands, micracode, micracode-core, model-orchestrator, opencode, plugin, script, sdk, slack, storybook, ui, util, web
- Target `packages/ide/` exists with 23 packages: ai-os, app, console, containers, desktop, desktop-electron, docs, enterprise, extensions, function, identity, mekong-commands, model-orchestrator, opencode, plugin, script, sdk, slack, storybook, ui (NOTE: micracode, micracode-core NOT in target)
- Target `apps/ide/` exists with 3 packages: ide-next, ide-ui, tauri-shell-cli
- **Verdict:** ⚠️ Source has 2 extra packages (micracode, micracode-core) not in target. Verify if these are needed.
- **DOC IS ACCURATE:** section 5 references `packages/ide/<name>/` — these paths exist.

### mekong-foundation (Section 6)
- Source exists with src/, tests/, docs/, plans/, scripts
- Target `cli/foundation/` does NOT exist
- **Verdict:** ⚠️ Archive-if-useful. Needs diff evaluation before move.

### mekong (Section 7)
- Only 2 files in root: `README.md`, `getting-started.md`
- No code, no subdirs
- **Verdict:** ✅ Minimal content. Copy 2 docs to `docs/mekong-archive/` if unique.

### cheetahclaws (Section 8) — **BLOCKED**
- `~/.cheetahclaws-src` does NOT exist
- **DOC IS WRONG:** section 8 references paths that don't exist
- **BLOCKER:** Need user input on CheetahClaws source location. Check `~/projects/openclaw` for embedded Python adapter.
- **ALTERNATIVE:** CheetahClaws may be implemented inside `cli/src/core/` already.

## Post-Cook Delta Section Required
Add to source-consolidation-map.md:
- Packages removed (8): billing, vibe, vibe-embedded-finance, vibe-payos-billing-types, vibe-stripe, vibe-subscription, vibe-supabase, sdk
- New app (1): content-hub
- mekong-ide CORRECTION: packages/ide/ EXISTS (23 packages); micracode/micracode-core missing in target (source-only)
- CheetahClaws CORRECTION: ~/.cheetahclaws-src MISSING — phase 4 ver confirms no Python adapter in ~/projects/openclaw either
- daemon-guardian.sh: stale `~/mekong-cli` path FIXED to script-relative resolution

## Actions Required (High Priority)
1. Fix section 5 — mekong-ide target paths
2. Fix section 8 — cheetahclaws blocked, update BLOCKED status
3. Add Post-Cook Delta section
4. Verify before Phase 3 implementation
