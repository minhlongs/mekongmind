# SOP: Audit Execute
> MEKONG_WRAPPER SOP | Status: Active | Owner: code-reviewer agent

## Purpose
Standard Operating Procedure for executing a full audit cycle — plan → collect → test → report → remediate.

## Trigger
- Scheduled quarterly audit
- SOX/ITGC review triggered
- Client compliance request
- Post-incident forensic review

## Pre-requisites
- [ ] Audit scope defined (me project audit plan <scope>)
- [ ] Access credentials provisioned
- [ ] Prior period baseline in `state/audit/`
- [ ] Compliance framework selected (SOX/ITGC/IFRS/VN-GAAP)

## Procedure

### Step 1: Audit Plan
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-plan <scope>`
**Output:** `state/audit/plan-{stamp}.md`

### Step 2: Evidence Collection
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-trail --collect`
**Output:** Evidence files in `state/audit/evidence/`

### Step 3: Control Testing
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-itgc --run`
**Gate:** All key controls tested, exceptions documented.

### Step 4: Findings Report
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-report`
**Output:** `state/audit/report-{stamp}.md`

### Step 5: Remediation
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-compliance --remediate`
**Gate:** All critical findings remediated or escalated.

## Acceptance Criteria
- [ ] Plan approved
- [ ] 100% key controls tested
- [ ] Findings documented
- [ ] Remediation tracked

## Rollback
If step 3 fails: halt, escalate to `planner`, reschedule.

## Harness Pattern: Supervisor + Iterative Refiner
```
[code-reviewer] supervisor
  └─ [code-reviewer] iterative: plan → collect → test → report loop
CLI (supervisor): MEKONG_WRAPPER_AGENT=code-reviewer me idea "Execute Q2 SOX audit"
CLI (pipeline): me chain "mekong audit-plan SOX; mekong audit-trail --collect; mekong audit-itgc; mekong audit-report"
```

## Owner
`code-reviewer` agent in Quality & Compliance.

## Scope
Audit planning, evidence collection, control testing, findings, and remediation for the active project only.

## Preconditions
- Active project root confirmed with `pwd`.
- Active goal confirmed with `me goal show`.
- Audit scope and compliance framework selected.

## Evidence Contract
Audit execution is complete only when the plan, evidence package, control test results, findings report, and remediation tracker exist under `state/audit/` for the active project.

## Required Evidence Fields
- `goal_id`, `audit_scope`, `framework`, `plan_path`, `evidence_path`, `test_results_path`, `findings_path`, `remediation_status`.

## Stop Conditions
- Project root, active goal, or audit scope is unclear.
- Evidence cannot be tied to the active goal.
- Critical control failure has no remediation owner.

## Failure Policy
Fail closed. Do not mark audit complete when evidence is missing, unlinked, or produced outside the active project root.

## Escalation
Escalate unresolved control failures, missing access, or scope ambiguity to CEO Command.

## CLI Inspection Commands
```bash
pwd
me goal show
me solo gates verify --strict
me solo gates reconcile
```
