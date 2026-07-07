# SOP: Mekongmind Department Operating System
> MEKONG_WRAPPER SOP | Status: Active | Owner: planner agent

## Purpose

Turn one `idea/goal` into a CEO Solo Company that moves through departments, SOP gates, production shipping, revenue loops, fulfillment, and scale toward first `$1M MRR`.

## Operating Principle

Mekong CLI has broad business/orchestration surface but was command-heavy and noisy. ClaudeKit has strong full-stack/code specialists but does not own revenue. Mekongmind combines them:

- Mekong layer owns company, market, GTM, revenue, gates, and multi-project RaaS orchestration.
- ClaudeKit layer owns full-stack implementation, quality, infrastructure, and technical verification.
- MEKONG_WRAPPER owns the harness: department routing, SOP mesh, goal state, and cross-layer handoff.
- Command taxonomy normalizes both old surfaces as `command -> agent -> department -> gate -> SOP`.

The system is not command-first. It is bottleneck-first:

```text
active goal -> current gate -> next bottleneck -> owner department -> room queue -> SOP cell -> allowed command -> evidence artifact
```

Do not pick commands from the old Mekong CLI or ClaudeKit menu directly. Pick the bottleneck, then let the registry and doctrine decide which commands are allowed.

Canonical DNA lives in `agents/registry.json` key `mekongmind_operating_model` and is documented in `docs/mekongmind-operating-dna.md`. Inspect it with `me solo dna`.
Canonical proof contracts live in `agents/registry.json` key `mekongmind_evidence_contracts`. Inspect them with `me solo contract [department|gate]`.
Canonical source fusion lives in `agents/registry.json` key `mekongmind_source_fusion_matrix`. Inspect it with `me solo fusion [source|department|command]`.
The CEO-view operating map is derived from layers, doctrine, source fusion, and revenue ladder. Inspect it with `me solo map [filter]`.
The end-to-end execution trace joins layers, rooms, mesh, doctrine, contracts, and revenue ladder. Inspect it with `me solo journey [filter]`.
Department work packets are derived from blueprint, mesh, doctrine, and evidence contracts. Inspect them with `me solo brief <department>`.
Autonomous room contracts live in `agents/registry.json` key `mekongmind_department_room_system`. Inspect them with `me solo rooms [filter]` or `me solo room <department>`.

## Focus Doctrine

This SOP is scoped to one project at a time.

Hard rules:

- Terminal must remain in the active project root unless the operator explicitly changes project scope.
- `/goal` must not be used as a global scratchpad. It creates a scoped MekongMind Goal Contract for this repository's `state/`.
- Before executing any department command, inspect: `me goal show`, `me solo bottlenecks --strict`, `me solo gates verify --strict`, and `me solo allow <command> <current-gate>`.
- If a command is routed but not allowed by the current gate, stop and write the missing evidence instead of running the command.
- If the next bottleneck belongs to another department, hand off through the department artifact contract. Do not jump rooms manually.
- Daemon/service loops may only run against the current project state and must honor lock, stop file, retry, and circuit breaker controls.
- Production or revenue success cannot be claimed from code completion alone. It needs gate proof plus MRR, fulfillment, and clone-memory evidence where relevant.

Violation examples:

- Running `me goal "new product"` from the wrong repository.
- Running engineering build commands before `offer-validated`.
- Running revenue commands without checkout/provider evidence.
- Marking a department ready without its artifact passing `me solo artifact validate <department>`.

## Department Stack

| Layer | Department | Owner Agent | Mission | Gate Output |
|---|---|---|---|---|
| 0 | CEO Command | `planner` | Intent, priority, constraints, target, gate approval | Active company goal |
| 1 | Market Intelligence | `research-expert` | ICP, pain, competitor, wedge, demand proof | Validated terrain |
| 2 | Product Strategy | `business-analyst` | Offer, pricing, promise, RaaS blueprint | Sellable offer |
| 3 | Engineering Factory | `fullstack-developer` | MVP, integrations, agent workflows, product surface | Production artifact |
| 4 | Quality & Compliance | `code-reviewer` | Review, tests, audit trail, security, release approval | Green release gate |
| 5 | Platform Operations | `infrastructure-github-actions-expert` | Deploy, health, rollback, observability | Live service |
| 6 | Growth Marketing | `business-analyst` | Positioning, content, campaigns, experiments | Qualified pipeline |
| 7 | Sales & Revenue | `business-analyst` | Pricing, checkout, sales script, close loop, MRR | Revenue proof |
| 8 | Customer Success | `project-manager` | Onboarding, fulfillment, support, retention | Delivered outcome |
| 9 | Knowledge & Memory | `docs-manager` | SOP updates, decisions, cloneable playbooks | Reusable DNA |

