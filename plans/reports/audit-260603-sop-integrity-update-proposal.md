# SOP Integrity Audit + Update Proposal

Date: 260603
Scope: `/Users/macbook/Documents/me-deep-wrapper`
Mode: read-only audit, no code implementation.

## Objective

Audit SOP integrity of the codebase and propose updates. No code changes.

## Summary

SOP system is strong at registry/schema layer, but weak at runtime evidence layer.

Current state:

- Registry has 10 departments, 10 rooms, 10 capability mesh entries, 10 evidence contracts.
- Agent registry has 58 unified agents and 146 command routes.
- Current tests pass for registry/coverage.
- Gate verification does not prove active goal completion.
- Default `PROJECT_ROOT` points outside workspace.
- Canonical company evidence path is inconsistent.

Verdict: **SOP integrity is partially valid. Governance design exists. Runtime proof chain is not intact.**

## Evidence Checked

### Registry Coverage

Command:

```bash
python3 - <<'PY'
import json, pathlib
root=pathlib.Path('.')
reg=json.loads((root/'agents/registry.json').read_text())
print('departments', len(reg.get('mekongmind_departments', [])))
print('rooms', len(reg.get('mekongmind_department_room_system', [])))
print('mesh', len(reg.get('mekongmind_department_capability_mesh', [])))
print('contracts', len(reg.get('mekongmind_evidence_contracts', [])))
print('unified_agents', len(reg.get('unified_agents', [])))
print('command_to_agent', len(reg.get('command_to_agent', {})))
PY
```

Observed:

```text
departments 10
rooms 10
mesh 10
contracts 10
unified_agents 58
command_to_agent 146
```

### Tests

Commands:

```bash
bash tests/test_agent_registry.sh
bash tests/test_coverage.sh
python3 -m pytest tests/test_registry.py -q
```

Observed:

- `test_agent_registry.sh`: PASS=29 FAIL=0
- `test_coverage.sh`: PASS=17 FAIL=0
- `test_registry.py`: 53 passed, 1 skipped

Coverage conclusion: tests prove schema consistency. They do not prove runtime gate/evidence integrity.

### Gate Verification With Correct Project Root

Command:

```bash
PROJECT_ROOT=/Users/macbook/Documents/me-deep-wrapper ./bin/me solo gates verify --strict
```

Observed:

```text
ArtifactRoot: /Users/macbook/Documents/me-deep-wrapper
MISS company-blueprint .mekong/company.json|plans/company-blueprint/plan.md
MISS offer-validated state/evidence/offer-validated.json|plans/company-blueprint/offer.md
MISS mvp-live state/evidence/mvp-live.json|state/deploy/health.json|dist
MISS first-revenue CurrentMRR=0
MISS repeatable-channel state/evidence/repeatable-channel.json|plans/company-blueprint/channel.md
MISS fulfillment-stable state/evidence/fulfillment-stable.json|sops/fulfillment.md
MISS scale-ready state/evidence/scale-ready.json|plans/company-blueprint/scale.md
MISS first-1m-mrr CurrentMRR=0 TargetMRR=1000000

CurrentGate: repeatable-channel
- idea-intake: pending
- company-blueprint: pending
- offer-validated: pending
- mvp-live: pending
- first-revenue: pending
- repeatable-channel: active initial gate
- fulfillment-stable: pending
- scale-ready: pending
- first-1m-mrr: pending
```

Conclusion: active goal says current gate is `repeatable-channel`, but prior gate evidence is pending. This is a gate-state drift.

### Gate Verification With Default Root

Command:

```bash
./bin/me solo gates verify --strict
```

Observed:

```text
ArtifactRoot: /Users/macbook
goal-executor.sh: line 39: portable_sed: command not found
```

Conclusion: default `PROJECT_ROOT` is wrong for this repo and can route evidence checks outside the workspace.

## Integrity Findings

### P0-1: Project root default violates project isolation

Evidence:

- `./bin/me solo gates verify --strict` uses `ArtifactRoot: /Users/macbook`.
- Workspace is `/Users/macbook/Documents/me-deep-wrapper`.
- README says `PROJECT_ROOT=/path` override default root, but default is still `/Users/macbook`.

Risk:

- Gate checks can read/write evidence in wrong project.
- SOP says one terminal = one project, but runtime default contradicts this.
- Cross-project contamination risk.

Update proposal:

- SOP should require `PROJECT_ROOT` = current repo root for every gate/evidence command.
- Runtime docs should state default root must be wrapper repo root or derived from `bin/me` location.
- Add audit checklist item: compare `pwd`, `PROJECT_ROOT`, `ArtifactRoot`, and active goal path before any gate claim.

### P0-2: Company blueprint canonical path drift

Evidence:

- SOP/docs/registry frequently require `.mekong/company.json`.
- Existing evidence file is `state/evidence/company-blueprint.json`.
- `.mekong/` does not exist in current workspace.
- Strict gate accepts `.mekong/company.json|plans/company-blueprint/plan.md`, not `state/evidence/company-blueprint.json`.

Risk:

- CEO Command evidence can exist but never pass gate verification.
- Docs and state can disagree about what counts as company blueprint proof.

Update proposal:

- Choose one canonical path:
  - Preferred for consistency with evidence layer: `state/evidence/company-blueprint.json`.
  - Alternative: create/use `.mekong/company.json` as company-level metadata and keep evidence JSON separate.
- Update README, `docs/mekongmind-multilayer-sop-map.md`, `docs/mekongmind-operating-dna.md`, `sops/departments/ceo-command.md`, and registry gate doctrine to one rule.
- If both files are kept, define exact roles:
  - `.mekong/company.json`: company identity/config.
  - `state/evidence/company-blueprint.json`: gate evidence contract.

