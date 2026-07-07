# SOP: Autonomous Portfolio Self-Selling
> MEKONG_WRAPPER SOP | Status: Active | Owner: planner agent

## Purpose

Make every local SSD product visible to MekongMind/Hermes, then route each product through the same CEO Solo Company loop until it can sell itself with Polar-backed revenue evidence.

## Trigger

- User objective: all local products must self-sell through MekongMind/Hermes core DNA.
- `me solo products scan --root <path>`
- `me solo products list`
- `me solo products queue`
- `me solo products audit`
- `me solo products audit --strict`
- `me solo products audit --self-selling`
- `me solo products loop --once <product>`
- `me solo products batch --limit <N>`
- `me solo products packet-batch --kind both --limit <N>`
- `me solo products packet-batch --kind work --limit <N> --force`
- `me solo products release-packet <product>`
- `me solo products work-packet <product>`
- `me solo products campaign-proof <product> --log <outreach-log.json>`
- `me solo products revenue-proof <product> --polar <polar-evidence.json>`
- `me solo gates reconcile --repair`
- Any `/goal $1M MRR` that references a product portfolio, local product, campaign, checkout, outreach, or Polar revenue.

## Canonical Artifacts

- Product inventory: `state/products/local-product-inventory.json`
- Product self-selling queue: `state/products/self-selling-queue.json`
- CEO blueprint: `state/evidence/company-blueprint.json`
- Offer proof: `state/evidence/offer-validated.json`
- Live MVP proof: `state/evidence/mvp-live.json`
- Product release readiness packet: `state/products/evidence/<product>/release-readiness-packet.json`
- Campaign proof: `state/evidence/repeatable-channel.json`
- Revenue truth: `state/evidence/first-revenue.json` plus `state/revenue/<goal-id>.json`
- Product Growth/Sales work packet: `state/products/evidence/<product>/growth-sales-work-packet.json`
- Product campaign evidence: `state/products/evidence/<product>/repeatable-channel.json`
- Product revenue evidence: `state/products/evidence/<product>/first-revenue.json`
- Fulfillment proof: `state/evidence/fulfillment-stable.json`
- Clone memory: `state/evidence/scale-ready.json`

## Autonomy Doctrine

1. Inventory is not validation.
2. Queue coverage is not validation.
3. Campaign is not revenue.
4. Outreach is allowed only through Growth Marketing and Sales & Revenue contracts.
5. Polar.sh is the canonical revenue provider. Do not delete, rotate, overwrite, or fabricate Polar configuration.
6. No MRR claim without provider-backed evidence from `POLAR_MRR_FILE` or `POLAR_MRR_ENDPOINT`; `me solo revenue set` is local note state unless paired with Polar evidence.
7. No product may skip fulfillment proof even if checkout works.
8. Human escalation is required for credential rotation, irreversible provider changes, paid ad spend, legal claims, or sending messages from a personal identity.

## Cross-Department Loop

| Step | Owner | Action | Evidence |
|---|---|---|---|
| 1 | CEO Command | Queue every inventory product into the self-selling ledger | `self-selling-queue.json` |
| 2 | CEO Command | Select one queued product and bind it to one active `/goal $1M MRR` | `company-blueprint.json` |
| 3 | Market Intelligence | Identify buyer, pain, trigger, alternatives, wedge | `offer-validated.json` |
| 4 | Product Strategy | Package promise, pricing, MVP boundary, sales angle | `offer-validated.json` |
| 5 | Engineering Factory | Ensure sellable path, checkout path, integration boundary | `mvp-live.json` |
| 6 | Quality & Compliance | Verify buyer/revenue path, security, residual risks | `mvp-live.json` |
| 7 | Platform Operations | Verify provider, commit, health, rollback, monitoring | `mvp-live.json` |
| 8 | Growth Marketing | Run bounded campaign/email/outreach experiment with CTA and qualification rule | `repeatable-channel.json` |
| 9 | Sales & Revenue | Qualify lead, run script, verify Polar checkout/subscription, sync MRR | `first-revenue.json`, `state/revenue/<goal-id>.json` |
| 10 | Customer Success | Onboard paid/signed customer and prove promise delivery | `fulfillment-stable.json` |
| 11 | Knowledge & Memory | Extract reusable product-selling playbook | `scale-ready.json` |

## Real Outreach Rules

- Growth Marketing may draft and schedule campaign/email/outreach assets only after `mvp-live` or explicit CEO exception.
- Sales & Revenue may send real outreach only when the message includes offer, audience, CTA, qualification rule, checkout path, and opt-out/compliance handling.
- Any checkout link must point to the verified Polar product/checkout path for that product.
- Growth evidence must include campaign asset, email/outreach sequence, outreach log, replies/leads, conversion, learning, and Sales handoff.
- Sales evidence must include campaign source, Polar checkout URL, provider evidence, provider sync status, current MRR, and next action.
- If a buyer wants to pay and Polar checkout fails, block revenue claim and route to Engineering Factory plus Platform Operations.
- If outreach produces objections, Market Intelligence and Product Strategy must update the offer artifact before more volume.

## Local LLM + API Routing

- Primary reasoning: `qwen3.6:35b-cc` (Q4_K_M ~20GB) for all departments — SOP routing, code, synthesis, autonomous coordination.
- Fast classifier: `qwen3.5:2b` (Q4_K_M ~2.6GB) for route resolution, intent classification, small patches, low-latency fallback.
- Total disk: ~23GB (down from ~95GB with 4 old models).
- API escalation: high-risk strategy, legal/payment ambiguity, or local model uncertainty recorded in artifact notes.

## Command Procedure

