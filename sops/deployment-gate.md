# SOP: Deployment Gate
> MEKONG_WRAPPER SOP | Status: Active | Owner: infrastructure-github-actions-expert agent

## Purpose
Standard Operating Procedure for production deployment — enforces audit → test → deploy pipeline.

## Trigger
- PR merged to main
- Release tag created
- Scheduled deployment window

## Pre-requisites
- [ ] CI pipeline green (all tests pass)
- [ ] `code-reviewer` sign-off on code changes
- [ ] `tester` sign-off on e2e tests
- [ ] Deployment target configured

## Procedure

### Step 1: Audit Review
**Agent:** `code-reviewer` (quality-compliance)
**CLI:** `me mekong audit-execute`
**Gate:** Exit 0 only. Block deployment on findings.

### Step 2: Test Suite
**Agent:** `testing-expert` (claudekit)
**CLI:** `me ck jest`  (or `me ck vitest`)
**Gate:** 100% pass on critical paths.

### Step 3: Build Artifact
**Agent:** `typescript-build-expert` (claudekit)
**CLI:** `me ck build`
**Output:** `dist/` with versioned artifact.

### Step 4: Deploy
**Agent:** `infrastructure-github-actions-expert` (platform-operations)
**CLI:** `me mekong deploy`
**Output:** Deployment log in `state/sops/deploy-{stamp}.log`

### Step 5: Health Check
**Agent:** `infrastructure-github-actions-expert` (platform-operations)
**CLI:** `me mekong bridge --health`
**Gate:** All services healthy before sign-off.

## Acceptance Criteria
- [ ] All 5 steps completed
- [ ] Zero test failures
- [ ] Deployment log captured
- [ ] Health check passed

## Rollback
If step 4 fails: `me mekong rollback {deploy-id}`; escalate to `planner` for post-mortem.

## Harness Pattern: Pipeline + Supervisor
```
[code-reviewer] → [testing-expert] → [typescript-build-expert] → [infrastructure-github-actions-expert]
                             ↑ Supervisor (infrastructure-github-actions-expert) coordinates all
```
CLI (pipeline): `me chain "mekong audit-execute; ck jest; ck build; mekong deploy; mekong bridge --health"`
CLI (supervisor): `MEKONG_WRAPPER_AGENT=infrastructure-github-actions-expert me idea "Deploy v2.3.0 to prod"`

## Owner
`infrastructure-github-actions-expert` agent in Platform Operations.

## Scope
Production deployment gate for the active project only.

## Preconditions
- Active project root confirmed with `pwd`.
- Quality & Compliance release evidence exists.
- Deployment target and rollback plan are known.

## Evidence Contract
Deployment is complete only when build artifact, deployment log, health check, version match, rollback plan, and monitoring link are recorded under active project evidence.

## Required Evidence Fields
- `goal_id`, `provider`, `commit`, `build_id`, `deploy_log`, `health_url`, `http_status`, `version_match`, `rollback_plan`.

## Stop Conditions
- Tests or release review are not green.
- Deployment target is ambiguous.
- Health check or version match fails.

## Failure Policy
Rollback or hold release. Do not report production green until live health and version evidence match the deployed commit.

## Escalation
Escalate failed deploy, failed rollback, or unknown provider to CEO Command and Platform Operations.

## CLI Inspection Commands
```bash
pwd
me goal show
me solo gates verify --strict
me solo gates reconcile
```
