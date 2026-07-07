# Mekongmind Department SOP Restructure

Date: 260601

## Problem

Old Mekong CLI surface has many business commands but weak shape. ClaudeKit has strong full-stack/code specialists but does not own revenue. Existing SOP files were mostly audit/deploy/code-review, with owners like `audit-expert`, `security-expert`, `code-expert`, and `orchestrator` that are not canonical runtime agents in this wrapper.

## Restructure

Added canonical `mekongmind_departments` in `agents/registry.json`.

Added canonical `mekongmind_operating_model` in `agents/registry.json`.
Added canonical `mekongmind_evidence_contracts` in `agents/registry.json`.

This model records:

- Mekong CLI as business/revenue orchestration layer
- ClaudeKit as engineering/verification factory layer
- MEKONG_WRAPPER as harness DNA, SOP gate, command router, and clone-memory layer
- six lifecycle stages from `idea-to-company` through `retention-to-clone`
- invariants that prevent naked commands, premature engineering, premature deploy, unsupported `$1M MRR` claims, and clone without reusable SOP evidence
- department proof contracts that bind each department to gate, artifact path, required fields, and proof rule

Each department now has:

- `id`
- `name`
- `mission`
- `owner_agent`
- `support_agents`
- `owns_commands`
- `sop_chain`
- `gate_artifact`
- `sop_file`
- `metric`

## Department Layers

1. CEO Command
2. Market Intelligence
3. Product Strategy
4. Engineering Factory
5. Quality & Compliance
6. Platform Operations
7. Growth Marketing
8. Sales & Revenue
9. Customer Success
10. Knowledge & Memory

## Runtime Surface

- `me solo departments` lists department ownership, gate artifact, and SOP file
- `me solo dna` shows the operating model: source roles, lifecycle, and invariants
- `me solo layers [filter]` shows the multi-layer SOP stack: source mix, departments, command groups, SOP focus, gate, handoff, and failure signal
- `me solo graph [--mermaid]` derives the department handoff/dependency graph from blueprints
- `me solo bottlenecks [--strict]` derives next bottleneck and department readiness from current goal, ledger, revenue, and contracts
- `me solo ladder` shows the revenue ladder from first paid customer to first $1M MRR
- `me solo blueprint <department>` shows department inputs, decision rights, output artifacts, handoffs, cadence, escalation triggers, and success definition
- `me solo commands [filter]` audits command -> agent -> source -> department -> lifecycle stage -> gate -> SOP file
- `me solo capabilities [filter]` groups old command chaos into stage/department/gate/source capabilities
- `me solo contract [department|gate]` shows required evidence fields and proof rule
- `me solo sop <department>` shows mission, commands, SOP chain, gate artifact, SOP file, metric
- `me solo route <command>` shows command -> agent -> department -> gate -> SOP
- `me agents routes [keyword]` lists the normalized command taxonomy
- `me solo run <department> [status] [note]` writes owner evidence to the department gate artifact
- `me solo loop --once` resolves the next department from the department ledger, gate evidence, and MRR gap
- `me solo loop --once --run` executes one local coordinator pass: optional revenue file sync, department artifact write, ledger update, gate verification, next bottleneck recompute
- `me solo daemon run --passes N --interval S` repeats local coordinator passes with lock/log/status/retry/circuit-breaker/stop controls
- `me solo daemon status|stop|clear-stop` exposes and controls the loop runner
- `me solo service print|write|install|status|uninstall` exposes the loop runner as a macOS LaunchAgent service contract
- `me solo gates` shows the SOP gate evidence timeline from `state/gates/<goal-id>.json`
- `me solo gates verify` derives gate readiness from department artifacts under `PROJECT_ROOT`
- `me solo gate advance <gate> [source] [note]` records gate evidence and updates `CurrentGate`
- `me solo artifact list` prints the canonical gate artifact contract
- `me solo artifact write <gate> [owner] [status] [note]` writes the standard artifact consumed by `me solo gates verify`
- `me solo artifact template <department> [--write path]` renders the strict evidence JSON skeleton from registry contracts
- `me solo artifact validate <department> [json]` rejects missing or empty required evidence fields before strict loop/gate advancement
- `me solo revenue` shows current MRR, target MRR, and gap for the Sales & Revenue gate
- `me solo revenue set <mrr> [source] [note]` writes revenue evidence to `state/revenue/<goal-id>.json` and updates goal fields
- `me solo revenue sync file <json>` imports external provider/export evidence with `current_mrr`, `mrr`, `monthly_recurring_revenue`, or active subscription rows
- `me solo revenue sync polar` supports `POLAR_MRR_FILE` for export-based sync, or `POLAR_MRR_ENDPOINT + POLAR_ACCESS_TOKEN` for authenticated endpoint sync
- `me sops list` shows department SOP chains and file SOP catalog
- `me sops show <department|file>` inspects either canonical department SOP or markdown SOP file
- `me idea "<goal>"` now writes Agentic Department Stack and Department SOP Mesh into goal state

