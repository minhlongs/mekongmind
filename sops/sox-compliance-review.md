# SOP: SOX Compliance Review
> MEKONG_WRAPPER SOP | Status: Active | Owner: code-reviewer agent

## Purpose
Standard Operating Procedure for performing SOX (Sarbanes-Oxley) compliance review across financial controls.

## Trigger
- Quarterly internal audit cycle
- External auditor request
- Regulatory inquiry

## Pre-requisites
- [ ] Current financial period data available in system
- [ ] Previous quarter's SOX report for baseline
- [ ] Access to `code-reviewer` agent definition
- [ ] Project root set to `/Users/macbook`

## Procedure

### Step 1: Plan Audit Scope
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-plan`
**Output:** `state/sops/sox-audit-plan-{stamp}.md`
- Define control objectives
- Identify material accounts
- Select sample size

### Step 2: Execute ITGC Testing
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-itgc`
**Output:** `state/sops/itgc-results-{stamp}.md`
- Test access controls
- Test change management
- Test IT operations

### Step 3: Collect Evidence
**Agent:** `tester` (quality-compliance)
**CLI:** `me mekong test --collect-evidence`
**Output:** `state/sops/evidence-{stamp}.zip`
- Screenshots of key controls
- System configuration exports
- Interview notes

### Step 4: Compile Findings
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-execute`
**Output:** `state/sops/findings-{stamp}.md`
- Control deficiencies (if any)
- Risk ratings
- Remediation recommendations

### Step 5: Generate SOX Report
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-sox`
**Output:** `state/sops/sox-report-{stamp}.md`
- Management assertion letter
- Attestation of controls
- Remediation tracking table

## Acceptance Criteria
- [ ] All 5 steps completed in sequence
- [ ] No critical control deficiencies unresolved
- [ ] Report signed by code-reviewer
- [ ] Output stored in `state/sops/`

## Rollback
If step fails: document failure reason, escalate to `planner` agent for remediation plan.

## Harness Pattern: Pipeline (순차)
```
[Plan] → [ITGC] → [Evidence] → [Findings] → [Report]
```
CLI: `me chain "mekong audit-plan; mekong audit-itgc; mekong test --collect-evidence; mekong audit-execute; mekong audit-sox"`

## Owner
`code-reviewer` agent in Quality & Compliance.

## Scope
SOX compliance review for controls and evidence in the active project only.

## Preconditions
- Active project root confirmed with `pwd`.
- Current financial period and prior baseline are available.
- Required access is provisioned.

## Evidence Contract
SOX review is complete only when scope, ITGC results, evidence package, findings, and final report exist under active project state paths.

## Required Evidence Fields
- `goal_id`, `period`, `scope`, `itgc_results_path`, `evidence_package_path`, `findings_path`, `report_path`, `signoff`.

## Stop Conditions
- Project root is not the active repository.
- Financial period or control scope is unclear.
- Critical control deficiency has no owner.

## Failure Policy
Block signoff and create remediation plan. Do not report SOX complete with unresolved critical deficiencies.

## Escalation
Escalate unresolved deficiencies, missing evidence, or access gaps to CEO Command and Quality & Compliance.

## CLI Inspection Commands
```bash
pwd
me goal show
me solo gates verify --strict
me solo gates reconcile
```
