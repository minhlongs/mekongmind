# Department SOP: Knowledge & Memory
Owner: docs-manager agent
Department: knowledge-memory
GateArtifact: scale-ready
ArtifactPath: state/evidence/scale-ready.json
Metric: operating knowledge reusable by the next CEO Solo clone

## Purpose

Turn decisions, experiments, fixes, customer learnings, and SOP improvements into reusable DNA for Mekongmind and future CEO Solo clones.

## Trigger

Run after each gate, after production/revenue/customer events, or before cloning/scaling a RaaS project.

## Agentic Room Contract

- RoomType: clone memory and SOP refinery room.
- WIP: 1 decision log, 1 SOP delta batch, 1 clone-readiness packet.
- Intake: requires passed gates, department artifacts, customer outcomes, open questions, and SOP deltas.
- DecisionLoop: capture decision -> update SOP delta -> extract reusable playbook -> mark clone readiness or next bottleneck.
- Escalation: if evidence is thin or project-specific, block clone claim and request missing department proof.
- AntiChaos: no playbook from anecdotes; no clone without reusable SOP; no memory update detached from evidence.

## Command Admission

Docs/memory commands enter this room only when tied to evidence from the current project. Clone memory must separate reusable MekongMind DNA from project-specific notes.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| decision-log | journal, notes | Decision log captures why gates passed, failed, or changed |
| sop-update | docs, documentation | SOP deltas are linked to actual evidence and bottlenecks |
| playbook-extract | docs, journal | Reusable playbook separates generic Mekongmind DNA from project-specific notes |
| clone-sync | goal, solo | Clone readiness, open questions, next bottleneck, and next CEO Solo target are recorded |

## SOP Steps

1. Capture decision log, evidence links, command output, and gate outcome.
2. Update affected SOPs, docs, playbooks, templates, and unresolved questions.
3. Extract reusable patterns that can apply to the next niche or CEO Solo clone.
4. Identify missing automation and measurement gaps.
5. Write scale-ready evidence when operating cadence, metrics, and SOPs support replication.

## Evidence Contract

`me solo run knowledge-memory ready "clone playbook updated"` must write `state/evidence/scale-ready.json`.

## Operating Checklist

- Extract decisions, SOP deltas, reusable prompts, agent routing rules, and failure patterns.
- Update docs only with facts proven by artifacts, tests, revenue, or customer evidence.
- Mark what is reusable across RaaS clones and what is project-specific.
- Keep unresolved questions explicit so the next loop knows the real bottleneck.

## Required Evidence Fields

- `decision_log`, `sop_changes`, `reusable_playbook`, `project_specific_notes`, `open_questions`, `clone_readiness`, `next_bottleneck`.

## Automation Hooks

- `me solo route docs` and `me sops list` confirm knowledge ownership.
- `me solo artifact write scale-ready docs-manager ready "<note>"` writes clone-readiness evidence.
- `me solo dna` should stay aligned with any structural operating-model changes.

## Escalation Rules

- Escalate to the owning department when evidence is missing; escalate to CEO Command if clone-readiness conflicts with active revenue work.

## Handoff

Next step is CEO Command for the next bottleneck, scale decision, or new clone. Handoff must include lessons, updated SOPs, reusable templates, and unresolved risks.

## Stop Conditions

- Evidence exists only in chat, not files.
- SOPs are stale.
- Reusable pattern not extracted.
- Scale decision lacks metrics.
