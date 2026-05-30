# Project Changelog

Aggregated, human-readable history. The machine-readable
[`CHANGELOG.md`](../CHANGELOG.md) at the repository root is the source of
truth for release notes; this file adds context and cross-references.

## Conventions

- One entry per merged PR or per accepted batch of related commits.
- Format: `YYYY-MM-DD — <short title> (<commit SHA>)` followed by a one-line
  summary.
- Group by week under a date header.

---

## Week of 2026-04-27

- **2026-04-29 — Migrated canonical home to GitLab (`<sha-pending>`).**
  Created `gitlab.com/agency.os/mekong-foundation`, pushed `main`, rewrote
  URLs across `pyproject.toml`, README, CLAUDE.md, CONTRIBUTING, SECURITY,
  and `docs/`. Added `.gitlab-ci.yml` (ruff + pytest matrix 3.11 / 3.12),
  GitLab issue + MR templates under `.gitlab/`, and root `CODEOWNERS`.
  Removed `.github/workflows/{ci,codeql,release}.yml` — account-flag on
  `longtho638-jpg` prevented them from firing.
  See `plans/reports/cook-260429-0040-gitlab-migration.md`.

- **2026-04-29 — Template-followups: `--env-file` and README clarifications (`<sha-pending>`).**
  Extended `scripts/personalize.sh` with `--env-file PATH` flag (both space and `=` forms)
  to support alternate answers files, enabling multi-clone reuse. Updated README.md blockquote
  to document tracked-files-only behavior and new flag. Updated CHANGELOG.md with flagged
  "Changed" entries. See `plans/reports/cook-260429-0035-template-followups.md`.

- **2026-04-29 — Template-finalization extras (`<sha-pending>`).**
  Added `.github/workflows/release.yml` (PyPI OIDC publish-on-tag),
  `plans/_example-feature/plan.md` (worked plan example), and
  `scripts/personalize.sh` (interactive template-to-project converter).
  README and `CLAUDE.md` updated to reference the new pieces. See
  `plans/reports/cook-260429-0023-template-finalization.md`.

- **2026-04-29 — ClaudeKit-compatible scaffold added (`<sha-pending>`).**
  Project-level `CLAUDE.md`, `.claude/{rules,agents,commands,skills,settings}`,
  full canonical `docs/` set, and `plans/` skeleton landed. `mekong-foundation`
  is now suitable as a GitHub Template repo for future tools.

- **2026-04-29 — Account trust posture pushed to ~95% (`<sha-pending>`).**
  Bulk-sanitized 23 active repos (descriptions, topics, security toggles),
  archived 8 placeholder repos, configured local SSH commit signing, made
  `mekong-foundation` an `is_template` repo. One scope-refresh away from
  GitHub-side commit verification. See
  `plans/reports/devops-260428-2354-100-of-100.md`.

- **2026-04-28 — Initial scaffold committed (`9b558da`).**
  23 community-health files, MIT license, CI matrix, CodeQL, dependabot,
  branch protection.
