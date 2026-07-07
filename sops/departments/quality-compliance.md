# Department SOP: Quality & Compliance
Owner: code-reviewer agent
Department: quality-compliance
GateArtifact: mvp-live
ArtifactPath: state/evidence/mvp-live.json
Metric: green tests and no unresolved critical findings

## Purpose

Protect the factory from shipping broken, insecure, unverified, or unauditable product changes.

## Trigger

Run after Engineering Factory changes product behavior, before Platform Operations deploys, and after any failed test/CI/security check.

## Agentic Room Contract

- RoomType: release proof and risk room.
- WIP: 1 release candidate, 1 blocker list, 1 residual-risk register.
- Intake: requires MVP artifact, acceptance criteria, changed files, test scope, and risk notes.
- DecisionLoop: review diff -> map tests to buyer flow -> scan risk -> record audit trail -> pass/block release.
- Escalation: if tests miss checkout, auth, provider, or fulfillment flow, block release and return to Engineering Factory.
- AntiChaos: no summary-only review; no green tests without coverage of revenue path; no security waiver without owner.

## Command Admission

Review/test commands enter this room only against a named release candidate and current project artifact. A green technical check cannot advance revenue gates alone.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| review | review, audit | Review scope, blocking findings, residual risks, and release decision are explicit |
| test | test, jest, vitest, playwright | Unit, integration, and buyer-flow tests map to MVP acceptance criteria |
| security-scan | lint, sox, verify | Security notes, compliance notes, and no-secret evidence are recorded |
| audit-trail | audit | Decision trail links tests, review, risks, and deployment readiness |
| release-approval | verify | Release decision is pass/block with residual risk and owner |

## SOP Steps

1. Review behavior against offer acceptance criteria and user workflow.
2. Run syntax, build, tests, lint, and security checks appropriate to the change.
3. Inspect critical paths: auth, checkout, data writes, webhooks, env handling, and error states.
4. Record findings with severity and required fixes.
5. Update MVP artifact only when release evidence is green or explicitly blocked.

## Evidence Contract

`me solo run quality-compliance ready "release checks green"` must write `state/evidence/mvp-live.json`.

## Operating Checklist

- Review changed behavior against offer acceptance criteria, not generic cleanliness only.
- Run targeted tests, build/syntax checks, and security checks proportional to blast radius.
- Identify blocking defects separately from improvement backlog.
- Refuse release if checkout, auth, data integrity, or customer-facing core path is unverified.

## Required Evidence Fields

- `review_scope`, `tests_run`, `build_status`, `security_notes`, `blocking_findings`, `residual_risks`, `release_decision`.

## Automation Hooks

- `me solo route playwright`, `me solo route lint`, and `me solo route review` confirm quality ownership.
- `me solo artifact write mvp-live code-reviewer ready "<note>"` supplements MVP evidence with release approval.
- `me solo gates verify` should not be treated as enough unless the quality note is green.

## Escalation Rules

- Escalate to Engineering Factory for code defects; escalate to CEO Command only when release risk conflicts with revenue urgency.

## Handoff

Next department is Platform Operations when release checks are green. If not green, hand back to Engineering Factory with exact fix list.

## Stop Conditions

- Critical finding unresolved.
- Build/test evidence missing.
- Secret or credential risk detected.
- Checkout/auth/data integrity unverified for affected path.