## SOP Mesh

1. **CEO Command:** idea-intake -> company-blueprint -> gate-review -> capital-allocation
2. **Market Intelligence:** market-map -> customer-discovery -> competitor-scan -> demand-proof
3. **Product Strategy:** offer-design -> pricing-model -> raas-blueprint -> roadmap
4. **Engineering Factory:** technical-design -> mvp-build -> integration -> production-hardening
5. **Quality & Compliance:** review -> test -> security-scan -> audit-trail -> release-approval
6. **Platform Operations:** ci -> deploy -> health-check -> rollback -> ops-review
7. **Growth Marketing:** positioning -> content-engine -> campaign -> launch -> growth-experiment
8. **Sales & Revenue:** lead-qualification -> sales-script -> checkout -> close -> revenue-review
9. **Customer Success:** onboarding -> fulfillment -> support -> retention -> expansion
10. **Knowledge & Memory:** decision-log -> sop-update -> playbook-extract -> clone-sync

## Capability Mesh

The department stack is not enough by itself. Each department must expose internal cells in `agents/registry.json` key `mekongmind_department_capability_mesh`:

```text
department -> SOP stage -> command groups -> agents -> proof -> handoff -> failure signal
```

Inspect it with:

```bash
me solo mesh
me solo mesh engineering-factory
me solo mesh checkout
me solo mesh nextjs
```

Rules:

- Every `sop_chain` stage must have one mesh cell.
- Every mesh cell must name commands, agents, proof, gate, handoff, and failure signal.
- A command group is allowed to represent multiple old commands, but it must sit inside one department/gate context.
- If a cell has no proof, it cannot advance a gate.
- If a cell has no failure signal, the autonomous loop cannot detect the next bottleneck.

## Autonomous Room Contracts

Each department also has a room contract in `agents/registry.json` key `mekongmind_department_room_system`:

```text
department -> queue policy -> WIP limit -> intake contract -> checkpoints -> decision loop -> escalation -> anti-chaos -> done condition
```

Inspect it with:

```bash
me solo rooms
me solo rooms sales-revenue
me solo room engineering-factory
```

Rules:

- Every department must have one room contract.
- Every room must define what can enter its queue and what must be blocked.
- Every room must define WIP limit, checkpoints, decision loop, escalation policy, anti-chaos rules, and done condition.
- Room `checkpoint_stack` must align with the department SOP chain, otherwise agents can drift from SOP order.
- Room `done_when` must point to evidence strong enough for the department gate.

## Department SOP Files

| Department | Owner | Gate Artifact | SOP File |
|---|---|---|---|
| ceo-command | `planner` | company-blueprint | `sops/departments/ceo-command.md` |
| market-intelligence | `research-expert` | offer-validated | `sops/departments/market-intelligence.md` |
| product-strategy | `business-analyst` | offer-validated | `sops/departments/product-strategy.md` |
| engineering-factory | `fullstack-developer` | mvp-live | `sops/departments/engineering-factory.md` |
| quality-compliance | `code-reviewer` | mvp-live | `sops/departments/quality-compliance.md` |
| platform-operations | `infrastructure-github-actions-expert` | mvp-live | `sops/departments/platform-operations.md` |
| growth-marketing | `business-analyst` | repeatable-channel | `sops/departments/growth-marketing.md` |
| sales-revenue | `business-analyst` | first-revenue | `sops/departments/sales-revenue.md` |
| customer-success | `project-manager` | fulfillment-stable | `sops/departments/customer-success.md` |
| knowledge-memory | `docs-manager` | scale-ready | `sops/departments/knowledge-memory.md` |

## Main Loop

```text
idea/goal
  -> CEO Command
  -> Market Intelligence
  -> Product Strategy
  -> Engineering Factory
  -> Quality & Compliance
  -> Platform Operations
  -> Growth Marketing
  -> Sales & Revenue
  -> Customer Success
  -> Knowledge & Memory
  -> next bottleneck
```

## Execution Intake Checklist

Run this checklist before any command that mutates state, builds, deploys, changes revenue, or advances a gate:

1. Confirm project root: `pwd`.
2. Confirm active goal: `me goal show`.
3. Confirm current bottleneck: `me solo bottlenecks --strict`.
4. Confirm gate evidence: `me solo gates verify --strict`.
5. Confirm route: `me solo route <command>`.
6. Confirm permission: `me solo allow <command> <current-gate>`.
7. Confirm room packet: `me solo brief <department>` or `me solo room <department>`.
8. Execute only the allowed command or write the missing artifact.
9. Validate artifact: `me solo artifact validate <department> <artifact-json>`.
10. Recompute bottleneck: `me solo loop --once --strict`.

