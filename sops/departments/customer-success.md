# Department SOP: Customer Success & Fulfillment
Owner: project-manager agent
Department: customer-success
GateArtifact: fulfillment-stable
ArtifactPath: state/evidence/fulfillment-stable.json
Metric: customer outcome delivered without founder bottleneck

## Purpose

Deliver the promised outcome repeatedly with onboarding, fulfillment SOPs, support, retention, expansion, and founder-bottleneck removal.

## Trigger

Run after first revenue, after failed onboarding/support, or before scaling acquisition.

## Agentic Room Contract

- RoomType: fulfillment and retention room.
- WIP: 5 active onboardings, 5 support items, 2 retention risks.
- Intake: requires paid customer, customer promise, onboarding need, success metric, and delivery deadline.
- DecisionLoop: start onboarding -> deliver promised outcome -> manage support -> assess retention -> route expansion/product learning.
- Escalation: if promise cannot be delivered repeatably, block scale-ready and return to Product Strategy or Engineering Factory.
- AntiChaos: no customer without owner; no undocumented founder-only fulfillment; no retention claim without signal.

## Command Admission

Customer-success commands enter this room only with a named customer promise and owner. Fulfillment proof is required before scale or clone claims.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| onboarding | support, docs | Customer, promise, onboarding plan, owner, and due date are recorded |
| fulfillment | tracking, support | Delivery status, success metric, and evidence of outcome are updated |
| support | triage, support | Support open items, severity, owner, and escalation path are recorded |
| retention | tracking | Renewal risk, usage, satisfaction, and retention signal are recorded |
| expansion | sales, revenue | Expansion signal and next offer loop are recorded |

## SOP Steps

1. Convert the sales promise into onboarding checklist, delivery workflow, and success metric.
2. Assign agent/tool responsibilities for fulfillment and support.
3. Track customer activation, time-to-value, blockers, tickets, and retention signals.
4. Extract repeated tasks into SOPs and automation backlog.
5. Write fulfillment-stable evidence when delivery no longer depends on founder heroics.

## Evidence Contract

`me solo run customer-success ready "fulfillment stable"` must write `state/evidence/fulfillment-stable.json`.

## Operating Checklist

- Convert sales promise into onboarding tasks, timeline, owner, and success metric.
- Track delivery status, customer blockers, support issues, renewal risk, and expansion opportunity.
- Feed product bugs to Engineering and message gaps to Product Strategy/Growth.
- Do not pass if customer success depends on undocumented founder-only work.

## Required Evidence Fields

- `customer`, `promise`, `onboarding_plan`, `success_metric`, `delivery_status`, `support_open_items`, `renewal_risk`, `expansion_signal`.

## Automation Hooks

- `me solo route support` and `me solo route triage` confirm customer-success ownership.
- `me solo artifact write fulfillment-stable project-manager ready "<note>"` writes fulfillment evidence.
- `me solo gates verify` can advance fulfillment after stable evidence exists.

## Escalation Rules

- Escalate to Sales & Revenue if promise/payment mismatch; escalate to Engineering Factory if delivery is blocked by product defect.

## Handoff

Next department is Knowledge & Memory. Handoff must include delivery SOP, customer result, support issues, expansion signal, and reusable playbook candidates.

## Stop Conditions

- Customer outcome undefined.
- Delivery depends on manual founder improvisation.
- Support issues are not tracked.
- Retention risk ignored.
