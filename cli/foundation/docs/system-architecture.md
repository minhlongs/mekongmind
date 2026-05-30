# System Architecture

A short overview of how the package is laid out and how the pieces relate.

## Layout

```
mekong-foundation/
├── src/
│   └── mekong_foundation/
│       ├── __init__.py    # version constant, public re-exports
│       └── cli.py         # click entry point — thin shell over the library
├── tests/
│   └── test_version.py    # smoke + CLI tests (CliRunner)
├── docs/                  # canonical project docs (this folder)
├── plans/                 # per-task plan directories + reports
├── .claude/               # ClaudeKit metadata: rules, agents, commands, skills
├── .github/               # community-health files + CI workflows
└── pyproject.toml         # build + tool config (ruff, pytest, hatchling)
```

## Components

```
                     ┌─────────────────────────┐
                     │         user shell      │
                     └────────────┬────────────┘
                                  │ argv
                                  ▼
            ┌─────────────────────────────────────┐
            │     mekong_foundation.cli (click)    │
            └─────────────────┬───────────────────┘
                              │ calls
                              ▼
            ┌─────────────────────────────────────┐
            │  mekong_foundation library code      │
            │  (pure functions, no side effects)   │
            └─────────────────┬───────────────────┘
                              │ logs
                              ▼
            ┌─────────────────────────────────────┐
            │  stdlib `logging` (logger name       │
            │  "mekong_foundation")                │
            └─────────────────────────────────────┘
```

## Conventions

- **Source under `src/`** so tests cannot import the package by accident from
  the working directory; the wheel layout is exactly what users see.
- **CLI is thin.** `cli.py` parses arguments, calls the library, prints
  results. No business logic lives in `cli.py`.
- **Public surface** is the top-level package. Anything under a future
  `_internal/` subpackage is unstable and may change without notice.
- **Side effects at the edges only.** Library functions take inputs and
  return outputs; only the CLI and the logger touch the outside world.

## External dependencies

| Package | Purpose                       | License | Pinning      |
| ------- | ----------------------------- | ------- | ------------ |
| click   | CLI parsing                   | BSD-3   | `>=8.1.7`    |
| pytest  | Test runner                   | MIT     | dev only     |
| pytest-cov | Coverage reporting         | MIT     | dev only     |
| ruff    | Lint + format                 | MIT     | dev only     |

Runtime is intentionally tiny. New dependencies require a note in
`docs/project-changelog.md` justifying the addition.

## CI architecture

```
push / PR ──▶ GitHub Actions
                ├── CI (ci.yml)        — matrix py3.11/3.12 × ubuntu/macos
                │     ├── ruff check
                │     ├── ruff format --check
                │     └── pytest --cov
                │
                ├── CodeQL (codeql.yml) — Python, security-and-quality queries
                │
                └── Dependabot         — daily PRs for pip + github-actions
```

Branch protection on `main` requires the `test (py3.12 / ubuntu-latest)`
status check and a code-owner review.

## Release flow

1. Bump `version` in `pyproject.toml` and `src/mekong_foundation/__init__.py`.
2. Move `[Unreleased]` entries in `CHANGELOG.md` under a new dated section.
3. Tag `vX.Y.Z` (signed) and push.
4. The release workflow (added when first non-alpha release ships) builds and
   publishes to PyPI on tag push.