## Runtime Evidence Audit Block

Every completion report for SOP work must include this block. Tests alone are not enough.

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

Rules:

- `Project Root` must compare `pwd`, `PROJECT_ROOT`, `ArtifactRoot`, and active goal path.
- `Strict Gates` must include `me solo gates verify --strict` output or a concise failure summary.
- `Goal/Gate Reconciliation` must include `me solo gates reconcile` output or a concise `DRIFT` summary.
- A report may say schema/tests are green while runtime gates are blocked, but it must not call the goal complete.

`me solo loop --once` resolves the next department from:

- `state/departments/<goal-id>.json`: department run ledger
- `state/gates/<goal-id>.json`: SOP gate evidence
- `state/revenue/<goal-id>.json`: MRR source and target gap
- `PROJECT_ROOT` gate artifacts: company, offer, MVP, channel, fulfillment, scale evidence

The loop does not fabricate completion. A department only counts as ready after `me solo run <department> ready "<note>"` records it in the ledger.

`me solo loop --once --run` executes one local plan-execute-verify pass:

1. Sync `SOLO_REVENUE_FILE` or `POLAR_MRR_FILE` when present.
2. Resolve the next department and gate.
3. Write the department artifact and ledger record.
4. Verify gates from artifact and revenue evidence.
5. Print the next bottleneck.

`me solo daemon run --passes N --interval S` repeats that pass with:

- lock directory: `state/loops/solo-loop.lock`
- log file: `state/loops/solo-loop.log`
- status JSON: `state/loops/solo-loop-status.json`
- stop file: `state/loops/STOP`
- retry control: `--retries N`
- circuit breaker: `--max-failures N`
- status command: `me solo daemon status`
- stop command: `me solo daemon stop`

`me solo service ...` packages that daemon as a macOS LaunchAgent contract:

- `me solo service print`: render plist without writing it
- `me solo service write --path <plist>`: write plist only for review/versioning
- `me solo service install`: write and bootstrap LaunchAgent under `gui/$UID`
- `me solo service status`: inspect plist existence and `launchctl` state
- `me solo service uninstall`: boot out and remove the plist

The LaunchAgent runs `me solo daemon run --forever` with explicit `--interval`, `--max-failures`, and `--retries`, so the service inherits the same lock, stop file, status JSON, retry, and circuit-breaker controls.

## Gate Rules

- No build before Market Intelligence has a concrete ICP and pain.
- No deploy before Quality & Compliance passes test/review/audit gate.
- No scale before Sales & Revenue has revenue proof and Customer Success can fulfill.
- No clone before Knowledge & Memory extracts reusable SOPs and decisions.

Gate rules are machine-readable in `agents/registry.json` key `mekongmind_gate_execution_doctrine`.
Inspect them with:

```bash
me solo doctrine
me solo doctrine offer-validated
me solo doctrine mvp-live
me solo doctrine first-revenue
```

Each doctrine row states required departments, required SOP stages, allowed command groups, blocked work, proof artifacts, next gate, and failure signal. If a command is routed to a department but the current gate doctrine does not allow it yet, CEO Command must either block it or record explicit exception evidence.

Use `me solo allow <command> [current-gate]` before running high-impact commands:

- `me solo allow nextjs company-blueprint` must block engineering before offer/MVP gates.
- `me solo allow nextjs mvp-live` must allow engineering within MVP gate.
- `me solo allow revenue first-revenue` must allow revenue work only inside revenue doctrine and still require provider proof.

## CLI

```bash
me solo departments
me solo fusion claudekit
me solo map mvp-live
me solo journey sales-revenue
me solo brief sales-revenue
me solo rooms sales-revenue
me solo room sales-revenue
me solo sop sales-revenue
me solo mesh sales-revenue
me solo doctrine first-revenue
me solo allow revenue first-revenue
me solo route nextjs
me agents routes playwright
me solo run engineering-factory ready "MVP artifact ready"
me solo loop --once --run
me solo daemon run --passes 3 --interval 60
me solo daemon run --passes 3 --max-failures 2 --retries 1
me solo daemon status
me solo service print
me solo service write --path state/loops/com.mekongmind.solo-loop.plist
me solo service install --interval 300 --max-failures 3 --retries 1
me solo service status
me solo gates
me solo gates verify
me solo gate advance company-blueprint manual "blueprint ready"
me solo contract sales-revenue
me solo contract offer-validated
me solo artifact list
me solo artifact write mvp-live fullstack-developer ready "deploy healthy"
me solo revenue
me solo revenue set 2500 manual "first paid plan"
me solo revenue sync file revenue.json
POLAR_MRR_FILE=revenue.json me solo revenue sync polar
me sops list
me sops show mekongmind-department-operating-system
```

