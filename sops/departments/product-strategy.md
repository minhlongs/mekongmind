# Department SOP: Product Strategy
Owner: business-analyst agent
Department: product-strategy
GateArtifact: offer-validated
ArtifactPath: state/evidence/offer-validated.json
Metric: sellable offer with pricing and MVP scope

## Purpose

Turn validated pain into a sellable RaaS offer: promise, package, pricing, scope, checkout path, and MVP boundary.

## Trigger

Run after Market Intelligence has a concrete ICP and demand signal, or when pricing/package is unclear.

## Agentic Room Contract

- RoomType: offer and RaaS blueprint room.
- WIP: 1 active offer, 1 pricing model, 1 MVP boundary.
- Intake: requires ICP, pain, wedge, demand proof, and known constraints.
- DecisionLoop: shape promise -> price package -> define RaaS surface -> bound MVP -> hand off acceptance criteria.
- Escalation: if promise cannot be fulfilled or priced, send correction to Market Intelligence or CEO Command.
- AntiChaos: no feature roadmap without paid promise; no free-demo default; no MVP scope beyond first revenue proof.

## Command Admission

Commands enter this room only when `offer-validated` is the target gate. Product strategy cannot expand scope beyond first-revenue proof.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| offer-design | business, requirements | Offer, promise, buyer, outcome, and non-goals are written |
| pricing-model | pricing, finance | Price, package, margin assumption, and checkout model are recorded |
| raas-blueprint | product, design | RaaS blueprint links product surface to sales promise and fulfillment path |
| roadmap | plan, requirements | MVP acceptance criteria and roadmap are bounded by revenue milestone |

## SOP Steps

1. Write the transformation promise and the measurable customer outcome.
2. Package the offer into tiers, guarantee, onboarding, fulfillment boundary, and exclusions.
3. Define price anchor, first plan, expansion path, and minimum viable checkout.
4. Cut MVP scope to the smallest sellable workflow that proves the promise.
5. Update the offer validation artifact with product and pricing decisions.

## Evidence Contract

`me solo run product-strategy ready "offer and pricing locked"` must write `state/evidence/offer-validated.json`.

## Operating Checklist

- Convert validated pain into one paid promise, not a feature list.
- Define package, price, guarantee, onboarding promise, and first success metric.
- Cut MVP scope to the smallest sellable workflow that supports checkout and fulfillment.
- Record non-goals so Engineering does not build speculative platform surface.

## Required Evidence Fields

- `offer`, `promise`, `pricing`, `package`, `mvp_scope`, `non_goals`, `acceptance_criteria`, `sales_angle`, `risk`.

## Automation Hooks

- `me solo route pricing` confirms Sales & Revenue handoff path.
- `me solo artifact write offer-validated business-analyst ready "<note>"` writes offer evidence.
- `me solo loop --once` should move next to Engineering Factory after offer validation.

## Escalation Rules

- Escalate to CEO Command if price, promise, and MVP scope cannot fit one coherent offer.

## Handoff

Next department is Engineering Factory. Handoff must include MVP scope, acceptance criteria, checkout requirement, integration list, and non-goals.

## Stop Conditions

- No pricing.
- MVP scope cannot be sold.
- Offer promise is not measurable.
- Checkout or sales path is undefined.
