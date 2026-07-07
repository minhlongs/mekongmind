# Mekongmind Operating DNA

## Purpose

Mekongmind is the merged operating system for two older surfaces:

- `mekong-cli`: broad business, orchestration, GTM, revenue, and multi-project RaaS surface, but noisy as a raw command list.
- `claudekit`: strong full-stack engineering, tests, review, and infra specialists, but not a complete business engine by itself.
- `me-wrapper`: the harness layer that turns both into one CEO Solo Company factory.

The final shape is not command-first. It is goal-first:

```text
idea -> company goal -> department -> SOP -> evidence gate -> revenue loop -> cloneable playbook
```

For a one-page operator map of the full stack, see `docs/mekongmind-multilayer-sop-map.md`.

## Goal Contract Kernel

`/goal` is the kernel contract. It must not create a thin task note. Every direct goal is a CEO Solo Company operating state with this nested control path:

```text
goal
  -> CEO Solo Company
  -> Agentic department
  -> department room
  -> SOP cell
  -> command/agent capability
  -> evidence contract
  -> MRR ladder
  -> clone memory
```

This is the main fix for old architecture chaos:

- Mekong CLI remains valuable for business, GTM, revenue, fulfillment, and RaaS orchestration, but its commands are not allowed to float as a menu.
- ClaudeKit remains valuable for full-stack build, tests, review, deploy, and infra, but it is not allowed to define success without market, checkout, MRR, and retention proof.
- MekongMind uses `/goal` to bind both stacks into one operating contract with gate doctrine, department ownership, artifact proof, and next-bottleneck routing.

Every new `/goal` file must include `SoloCompanyMode`, `RevenueTarget`, `CurrentGate`, the Agentic Department Stack, Department SOP Mesh, Command Chaos Resolution, and Required Inspection Commands. If any of these are missing, the goal is under-specified and must not be treated as a live $1M MRR factory objective.

## Focus And Project Isolation Doctrine

`/goal` is powerful enough to mint a Solo Company loop, so it must also be narrow enough to prevent cross-project chaos.

Rules:

- One terminal session owns one workspace. The active project is the current repository root, not a global idea pool.
- `/goal` must write and read state under this project unless the operator explicitly passes a project scope.
- The coordinator must inspect the current goal, current gate, department ledger, and evidence contracts before suggesting any command.
- A command route is not permission. `me solo route <cmd>` only says where the command belongs; `me solo allow <cmd> <gate>` says whether it may run now.
- Terminal automation must not `cd` into another product or run another product's goal loop as a side effect.
- If two goals exist, the active one is the latest scoped goal in `state/` unless the operator selects another scope explicitly.
- When context is ambiguous, CEO Command must stop at inspection commands: `me goal show`, `me solo bottlenecks --strict`, `me solo gates verify --strict`, and `me solo allow <command> <gate>`.

This doctrine protects the $1M MRR path from command sprawl. Mekong CLI, ClaudeKit, local LLMs, and daemon loops can only act inside the current goal contract, current department room, current gate doctrine, and required evidence path.

## Source Roles

| Source | Role | Owns |
|---|---|---|
| Mekong CLI | Business revenue orchestration | idea, market, offer, GTM, sales, revenue, fulfillment, multi-project RaaS |
| ClaudeKit | Engineering verification factory | full-stack code, tests, review, infra, deploy, runtime quality |
| MEKONG_WRAPPER | Harness DNA and command router | goal state, department routing, SOP gates, evidence contracts, continuous loop, clone memory |

## Source Fusion Matrix

`mekongmind_source_fusion_matrix` explains why the two old architectures must be fused instead of used as separate menus:

```bash
me solo fusion
me solo fusion mekong-cli
me solo fusion claudekit
me solo fusion revenue
```

Each source row defines:

```text
source -> legacy strength -> failure if alone -> merged role -> departments -> command groups -> control layers -> MRR contribution -> anti-pattern
```

The important distinction:

- `mekong-cli` supplies business, GTM, revenue, fulfillment, and RaaS orchestration, but without Mekongmind it becomes a noisy command surface.
- `claudekit` supplies engineering, tests, review, deploy, and runtime quality, but without Mekongmind it can ship software that still has no buyer, checkout, MRR, or retention.
- `me-wrapper` supplies the harness kernel: state, routing, gates, evidence contracts, doctrine, policy, daemon loop, and clone memory.

