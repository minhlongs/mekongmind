# Contributing

Thanks for considering a contribution. This document covers the basics.

## Quick Start

```bash
# 1. Fork and clone (canonical home is GitLab)
git clone https://gitlab.com/<your-fork>/mekong-foundation.git
cd mekong-foundation

# 2. Create venv (requires Python 3.11+)
python3 -m venv .venv && source .venv/bin/activate

# 3. Install with dev extras
pip install -e ".[dev]"

# 4. Run checks
ruff check .
ruff format --check .
pytest
```

## Branching

- `main` is the default branch and is protected.
- Create a topic branch from `main`: `git checkout -b feat/<short-slug>`.
- Branch prefixes: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body — optional, wrap at 72 cols>

Signed-off-by: Your Name <you@example.com>
```

Sign every commit with `git commit -s` (DCO required).

## Pull Requests

1. Open against `main` from your topic branch.
2. Fill out the PR template completely.
3. Ensure CI is green: lint, format, tests on all matrix entries.
4. At least one approving review from a CODEOWNER is required to merge.
5. Squash-merge is the default; commit message must remain Conventional.

## Tests

- Unit tests live under `tests/`.
- Coverage threshold is enforced in CI (target ≥ 80%).
- Use `pytest -k <pattern>` while iterating locally.

## Reporting Bugs / Requesting Features

Open an issue on GitLab using the Bug or Feature template (selectable in the
issue creation UI; sources live under `.gitlab/issue_templates/`). For security
vulnerabilities, follow `SECURITY.md` instead.

## Releasing

Releases are cut by maintainers via signed Git tags `vX.Y.Z` after `CHANGELOG.md`
is updated. The GitLab CI pipeline runs on tag push; PyPI publish wiring lives
in `.gitlab-ci.yml` (release job is deferred to the next session — for now
`twine upload` is the manual fallback documented in `docs/deployment-guide.md`).
