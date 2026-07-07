# Department SOP: Platform Operations
Owner: infrastructure-github-actions-expert agent
Department: platform-operations
GateArtifact: mvp-live
ArtifactPath: state/evidence/mvp-live.json
Metric: live service healthy and current with shipped commit

## Purpose

Deploy, observe, recover, and operate the live RaaS product so the business can sell and fulfill against a real URL.

## Trigger

Run after Quality & Compliance approves release, or whenever deploy, CI, health, rollback, or runtime status changes.

## Agentic Room Contract

- RoomType: live service and operations room.
- WIP: 1 active deploy, 1 incident, 1 rollback path.
- Intake: requires release approval, commit, deployment target, build command, smoke path, and rollback owner.
- DecisionLoop: verify CI -> deploy current commit -> smoke health/version -> attach rollback -> publish operations review.
- Escalation: if production is not current, observable, or rollbackable, block Growth and Sales rooms.
- AntiChaos: no fabricated provider; no HTTP 200 as sole proof; no launch without rollback path.

## Command Admission

Deploy/infra commands enter this room only after release approval and provider detection from current project config. Do not infer Vercel, Cloudflare, or any provider from memory.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| ci | github, build | CI job, commit, build ID, and build status are recorded |
| deploy | deploy, devops, docker | Provider, environment, URL, and deployment method are explicit |
| health-check | verify, tracking | Health URL, HTTP status, version match, and smoke path are recorded |
| rollback | git, deploy | Rollback plan and owner are attached to release evidence |
| ops-review | devops, tracking | Monitoring, alert, cost, and operational bottleneck are recorded |

## SOP Steps

1. Detect the real deploy provider from project config; do not fabricate provider.
2. Run deploy path defined by the project, then verify CI/CD, jobs, and runtime health.
3. Verify production URL, version/commit metadata, checkout redirect, and critical endpoints.
4. Record rollback path, logs location, and monitoring status.
5. Update MVP artifact with production evidence.

## Evidence Contract

`me solo run platform-operations ready "production healthy"` must write `state/evidence/mvp-live.json`.

## Operating Checklist

- Detect actual deploy provider from project files before claiming production status.
- Verify deployed commit/version, HTTP health, logs, rollback path, and monitoring surface.
- Keep continuous loop state inspectable: lock, status JSON, log, stop file, service status.
- Never call deploy complete without live health evidence.

## Required Evidence Fields

- `provider`, `commit`, `build_id`, `health_url`, `http_status`, `version_match`, `rollback_plan`, `monitoring`.

## Automation Hooks

- `me solo daemon status` checks local loop state.
- `me solo service status` checks LaunchAgent service contract.
- `me solo artifact write mvp-live infrastructure-github-actions-expert ready "<note>"` writes ops evidence.

## Escalation Rules

- Escalate to Quality & Compliance when release is not green; escalate to CEO Command when deploy provider or production target is ambiguous.

## Handoff

Next department is Growth Marketing. Handoff must include production URL, health evidence, checkout status, analytics status, and known operational risks.

## Stop Conditions

- Production is not HTTP healthy.
- Deployed version cannot be tied to current build.
- Checkout path cannot be verified.
- Rollback path unknown.
