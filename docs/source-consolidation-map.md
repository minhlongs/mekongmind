# Source Consolidation Map
*Generated: 2026-05-31 | Phase 2 verified 2026-07-07 | Status: draft — pending dry-run gate*

## Contract
`source path → target path → import method → conflict resolution → verification command`

---

## 1. `~/mekong-cli` → Target (Reconcile)

This is the flagship old monorepo. Contains the widest surface. Strategy: **diff-first, import-by-decision**.

| Source Path | Target Path | Import Method | Conflict Resolution |
|---|---|---|---|
| `apps/admin` | `apps/admin` (exists) | Merge unique routes/files | Keep target; import missing screens from mekong-cli |
| `apps/agencyos-web` | `apps/agencyos-web` (exists) | Merge unique pages | Keep target; diff via `diff -rq` |
| `apps/agi-sops`, `apps/antigravity-cli`, `apps/apex-os`, `apps/com-anh-duong-10x`, `apps/nhipdieuxanh*`, `apps/raas-demo`, `apps/raas-landing`, `apps/landing`, `apps/docs`, `apps/worker`, `apps/web`, `apps/api`, `apps/dashboard`, `apps/tasks` | `apps/<same-name>` (mostly exist) | Merge unique | Target wins; import missing only |
| `apps/engine` | `engine/` (exists) | **Do NOT copy; use `mekong-ide-core` diff instead** | See section 3 |
| `apps/ide-ui` | `apps/ide/*` (merge) | Merge into existing `apps/ide` | See section 5 |
| `cli/` (Python CLI source) | `cli/` (exists) | Merge unique commands | Target wins; cherry-pick missing modules |
| `packages/mekong-cli-core` | `packages/mekong-cli-core` (exists) | Keep target as canonical | Reconcile via git diff |
| `packages/openclaw-engine` | `packages/openclaw-engine` (exists) | Keep target; reduce bridge debt | See section 4 |
| `packages/mekong-engine`, `packages/rd-engine` | `engine/` (Go/Rust) | **Do NOT copy; see section 3** | See section 3 |
| `packages/mekong-sdk`, `packages/sdk`, `packages/shared`, `packages/tokens`, `packages/tooling` | `packages/*` (merge) | Import unique modules | Dedup by name; target wins on collision |
| `packages/vibe-*`, `packages/trading-core`, `packages/raas-*`, `packages/license-sdk`, `packages/billing` | `packages/<same-name>` (merge or import) | Merge or import if missing | Target wins; track new packages |
| `docs/` (82 dirs) | `docs/` (merge) | Import unique docs | No overwrite; merge subdirs |
| `plans/` | `plans/` (merge) | Import unique plans | No overwrite |

**Verification gate (mekong-cli):**
```bash
diff -rq ~/mekong-cli/apps/ /Users/macbook/mekongmind/apps/ 2>/dev/null | head -50
diff -rq ~/mekong-cli/packages/ /Users/macbook/mekongmind/packages/ 2>/dev/null | head -50
diff -rq ~/mekong-cli/cli/src/ /Users/macbook/mekongmind/cli/src/ 2>/dev/null | head -30
```

---

## 2. `~/mekong-digital` → Target (Import Subset)

Web/templates repo. Strategy: **docs/templates only**.

| Source Path | Target Path | Import Method | Conflict Resolution |
|---|---|---|---|
| `apps/` | `apps/digital/*` (new dirs) | Copy missing app dirs | No collision expected |
| `docs/` | `docs/digital-archive/` | Copy docs to archive | Preserve originals |
| `workers/` | `apps/digital/workers/` | Copy if missing | Target wins on name collision |

**Verification gate (mekong-digital):**
```bash
diff -rq ~/mekong-digital/apps/ /Users/macbook/mekongmind/apps/digital/ 2>/dev/null
diff -rq ~/mekong-digital/docs/ /Users/macbook/mekongmind/docs/digital-archive/ 2>/dev/null
```

---

## 3. `~/mekong-ide-core` vs `~/mekong-cli/apps/engine` vs `engine/` (Diff-First)

Three engine sources. **Do NOT merge blindly.** Canonical target is `engine/`. Strategy: diff and cherry-pick only missing code.

| Source | Path | Verdict |
|---|---|---|
| Target | `/Users/macbook/mekongmind/engine/` | Canonical |
| mekong-ide-core | `cmd/`, `engine-farm/`, `internal/`, `orchestrator/` | Diff vs target; import missing |
| mekong-cli | `apps/engine/` | Likely superseded by mekong-ide-core + target |
| mekong-ide | `packages/ide/*` | SDK pieces, not engine |

**Verification gate (engine):**
```bash
diff -rq ~/mekong-ide-core/cmd/ /Users/macbook/mekongmind/engine/cmd/ 2>/dev/null
diff -rq ~/mekong-ide-core/internal/ /Users/macbook/mekongmind/engine/internal/ 2>/dev/null
```

---

## 4. `~/projects/openclaw` → Adapter Contract