Together they become a governed factory: business motion decides what deserves to be built, engineering produces a sellable and verified product, and the wrapper enforces proof before each gate moves.

## Local LLM Runtime

`mekongmind_local_llm_runtime` defines the local-first inference substrate for the Solo Company loop:

```bash
me solo local-llm
me solo local-llm qwen3
me solo local-llm coder
```

The runtime policy is designed for Apple Silicon:

- M1 Max 64GB: `qwen3.6:35b-cc` (Q4_K_M ~20GB) as primary reasoning for all departments; `qwen3.5:2b` (~2.6GB) as fast classifier/fallback. Total: ~23GB disk, single-model routing per session.
- M1 16GB: 3B-14B quantized models only for continuous autonomous loops, with cloud/max escalation recorded when local models are insufficient.
- Primary runtime: Ollama; secondary options: MLX-LM and llama.cpp Metal.

This layer exists to prevent data gaps in autonomous operation. A local model may propose routing, summarize state, critique blockers, draft artifacts, or generate scoped patches, but it cannot pass a gate by itself. Gate advancement still requires the relevant artifact JSON, required evidence fields, proof rule, and validation command.

No-gap invariants:

- No LLM response is evidence unless written to an artifact contract.
- No department handoff without artifact path, required fields, proof rule, and next bottleneck.
- No cloud escalation without recording why local model was insufficient.
- No `$1M MRR` claim without provider-backed revenue evidence and fulfillment/clone-memory proof.
- No autonomous loop may run more than one large local model concurrently on M1/M1 Max without explicit memory budget.

## CEO Operating Map

`me solo map` is the executive index across all lower layers:

```bash
me solo map
me solo map mvp-live
me solo map revenue
me solo map claudekit
```

It derives one row per operating layer from the registry and joins:

```text
layer -> gate -> next gate -> departments -> source mix -> command groups -> SOP focus -> proof artifacts -> blocked work -> revenue milestones -> control layers -> failure signal
```

This is the single picture to inspect when the command surface feels noisy. `me solo fusion` explains why the old architectures must merge. `me solo map` shows how that merger moves through the factory from idea to company, offer, MVP, channel, revenue, fulfillment, and clone memory.

## Execution Journey

`me solo journey [filter]` is the deepest trace view. It joins operating layers, autonomous rooms, SOP mesh cells, gate doctrine, evidence contracts, and the revenue ladder:

```bash
me solo journey
me solo journey sales-revenue
me solo journey claudekit
me solo trace mvp-live
```

Each row answers:

```text
layer -> department -> owner -> source mix -> room -> queue -> checkpoints -> SOP cells -> commands -> agents -> evidence -> proof -> blockers -> next gate -> MRR milestone -> failure signal
```

This is the view to use when the old Mekong CLI and ClaudeKit command surfaces feel chaotic. It shows why a ClaudeKit command such as `nextjs` belongs inside Engineering/Quality/Platform after offer validation, and why a Mekong command such as `revenue` cannot claim success until Sales/Revenue evidence and provider-backed MRR are present.

## Department Work Packet

`me solo brief <department>` compiles an actionable packet for one Agentic room:

```bash
me solo brief sales-revenue
me solo brief engineering-factory
me solo brief customer-success
```

The packet joins department blueprint, capability mesh, evidence contract, and gate doctrine:

```text
mission -> owner/support agents -> inputs -> decision rights -> output artifacts -> required fields -> proof rule -> SOP cells -> allowed commands -> blocked work -> handoff
```

This is the view an agent should receive when assigned to a department. It avoids vague instructions like "do sales" or "build MVP" by naming exactly which SOP stages to run, which commands/agents belong there, what proof must be written, and what remains blocked.

## Autonomous Department Rooms

`mekongmind_department_room_system` is the room-control layer that makes each department autonomous instead of just named:

```bash
me solo rooms
me solo rooms sales-revenue
me solo room engineering-factory
```

Each room contract defines:

