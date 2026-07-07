# MekongMind Multi-Layer SOP Map

## Purpose

This map is the CEO-view contract for turning two noisy legacy architectures into one $1M MRR operating system.

- Mekong CLI contributes business, market, GTM, revenue, fulfillment, and multi-project RaaS capabilities.
- ClaudeKit contributes full-stack engineering, review, test, deploy, and infrastructure capabilities.
- MekongMind makes both safe by forcing every command through project scope, active goal, department room, SOP cell, gate doctrine, and evidence contract.

## Non-Negotiable Focus Rule

One terminal works one project.

`/goal` must not run as a global scratchpad. It mints a scoped MekongMind Goal Contract under the current repository state. If project scope, active goal, or current gate is unclear, stop and inspect:

```bash
pwd
me goal show
me solo bottlenecks --strict
me solo gates verify --strict
me solo allow <command> <current-gate>
```

## Control Spine

```text
founder intent
  -> scoped /goal contract
  -> CEO Solo Company
  -> current gate
  -> next bottleneck
  -> Agentic department
  -> department room
  -> SOP cell
  -> command/agent capability
  -> evidence artifact
  -> gate doctrine
  -> revenue ladder
  -> fulfillment proof
  -> clone memory
```

## Layer Responsibilities

| Layer | Responsibility | Canonical Proof |
|---|---|---|
| Goal Contract | Bind intent to this project and revenue target | `state/goal-*.md` |
| CEO Company | Decide gate, bottleneck, constraints, kill criteria | `state/evidence/company-blueprint.json` |
| Department | Own one business/technical bottleneck | `agents/registry.json` department row |
| Room | Control queue, WIP, decision loop, escalation | `mekongmind_department_room_system` |
| SOP Cell | Define repeatable departmental action | `sops/departments/*.md` |
| Capability | Map old Mekong/ClaudeKit commands into one cell | `mekongmind_department_capability_mesh` |
| Command Admission | Decide whether a command may run now | `me solo allow <command> <gate>` |
| Evidence | Prove done with required fields | `me solo artifact validate <department>` |
| Gate Doctrine | Decide whether company can advance | `mekongmind_gate_execution_doctrine` |
| Revenue Ladder | Prevent fake jump to $1M MRR | `me solo ladder`, `state/revenue/` |
| Fulfillment | Prove customer outcome can be delivered | `state/evidence/fulfillment-stable.json` |
| Clone Memory | Extract reusable RaaS DNA | `state/evidence/scale-ready.json` |

## Department Gate Chain

| Order | Department | Room | Gate | Artifact |
|---|---|---|---|---|
| 1 | CEO Command | Strategic command room | company-blueprint | `state/evidence/company-blueprint.json` |
| 2 | Market Intelligence | Terrain and demand room | offer-validated | `state/evidence/offer-validated.json` |
| 3 | Product Strategy | Offer and RaaS blueprint room | offer-validated | `state/evidence/offer-validated.json` |
| 4 | Engineering Factory | Validated-offer product factory | mvp-live | `state/evidence/mvp-live.json` |
| 5 | Quality & Compliance | Release proof and risk room | mvp-live | `state/evidence/mvp-live.json` |
| 6 | Platform Operations | Live service and operations room | mvp-live | `state/evidence/mvp-live.json` |
| 7 | Growth Marketing | Qualified demand generation room | repeatable-channel | `state/evidence/repeatable-channel.json` |
| 8 | Sales & Revenue | Checkout and MRR truth room | first-revenue | `state/evidence/first-revenue.json` |
| 9 | Customer Success | Fulfillment and retention room | fulfillment-stable | `state/evidence/fulfillment-stable.json` |
| 10 | Knowledge & Memory | Clone memory and SOP refinery room | scale-ready | `state/evidence/scale-ready.json` |

## Command Chaos Resolution

Old commands are not removed. They are demoted from "menu" to "capability".

```text
command exists
  -> route to owner department
  -> check current gate doctrine
  -> enter department room queue
  -> run SOP cell
  -> write evidence artifact
  -> validate fields
  -> recompute bottleneck
```

Examples:

- `nextjs`, `react`, `typescript`, `build`, `test` belong inside Engineering/Quality/Platform and are blocked before offer validation.
- `marketing`, `launch`, `content`, `growth` belong inside Growth Marketing and are blocked before MVP/live or CEO launch exception.
- `sales`, `pricing`, `revenue`, `finance` belong inside Sales & Revenue and cannot claim progress without checkout/provider-backed MRR evidence.
- `docs`, `journal`, `goal`, `solo` become clone-memory capability only when tied to current project evidence.

## Operator Rule

When in doubt, do not run a build, deploy, sales, or daemon command. Run the inspection stack, identify the next bottleneck, and write or validate the missing artifact.

Unresolved questions:
- None.