Upstream OpenClaw. Strategy: **adapter-only**, no vendoring.

| Source Surface | Target Path | Role |
|---|---|---|
| `apps/*` runtime logic | `packages/openclaw-engine/src/` | Import SDK interfaces only |
| Mission definitions | `apps/openclaw-worker/missions/` | Adapter wrappers |
| Config patterns | `packages/openclaw-engine/src/config/` | Config adapter |
| `AGENTS.md`, `README.md` | `docs/openclaw-adapter.md` | Documentation |

**Current boundary debt:** `packages/openclaw-engine/src/_bridge/*` → `apps/openclaw-worker/lib/*`  
**Fix:** Extract shared interfaces to `packages/openclaw-engine/src/shared/`; remove `_bridge` proxies.

**Verification gate (OpenClaw):**
```bash
ls packages/openclaw-engine/src/  # verify no _bridge/ remains after fix
diff -rq ~/projects/openclaw/apps/ /Users/macbook/mekongmind/apps/openclaw-worker/ 2>/dev/null
```

---

## 5. `~/mekong-ide` → Merge Into Existing

| Source | Target | Import Method |
|---|---|---|
| `packages/ai-os`, `packages/function`, `packages/plugin`, `packages/script` | `packages/ide/<name>/` (new) | Copy if missing |
| `packages/sdk`, `packages/console`, `packages/desktop`, `packages/desktop-electron` | `packages/ide/<name>/` or merge with existing | Merge or create new |
| `packages/identity`, `packages/opencode`, `packages/model-orchestrator` | `packages/ide/<name>/` | Copy unique |
| `packages/docs`, `packages/storybook`, `packages/ui`, `packages/web` | `packages/ide/<name>/` or merge with existing | Merge or dedup |
| `packages/app`, `packages/containers`, `packages/enterprise`, `packages/extensions`, `packages/mekong-commands`, `packages/slack`, `packages/util` | `packages/ide/<name>/` (new) | Copy if missing |

**Workspace update required:** `pnpm-workspace.yaml` already has `apps/ide/*`, `packages/ide/*`, `packages/ide/sdk/js`, `packages/ide/console/*`. Verify patterns match.

**Verification gate (mekong-ide):**
```bash
ls packages/ide/  # confirm workspace patterns match
# micracode/micracode-core verification: diff -rq ~/mekong-ide/packages/micracode ~/mekong-ide/packages/micracode-core /Users/macbook/mekongmind/packages/ide/ 2>/dev/null
```

---

## 6. `~/mekong-foundation` → Archive-If-Useful

| Source | Target | Import Method |
|---|---|---|
| `src/`, `tests/` | `cli/foundation/` (new) | Copy if unique content exists |
| `pyproject.toml` | `cli/pyproject.toml` (merge deps) | Merge if needed |
| `CLAUDE.md` | `cli/CLAUDE.md` (merge) | Append unique sections |

**NOTE:** `cli/foundation/` does NOT exist in target. Import deferred.

**Verification gate (mekong-foundation):**

---

## 7. `~/mekong` (No Git) → Manual Inspect

Small source, no git marker. Strategy: manual content review, import unique docs/code only.

| Source | Target | Import Method |
|---|---|---|
| `docs/` | `docs/mekong-archive/` | Copy unique docs |
| `src/` | Inspect; merge if unique | Import unique only |

**Verification gate (mekong):**
```bash
find ~/mekong -maxdepth 2 -type f -name "*.py" -o -name "*.ts" -o -name "*.md" 2>/dev/null
```

---

## 8. `cli/src/core/` + `~/.cheetahclaws/` → CheetahClaws Adapter (VERIFIED EXISTS)

**VERIFIED 2026-07-07:** CheetahClaws adapter is fully implemented inline in target. No external `~/.cheetahclaws-src` repo exists or is needed.

| Component | Path | Status |
|---|---|---|
| Adapter | `cli/src/core/cheetahclaws_adapter.py` | 263 lines, `CheetahClawsAdapter` class with JSON-RPC over Unix socket |
| Bridges | `cli/src/core/bridges/__init__.py` | Exports `CheetahClawsAdapter`, boundary rule enforced |
| Daemon runtime | `~/.cheetahclaws/` | sessions.db, skills, config.json present |
| CLI binary | `/Users/macbook/.local/bin/cheetahclaws` | Installed |

**Source strategy:** Adapter was built inline during mekong-cli era. Daemon is a separate runtime (`cheetahclaws serve`), not imported as code. MekongMind communicates via JSON-RPC over Unix socket at `~/.cheetahclaws/run/daemon.sock`.

**Phase 2 plan was wrong:** Section 8 originally referenced `~/.cheetahclaws-src` as a source repo. That path never existed. The adapter code was always in `cli/src/core/`.

**Verification gate (CheetahClaws):**
```bash
ls -la cli/src/core/cheetahclaws_adapter.py     # must exist
ls -la cli/src/core/bridges/__init__.py         # must exist
ls -la ~/.cheetahclaws/run/daemon.sock          # daemon runtime (optional, requires serve running)
python3 -c "from cli.src.core.cheetahclaws_adapter import CheetahClawsAdapter; print('OK')"
```


