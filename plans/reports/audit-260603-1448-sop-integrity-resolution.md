# SOP Integrity Resolution Report

Date: 260603
Scope: `/Users/macbook/Documents/me-deep-wrapper`
Input report: `plans/reports/audit-260603-sop-integrity-update-proposal.md`

## Summary

The P0 governance design from the proposal is now mostly reflected in docs, SOPs, registry, runtime, and tests.

Resolved:

- Default artifact root now derives from the wrapper repository root when `PROJECT_ROOT` is unset.
- Canonical company blueprint evidence path is `state/evidence/company-blueprint.json`.
- `.mekong/company.json` is removed from current README/docs/SOP canonical references.
- Goal/gate reconciliation exists and blocks drift claims.
- Reports must include runtime evidence audit, not only schema/test pass.

Still blocked by real evidence:

- Strict gate verification does not pass because business/runtime artifacts are missing or fail contract validation.
- Existing `state/evidence/company-blueprint.json` is legacy-shaped and missing required CEO Command fields.
- No provider-backed MRR evidence exists for revenue gates.

## Current Registry Snapshot

```text
mekongmind_departments 10
mekongmind_department_room_system 10
mekongmind_department_capability_mesh 10
mekongmind_evidence_contracts 10
unified_agents 58
command_to_agent 146
ceo_artifact state/evidence/company-blueprint.json
```

## Proposal Item Status

| Item | Status | Evidence |
|---|---|---|
| P0-1 Project root default | Resolved | `env -u PROJECT_ROOT ./bin/me solo gates verify --strict` prints `ArtifactRoot: /Users/macbook/Documents/me-deep-wrapper`. README env var updated. |
| P0-2 Company blueprint path drift | Resolved for canonical refs | Registry, README/docs/SOP, and tests use `state/evidence/company-blueprint.json`; tests reject `.mekong/company.json` in README/docs/SOP. |
| P0-3 Active goal gate drift | Resolved for current active goal | `me solo gates reconcile` returns PASS with `CurrentGate: mvp-live` for `state/goal-20260603-155338.md`. |
| P1-1 SOP format uniformity | Resolved | Department SOPs contain evidence contracts and stop conditions. All 9 cross-cutting SOPs under `sops/*.md` now contain the proposed core sections: Owner, Scope, Trigger, Preconditions, Procedure, Evidence Contract, Required Evidence Fields, Acceptance Criteria, Stop Conditions, Failure Policy, Escalation, and CLI Inspection Commands. |
| P1-2 Tests vs runtime truth | Resolved in doctrine | `sops/mekongmind-department-operating-system.md` requires `Registry Schema`, `SOP Coverage`, `Command Routing`, `Project Root`, `Strict Gates`, `Goal/Gate Reconciliation`, and `Revenue Evidence`. |
| P1-3 Stale architecture docs | Resolved for checked root/agent drift | README shows 58 agents; `docs/VIETNAMESE-ARCHITECTURE-REPORT.md` no longer says default root is `/Users/macbook`. |
| P2-1 `portable_sed` helper | Resolved in current runtime | `lib/goal-executor.sh` defines fallback `portable_sed`; gate verifier no longer emits `portable_sed: command not found`. |

## Runtime Evidence Audit Block

```text
Registry Schema: pass
SOP Coverage: pass
Command Routing: pass by existing registry coverage tests
Project Root: pass
Strict Gates: fail, expected until real artifacts exist
Goal/Gate Reconciliation: pass
Revenue Evidence: fail, CurrentMRR=0
Unresolved Questions: see end
```

## Verifier Evidence

Project root, strict gates, and reconciliation:

```text
ArtifactRoot: /Users/macbook/Documents/me-deep-wrapper
MISS company-blueprint strict-contract ceo-command /Users/macbook/Documents/me-deep-wrapper/state/evidence/company-blueprint.json
MISS offer-validated strict-contract market-intelligence+product-strategy /Users/macbook/Documents/me-deep-wrapper/state/evidence/offer-validated.json
MISS mvp-live strict-contract engineering-factory+quality-compliance+platform-operations /Users/macbook/Documents/me-deep-wrapper/state/evidence/mvp-live.json
MISS first-revenue CurrentMRR=0
MISS repeatable-channel state/evidence/repeatable-channel.json|plans/company-blueprint/channel.md
MISS fulfillment-stable state/evidence/fulfillment-stable.json|sops/fulfillment.md
MISS scale-ready state/evidence/scale-ready.json|plans/company-blueprint/scale.md
MISS first-1m-mrr CurrentMRR=0 TargetMRR=1000000

CurrentGate: mvp-live
PASS goal/gate reconciliation
```

Standalone reconciliation:

```text
PASS goal/gate reconciliation
Goal: /Users/macbook/Documents/me-deep-wrapper/state/goal-20260603-155338.md
GateState: /Users/macbook/Documents/me-deep-wrapper/state/gates/goal-20260603-155338.json
CurrentGate: mvp-live
```

CEO Command artifact validation:

```text
MISS ceo-command missing fields: idea, target_customer, pain, offer_direction, target_mrr, current_gate, next_department, kill_criteria
Artifact: /Users/macbook/Documents/me-deep-wrapper/state/evidence/company-blueprint.json
ProofRule: one active company goal with target, current gate, next department, and kill criteria
EXIT:1
```

## Interpretation

The SOP integrity update should not claim the Solo Company goal is complete.

The governance spine is now coherent: project root, canonical evidence path, `/goal` focus doctrine, command admission, strict gate checks, and reconciliation are aligned. Runtime gates still correctly block because evidence has not been produced under the strict contracts.

## Next Required Work

1. Replace or regenerate `state/evidence/company-blueprint.json` with real CEO Command fields for the active project goal.
2. Create real offer, MVP, revenue, channel, fulfillment, and scale artifacts only when each department has done the work.
3. Keep old cross-cutting SOPs normalized when adding new SOP files; the current `sops/*.md` scanner returns no missing core sections.

## Unresolved Questions

- Should legacy `state/evidence/company-blueprint.json` be archived before writing the active goal blueprint?
- Should `me solo gates reconcile` auto-initialize missing gate-state, or should missing gate-state remain a hard drift outside `verify --strict`?
