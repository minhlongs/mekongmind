# Source Inventory
*Last refreshed: 2026-05-31 — Phase 1 complete*

## Target Repo Summary

| Metric | Count | Source |
|--------|-------|--------|
| Apps | 32 | `apps/` directory |
| Packages | 57 | `packages/` directory |
| CLI | 1 | `cli/` (Python Typer v6.0.0) |
| Engine | 1 | `engine/` (Go + Rust + Python) |
| Docs | 13 | `docs/` directory |

## Target Repo Paths

| Path | Role | Evidence | Decision |
|------|------|----------|----------|
| `/Users/macbook/mekongmind` | Canonical monorepo | `README.md`, `package.json`, `pnpm-workspace.yaml` | Keep as target |
| `/Users/macbook/mekongmind/cli` | Python CLI + CheetahClaws MCP | `cli/pyproject.toml`, `cli/src/core/mcp_server.py` | Keep and harden |
| `/Users/macbook/mekongmind/packages/mekong-cli-core` | TS CLI/runtime + LLM router | `src/llm/router.ts`, `src/llm/providers/ollama.ts` | Keep as TS harness core |
| `/Users/macbook/mekongmind/packages/openclaw-engine` | OpenClaw mission engine | `src/sdk.ts`, `src/_bridge/*` | Keep, reduce bridge debt |
| `/Users/macbook/mekongmind/apps/openclaw-worker` | Worker/daemon runtime | `scripts/qwen-warmup.sh`, `data/*.json` | Keep as runtime fixture |
| `/Users/macbook/mekongmind/engine` | Go/Rust/Python engine | `cmd/mekong/main.go`, `rust_safety`, `quantization` | Keep as local engine |

## 32 Apps (apps/)

| # | App | Notes |
|---|-----|-------|
| 1 | admin | |
| 2 | agencyos-web | |
| 3 | agi-sops | |
| 4 | algo-trader | |
| 5 | algo-trader-remote | |
| 6 | anima119 | |
| 7 | antigravity-cli | |
| 8 | apex-os | |
| 9 | api | |
| 10 | com-anh-duong-10x | |
| 11 | dashboard | |
| 12 | digital | |
| 13 | docs | |
| 14 | engine | |
| 15 | gemini-proxy-clone | |
| 16 | ide | |
| 17 | mekonmind-landing | NOTE: typo "mekon" vs "mekong" — investigate |
| 18 | nhipdieuxanh | |
| 19 | nhipdieuxanh-landing | |
| 20 | nhipdieuxanh-orchestrator | |
| 21 | openclaw-worker | |
| 22 | raas-demo | |
| 23 | raas-gateway | |
| 24 | raas-gateway-cli | |
| 25 | raas-landing | |
| 26 | roi-calculator | |
| 27 | sa-dec-flower-hunt | |
| 28 | saas-dashboard | |
| 29 | starter-template | |
| 30 | vibe-coding-cafe | |
| 31 | well | |
| 32 | worker | |

**Duplicate check:** No duplicate app names found. `algo-trader` and `algo-trader-remote` are distinct (remote variant). `nhipdieuxanh`, `nhipdieuxanh-landing`, `nhipdieuxanh-orchestrator` are a family but not duplicates.

**Potential naming issue:** `mekonmind-landing` (line 17) — likely typo for `mekongmind-landing`. Needs confirmation in Phase 2.

## 57 Packages (packages/)