```text
department -> room type -> queue policy -> WIP limit -> intake contract -> cadence -> checkpoints -> decision loop -> escalation -> anti-chaos rules -> done condition -> evidence artifact
```

This is the missing layer between department labels and SOP execution. It explains how a room decides what enters its queue, how many motions it can run at once, when it must block downstream work, how it escalates contradictions, and what evidence closes the room. That is what turns the old Mekong CLI command pile and ClaudeKit specialist pool into a governed Solo Company factory.

## Layer Stack

| Layer | Name | Purpose | Canonical Evidence |
|---|---|---|---|
| L0 | Goal Intent | Capture founder idea and target | `state/goal-*.md` |
| L1 | Company Command | Convert intent into active company objective | `state/evidence/company-blueprint.json` |
| L2 | Department Mesh | Route work to owner departments | `agents/registry.json` |
| L3 | SOP Chain | Define repeatable department execution | `sops/departments/*.md` |
| L4 | Evidence Gates | Prove each stage before advancing | `state/gates/<goal-id>.json` |
| L5 | Revenue Loop | Track MRR and provider evidence | `state/revenue/<goal-id>.json` |
| L6 | Fulfillment Loop | Prove customer outcome delivery | `state/evidence/fulfillment-stable.json` |
| L7 | Clone Memory | Extract SOPs and decisions for the next RaaS | `state/evidence/scale-ready.json` |

The canonical machine-readable layer stack is `mekongmind_operating_model.operating_layers` in `agents/registry.json`.
Inspect it with:

```bash
me solo layers
me solo layers L2
me solo layers engineering-factory
me solo layers revenue
```

Each layer must define source mix, owner departments, command groups, SOP focus, entry signal, exit gate, handoff target, and failure signal. This is the view that explains how the old Mekong command surface and ClaudeKit engineering agents become one factory instead of two disconnected CLIs.

## Multi-Layer SOP Control Spine

The visible architecture is only the top of the system. The real operating picture is the full spine below it:

```text
L0 founder intent
  -> L1 CEO company command
  -> L2 Agentic department
  -> L2.5 department room
  -> L3 SOP stage
  -> L3.5 capability cell
  -> L4 command/agent execution
  -> L5 evidence contract
  -> L6 gate doctrine
  -> L7 MRR ladder
  -> L8 fulfillment proof
  -> L9 clone memory
```

Each layer has one job:

| Layer | Control Question | Must Prove |
|---|---|---|
| Founder intent | What outcome matters? | Specific goal, target, constraint |
| CEO command | Should this become a company objective? | Active scoped goal and current gate |
| Department | Who owns the bottleneck? | Department owner, metric, gate artifact |
| Room | How does the department work autonomously? | Queue policy, WIP limit, checkpoints, escalation |
| SOP stage | What repeatable motion runs now? | Stage order and handoff |
| Capability cell | Which old commands are valid here? | Command groups, agents, proof, failure signal |
| Command execution | What tool runs? | Route and allow decision |
| Evidence contract | What artifact counts as done? | Required fields and validation |
| Gate doctrine | Can the company advance? | All required departments and proof artifacts |
| MRR ladder | Is revenue actually moving? | Provider-backed MRR evidence |
| Fulfillment | Can customers receive the promised outcome? | Delivery, support, retention proof |
| Clone memory | Can this become repeatable RaaS DNA? | Updated SOPs, decisions, reusable playbook |

No layer may skip the next lower proof. A department name without a room is only an org chart. A SOP stage without a capability cell is a manual gap. A command without gate permission is command chaos. A shipped MVP without MRR and fulfillment proof is not a $1M MRR engine.

## Department Operating Blueprints

Each department also owns a machine-readable `operating_blueprint` in `agents/registry.json`.
Inspect it with:

```bash
me solo blueprint sales-revenue
me solo blueprint engineering-factory
me solo department blueprint customer-success
```

The blueprint is the layer below the SOP chain. It defines upstream inputs, decision rights, output artifacts, handoff targets, automation cadence, escalation triggers, and success definition. This prevents departments from being only names in an org chart: every room in Mekongmind must know what it consumes, what it is allowed to decide, what proof it writes, and where the factory moves next.

## Department Capability Mesh

`mekongmind_department_capability_mesh` is the layer inside each department:

```bash
me solo mesh
me solo mesh sales-revenue
me solo mesh checkout
me solo mesh nextjs
```

Each mesh cell maps:

```text
department -> SOP stage -> command groups -> agents -> proof -> handoff -> failure signal
```

This is the deeper view that makes the old command chaos legible. Mekong CLI commands become business, GTM, revenue, fulfillment, and memory capabilities. ClaudeKit commands become engineering, quality, platform, and verification capabilities. MEKONG_WRAPPER connects them through proof contracts, so a command can no longer float around as an isolated tool.

The mesh must cover every `sop_chain` stage for every department. If a department has a SOP stage without a mesh cell, the factory has a hidden manual step. If a mesh cell has no proof or failure signal, it is not autonomous enough for CEO Solo operation.

## Gate Execution Doctrine

`mekongmind_gate_execution_doctrine` is the policy layer around each gate:

```bash
me solo doctrine
me solo doctrine offer-validated
me solo doctrine mvp-live
me solo doctrine revenue
```

Each doctrine row defines:

```text
gate -> purpose -> entry signal -> exit signal -> required departments -> required SOP stages -> allowed command groups -> blocked work -> proof artifacts -> next gate -> failure signal
```

This layer prevents the two old architectures from leaking back into chaos. For example, ClaudeKit commands such as `nextjs`, `react`, `test`, and `deploy` are allowed inside `mvp-live`, but they are blocked until `offer-validated` passes. Mekong revenue commands such as `sales`, `pricing`, and `revenue` are allowed inside `first-revenue`, but they cannot claim the objective complete without provider-backed MRR evidence and later fulfillment/scale gates.

Doctrine is stricter than command routing. Routing answers "where does this command belong?" Doctrine answers "is this command allowed at this gate, what proof must it produce, and what remains blocked until that proof exists?"

`me solo allow <command> [current-gate]` applies doctrine to one command:

```bash
me solo allow nextjs company-blueprint
me solo allow nextjs mvp-live
me solo allow revenue first-revenue
```

This is the enforcement view. It answers `ALLOW` or `BLOCK`, shows the routed department, the command's allowed gates, proof artifacts, blocked work, and reason. This keeps ClaudeKit full-stack commands from running before offer proof and keeps Mekong revenue commands from claiming progress without provider-backed MRR evidence.

## Handoff Graph

The handoff graph is derived from department blueprints, not maintained separately:

```bash
me solo graph
me solo graph --mermaid
```

Each edge is `department -> next department` with the gate and output artifact that unlocks the handoff. This makes bottlenecks explicit: if `engineering-factory` is complete but `quality-compliance` or `platform-operations` has not produced `mvp-live` proof, Growth/Sales should not run as if the product were live.

## Bottleneck Matrix

`me solo bottlenecks [--strict]` is the operating-room view for the current goal:

```bash
me solo bottlenecks
me solo bottlenecks --strict
```

It derives the next bottleneck, current MRR gap, department readiness, artifact path, blocker, and proof rule from the current goal, department ledger, revenue metrics, and evidence contracts. In strict mode, a department is not ready just because a local ledger says `ready`; the linked artifact must pass its evidence contract.

## Revenue Ladder

`me solo ladder` is the revenue operating ladder from first paid customer to first `$1M MRR`:

```bash
me solo ladder
```

The canonical ladder is `mekongmind_operating_model.revenue_ladder` in `agents/registry.json`. Each milestone defines target MRR, gate, owner departments, evidence rule, SOP focus, and next bottleneck. This prevents the system from jumping from "first revenue" directly to "$1M" without the intermediate GTM, fulfillment, operations, and clone-readiness proof needed to make the revenue durable.

## Lifecycle

1. `idea-to-company`: CEO Command turns raw idea into one company blueprint.
2. `terrain-to-offer`: Market Intelligence and Product Strategy validate ICP, pain, wedge, offer, pricing.
3. `offer-to-product`: Engineering Factory, Quality & Compliance, and Platform Operations build, test, ship, observe.
4. `product-to-revenue`: Growth Marketing and Sales & Revenue turn traffic and demand into MRR.
5. `revenue-to-retention`: Customer Success fulfills the promised outcome without founder bottleneck.
6. `retention-to-clone`: Knowledge & Memory extracts the operating playbook for the next Solo CEO clone.