## Success Criteria

- Every department owner exists in `agents/registry.json`.
- Every department has commands, SOP chain, and metric.
- Every department declares `gate_artifact`, so a SOP run can write evidence without operator remembering paths.
- `me idea "<goal>"` writes department stack into goal state.
- `me solo departments` and `me solo sop <department>` can inspect the operating model.
- `me solo route <command>` and `me agents routes [keyword]` map old commands into department/gate/SOP ownership.
- `me solo contract [department|gate]` shows required evidence fields and proof rule before a department/gate can be treated as real.
- `me solo run <department> [status] [note]` writes the department owner evidence to its canonical gate artifact.
- `me solo loop --once` recommends the next department from department ledger, gate evidence, and MRR gap.
- `me solo loop --once --run` executes one safe local coordinator pass and then recomputes the next department.
- `me solo daemon run --passes N --interval S` repeats coordinator passes with lock/log/status/retry/circuit-breaker/stop controls.
- `me solo service print|write|install|status|uninstall` exposes the same loop as a macOS LaunchAgent service contract.
- `me solo map [filter]` shows the combined layer/gate/source/proof/revenue picture in one CEO operating view.
- `me solo journey [filter]` traces layer, room, queue, SOP cells, commands, agents, evidence, blockers, and revenue milestones in one path.
- `me solo brief <department>` compiles an actionable department work packet with SOP cells, allowed commands, proof fields, blockers, and handoff.
- `me solo rooms [filter]` and `me solo room <department>` expose autonomous room contracts with queue, WIP, checkpoints, decision loop, escalation, anti-chaos, and done condition.
- `me solo gate advance <gate> <source> <note>` writes `state/gates/<goal-id>.json` and updates `CurrentGate`.
- `me solo gates verify` derives gate readiness from department artifacts under `PROJECT_ROOT`.
- `me solo artifact write <gate> <owner> <status> <note>` writes the standard artifact path consumed by `me solo gates verify`.
- `me solo revenue set <mrr> <source>` updates `state/revenue/<goal-id>.json` and the active goal revenue fields.
- `me solo revenue sync file <json>` and `me solo revenue sync polar` update MRR from provider evidence; Polar sync requires `POLAR_MRR_FILE` or `POLAR_MRR_ENDPOINT + POLAR_ACCESS_TOKEN`.

## Unresolved Questions

- Source of truth for live MRR metrics.
- Whether to enable the LaunchAgent by default per project remains operator decision.

## Owner
`planner` agent in CEO Command.

## Scope
End-to-end MekongMind department operating doctrine for one active project and one active Solo Company goal.

## Trigger
- User enters `/idea` or `/goal`.
- Operator runs a Solo Company inspection, gate, room, artifact, daemon, or service command.
- A report claims department, gate, revenue, fulfillment, or clone-memory progress.

## Preconditions
- Active project root confirmed with `pwd`.
- Active goal confirmed with `me goal show`.
- Current gate and next bottleneck confirmed before mutation.

## Procedure
Use `## Execution Intake Checklist`, `## Main Loop`, and `## Gate Rules` as the canonical procedure.

## Evidence Contract
The department operating system is healthy only when registry schema, SOP coverage, command routing, project root, strict gates, goal/gate reconciliation, and revenue evidence are all reported separately.

## Required Evidence Fields
- `goal_id`, `project_root`, `current_gate`, `next_bottleneck`, `department`, `room`, `artifact_path`, `required_fields`, `proof_rule`, `revenue_state`.

## Acceptance Criteria
Use `## Success Criteria` plus the `## Runtime Evidence Audit Block`.

## Stop Conditions
- Project root, active goal, current gate, or department owner is unclear.
- Command route is not allowed by current gate doctrine.
- Required artifact fails strict validation.
- Revenue or production success lacks provider/runtime evidence.

## Failure Policy
Fail closed. Report schema green separately from runtime gate failure. Never claim goal completion from tests alone.

## Escalation
Escalate cross-project scope, contradictory gates, provider evidence gaps, or unowned bottlenecks to CEO Command.

## CLI Inspection Commands
```bash
pwd
me goal show
me solo bottlenecks --strict
me solo gates verify --strict
me solo gates reconcile
me solo allow <command> <current-gate>
```
