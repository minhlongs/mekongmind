# Claude Handoff

## Run Command

```bash
/cook ./plans/260531-mekongmind-source-consolidation-harness/plan.md --auto
```

## Mission

Normalize `/Users/macbook/mekongmind` into the single canonical MekongMind repo and prepare the local-first harness runtime for OpenClaw + CheetahClaws operations.

## Hard Rules

- Work in `/Users/macbook/mekongmind`.
- Read `README.md`, `docs/system-architecture.md`, this plan, and all phase files before editing.
- Treat `/Users/macbook/mekong-cli`, `/Users/macbook/mekong-digital`, `/Users/macbook/mekong-foundation`, `/Users/macbook/mekong-ide`, `/Users/macbook/mekong-ide-core`, `/Users/macbook/projects/openclaw`, and `/Users/macbook/.cheetahclaws-src` as read-only sources.
- Do not revert unrelated dirty worktree changes.
- Do not delete source repos.
- Do not vendor full OpenClaw or CheetahClaws source unless the phase explicitly proves a minimal adapter cannot work.
- Do not claim complete without command evidence.

## Expected Deliverables

- Updated `source-inventory.md` with keep/merge/archive decisions.
- `docs/harness-engineering.md` describing canonical local/cloud model routing and OpenClaw/CheetahClaws boundaries.
- `docs/source-consolidation-map.md` listing source-to-target paths and conflict resolution.
- Minimal config/smoke command for local LLM harness.
- Reduced stale path references to `~/mekong-cli` where they block current MekongMind runtime.
- Phase reports in `plans/260531-mekongmind-source-consolidation-harness/reports/`.

## Verification Gates (Phase 5 Evidence)

### TS Type-Check
```bash
pnpm --filter @mekongcli/cli-core exec tsc --noEmit
```
```
Exit: 2 (pre-existing, NOT regression from consolidation)
Errors:
  src/cli/commands/cli-provider.ts:8:30 — Cannot find module '@openclaw/cli-adapter'
  src/cli/commands/cook-auto.ts:15:79 — Property 'cookAuto' does not exist on type 'MekongEngine'
  src/cli/commands/raas-marketplace.ts:7:82 — Cannot find module '@openclaw/raas-marketplace'
```

### Python Import Gate
```bash
python3 -c "import sys; sys.path.insert(0, 'cli/src'); from core.llm_client import LLMClient; print('OK')"
```
```
Exit: 0 — PASS
```

## Verification Gates

Run the narrowest reliable gates after each phase:

```bash
pnpm --dir packages/mekong-cli-core exec vitest run tests/unit/llm.test.ts
pnpm --dir packages/mekong-cli-core exec tsx -e "import('./src/llm/index.ts').then(() => console.log('llm-import-ok'))"
cd cli && poetry run pytest tests/test_api_adapter.py tests/test_fallback_chain.py -q
```

If implementation changes Go/Rust engine:

```bash
cd engine && go test ./...
```

If broad TS typecheck fails, separate new regressions from existing unresolved module errors and document exact output.

