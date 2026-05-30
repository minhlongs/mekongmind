# Project Roadmap

Living document. Updated as milestones complete or scope shifts.

## 0.1.x — Scaffold (current)

- [x] Repository created with full community-health file set.
- [x] CI matrix (py3.11/3.12 × ubuntu/macos) green on push.
- [x] CodeQL workflow registered.
- [x] Branch protection: signed commits + linear history + reviews.
- [x] ClaudeKit metadata (`.claude/rules`, `.claude/agents`, `.claude/commands`, `.claude/skills`).
- [x] Canonical `docs/` set in place.
- [x] Release-on-tag workflow with PyPI OIDC trusted publishing.
- [x] Worked plan example under `plans/_example-feature/`.
- [x] `scripts/personalize.sh` for first-run template rewrite.
- [x] Migrated canonical home to GitLab (`agency.os/mekong-foundation`).
- [x] `.gitlab-ci.yml` matrix pipeline running on push + MR.
- [ ] First Dependabot / Renovate PR merged.
- [ ] First external contribution accepted.

## 0.2.x — Useful CLI

- [ ] Beyond `version`: at least three concrete commands solving real local
      automation needs.
- [ ] Structured logging with JSON output behind `--json`.
- [ ] Configuration file support (`~/.config/mekong-foundation/config.toml`).
- [ ] mypy --strict gate added to CI.

## 0.3.x — Distribution

- [ ] GitLab CI release-on-tag job wired with PyPI OIDC trusted publishing.
- [ ] Homebrew formula via `gitlab.com/agency.os/homebrew-mekong`.
- [ ] `pip install mekong-foundation` works on macOS, Linux, Windows.

## 1.0 — Stability

- [ ] Public API frozen for 6 months without a breaking change.
- [ ] mypy --strict has been passing for 6 months.
- [ ] Coverage ≥ 90 % on the library.
- [ ] At least three downstream projects depend on the library or use the
      template.

## Cross-cutting (always on)

- Account-level GitLab + GitHub trust posture audited every quarter against
  `~/.claude/rules/on-demand/actual-fullstack-audit.md`.
- Dependency PRs (Renovate / GitLab Dependency Scanning) reviewed within seven days.
- Security advisories triaged within three business days per `SECURITY.md`.