```bash
me solo products scan --root /Users/macbook
me solo products list
me solo products queue
me solo products audit
me solo products audit --strict
me solo products audit --self-selling
me solo products loop --once <product-name-or-path>
me solo products batch --limit 3
me solo products packet-batch --kind both --limit 3
me solo products packet-batch --kind work --limit 25 --force
me solo products release-packet <product-name-or-path>
me solo products work-packet <product-name-or-path>
me solo products campaign-proof <product-name-or-path> --log <outreach-log.json>
me solo products revenue-proof <product-name-or-path> --polar <polar-evidence.json>
me solo products select <product-name-or-path>
me solo products offer
me solo gates reconcile --repair
me solo bottlenecks --strict
me solo brief <next-department>
me solo artifact template growth-marketing --write state/evidence/repeatable-channel.json
me solo artifact template sales-revenue --write state/evidence/first-revenue.json
me solo artifact validate <department> <artifact>
POLAR_MRR_FILE=<verified-export.json> me solo revenue sync polar
me solo gates verify --strict
me solo loop --once --strict
```

## Done Condition

A product is self-selling only when inventory, offer, MVP, campaign, Polar-backed first revenue, fulfillment, and clone memory artifacts all validate for the active goal.

`me solo products audit` proves queue coverage only. `me solo products audit --strict` proves every inventory row has the $1M MRR self-selling contract, Polar canonical warning, required stages, and required evidence paths. `me solo products audit --self-selling` must fail until every queued product has completed real self-selling proof.

`me solo products offer` can satisfy Market Intelligence and Product Strategy using local README/package/deployment evidence, but it must mark the result as desk-researched until Growth Marketing and Sales & Revenue produce real lead/outreach/checkout/Polar MRR evidence.

`me solo products loop --once <product>` may automate only the safe pre-revenue pass: queue audit, CEO blueprint, Market/Product offer artifact, and strict bottleneck report. It must stop before real outreach, Polar sync, fulfillment, or clone-readiness unless those departments have valid evidence artifacts.

`me solo products next <product>` is the per-product dispatcher view. It reads queue status and packet/evidence fields, then prints the next command and blocker. It is advisory only and must not send outreach, mutate Polar.sh, sync revenue, or mark a product self-selling.

`me solo products batch --limit <N>` repeats the same safe pre-revenue pass for multiple queued products. It is allowed for autonomous portfolio coverage, but it has the same hard stop: no real outreach, no Polar mutation, no revenue sync, no fulfillment claim.

Batch mode must snapshot each product's blueprint/offer to `state/products/evidence/<product>/` and restore the shared active-goal artifacts after the batch. Shared artifacts are for the current goal; product snapshots are the portfolio ledger proof.

`me solo products work-packet <product>` creates `growth-sales-work-packet.json` for the selected product. The packet contains Growth Marketing draft campaign/email/outreach fields, opt-out handling, Sales handoff, Polar checkout/provider evidence placeholders, and the cross-department order from MVP proof to Growth to Sales. It is an execution packet only: it is not `repeatable-channel.json`, not `first-revenue.json`, not MRR proof, and must not mutate Polar.sh.

`me solo products campaign-proof <product> --log <outreach-log.json>` ingests a real bounded outreach/send/reply log and writes product-specific `repeatable-channel.json`. The log must include real send events, recipient/source references, status, and opt-out notice. This command does not send outreach, mutate Polar.sh, sync revenue, or prove MRR; it only promotes Growth Marketing evidence when the strict `growth-marketing` contract validates.

`me solo products revenue-proof <product> --polar <polar-evidence.json>` ingests provider-backed Polar checkout/subscription/customer evidence and writes product-specific `first-revenue.json`. It requires Polar provider evidence, paid/active/signed/subscription status, campaign source, provider sync status, and current MRR greater than zero. This command does not mutate Polar.sh and does not prove fulfillment or clone readiness.

`me solo products fulfillment-proof <product> --artifact <fulfillment-stable.json>` ingests customer outcome evidence and writes product-specific `fulfillment-stable.json`. It requires prior Polar-backed revenue evidence and a product-bound artifact. This command does not prove clone readiness or self-selling completion.

`me solo products clone-proof <product> --artifact <scale-ready.json>` ingests reusable playbook/clone-memory evidence and writes product-specific `scale-ready.json`. It requires prior fulfillment evidence and a product-bound artifact. This command can only mark a product self-selling after first `$1M MRR`; otherwise the queue remains active at `scale-ready`.

`me solo products release-packet <product>` creates `release-readiness-packet.json` for the selected product. The packet grades Engineering Factory, Quality & Compliance, and Platform Operations against the `mvp-live` contracts and lists exact blockers. It also checks artifact binding: `mvp-live.json` must carry a matching `product_name`, `product_path`, or product-specific artifact label before it can be reused for that product. A matching goal ID alone is not enough for portfolio batch reuse. It is a release work order only: it is not `mvp-live.json`, not production proof, not campaign proof, not revenue proof, and must not unblock Growth/Sales until strict Quality and Platform contracts pass.

`me solo products packet-batch --kind both --limit <N>` creates missing release readiness and/or Growth/Sales packets across the portfolio. It chooses products missing the requested packet type and writes product-specific artifacts only. It must restore shared active-goal artifacts after the batch and must not send outreach, mutate Polar.sh, sync revenue, or mark any product self-selling.

`me solo products packet-batch --kind <release|work|both> --limit <N> --force` refreshes existing packet artifacts after MekongMind/Hermes DNA, SOP, or generator improvements. Force mode is a packet refresh only: it must not send outreach, mutate Polar.sh, sync revenue, or mark any product self-selling.

## Unresolved Questions

- Default scan root still needs operator policy: full `/Users/macbook` vs safer `/Users/macbook/Documents`.
- First product to activate from inventory is not yet selected.
