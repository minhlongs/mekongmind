# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ClaudeKit-compatible scaffold: project-level `CLAUDE.md`, `.claude/{rules,agents,commands,skills,settings.json,agent-memory,workflows}/`, full canonical `docs/` set, `plans/` skeleton with naming-convention README.
- `.github/workflows/release.yml` — PyPI publish-on-tag via OIDC trusted publishing plus auto-generated GitHub Release notes.
- `plans/_example-feature/plan.md` — worked example showing the canonical plan layout.
- `scripts/personalize.sh` — interactive, idempotent rewrite of owner / email / project / package placeholders for first-run after `gh repo create --template`.

### Changed
- **Migrated canonical home from GitHub to GitLab** — `gitlab.com/agency.os/mekong-foundation`. GitHub repository at `longtho638-jpg/mekong-foundation` is now a read-only mirror.
- `pyproject.toml` URLs (Homepage, Documentation, Issues, Changelog) point at GitLab; `Mirror` URL added for the GitHub copy.
- `README.md` badges, clone URL, and "Use as a template" flow rewritten for GitLab.
- `CLAUDE.md` "Reference" section split into project home (GitLab) + read-only mirror (GitHub).
- `scripts/personalize.sh` placeholder values updated: `longtho638-jpg` → `agency.os`, GitHub project URL → GitLab project URL.
- `scripts/personalize.sh` now supports `--env-file PATH` flag (both space and `=` forms) to point at an alternate answers file, enabling multi-clone reuse.
- README.md clarifies that `personalize.sh` walks `git ls-files` (tracked files only) and added `--env-file` usage example.

### Added
- `.gitlab-ci.yml` — ruff lint + format check + pytest matrix on Python 3.11 / 3.12.
- `.gitlab/issue_templates/{Bug,Feature}.md` — GitLab issue templates.
- `.gitlab/merge_request_templates/Default.md` — GitLab MR template.
- Root `CODEOWNERS` — replaces `.github/CODEOWNERS`; recognised by both GitLab and GitHub.

### Removed
- `.github/workflows/{ci,codeql,release}.yml` — superseded by `.gitlab-ci.yml`. (Account-flag on `longtho638-jpg` prevented these workflows from firing reliably anyway.)
- `.github/CODEOWNERS` — moved to repo root for cross-platform compatibility.

## [0.1.0] - 2026-04-28

### Added
- Initial scaffold with full GitHub community-health file set.
- `mekong-foundation version` CLI command.
- CI matrix on Ubuntu + macOS, Python 3.11 / 3.12.
- CodeQL static analysis workflow.
- Dependabot configuration for `pip` and `github-actions` ecosystems.

[Unreleased]: https://gitlab.com/agency.os/mekong-foundation/-/compare/v0.1.0...main
[0.1.0]: https://gitlab.com/agency.os/mekong-foundation/-/tags/v0.1.0
