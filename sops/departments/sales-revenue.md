# Department SOP: Sales & Revenue
Owner: business-analyst agent
Department: sales-revenue
GateArtifact: first-revenue
ArtifactPath: state/evidence/first-revenue.json
Metric: MRR growth toward first $1M MRR

## Purpose

Convert demand into revenue through qualification, sales script, demo, checkout, close loop, MRR tracking, and pricing iteration.

## Trigger

Run when Growth Marketing creates qualified demand, when checkout changes, or when MRR evidence needs sync.

## Agentic Room Contract

- RoomType: checkout and MRR truth room.
- WIP: 3 active revenue motions, 1 checkout blocker, 1 provider sync discrepancy.
- Intake: requires qualified lead, offer, price, checkout path, campaign source, and current provider expectation.
- DecisionLoop: qualify buyer -> run script/objections -> verify checkout/provider -> close or route fix -> reconcile MRR evidence.
- Escalation: if buyer wants to pay but checkout/provider fails, block revenue claim and return to Engineering Factory plus Platform Operations.
- AntiChaos: no verbal yes as revenue; no MRR without provider-backed evidence; no scale claim before fulfillment proof.

## Command Admission

Revenue commands enter this room only inside the current project's revenue gate. Sales proof must reconcile with provider-backed MRR state before `$1M MRR` progress can be claimed.

| SOP Cell | Command Groups | Proof |
|---|---|---|
| lead-qualification | sales | Lead qualifies on pain, authority, urgency, budget, and fit |
| sales-script | sales, pricing | Script, objection log, offer, and price reaction are recorded |
| checkout | revenue, pricing | Checkout URL, Polar checkout URL, invoice/subscription, provider evidence, and payment status are captured |
| close | sales, finance | Close reason, payment evidence, customer promise, and next action are recorded |
| revenue-review | revenue | `state/revenue/<goal-id>.json` and first-revenue artifact agree on Polar-backed current MRR |

## SOP Steps

1. Qualify lead pain, budget, urgency, authority, and fit.
2. Run sales script or checkout path against the offer promise.
3. Capture objection, close reason, price reaction, and next action.
4. Sync revenue source with `POLAR_MRR_FILE=<verified-export.json> me solo revenue sync polar` or `POLAR_MRR_ENDPOINT` plus token.
5. Write first revenue evidence only when paid customer, signed commitment, or verified Polar-backed MRR exists.

## Evidence Contract

`POLAR_MRR_FILE=<verified-export.json> me solo revenue sync polar` is canonical for MRR gates. `me solo revenue set <mrr> <source> <note>` is allowed for local draft/manual notes, but it does not prove a revenue gate unless the first-revenue artifact also records Polar checkout/provider evidence and provider sync status. `me solo run sales-revenue ready "first revenue evidence"` may write `state/evidence/first-revenue.json` as supplemental evidence.

## Operating Checklist

- Qualify every opportunity against pain, authority, urgency, budget, and implementation fit.
- Keep checkout path, invoice, subscription, and CRM/customer record aligned.
- Sync provider-backed MRR after every close, refund, upgrade, or churn event.
- Separate vanity interest from revenue: only paid, signed, or Polar provider-backed evidence can advance gates.
- Do not modify, delete, rotate, or fabricate the verified Polar.sh setup.

## Required Evidence Fields

- `lead`, `qualification`, `campaign_source`, `offer`, `price`, `checkout_url`, `polar_checkout_url`, `payment_status`, `provider`, `provider_evidence`, `provider_sync_status`, `current_mrr`, `next_action`.

## Automation Hooks

- `POLAR_MRR_FILE=revenue.json me solo revenue sync polar` imports provider export evidence.
- `me solo revenue set <mrr> <source> "<note>"` updates local MRR state for inspection, but revenue gate proof still requires Polar evidence fields.
- `me solo artifact write first-revenue business-analyst ready "<note>"` writes supplemental sales evidence.

## Escalation Rules

- Escalate to Engineering Factory if checkout fails; escalate to Product Strategy if objections show offer/pricing mismatch.

## Handoff

Next department is Customer Success after first revenue. Handoff must include customer promise, onboarding need, payment evidence, success metric, and delivery deadline.

## Stop Conditions

- No verified revenue source.
- Provider is not `Polar.sh` for MRR gate proof.
- Provider sync status is missing or stale.
- Customer promise differs from product capability.
- Checkout broken.
- Close loop has no next action.
