# SOP: Code Quality Review
> MEKONG_WRAPPER SOP | Status: Active | Owner: code-reviewer agent

## Purpose
Standard Operating Procedure for code review — enforce lint → type-check → test → security-scan pipeline before merge.

## Trigger
- PR opened against main
- Pre-merge block enabled
- Scheduled nightly review

## Pre-requisites
- [ ] PR target branch configured
- [ ] Linting config present (`eslint.config.js`, `ruff.toml`, etc.)
- [ ] Type-check config present (`tsconfig.json`)
- [ ] Test runner configured

## Procedure

### Step 1: Lint
**Agent:** `code-quality-linting-expert` (claudekit)
**CLI:** `me ck code-review`
**Gate:** Exit 0 only. Auto-fix where possible.

### Step 2: Type Check
**Agent:** `typescript-expert` (claudekit)
**CLI:** `me ck typescript --check`
**Gate:** Zero type errors.

### Step 3: Test Suite
**Agent:** `testing-expert` (claudekit)
**CLI:** `me ck jest --coverage` (or `me ck vitest --coverage`)
**Gate:** Coverage ≥ 80%, all tests pass.

### Step 4: Security Scan
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong secure --scan`
**Gate:** Zero high/critical findings.

## Acceptance Criteria
- [ ] All 4 steps passed
- [ ] PR has code-reviewer sign-off
- [ ] Coverage ≥ 80%

## Rollback
If step 4 fails: request changes, reassign to `code-reviewer`.

## Harness Pattern: Pipeline + Supervisor
```
[code-quality-linting-expert] → [typescript-expert] → [testing-expert] → [code-reviewer]
↑ Supervisor (planner) coordinates all
CLI (pipeline): me chain "ck code-review; ck typescript --check; ck jest --coverage; mekong secure --scan"
CLI (supervisor): MEKONG_WRAPPER_AGENT=planner me idea "Review PR #123 before merge"
```

## Owner
`code-reviewer` agent in Quality & Compliance.

## Scope
Lint, type check, test, and security review for the active project change.

## Preconditions
- Active project root confirmed with `pwd`.
- Review target and changed files identified.
- Test and lint commands exist for the project.

## Evidence Contract
Code quality review is complete only when lint, type check, tests, and security scan results are recorded with command, exit code, and remediation status.

## Required Evidence Fields
- `goal_id`, `review_target`, `lint_result`, `typecheck_result`, `test_result`, `security_result`, `exit_codes`, `open_findings`.

## Stop Conditions
- Project root or review target is unclear.
- Any critical check fails without a remediation plan.
- Security scan finds high or critical risk.

## Failure Policy
Block merge and route remediation to the owning department. Do not approve from partial green checks.

## Escalation
Escalate repeated failures or security findings to CEO Command and Quality & Compliance.

## CLI Inspection Commands
```bash
pwd
me goal show
me solo gates verify --strict
me solo gates reconcile
```