### P0-3: Active goal gate drift

Evidence:

- `me goal show` reports active goal `Phase 6` and `CurrentGate: repeatable-channel`.
- Strict gate verify shows `company-blueprint`, `offer-validated`, `mvp-live`, `first-revenue` are pending.

Risk:

- SOP loop can claim late-stage execution without prior proof.
- Reports can say phase complete while evidence says not complete.

Update proposal:

- Add “Goal/Gate Reconciliation SOP”.
- Before any report says gate/phase done, reconcile:
  - active goal `CurrentGate`
  - `state/gates/<goal-id>.json`
  - `state/departments/<goal-id>.json`
  - `state/revenue/<goal-id>.json`
  - canonical evidence artifacts
- If later current gate exists while previous gates are pending, output `DRIFT` and block success claims.

### P1-1: SOP header/sections are not uniform

Evidence:

Department SOPs are consistent. Cross-cutting SOPs are less consistent:

- Some lack explicit `Evidence Contract`.
- Some use `Success Criteria`, some `Acceptance Criteria`, some `Stop Conditions`.
- `sops/mekongmind-department-operating-system.md` is central but lacks the same strict section layout as department SOPs.

Risk:

- Harder to validate SOP files by machine.
- Agents can interpret SOP completion differently across documents.

Update proposal:

Normalize every SOP to:

```text
Title
Owner
Scope
Trigger
Preconditions
Procedure
Evidence Contract
Required Evidence Fields
Acceptance Criteria
Stop Conditions
Failure Policy
Escalation
CLI Inspection Commands
```

### P1-2: Tests prove schema, not runtime truth

Evidence:

- Registry tests pass.
- Strict gate verification still fails all proof gates.

Risk:

- “All tests pass” can be misread as SOP system complete.
- Runtime drift can remain invisible.

Update proposal:

- Add non-code SOP requirement: every completion report must include runtime verifier output, not only tests.
- Add report checklist:
  - registry schema pass
  - SOP file coverage pass
  - command route pass
  - strict gate verification pass/fail
  - active goal/gate reconciliation result

### P1-3: Stale documentation

Evidence:

- `docs/VIETNAMESE-ARCHITECTURE-REPORT.md` references 56 agents.
- Registry and README now indicate 58 agents.

Risk:

- Architecture docs lose authority.
- Operators may trust outdated counts and structure.

Update proposal:

- Update docs to current registry values.
- Add a doc freshness rule: architecture count values must be generated from registry or marked as snapshot with date.

### P2-1: Runtime helper dependency issue

Evidence:

- Default-root gate verification emits `portable_sed: command not found`.

Risk:

- Gate verification can fail before printing complete status.
- Not the main SOP integrity issue, but it degrades operator trust.

Update proposal:

- SOP should require verifier command health check.
- Runtime implementation should ensure `portable_sed` is sourced/defined before gate verifier paths use it.

## Proposed Update Plan

### Phase 1: Root + Evidence Canonicalization

Goal: stop cross-project and artifact-path drift.

Updates:

- Define canonical project root rule.
- Define canonical company blueprint evidence path.
- Update docs/SOP/registry references.
- Add report checklist for `pwd`, `PROJECT_ROOT`, `ArtifactRoot`, active goal path.

Success criteria:

- `./bin/me solo gates verify --strict` uses workspace root by default or docs require explicit `PROJECT_ROOT=$(pwd)`.
- Company blueprint path appears consistently across README/docs/SOP/registry.

### Phase 2: Goal/Gate Reconciliation SOP

Goal: prevent phase claims without evidence.

Updates:

- New SOP section or standalone SOP:
  - compare active goal gate vs gate JSON
  - compare department artifacts vs required contracts
  - compare revenue metric vs revenue gate
  - block success claim on drift

Success criteria:

- Any report that claims gate progress includes reconciliation status.
- Drift is shown as failure, not warning.

### Phase 3: SOP Format Normalization

Goal: make SOPs machine-checkable.

Updates:

- Normalize cross-cutting SOP files to same minimum section set.
- Add evidence contract section to every SOP.
- Add stop conditions to every SOP.

Success criteria:

- SOP scanner returns no missing core sections.

### Phase 4: Runtime Evidence Audit Checklist

Goal: distinguish schema green from operating green.

Required report block:

```text
Registry Schema: pass/fail
SOP Coverage: pass/fail
Command Routing: pass/fail
Project Root: pass/fail
Strict Gates: pass/fail
Goal/Gate Reconciliation: pass/fail
Revenue Evidence: pass/fail
Unresolved Questions: ...
```

Success criteria:

- No report can say “complete” using tests alone.

## Recommended Priority

P0:

1. Fix root doctrine/default.
2. Canonicalize company blueprint path.
3. Add goal/gate reconciliation rule.

P1:

4. Normalize SOP sections.
5. Update stale architecture docs.
6. Require runtime verifier output in every completion report.

P2:

7. Document/repair runtime helper dependency like `portable_sed`.

## Final Assessment

Current SOP design is coherent, but execution integrity is not proven.

Do not claim SOP system complete until:

- artifact root is correct,
- company blueprint evidence path is canonical,
- strict gate verification can pass or clearly show expected blocked state,
- active goal gate matches gate evidence,
- reports distinguish schema pass from runtime pass.

## Unresolved Questions

- Should canonical company blueprint evidence be `.mekong/company.json` or `state/evidence/company-blueprint.json`?
- Should active Phase 6 goal be reconciled backward to pending gates, or should missing artifacts be created from validated prior work?
- Should `PROJECT_ROOT` default to wrapper repo root or always require explicit override per project?