| # | Package | Notes |
|---|---------|-------|
| 1 | agencyos-dashboard | |
| 2 | agencyos-ui | |
| 3 | agent-core | |
| 4 | agent-forest | |
| 5 | agents | |
| 6 | agi-evolution | |
| 7 | alphaear | |
| 8 | billing | |
| 9 | build-optimizer | |
| 10 | business | |
| 11 | cleo | |
| 12 | cli-adapter | |
| 13 | cli-orchestrator | |
| 14 | command-loader | |
| 15 | core | |
| 16 | i18n | |
| 17 | ide | |
| 18 | integrations | |
| 19 | license-sdk | |
| 20 | mekong-cli-core | |
| 21 | mekong-docs | |
| 22 | mekong-engine | |
| 23 | mekong-reports | |
| 24 | mekong-sdk | |
| 25 | mekongd | |
| 26 | memory | |
| 27 | observability | |
| 28 | openclaw-agents | |
| 29 | openclaw-engine | |
| 30 | raas-dashboard | |
| 31 | raas-landing | |
| 32 | raas-marketplace | |
| 33 | raas-sdk | |
| 34 | rd-engine | |
| 35 | sdk | |
| 36 | shared | |
| 37 | solo-os | |
| 38 | tokens | |
| 39 | tooling | |
| 40 | trading-core | |
| 41 | ui | |
| 42 | vc-governance | |
| 43 | vibe | |
| 44 | vibe-agents | |
| 45 | vibe-analytics | |
| 46 | vibe-arbitrage-engine | |
| 47 | vibe-auth | |
| 48 | vibe-crm | |
| 49 | vibe-embedded-finance | |
| 50 | vibe-money | |
| 51 | vibe-payment | |
| 52 | vibe-payos-billing-types | |
| 53 | vibe-stripe | |
| 54 | vibe-subscription | |
| 55 | vibe-supabase | |
| 56 | vibe-ui | |
| 57 | zalo-parser | |

**Duplicate check:** No duplicate package names found. `vibe-*` family (8 packages) are distinct by suffix.

## External Sources

| Source | Type | Exists | Git | Dirty Entries | Decision | Rationale |
|--------|------|--------|-----|---------------|----------|-----------|
| `/Users/macbook/mekong-cli` | Flagship old monorepo | YES | YES | ~151 dirty, 109 subdirs | **Reconcile** | Source-of-truth candidate; has code + docs to diff |
| `/Users/macbook/mekong-digital` | Web/templates | YES | NO | 0 | **Import docs/templates only** | Clean, no git — copy unique assets |
| `/Users/macbook/mekong-foundation` | Python scaffold | YES | YES | 1 (reports/) | **Archive** under `cli/foundation/` if useful | Reference scaffold, likely superseded |
| `/Users/macbook/mekong-ide` | IDE monorepo | YES | YES | Clean | **Merge** → `apps/ide` + `packages/ide/*` | Has packages to merge into canonical |
| `/Users/macbook/mekong-ide-core` | Go/Rust engine | YES | YES | 1 dirty | **Diff vs `engine/`** before copy | Must compare with existing engine/ |
| `/Users/macbook/mekong` | Small source | YES | YES | Multiple (`.claude/` files) | **Manual inspect; import unique only** | Contains this repo's .claude configs |
| `/Users/macbook/projects/openclaw` | Upstream OpenClaw | YES | YES | 1 (`tasks/`) | **Adapter contract only** — do NOT vendor | External dependency, keep as adapter |
| `/Users/macbook/.cheetahclaws-src` | CheetahClaws source | YES | NO | N/A | **Adapter contract only** — do NOT vendor | Source for adapter, not vendoring |

## Old Path References

Files referencing `~/mekong-cli` or `/Users/macbook/mekong-cli`:

| Location | Type | Count |
|----------|------|-------|
| `/Users/macbook/mekongmind/plans/` | Plan docs (bootstrap, overhaul, consolidation) | ~10 files |
| `/Users/macbook/mekongmind/platform/ci-runner/_work/mekong-ide-core/` | External repo mirror | ~20 files |
| `/Users/macbook/mekongmind/docs/system-architecture.md` | Architecture doc | 1 file |
| `/Users/macbook/mekongmind/apps/well/` | App-specific plans | ~15 files |
| `/Users/macbook/mekongmind/pnpm-lock.yaml` | Lock file | 1 reference |

**Code files (.ts/.tsx/.js/.py/.sh):** ZERO references found. All old path references are in documentation/plans only.

**Resolution:** Update docs/plans in Phase 2. No code changes needed.

## Known Risks

- Root worktree dirty with 2828+ unrelated build/cache deletes and untracked files (mostly `apps/agencyos-web/out/` build artifacts).
- Root `CLAUDE.md` is missing; only nested project-specific instructions exist.
- `packages/openclaw-engine/src/_bridge/*` proxies into `apps/openclaw-worker/lib/*`, causing package/app boundary debt.
- Local LLM config split across Python CLI, TS router, OpenClaw scripts, CheetahClaws conventions.
- `mekonmind-landing` app name likely has typo (missing 'g').

## Claude Instruction

Refresh this inventory with commands before implementation. Update decisions in this file. Modify only target repo files. Do not revert unrelated dirty changes.