## Non-Negotiable Invariants

- No command is naked: every command resolves as `command -> agent -> department -> SOP -> gate`.
- No engineering before offer validation unless CEO Command records explicit exception evidence.
- No deploy is done until Quality & Compliance and Platform Operations prove green release and health evidence.
- No `$1M MRR` claim is done until Sales & Revenue records provider-backed MRR evidence.
- No clone is allowed until Knowledge & Memory records reusable SOP and decision evidence.

## CLI Evidence

```bash
me solo dna
me solo fusion
me solo fusion claudekit
me solo map
me solo map mvp-live
me solo journey
me solo journey sales-revenue
me solo brief sales-revenue
me solo rooms sales-revenue
me solo room sales-revenue
me solo departments
me solo commands
me solo commands revenue
me solo commands nextjs
me solo mesh
me solo mesh sales-revenue
me solo doctrine
me solo doctrine mvp-live
me solo allow nextjs company-blueprint
me solo allow revenue first-revenue
me solo contract sales-revenue
me solo contract offer-validated
me solo artifact template sales-revenue
me solo artifact template sales-revenue --write state/evidence/first-revenue.json
me solo artifact validate sales-revenue state/evidence/first-revenue.json
me solo route nextjs
me solo sop sales-revenue
me solo loop --once --run
me solo loop --once --strict
me solo gates verify
me solo gates verify --strict
me solo revenue
```

## Command Alignment Audit

`me solo commands [filter]` is the audit view for the old command chaos. It expands each command as:

```text
command -> agent -> source -> department -> lifecycle stage -> gate -> SOP file
```

This matters because the merged system should not merely know that `nextjs` maps to an engineering agent or `revenue` maps to a business agent. It must prove where each command sits in the Solo Company factory:

- ClaudeKit-heavy commands should land in `offer-to-product` through Engineering, Quality, or Platform Operations.
- Mekong-heavy commands should land in `idea-to-company`, `terrain-to-offer`, `product-to-revenue`, retention, or clone-memory loops.
- Shared agents must still resolve to one operating department and one gate.
- Any command with unknown source, stage, gate, or SOP is a broken operating contract.

`me solo capabilities [filter]` groups the same command map by lifecycle stage, department, gate, source mix, command set, and agent set. This is the more useful executive view when the raw command list is too noisy: it shows which capabilities are Mekong business/revenue capabilities, which are ClaudeKit engineering/verification capabilities, and where both stacks overlap.

## Evidence Contracts

`me solo contract [department|gate]` is the proof contract view. It expands each department into:

```text
department -> gate -> artifact path -> required fields -> proof rule
```

This prevents thin artifacts such as "done" notes from replacing the actual operating evidence. For example:

- `sales-revenue` must prove lead, qualification, offer, price, checkout URL, payment status, provider, current MRR, and next action.
- `platform-operations` must prove provider, commit, build ID, health URL, HTTP status, version match, rollback plan, and monitoring.
- `knowledge-memory` must prove decision log, SOP changes, reusable playbook, project-specific notes, open questions, clone readiness, and next bottleneck.

`me solo artifact template <department> [--write path]` renders the JSON skeleton for that department contract. Blank templates intentionally fail strict validation until every required proof field is filled with real evidence.

`me solo artifact validate <department> [json]` is the strict check. A generic artifact with only `gate`, `owner`, `status`, and `note` is not enough for department proof; it must contain all required fields and those fields must be non-empty.

`me solo gates verify --strict` applies those contracts at gate level. Shared gates require every owning department contract:

- `offer-validated`: Market Intelligence and Product Strategy.
- `mvp-live`: Engineering Factory, Quality & Compliance, and Platform Operations.
- single-owner gates such as `scale-ready` validate their owning department contract.

`me solo loop --once --strict` applies the same principle to department routing. A department ledger entry is not enough; the ledger artifact must validate against that department contract before the loop advances to the next department.

## Completion Boundary

This DNA is an operating contract. It proves structure, routing, and local evidence loops. It does not by itself prove a live product reached `$1M MRR`. That requires provider-backed revenue evidence and real production/customer-success artifacts.
