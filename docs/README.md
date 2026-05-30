# MekongMind Documentation

> Table of contents for the `docs/` directory.

## Subdirectories

| Directory | Description |
|-----------|-------------|
| [`api/`](./api/) | API reference docs — OpenAPI spec + getting started guide |
| [`mekong-cli/`](./mekong-cli/) | All Mekong CLI and platform documentation — CLI reference, architecture, deployment, guides, standards, and more |
| [`mekong-digital/`](./mekong-digital/) | Agency operations — design system, processes, runbooks, and contract templates |
| [`archive/`](./archive/) | Stale/upstream docs from the old `mekong-cli` repo — audit reports, fork guide, superseded plans (preserved for reference) |

## Key Files in `docs/mekong-cli/`

| File | Description |
|------|-------------|
| `CLI_REFERENCE.md` | Complete CLI command reference |
| `CLI_USAGE.md` | CLI usage guide and examples |
| `COMMANDS.md` | Command index |
| `ARCHITECTURE.md` | System architecture overview |
| `system-architecture.md` | Detailed system architecture |
| `code-standards.md` | Coding standards and conventions |
| `design-guidelines.md` | Design principles and guidelines |
| `deployment-guide.md` | Deployment instructions |
| `troubleshooting-guide.md` | Common issues and solutions |
| `authentication.md` | Auth setup and configuration |
| `api-reference.md` | API endpoint reference |
| `api-spec.yaml` | OpenAPI specification |
| `project-roadmap.md` | Development roadmap |
| `project-changelog.md` | Changelog |
| `README.md` | mekong-cli docs index |

## Archived Docs (`docs/archive/`)

The following were moved to `docs/archive/` because they reference the upstream `longtho638-jpg/mekong-cli` repo, non-existent paths (`seed/`, `src/core/`), or are one-off audit artifacts:

- `mekong-cli/audit/` — 7 audit reports dated 260522
- `mekong-cli/command-audit/` — Old command mapping audit
- `mekong-cli/codebase-summary.md` — Upstream codebase summary (wrong architecture)
- `mekong-cli/FORK_GUIDE.md` — Upstream fork guide
- `mekong-cli/RELEASE_SYSTEM.md` — Upstream release system docs
- `mekong-cli/ONBOARDING.md` — Upstream onboarding guide
- `mekong-cli/project-overview-pdr.md` — Upstream project overview PDR
- `mekong-cli/quick-start.md` — Upstream quick-start guide
- `mekong-cli/getting-started.md` — Upstream getting-started guide
- `mekong-cli/domain-plan.md` — Upstream domain plan
- `mekong-cli/DEPLOYMENT_GUIDE.md` — Old deployment guide (non-existent infra)
- `mekong-cli/BINH_PHAP_1M_BATTLE_PLAN.md` — Upstream battle plan
- `mekong-cli/raas/package-lock.json` — Misplaced lock file

## How to Contribute to Docs

1. Edit Markdown files directly in the relevant subdirectory
2. Keep files focused and under 800 lines where possible
3. Update this README when adding/removing major sections
4. Run `node .opencode/scripts/validate-docs.cjs docs/` to check for broken links
