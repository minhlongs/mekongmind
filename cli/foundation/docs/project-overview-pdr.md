# Project Overview — Product Development Reference

## Identity

- **Name:** mekong-foundation
- **Owner:** Long Tho (GitLab `@agency.os`, GitHub `@longtho638-jpg`)
- **License:** MIT
- **Status:** 0.1.x — alpha, public surface still mutable.
- **Home:** <https://gitlab.com/agency.os/mekong-foundation>
- **Mirror:** <https://github.com/longtho638-jpg/mekong-foundation>

## Why this project exists

Several internal CLI tools at `mekongmind.com` repeat the same scaffolding:
argument parsing, logging configuration, pytest harness, ruff config, CI
matrix, dependabot, signed-commit policy. mekong-foundation packages that
boilerplate as an opinionated starter so new tools can focus on domain logic
from the first commit.

The repository is also a **ClaudeKit-compatible** template — Claude Code
agents pick up `CLAUDE.md`, `.claude/rules/`, `.claude/skills/`,
`.claude/commands/`, and `.claude/agents/` out of the box.

## Goals (in priority order)

1. **Reproducible structure** across services owned by the same team.
2. **Strict quality gates** in CI — ruff lint + format + pytest + CodeQL.
3. **Trust signals from day 1** — signed commits, branch protection, full
   community-health file set.
4. **Zero-config Claude Code experience** — clone, open, and the agent has
   everything it needs.

## Non-goals

- Replacing `cookiecutter` or `copier`. mekong-foundation is a thin GitHub
  template, not a templating engine.
- Becoming a framework. New behavior lands as opt-in modules, not as
  inheritance.
- Supporting Python <3.11. The codebase uses modern syntax (PEP 604, match).

## Stakeholders

| Role            | Name / handle                |
| --------------- | ---------------------------- |
| Owner           | Long Tho (`@agency.os` on GitLab) |
| Domain          | mekongmind.com               |
| Primary user    | Internal teams using AI agents and CLI tools |
| Secondary user  | External contributors via PR |

## Success criteria

- A new project cloned from `https://gitlab.com/agency.os/mekong-foundation`
  and personalized via `bash scripts/personalize.sh` passes
  `ruff check && ruff format --check && pytest` from the first push.
- The default `main` branch can never receive an unsigned, unreviewed, or
  untested commit.
- `docs/` and `CHANGELOG.md` move in lockstep with code; documentation drift
  is caught in code review, not after release.

## Out of scope

- Web UI / dashboard.
- Cloud-deployed services (use a downstream project for that).
- Multi-language support — the README and docs are English-only by design.
