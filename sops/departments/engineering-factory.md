# Department SOP: Engineering Factory
Owner: fullstack-developer agent
Department: engineering-factory
GateArtifact: mvp-live
ArtifactPath: state/evidence/mvp-live.json
Metric: production-ready product artifact

## Purpose

Build the minimum sellable full-stack RaaS product, integrations, automations, checkout surface, and agent workflow needed to deliver the offer.

## Trigger

Run after Product Strategy defines MVP scope and acceptance criteria.

## Agentic Room Contract

- RoomType: validated-offer product factory.
- WIP: 1 MVP workflow, 1 integration risk, 1 production hardening queue.
- Intake: requires offer brief, MVP acceptance criteria, checkout/provider expectation, and fulfillment boundary.
- DecisionLoop: design sellable workflow -> implement minimum path -> connect real integrations -> prove build/test -> hand off quality evidence.
- Escalation: if checkout, data, or delivery path is missing, block build and request Product Strategy correction.
- AntiChaos: no coding from raw idea; no demo-only product proof; no mock integration as production evidence.

## Command Admission

ClaudeKit/full-stack commands enter this room only when the current gate allows MVP work. `me solo route <command>` is insufficient; `me solo allow <command> <current-gate>` must allow it.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| technical-design | web, api, database, ai | Routes, APIs, data model, integrations, and checkout path are planned |
| mvp-build | frontend, backend, nextjs, react | Minimum sellable workflow is implemented against acceptance criteria |
| integration | api, database, kafka | External services, persistence, and checkout/provider paths are connected or explicitly sandboxed |
| production-hardening | test, build, typescript | Build command, tests run, known risks, and handoff notes are recorded |

## SOP Steps

1. Translate offer scope into routes, APIs, database objects, agent tools, and jobs.
2. Implement the smallest production-capable workflow with real integrations, not mock-only paths.
3. Add checkout, analytics, error states, and operational hooks required for sales.
4. Run build and relevant tests before handing off.
5. Write MVP artifact evidence with build status, changed surfaces, and open risks.

## Evidence Contract

`me solo run engineering-factory ready "MVP artifact ready"` must write `state/evidence/mvp-live.json`.

## Operating Checklist

- Implement the revenue path first: entry, core workflow, checkout, delivery, support contact.
- Use real integrations or explicit sandbox providers; no hidden mock-only success path.
- Keep architecture boring enough for clone reuse across RaaS projects.
- Record build/test commands and every unverified assumption before handoff.

## Required Evidence Fields

- `routes`, `apis`, `data_model`, `integrations`, `checkout_path`, `build_command`, `tests_run`, `known_risks`.

## Automation Hooks

- `me solo route nextjs` and `me solo route api` show engineering ownership.
- `me solo artifact write mvp-live fullstack-developer ready "<note>"` writes MVP evidence.
- `me solo daemon run --passes N` can continue once artifact evidence exists.

## Escalation Rules

- Escalate to Product Strategy if acceptance criteria are unclear, checkout promise is unsupported, or MVP scope expands beyond offer.

## Handoff

Next department is Quality & Compliance. Handoff must include changed files, commands run, test gaps, risk notes, and deploy prerequisites.

## Stop Conditions

- MVP path only works with fake data.
- Build cannot run.
- Checkout requirement omitted.
- No handoff notes for test/review.
