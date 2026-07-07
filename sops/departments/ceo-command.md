# Department SOP: CEO Command
Owner: planner agent
Department: ceo-command
GateArtifact: company-blueprint
ArtifactPath: state/evidence/company-blueprint.json
Metric: one active company goal with clear gate, target, and next constraint

## Purpose

Convert raw founder intent into one focused CEO Solo Company objective with revenue target, constraints, current gate, and next bottleneck.

## Trigger

Run when a user enters an idea, changes priority, requests a new RaaS clone, or asks the factory to decide the next move.

## Agentic Room Contract

- RoomType: strategic command room.
- WIP: 1 active goal, 1 active gate exception, 1 current bottleneck.
- Intake: idea must name buyer hypothesis, pain, target outcome, constraints, and first $1M MRR intent.
- DecisionLoop: accept idea -> freeze company blueprint -> approve gate or kill -> assign next room -> record exception if doctrine is bypassed.
- Escalation: if ICP, target, budget, or kill criteria are missing, block downstream rooms until CEO evidence is written.
- AntiChaos: no parallel company goals; no build before gate decision; no vague objective without MRR target.

## Command Admission

Commands enter this room only after `me goal show`, `me solo bottlenecks --strict`, and `me solo allow <command> <current-gate>` confirm the current project goal.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| idea-intake | idea, goal | Raw idea captured with buyer, pain, target, constraints, and desired outcome |
| company-blueprint | plan, solo | `state/evidence/company-blueprint.json` and `state/goal-*.md` name the next department and current gate |
| gate-review | chain | CEO approval, exception, or kill note links to the gate evidence being reviewed |
| capital-allocation | plan | Time, budget, model, and constraint allocation recorded before build or launch |

## SOP Steps

1. Capture idea, founder intent, target customer, promise, constraints, and time horizon.
2. Normalize the goal into one active company objective with first `$1M MRR` as the default revenue milestone.
3. Select the current gate and declare the next department owner.
4. Allocate scope and capital: what to build, validate, sell, defer, or kill.
5. Write or update the company blueprint artifact.

## Evidence Contract

`me solo run ceo-command ready "company blueprint ready"` must produce `state/evidence/company-blueprint.json` with the required company blueprint fields below. Generic fields such as department, owner, gate, status, note, and timestamp are useful metadata, but they are not sufficient for strict validation.

## Operating Checklist

- Confirm one active objective, one target customer, one revenue milestone, one current gate.
- Record founder constraints: cash, time, skills, legal, data, delivery capacity.
- Decide next bottleneck by evidence, not preference.
- Reject parallel projects unless Knowledge & Memory has clone-ready evidence.

## Required Evidence Fields

- `idea`, `target_customer`, `pain`, `offer_direction`, `target_mrr`, `current_gate`, `next_department`, `kill_criteria`.

## Automation Hooks

- `me idea "<goal>"` creates the durable goal state.
- `me solo loop --once` recomputes the next department.
- `me solo artifact write company-blueprint planner ready "<note>"` writes blueprint evidence.

## Escalation Rules

- Escalate to user only for strategic ambiguity: target customer conflict, revenue target conflict, or kill/pivot decision.

## Handoff

Next department is Market Intelligence unless the blueprint already has validated terrain. Handoff must include ICP hypothesis, painful job, offer direction, and explicit unknowns.

## Stop Conditions

- No ICP hypothesis.
- No revenue target.
- More than one competing active objective.
- Missing CurrentGate in goal state.
