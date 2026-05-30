# Codebase Summary

Map of the repository for new contributors and Claude Code agents.

## Top-level layout

```
mekong-foundation/
├── src/mekong_foundation/   # library code
├── tests/                   # pytest suite
├── docs/                    # canonical documentation (8 files max)
├── plans/                   # per-task plan dirs + reports
├── .claude/                 # ClaudeKit metadata
├── .gitlab-ci.yml           # GitLab CI: ruff + pytest matrix
├── .gitlab/                 # GitLab issue + MR templates
├── .github/                 # legacy issue/PR templates for the GitHub mirror
├── CLAUDE.md                # agent orientation
├── CODEOWNERS               # ownership map (read by GitLab + GitHub)
├── README.md                # human-facing intro
├── CHANGELOG.md             # Keep-a-Changelog
├── CONTRIBUTING.md          # contributor flow
├── CODE_OF_CONDUCT.md       # Contributor Covenant 2.1
├── SECURITY.md              # vulnerability reporting
├── LICENSE                  # MIT
└── pyproject.toml           # build + tool config
```

## Library modules

| Path                                    | Lines | Purpose                                   |
| --------------------------------------- | ----- | ----------------------------------------- |
| `src/mekong_foundation/__init__.py`     | ~5    | Version constant, public re-exports.       |
| `src/mekong_foundation/cli.py`          | ~25   | Click-based CLI entry point.              |

The package is intentionally small. Add new modules under
`src/mekong_foundation/<topic>.py` and document them here in the same PR.

## Tests

| Path                          | What it covers                            |
| ----------------------------- | ----------------------------------------- |
| `tests/test_version.py`       | `__version__` shape; `version` CLI command. |

## ClaudeKit metadata

| Path                                       | Purpose                              |
| ------------------------------------------ | ------------------------------------ |
| `.claude/rules/primary-workflow.md`        | Phase order from idea to merge.       |
| `.claude/rules/development-rules.md`       | Project-specific coding rules.        |
| `.claude/rules/documentation-management.md`| When and how to update `docs/`.       |
| `.claude/agents/example-domain-expert.md`  | Template for project-scoped subagents. |
| `.claude/commands/dev-setup.md`            | `/dev-setup` slash command.           |
| `.claude/skills/example-skill/SKILL.md`    | Template for project-scoped skills.   |
| `.claude/settings.json`                    | Permissions, env, hooks.              |

## Where things go

- New library module → `src/mekong_foundation/<name>.py` + a row above.
- New test → `tests/test_<name>.py` + a row in the Tests section.
- New rule → `.claude/rules/<name>.md` + reference from `CLAUDE.md`.
- New documentation → update an existing `docs/*.md` first; only add a new
  file if no canonical doc fits.

## Helper scripts

| Path                       | Purpose                                          |
| -------------------------- | ------------------------------------------------ |
| `scripts/personalize.sh`   | One-shot rewrite of template placeholders after `gh repo create --template`. Interactive by default; `--dry-run` previews; `--apply` re-uses saved answers; `--env-file PATH` points at alternate answers file for multi-clone reuse. |
