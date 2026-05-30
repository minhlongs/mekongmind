# Mekong Foundation

A Python CLI toolkit for structured data processing and workflow automation.

[![Pipeline](https://gitlab.com/agency.os/mekong-foundation/badges/main/pipeline.svg)](https://gitlab.com/agency.os/mekong-foundation/-/pipelines)
[![Coverage](https://gitlab.com/agency.os/mekong-foundation/badges/main/coverage.svg)](https://gitlab.com/agency.os/mekong-foundation/-/pipelines)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/pypi/v/mekong-foundation)](https://pypi.org/project/mekong-foundation/)

> Canonical home: [`gitlab.com/agency.os/mekong-foundation`](https://gitlab.com/agency.os/mekong-foundation).
> A read-only mirror is kept at [`github.com/longtho638-jpg/mekong-foundation`](https://github.com/longtho638-jpg/mekong-foundation).

---

## Why

Many data-pipeline projects repeat the same scaffolding: CLI entry-points, logging
configuration, error handling, and test harnesses. Mekong Foundation bundles that
boilerplate into a minimal, opinionated starter so new projects can focus on
domain logic from the first commit.

Goals:
- Reproducible project structure across services owned by the same team.
- Strict type checking and linting enforced in CI (ruff + mypy).
- Conventional commits and a machine-readable CHANGELOG by default.
- **ClaudeKit-compatible** out of the box — `CLAUDE.md`, `.claude/rules/`,
  `.claude/agents/`, `.claude/commands/`, `.claude/skills/`, and the
  canonical `docs/` set are wired in so Claude Code agents have full context
  on first open.

---

## Use as a template

```bash
# 1. Create your project on GitLab from this repository
#    (UI: New project → Create from template → Use template URL
#     https://gitlab.com/agency.os/mekong-foundation)
git clone https://gitlab.com/<your-namespace>/<your-project>.git
cd <your-project>

# 2. One-shot personalize (rewrites owner/email/project name across the tree)
bash scripts/personalize.sh

# 3. Verify everything still passes
ruff check . && ruff format --check . && pytest -q
```

> `personalize.sh` walks `git ls-files`, so it only touches **tracked**
> files. Run it after the initial template clone is fully checked out
> (i.e. after the first `git clone`); it will skip anything still
> untracked. Pass `--env-file PATH` to point at an alternate answer
> file when personalizing multiple template clones from the same shell.

The template ships:
- `.gitlab-ci.yml` — ruff lint + format + pytest matrix on Python 3.11 / 3.12 — runs on every push to `main` and every merge request.
- `.gitlab/` — issue and merge-request templates ready for the GitLab UI.
- `.github/` — issue / PR templates and CODEOWNERS retained for the read-only GitHub mirror.
- `.claude/` — rules, settings, and one example each of agent / command / skill.
- `docs/` — eight canonical docs (overview, architecture, standards,
  summary, design, deployment, roadmap, changelog).
- `plans/` — directory layout, naming convention, and a worked example
  under `plans/_example-feature/`.
- `scripts/personalize.sh` — interactive one-shot rewrite of every
  template placeholder (owner, email, project name, package name, homepage).
- Branch protection: signed commits, linear history, required reviews.

---

## Install

Requirements: Python 3.11 or later.

```bash
# From PyPI (once published)
pip install mekong-foundation

# From source
git clone https://gitlab.com/agency.os/mekong-foundation.git
cd mekong-foundation
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
```

---

## Usage

```bash
# Show version
mekong version

# Show help
mekong --help
```

Programmatic import:

```python
from mekong_foundation import __version__
print(__version__)
```

---

## Development

```bash
# Run linter
ruff check src tests

# Run formatter check
ruff format --check src tests

# Run tests
pytest
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution workflow,
[CLAUDE.md](CLAUDE.md) for agent orientation, and [docs/](docs/) for the
canonical project documentation.

---

## Roadmap

| Milestone | Target | Status |
|-----------|--------|--------|
| 0.1.0 — Initial scaffold | 2026-04-28 | Released |
| 0.2.0 — Core pipeline primitives | 2026-Q2 | Planned |
| 0.3.0 — Plugin interface | 2026-Q3 | Planned |
| 1.0.0 — Stable public API | 2026-Q4 | Planned |

---

## License

MIT — see [LICENSE](LICENSE) for details.

