# Agent + Command Coverage Audit

Date: 260601
Scope: MEKONG_WRAPPER combining `mekong-cli` + `claudekit`
Workspace: `/Users/macbook/Documents/me-deep-wrapper`

## Verdict

Not fully complete.

- Agent coverage: effectively complete for current installed source-of-truth.
- Command coverage: incomplete as a catalog/mapping. Runtime pass-through exists, but wrapper has no full command registry and visible docs/help are stale.

## Sources Checked

- Wrapper registry: `agents/registry.json`
- Wrapper routing: `lib/agent-patterns.sh`, `bin/me`
- Mekong live CLI: `/opt/homebrew/bin/mekong --help`
- Mekong slash commands: `/Users/macbook/mekong-cli/.claude/commands`
- Installed global Claude agents: `/Users/macbook/.claude/agents`
- ClaudeKit agents: `/Users/macbook/projects/claudekit/src/agents`
- ClaudeKit slash commands: `/Users/macbook/projects/claudekit/src/commands`
- ClaudeKit live CLI: `/opt/homebrew/bin/claudekit --help`

## Agent Coverage

Current wrapper registry:

- `mekong_agents`: 23
- `claudekit_agents`: 35
- Registry entries total: 58
- Unique agent IDs: 50
- Unique agent paths: 50

Evidence:

- ClaudeKit source agents: 35/35 present in registry.
- Registry `claudekit_agents` paths: 35/35 resolve on disk.
- Installed global Claude agents: 50 unique files.
- Registry union across `mekong_agents` + `claudekit_agents`: 50 unique paths, matching installed global agent set.
- Registry `mekong_agents` paths: 23/23 resolve under `/Users/macbook/.claude/agents`.

Agent issue:

- `bin/me agents list` is stale and hardcoded.
- It prints 15 Mekong + 14 ClaudeKit placeholders, but registry currently has 23 + 35 entries.
- Hardcoded Mekong list contains nonexistent IDs: `audit-expert`, `cook-agent`, `creative-agent`, `design-agent`, `devops-agent`, `finance-agent`, `git-agent`, `growth-agent`, `infrastructure-agent`, `revenue-agent`, `sales-agent`, `sync-agent`.
- Hardcoded ClaudeKit list contains group labels not registry IDs: `backend`, `code-quality`, `database`, `devops`, `documentation`, `e2e`, `frontend`, `git`, `testing`, `typescript`.

Conclusion: data coverage is complete, UI/help exposure is not.

## Command Coverage

Mekong:

- Live top-level commands from `mekong --help`: 127
- Mekong `.claude/commands/*.md`: 91
- Slash commands missing from live CLI: 0
- Live CLI commands without slash prompt files: 36

Live Mekong commands without `.claude/commands` prompt:

`agi`, `autonomous`, `bmad`, `browse`, `code`, `collab`, `dash`, `dealflow`, `debug`, `deploy`, `design`, `eval-agent`, `evolve`, `evolve-code`, `expert`, `gateway`, `goal`, `halt`, `init`, `list`, `match`, `memory`, `metrics`, `mk`, `portfolio`, `run`, `schedule`, `search`, `spec`, `studio`, `swarm`, `telegram`, `tools`, `ui`, `venture`, `version`.

ClaudeKit:

- Live top-level CLI commands: 11
- Source slash commands under `src/commands`: 26
- Wrapper supports `me claudekit <cmd>` pass-through, but no explicit command catalog in `agents/registry.json`.

Wrapper:

- `agents/registry.json` has no command registry key.
- `lib/agent-patterns.sh` resolves agent by fuzzy matching command text against agent IDs only.
- `bin/me` passes arbitrary commands to `mekong` and `claudekit`, so runtime pass-through is broad.
- Missing: authoritative command inventory, command-to-agent map, and coverage tests for all commands.

Conclusion: command execution pass-through exists, but "full command coverage" is not proven or represented.

## Required Fixes For Full Completeness

1. Replace hardcoded `bin/me agents list` with dynamic registry output.
2. Add command catalog to registry or a separate file, at minimum:
   - Mekong live top-level commands.
   - Mekong slash prompt commands.
   - ClaudeKit live CLI commands.
   - ClaudeKit slash prompt commands.
3. Add command-to-agent mapping, not only fuzzy agent-ID matching.
4. Add tests that fail when:
   - a source agent is missing from registry,
   - a registry agent path does not resolve,
   - a live command/slash command is not cataloged,
   - docs/help counts drift from registry counts.
5. Update README/docs counts from `29 agents: 15 + 14` to current values or generate them from registry.

## Verification Commands Run

- `python3 -m unittest tests/test_registry.py` passed.
- `PATH="$PWD/bin:$PATH" bash tests/test_agent_registry.sh` passed.
- `PATH="$PWD/bin:$PATH" bash tests/test_idea_dispatch.sh` passed.
- `bash -n bin/me lib/agent-patterns.sh lib/goal-executor.sh tests/test_agent_registry.sh tests/test_idea_dispatch.sh bin/deploy.sh` passed.

## Unresolved Questions

- Should `mekong_agents` represent only Mekong-specific agents, or all installed global Claude agents used by Mekong?
- Should all 36 live Mekong operational commands get slash prompt files, or are some intentionally CLI-only?
- Should command routing be explicit per command, or grouped by domain patterns?
