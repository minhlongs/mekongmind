# Old vs New /idea + /goal Power Audit

Date: 260601
Scope: old `mekong-cli` architecture vs new `me-deep-wrapper` merged architecture

## Verdict

Before this fix: yes, power was reduced.

After this fix: the critical contract is restored at wrapper level, but the old `mekong idea` autopilot binary path is still not live in the installed Mekong CLI.

## Source-of-Truth Evidence

Old `/idea` contract from `/Users/macbook/mekong-cli/.opencode/commands/idea.md`:

- `/idea` is an autonomous command.
- It must execute all 25 company architecture steps.
- It must produce `.mekong/company.json`, `plans/company-blueprint/plan.md`, and 5 `tasks/HIGH_mission_*` files.
- It must auto-dispatch the Binh Phap 5-phase command chain.
- Phase 7 hands off to `mekong idea run "<idea> -- implement per blueprint"`.

Old autopilot design from `/Users/macbook/mekong-cli/IDEA_AUTOPILOT.md`:

- `mekong idea run` was intended to do Plan -> Execute -> Verify -> Reflect.
- It has READ/WRITE/EDIT/BASH/GIT/TEST/TYPECHECK/CHECKPOINT/DONE/ABORT tools.
- It runs with worktree isolation, audit logs, safety caps, claudekit checkpoints.
- It describes the old `/idea` as a 25-step blueprint generator with Phase 7 autopilot handoff.

Current installed Mekong CLI:

- `mekong goal --help` exists and exposes `create`, `run`, `run-parallel`, `resume`, `verify`, `status`, `list`, `cancel`.
- `mekong idea --help` fails: `No such command 'idea'`.
- Source file `/Users/macbook/mekong-cli/cli/commands/idea.py` exists, but it is not registered in current `/Users/macbook/mekong-cli/src/cli/app_setup.py`.

New wrapper before fix:

- `me idea` only created a thin `state/goal-*.md` with `Steps: []`.
- It did not preserve the 25-step blueprint.
- It did not record Binh Phap chain.
- It did not map to Mekong `/goal`.
- `me goal create/run/...` did not pass through to Mekong GoalEngine.

## Fix Applied

Files changed:

- `lib/goal-executor.sh`
- `bin/me`
- `agents/registry.json`
- `tests/test_idea_dispatch.sh`
- `tests/test_registry.py`

Changes:

1. Added `create_idea_goal()` with:
   - `Type: idea`
   - `Source: legacy-25-step-idea`
   - `TotalSteps: 25`
   - all 25 legacy `/idea` blueprint steps
   - Binh Phap 5-phase chain
   - required output contract
   - handoff contract: prefer `mekong idea run`, fallback to `mekong goal create/run`

2. Updated `me idea`:
   - auto-detects harness pattern via `apply_harness_pattern`
   - writes a full legacy-compatible idea goal state, not a thin placeholder
   - shows the exact next `/goal` commands
   - `--auto` uses `mekong idea run` if live; otherwise falls back to `mekong goal create` + `mekong goal run --profile none`

3. Updated `me goal`:
   - local compatibility remains for `show`, `step`, and `chain`
   - Mekong GoalEngine subcommands pass through for `create`, `run`, `run-parallel`, `resume`, `verify`, `status`, `list`, `cancel`

4. Fixed dead command map targets:
   - `command_to_agent` now targets existing registry agents only.
   - Added test to prevent future dead agent IDs.

## Current Power Assessment

| Capability | Old architecture | New wrapper before fix | New wrapper after fix |
|---|---:|---:|---:|
| 25-step `/idea` blueprint contract | yes | no | yes, persisted in state |
| Binh Phap chain recorded | yes | no | yes |
| `/idea` maps toward `/goal` orchestration | intended via autopilot/goal OS | no | yes |
| `/goal create/run/resume/verify/status/list/cancel` reachable through wrapper | direct in Mekong | no | yes |
| `mekong idea run` live in installed CLI | intended/source exists | no | still no, external Mekong registration gap |
| Worktree autopilot with READ/WRITE/TEST/CHECKPOINT tools | intended/source exists | no | not restored in wrapper; fallback is Mekong GoalEngine |

## Remaining Gap

The wrapper now preserves the `/idea -> /goal` orchestration contract, but it cannot restore the full old worktree autopilot unless the installed Mekong CLI registers `cli/commands/idea.py` or the wrapper directly vendors that engine.

Concrete external gap:

- `/Users/macbook/mekong-cli/cli/commands/idea.py` exists.
- `/Users/macbook/mekong-cli/src/cli/app_setup.py` does not register `idea_app`.
- `mekong idea --help` returns `No such command 'idea'`.

## Verification

Passed:

- `python3 -m json.tool agents/registry.json`
- command map invalid target count: `0`
- `bash -n bin/me lib/agent-patterns.sh lib/goal-executor.sh tests/test_agent_registry.sh tests/test_idea_dispatch.sh`
- `python3 -m unittest tests/test_registry.py` (`38` tests)
- `PATH="$PWD/bin:$PATH" bash tests/test_agent_registry.sh`
- `PATH="$PWD/bin:$PATH" bash tests/test_idea_dispatch.sh`
- `PATH="$PWD/bin:$PATH" PROJECT_ROOT="$PWD" bin/me idea --pattern orchestrator "solo founder business plan platform"`
- fake-Mekong pass-through: `bin/me goal create 'abc'` dispatched `goal create abc`

## Final Answer

If comparing strict old `/idea` autopilot vs new wrapper before the fix, the merged architecture had lost power.

After the fix, the new wrapper no longer loses the core orchestration contract: `/idea` preserves the 25-step blueprint and points into `/goal` execution over the merged command surface.

The only remaining reduction is outside the wrapper: the live `mekong` binary still lacks `mekong idea`, even though old source/docs describe it. To reach full old power, register `idea_app` in Mekong CLI or vendor that autopilot into the wrapper.

## Unresolved Questions

- Should the wrapper directly vendor `cli/commands/idea.py`, or should Mekong CLI be fixed upstream by registering `idea_app`?
- Should `me idea --auto` run `mekong goal run --profile standard` instead of `--profile none` once verification gates are stable?