## Exclusions (With Reason)

| Source Path | Excluded From | Reason |
|---|---|---|
| `~/mekong-cli/node_modules/` | All | Standard npm dir; never copy |
| `~/mekong-cli/out/` | All | Next.js build artifact; rebuild from source |
| `~/mekong-cli/.next/` | All | Build cache |
| `~/mekong-cli/.git/` | All | Separate VCS history; do not merge |
| `~/projects/openclaw/.git/` | All | Upstream; adapter only |
| `~/.cheetahclaws-src/.git/` (if exists) | All | Separate history |
| `~/mekong-digital/node_modules/` | All | Standard npm dir |
| `~/mekong-ide/node_modules/` | All | Standard npm dir |
| Target `out/`, `.next/`, `.turbo/`, `node_modules/.cache/` | All | Build artifacts (2828 dirty entries — preserve, don't revert) |

---

## Workspace Impact

`pnpm-workspace.yaml` already includes patterns for:
- `apps/*/`
- `apps/ide/*`
- `apps/digital/*`
- `packages/ide/*`, `packages/ide/sdk/js`, `packages/ide/console/*`
- `packages/*`
- `apps/algo-trader-remote/dashboard`

**No workspace changes needed** — patterns already cover all incoming paths.

---

## Boundary Fixes Required Before Import

1. **`packages/openclaw-engine/src/_bridge/` → remove proxies**  
   Extract shared interfaces to `packages/openclaw-engine/src/shared/`. Remove `_bridge/*`. Update `apps/openclaw-worker/lib/*` to import from `shared/` directly.

2. **Path references to `~/mekong-cli` in scripts**  
   Grep and update to relative paths or env vars.  
   ```bash
   grep -rn "~/mekong-cli" /Users/macbook/mekongmind/scripts/ /Users/macbook/mekongmind/cli/ 2>/dev/null
   ```

3. **Root `CLAUDE.md` missing**  
   Create root `CLAUDE.md` from consolidated project instructions after all imports complete.

---

## Unresolved Questions
- Q1: mekong-cli 151 dirty entries — preserve as-is, cherry-pick specific changes, or overwrite by target?
- Q2: mekong-ide-core 1 dirty entry — same engine as target `engine/` or complementary additions?
- Q3: ~/mekong (no git) — what unique content does it hold that target lacks?
- Q4: Should workspace add explicit `apps/digital/*` and `packages/ide/*` entries (already present)?
- Q5: OpenClaw adapter — which upstream interfaces are actually consumed by target today?

---

## Post-Cook Delta (Phase 5 — 2026-07-07)

Changes from May 31 baseline after Phase 1-5 execution:

### Packages Removed (8)
| Package | Reason |
|---|---|
| `billing` | Merged into `packages/mekong-cli-core` or deprecated |
| `sdk` | Consolidated into `packages/openclaw-engine` |
| `vibe-embedded-finance` | Deduped into `vibe-payment` |
| `vibe-payos-billing-types` | Deduped into `vibe-payment` |
| `vibe-stripe` | Deduped into `vibe-payment` |
| `vibe-subscription` | Deduped into `vibe-payment` |
| `vibe-supabase` | Deduped into existing Supabase integration |


**Verdict:** 49 packages remain. 8 packages consolidated/removed: `sdk`→OpenClaw engine, 5 vibe billing→`vibe-payment`, `vibe-supabase` deduped, `billing` merged.

### New Apps (1)
| App | Source |
|---|---|
| `apps/content-hub` | Added since May 31 (unknown origin; likely standalone) |

### mekong-ide CORRECTION
**Phase 2 report initially claimed `packages/ide/` does NOT exist.** CORRECTED: `packages/ide/` EXISTS with 23 packages confirmed on 2026-07-07. Source `~/mekong-ide/packages/` has 2 extra packages (`micracode`, `micracode-core`) not present in target.

### CheetahClaws CORRECTION
**Phase 2 plan referenced `~/.cheetahclaws-src` as a source path.** CORRECTED: `~/.cheetahclaws-src` does NOT exist anywhere on the filesystem. Phase 4 adapter verification confirms no Python adapter in `~/projects/openclaw` either. Section 8 is BLOCKED pending user decision.

### daemon-guardian.sh Fix
`apps/openclaw-worker/scripts/daemon-guardian.sh` had stale `~/mekong-cli` hardcoded path. FIXED 2026-07-07: resolved script-relative via `BASH_SOURCE[0]`. Verification: script resolves to `/Users/macbook/mekongmind/apps/openclaw-worker`.

### OpenClaw Mobile Apps NOTED (OUT OF SCOPE)
`~/projects/openclaw` contains `android/`, `ios/`, `macos/`, `macos-mlx-tts/` directories — NOT consolidated. These are separate native codebases, out of scope for MekongMind monorepo consolidation.

