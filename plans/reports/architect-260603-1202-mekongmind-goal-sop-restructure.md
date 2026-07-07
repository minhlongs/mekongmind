# MekongMind Goal SOP Restructure

Date: 260603-1202

## Problem

`/goal` was still too thin compared with `/idea`.

Old state:

- Mekong CLI had many useful business/revenue commands, but command surface was noisy.
- ClaudeKit had strong full-stack/code/test/infra capability, but did not own market, checkout, MRR, fulfillment, or retention.
- Registry already had departments, mesh, rooms, doctrine, contracts, and revenue ladder.
- Direct `/goal` still created only `Goal`, `Created`, `Pattern`, `Status`, `Steps`.

That meant `/goal` could bypass the deeper MekongMind picture.

## Fix

Upgraded direct `/goal` state generation in `lib/goal-executor.sh`.

New `/goal` files now include:

- `Type: goal`
- `Source: direct-goal`
- `GoalEngine: mekong goal`
- `SoloCompanyMode: autonomous`
- `PlatformDNA: mekongmind-agentic-platform-solo`
- `FactoryLoop: active`
- `RevenueTarget: 1000000`
- `RevenueTargetType: MRR`
- `CurrentMRR: 0`
- `RevenueMilestone: first-1m-mrr`
- `CurrentGate: idea-intake`
- `CloneStrategy: multi-project-raas`

New embedded contract sections:

- MekongMind Goal Contract
- Goal Decomposition Layers
- Agentic Department Stack
- Department SOP Mesh
- Command Chaos Resolution
- Evidence Gates
- Required Inspection Commands

Because `lib/goal-executor.sh` currently contains duplicate function definitions, both `create_goal` copies were patched.

Follow-up refactor completed:

- Removed duplicate `goal-executor.sh` function block.
- Added `render_mekongmind_goal_contract`.
- Direct `/goal` now renders contract sections from `agents/registry.json` instead of copying static department/SOP text.
- `/idea` now uses the same renderer for MekongMind layers, so `/idea` and `/goal` share one registry-driven contract.
- Dynamic sections now include operating layers, departments, SOP mesh, capability cells, source fusion, gate doctrine, and revenue ladder.

Cross-coverage hardening completed:

- Added `MekongMindCrossCoverage` tests in `tests/test_registry.py`.
- Tests now prove the same department set exists across:
  - `mekongmind_departments`
  - `mekongmind_department_room_system`
  - `mekongmind_department_capability_mesh`
  - `mekongmind_evidence_contracts`
- Tests prove every department SOP file exists and includes department id, gate artifact, artifact path, metric, and required evidence fields.
- Tests prove capability mesh cells exactly cover every department SOP stage and include commands, agents, gate, proof, and failure signal.
- Tests prove room contracts have queue, WIP, intake, cadence, checkpoints, decision loop, escalation, anti-chaos, done condition, and artifact path.
- Tests prove gate doctrine references real departments, real SOP stages, allowed commands, proof artifacts, blockers, and failure signals.

Registry drift fixed:

- Added evidence artifact paths to every department room `done_when`.
- Added `.mekong/company.json` to `first-1m-mrr` proof artifacts because that aggregate gate requires CEO Command review evidence.
- Added command aliases `github-actions -> infrastructure-github-actions-expert` and `linting -> code-quality-linting-expert` so old ClaudeKit command names do not fall back to `planner`.
- Added README registry count line: `58 agents`, matching `agents/registry.json`.

## Operating Shape

Canonical control path:

```text
goal
  -> CEO Solo Company
  -> Agentic department
  -> department room
  -> SOP cell
  -> command/agent capability
  -> evidence contract
  -> MRR ladder
  -> clone memory
```

This makes command/agent chaos subordinate to goal gates:

- Mekong CLI commands become market, offer, GTM, sales, revenue, fulfillment, memory capability.
- ClaudeKit commands become engineering, quality, platform, verification capability.
- MEKONG_WRAPPER owns routing, doctrine, contracts, ledgers, bottlenecks, and clone memory.

## Docs Updated

- `README.md`: explains direct `/goal` as MekongMind Goal Contract.
- `docs/mekongmind-operating-dna.md`: adds Goal Contract Kernel.

## Tests Updated

- `tests/test_idea_dispatch.sh`: direct `/goal` must now prove:
  - `/idea` also has MekongMind Goal Contract, Department Capability Cells, and Revenue Ladder
  - goal file exists
  - `SoloCompanyMode: autonomous`
  - `RevenueTarget: 1000000`
  - `## MekongMind Goal Contract`
  - `## Agentic Department Stack`
  - `## Department SOP Mesh`
  - `## Department Capability Cells`
  - `## Command Chaos Resolution`
  - `## Revenue Ladder`
  - Mekong CLI fusion role with MRR contribution
  - ClaudeKit fusion role with MRR contribution
  - first paid customer revenue ladder

## Verification Commands

```bash
bash tests/test_idea_dispatch.sh
python3 -m pytest tests/test_registry.py
bash -n lib/goal-executor.sh && bash -n tests/test_idea_dispatch.sh && bash -n bin/me
```

Latest verification:

- `bash tests/test_idea_dispatch.sh`: 27 pass, 0 fail.
- `bash tests/test_agent_registry.sh`: 29 pass, 0 fail.
- `bash tests/test_coverage.sh`: 17 pass, 0 fail.
- `python3 -m pytest tests/test_registry.py`: 43 passed, 1 skipped, 52 subtests passed.
- shell syntax checks: pass.

## Unresolved Questions

- `lib/goal-executor.sh` has duplicated function blocks. Should dedupe in later cleanup.
- `/idea` and `/goal` now render from registry, and cross-coverage tests prove department SOP files, rooms, mesh cells, evidence contracts, and gate doctrine are mutually covered.
- Next deeper step is a completion audit report that maps the original objective requirement-by-requirement to current evidence.
