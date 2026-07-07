# Hermes Portfolio Autonomy

## Purpose

Hermes/MekongMind must treat local products as a portfolio, not as disconnected folders. Each product discovered on local SSD becomes a candidate CEO Solo Company goal and must self-sell through the same department DNA.

## Operating Contract

```text
local product inventory
  -> CEO Command product selection
  -> Market Intelligence buyer proof
  -> Product Strategy offer/package
  -> Engineering Factory sellable path
  -> Quality & Compliance release proof
  -> Platform Operations live proof
  -> Growth Marketing real campaign/outreach
  -> Sales & Revenue Polar-backed checkout/MRR
  -> Customer Success fulfillment proof
  -> Knowledge & Memory clone playbook
```

## Canonical Commands

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
me solo artifact template growth-marketing --write state/evidence/repeatable-channel.json
me solo artifact template sales-revenue --write state/evidence/first-revenue.json
me solo loop --once --strict
POLAR_MRR_FILE=<verified-export.json> me solo revenue sync polar
```

## Non-Negotiables

- Polar.sh is canonical. Do not destroy, rotate, or fabricate Polar setup.
- Outreach may be real, but must pass Growth Marketing and Sales & Revenue SOPs.
- Campaign evidence is not revenue evidence.
- Provider-backed Polar MRR is the revenue truth.
- Manual/local revenue notes are allowed for inspection, but cannot prove a revenue gate without Polar checkout/provider evidence and provider sync status.
- Any local/API LLM output must be written to an artifact before it can affect a gate.
- The human should only be escalated for credentials, legal/payment risk, spend approval, or identity-sensitive outreach.
- Gate drift must be repaired by `me solo gates reconcile --repair`, which resets current gate to the earliest missing strict evidence contract without fabricating proof.
- `me solo products offer` may create desk-researched Market/Product evidence from local product files. It is enough to route the company to Engineering/Growth, but real outreach must still validate demand before scale.

## Inventory Artifact

`state/products/local-product-inventory.json` records:

- product name and path
- detector signals
- package manager
- deployment provider signal
- Polar file/config signal
- next autonomy gate
- next action

The scanner ignores common secret file names, hidden/tooling folders, build/cache folders, and records metadata only.

## Self-Selling Queue

`state/products/self-selling-queue.json` is the portfolio ledger that turns inventory into autonomous work:

- one row per product in `state/products/local-product-inventory.json`
- current gate starts at `company-blueprint`
- target MRR defaults to `1000000`
- next command points to `me solo products select <product>`
- required stages include blueprint, offer, MVP live, campaign, Polar revenue, fulfillment, clone memory, and first `$1M MRR`

`me solo products audit` must pass before claiming the SSD portfolio is under MekongMind/Hermes control. Queue coverage is not revenue proof; it only proves every product has entered the operating loop.

`me solo products audit --strict` proves the queue contract is complete for every product: target MRR is `1000000`, Polar.sh canonical warning is present, required stages are complete, and required evidence paths are attached. `me solo products audit --self-selling` is the completion guard and must fail until every queued product has real self-selling proof.

`me solo products loop --once <product>` is the safe autonomous pass. It verifies queue coverage, selects the product into the active goal, writes CEO blueprint evidence, drafts Market/Product offer evidence from local files, updates the queue row, and prints the next strict bottleneck. It must not send outreach, sync revenue, or mutate Polar provider configuration.

`me solo products next <product>` reads the portfolio queue and product packets, then prints the product-specific next command plus the proof blocker. It is advisory only: no outreach send, no Polar mutation, no revenue claim, and no self-selling claim.

`me solo products batch --limit <N>` applies that safe pass to multiple queued products. It is for autonomous portfolio coverage only; it does not create campaign proof, revenue proof, fulfillment proof, or clone-readiness.

Batch mode writes product-specific snapshots under `state/products/evidence/<product>/` and restores the shared active-goal artifacts after the batch. This prevents portfolio coverage from overwriting the active goal's current blueprint/offer state.

`me solo products packet-batch --kind both --limit <N>` writes missing release readiness and Growth/Sales packets for multiple products. It selects products missing the requested packet kind and restores shared active-goal artifacts after the batch. It does not create `mvp-live`, campaign, revenue, fulfillment, or clone proof.

`me solo products packet-batch --kind <release|work|both> --limit <N> --force` refreshes already-written product packets when the Hermes/MekongMind generator or SOP improves. It keeps the same hard guard: no outreach send, no Polar mutation, no revenue sync, and no self-selling completion claim.

`me solo products release-packet <product>` writes `state/products/evidence/<product>/release-readiness-packet.json`. It grades Engineering Factory, Quality & Compliance, and Platform Operations against the `mvp-live` evidence contract and lists exact blockers for release approval, production provider, version match, rollback, monitoring, and Polar checkout readiness. The packet must also prove artifact binding by matching `product_name`, `product_path`, or a product-specific artifact label; otherwise it blocks as `artifact-binding`. It is deliberately not accepted as `mvp-live` proof.

`me solo products work-packet <product>` writes `state/products/evidence/<product>/growth-sales-work-packet.json`. This is the cross-department execution packet for Growth Marketing and Sales & Revenue: audience, positioning, draft campaign asset, email sequence, opt-out handling, qualification rule, Sales handoff, Polar checkout placeholder, provider evidence requirement, and sync-status requirement. It is deliberately not accepted as campaign proof or revenue proof.

`me solo products campaign-proof <product> --log <outreach-log.json>` converts real outreach evidence into product-specific `state/products/evidence/<product>/repeatable-channel.json`. It validates real send events, audience/source references, status, and opt-out notice. It does not send outreach, mutate Polar.sh, sync revenue, or prove MRR.

`me solo products revenue-proof <product> --polar <polar-evidence.json>` converts provider-backed Polar checkout/subscription/customer evidence into product-specific `state/products/evidence/<product>/first-revenue.json`. It validates provider=Polar.sh, paid/active/signed/subscription status, campaign source, provider sync status, and current MRR greater than zero. It does not mutate Polar.sh and does not prove fulfillment or clone readiness.

`me solo products fulfillment-proof <product> --artifact <fulfillment-stable.json>` converts customer outcome evidence into product-specific `state/products/evidence/<product>/fulfillment-stable.json`. It requires prior Polar-backed revenue evidence, validates the Customer Success contract, and does not prove clone readiness or self-selling completion.

`me solo products clone-proof <product> --artifact <scale-ready.json>` converts clone-memory evidence into product-specific `state/products/evidence/<product>/scale-ready.json`. It requires prior fulfillment evidence, validates the Knowledge & Memory contract, and still keeps the product active until first `$1M MRR` is reached.

## Campaign And Revenue Evidence

`state/evidence/repeatable-channel.json` must prove a bounded real campaign/email/outreach experiment:

- audience, positioning, channel, campaign, and campaign asset
- email sequence or outreach copy
- outreach/send/reply log
- CTA and qualification rule
- opt-out/compliance handling
- leads, conversion, learning, and Sales handoff

`state/evidence/first-revenue.json` must prove Polar-backed revenue truth:

- lead, qualification, campaign source, offer, and price
- checkout URL plus Polar checkout URL
- payment status, provider, provider evidence, provider sync status
- current MRR and next action

If Polar checkout fails, route to Engineering Factory and Platform Operations. Do not change the verified Polar setup unless the human explicitly approves credential/provider work.

## Success Definition

A local product is autonomous only when it has validated artifacts for:

- company blueprint
- offer validation
- live MVP
- repeatable channel
- first Polar-backed revenue
- fulfillment stability
- scale-ready clone memory

## Unresolved Questions

- Whole SSD scan root vs safer documents-only scan root.
- First product selected for autonomous selling pass.
