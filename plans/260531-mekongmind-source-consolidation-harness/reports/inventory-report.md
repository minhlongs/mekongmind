# Phase 1 Inventory Report — MekongMind Source Consolidation
**Plan:** `260531-mekongmind-source-consolidation-harness`
**Date:** 2026-05-31
**Mode:** Read-only scan (no code moved)

## Evidence Collected

### Target Repo (`/Users/macbook/mekongmind`)
- Git status: **2828 dirty entries** (mostly `out/` and build artifacts from Next.js apps)
- Top-level dirs: `apps/` `packages/` `cli/` `engine/` `platform/` `marketing/` `docs/` `scripts/` `tasks/`
- App count (top-level apps/): 32 entries (web, ide, workers, agi, algo, dashboard, RaaS)
- Package count (packages/): 20 entries (mekong-cli-core, openclaw-engine, agent-*, business-*, billing, i18n, integrations, etc.)
- CLI entry: `cli/` with `src/`, `tests/`, `pyproject.toml`
- Engine entry: `engine/` with Go main (`cmd/mekong/main.go`), `rust_safety/`, `quantization/`

### External Source Repos

| Source | Dirty | Top-level structure | Decision |
|---|---|---|---|
| `~/mekong-cli` | 151 | README, AGENTS, Dockerfiles, apps/, packages/, plans/, scripts/ | Source-of-truth candidate; reconcile into target |
| `~/mekong-digital` | 0 | README, apps/, docs/, workers/ | Import docs/templates only |
| `~/mekong-foundation` | 0 | README, CLAUDE, pyproject, src/, tests/ | Archive under `cli/foundation/` if useful |
| `~/mekong-ide` | 0 | AGENTS, README, apps/, packages/, docs/, plans/ | Reconcile IDE packages → `apps/ide` + `packages/ide/*` |
| `~/mekong-ide-core` | 1 | cmd/, engine/, docs/, internal/ | Diff vs `engine/` before copy |
| `~/mekong` | (no git) | AGENTS, Dockerfiles, docs/, src/ | Manual inspect; import unique content only |
| `~/projects/openclaw` | 0 | AGENTS, README, apps/, packages/, config/, deploy/ | Adapter contract only; do NOT vendor |
| `~/.cheetahclaws-src` | (no git) | README, pyproject, agent.py, cc_daemon/, bridges/ | Adapter contract only; do NOT vendor |

## Decisions Made

| Source | Decision | Rationale |
|---|---|---|
| Target repo | **Keep as canonical** | Already contains Mekong stack; 32 apps, 20 packages, CLI + engine |
| `mekong-cli` | **Reconcile** | Flagship old monorepo; likely source-of-truth for docs/templates |
| `mekong-digital` | **Import subset** | Web/templates; only missing docs/templates |
| `mekong-foundation` | **Archive-if-useful** | Python scaffold; minimal content |
| `mekong-ide` | **Merge packages** | IDE packages → `apps/ide` + `packages/ide/*` |
| `mekong-ide-core` | **Diff-first** | Go/Rust engine; compare with `engine/` |
| `mekong` | **Manual-inspect** | No git; small unknown |
| `projects/openclaw` | **Adapter** | Upstream OpenClaw; create adapter contract |
| `.cheetahclaws-src` | **Adapter** | CheetahClaws source; create adapter/bridge contract |

## Risks Noted
- Target worktree has 2828 dirty entries — must NOT revert unrelated changes.
- Path references to `~/mekong-cli` may still exist in scripts.
- `CLAUDE.md` is missing at root; only nested project instructions exist.
- `packages/openclaw-engine/src/_bridge/*` proxies into `apps/openclaw-worker/lib/*` (boundary debt).

## Command Evidence
```
git -C /Users/macbook/mekongmind status --short | wc -l → 2828
git -C /Users/macbook/mekong-cli status --short | wc -l → 151
git -C /Users/macbook/mekong-digital status --short | wc -l → 0
git -C /Users/macbook/mekong-foundation status --short | wc -l → 0
git -C /Users/macbook/mekong-ide status --short | wc -l → 0
git -C /Users/macbook/mekong-ide-core status --short | wc -l → 1
git -C /Users/macbook/projects/openclaw status --short | wc -l → 0
```

## Unresolved Questions
- Q1: `mekong-cli` has 151 dirty entries — should those be preserved, cherry-picked, or overwritten by target?
- Q2: `mekong-ide-core` has 1 dirty entry — is it the same Go/Rust engine as `engine/` or complementary?
- Q3: `~/mekong` (no git) content is unknown — what does it contain that target doesn't have?
- Q4: `CLAUDE.md` root missing — should the consolidated repo get a new root CLAUDE.md?
