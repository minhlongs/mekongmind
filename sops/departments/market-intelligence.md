# Department SOP: Market Intelligence
Owner: research-expert agent
Department: market-intelligence
GateArtifact: offer-validated
ArtifactPath: state/evidence/offer-validated.json
Metric: validated ICP and demand signal before build

## Purpose

Prove the terrain before build: ICP, pain, urgency, alternatives, buying trigger, willingness to pay, and market wedge.

## Trigger

Run after CEO Command creates a company blueprint, or whenever the current offer lacks demand proof.

## Agentic Room Contract

- RoomType: terrain and demand room.
- WIP: 2 active ICP hypotheses, 1 competitor map, 1 demand proof path.
- Intake: requires company blueprint, founder hypothesis, target customer guess, and constraints.
- DecisionLoop: narrow ICP -> test pain urgency -> compare alternatives -> score demand -> hand off or reject terrain.
- Escalation: if pain is weak, buyer unreachable, or wedge unclear, return to CEO Command with no-build recommendation.
- AntiChaos: no broad market essays; no research without buyer decision; no build signal from vanity TAM.

## Command Admission

Commands enter this room only after the active project goal and gate are confirmed. Research output cannot unlock build unless the evidence contract passes.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| market-map | research, analysis | Market map names buyer group, alternatives, spend pattern, and reachable channels |
| customer-discovery | investigate | Customer pain, trigger, urgency, authority, and workflow context are recorded |
| competitor-scan | research, analysis | Competitors, substitutes, and wedge are explicit |
| demand-proof | brainstorm, analysis | Demand signal, evidence source, and confidence level pass contract |

## SOP Steps

1. Map the market category, adjacent tools, substitutes, and budget owner.
2. Define ICP, excluded customers, painful workflow, and current workaround.
3. Scan competitors and extract pricing, positioning, promises, channels, and proof points.
4. Collect demand signals from search, communities, outbound replies, calls, waitlist, LOI, or checkout intent.
5. Write the offer validation artifact with confidence, risks, and next test.

## Evidence Contract

`me solo run market-intelligence ready "demand proof captured"` must write `state/evidence/offer-validated.json`.

## Operating Checklist

- Validate painful job, buyer, budget owner, trigger event, and current substitute.
- Compare at least three alternatives: direct competitor, manual workflow, no-action cost.
- Capture proof source: customer quote, search demand, community pain, paid test, or sales call.
- Do not pass if the evidence only says the idea is interesting.

## Required Evidence Fields

- `icp`, `pain`, `trigger`, `buyer`, `alternatives`, `wedge`, `demand_signal`, `evidence_source`, `confidence`.

## Automation Hooks

- `me solo route research` confirms command ownership.
- `me solo artifact write offer-validated research-expert ready "<note>"` writes market evidence.
- `me solo gates verify` confirms the offer gate can advance.

## Escalation Rules

- Escalate to CEO Command if ICP is split, pain is weak, or no urgent buying trigger exists.

## Handoff

Next department is Product Strategy. Handoff must include ICP, painful job, core promise, competitor gap, proof strength, and evidence source.

## Stop Conditions

- No painful workflow.
- No reachable buyer.
- No evidence source.
- Demand is only assumed from founder opinion.