## Department SOP Files

Added detailed SOP files under `sops/departments/`:

- `ceo-command.md`
- `market-intelligence.md`
- `product-strategy.md`
- `engineering-factory.md`
- `quality-compliance.md`
- `platform-operations.md`
- `growth-marketing.md`
- `sales-revenue.md`
- `customer-success.md`
- `knowledge-memory.md`

Each file defines purpose, trigger, SOP steps, evidence contract, handoff, and stop conditions.

Each department SOP now also defines:

- `Operating Checklist`
- `Required Evidence Fields`
- `Automation Hooks`
- `Escalation Rules`

These sections make each department executable as an autonomous factory station instead of a thin prose note.
The same required evidence fields are mirrored in `mekongmind_evidence_contracts`, so tests can prove SOP prose and registry contracts do not drift.

Added department ledger:

- `state/departments/<goal-id>.json`
- written by `me solo run <department> ...`
- consumed by `me solo loop --once` so the coordinator knows the next department instead of printing static instructions
- advanced by `me solo loop --once --run` for one safe local plan-execute-verify pass
- repeated by `me solo daemon run --passes N --interval S` with `state/loops/solo-loop.lock`, `state/loops/solo-loop.log`, `state/loops/solo-loop-status.json`, and `state/loops/STOP`
- protected by `--retries N` and `--max-failures N`; when failures reach the limit, the runner writes STOP and marks status `circuit-open`
- persisted by `me solo service ...` as a LaunchAgent plist that runs `me solo daemon run --forever` with explicit interval, retry, and circuit-breaker arguments

Added command taxonomy:

- all `command_to_agent` entries now resolve to a Mekongmind department
- routing order: exact department ownership, agent owner/support ownership, then command keyword taxonomy
- this folds old Mekong CLI and ClaudeKit commands into one operating model instead of keeping two noisy command lists
- command alignment audit now proves every command has source, lifecycle stage, gate artifact, and SOP file

Added operating DNA doc:

- `docs/mekongmind-operating-dna.md`
- maps old Mekong CLI + ClaudeKit + wrapper into an 8-layer Solo Company OS
- defines canonical evidence for goal, company, department, SOP, gate, revenue, fulfillment, and clone-memory layers

## Legacy SOP Normalization

Normalized active SOP and architecture docs away from ghost owners inherited from old Mekong CLI notes:

- `audit-expert` -> `code-reviewer` / Quality & Compliance
- `code-expert` -> `code-quality-linting-expert` or `code-reviewer`
- `security-expert` -> `code-reviewer`
- `orchestrator agent` -> `planner`
- `cook-agent` -> `fullstack-developer`
- `revenue-agent` / `finance-agent` / `sales-agent` -> `business-analyst`
- `devops-agent` / `infrastructure-agent` -> `infrastructure-github-actions-expert`

Added tests so active SOP owner/agent refs must exist in `agents/registry.json`, and core runtime docs cannot reintroduce those ghost agents.

## Strategic Effect

Mekongmind is no longer just command aggregation. It is a multi-layer operating model where:

- Mekong owns business/revenue orchestration
- ClaudeKit owns engineering/verification depth
- Wrapper owns SOP mesh, gate state, and department routing

## Unresolved Questions

- Live Polar endpoint shape still needs project-specific confirmation before using production secrets; export and endpoint adapter contracts now exist.
- Existing legacy SOP files still need progressive owner normalization.
