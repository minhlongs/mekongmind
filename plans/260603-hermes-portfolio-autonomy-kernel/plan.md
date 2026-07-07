# Hermes Portfolio Autonomy Kernel

Date: 260603
Status: active

## Objective

Make every local product discoverable by MekongMind/Hermes, then route each product through the same CEO Solo Company self-selling loop toward `/goal $1M MRR`.

## Scope

- Keep Polar.sh canonical and do not alter existing Polar credentials or verified provider setup.
- Add a local product inventory artifact so CEO Command can see what exists on SSD.
- Add portfolio self-selling SOP so Market, Product, Engineering, Growth, Sales, Success, and Memory can coordinate like company departments.
- Keep autonomous execution bounded by evidence contracts, gate validators, circuit breakers, and escalation rules.

## Phases

1. [x] Product inventory: scan local product directories into `state/products/local-product-inventory.json`.
2. [x] Product queue: write `state/products/self-selling-queue.json` so every inventory product has a required loop row.
3. [x] Portfolio doctrine: document cross-department SOP for self-selling real campaigns/outreach.
4. [x] CLI surface: add `me solo products scan|list|queue|audit|loop --once` to make inventory inspectable and repeatable.
5. [x] Verification: run syntax/tests covering registry/docs/CLI output.
6. [x] Add gate drift repair so autonomy returns to earliest missing strict evidence.
7. [x] Add product selection command to mint CEO blueprint from inventory.
8. [x] Select first product in active goal and verify next bottleneck.
9. [x] Add Market/Product offer generator from local product evidence.
10. [ ] Attach Polar checkout/revenue evidence without altering verified Polar setup.
11. [ ] Run bounded Growth/Sales outreach SOP with real campaign evidence.
12. [ ] Prove fulfillment and clone memory before claiming self-selling autonomy.

## Progress Notes

- 260603: Growth Marketing and Sales & Revenue contracts now require real campaign/email/outreach logs, Sales handoff, Polar checkout URL, provider evidence, and provider sync status. This prepares phase 9-10 without touching verified Polar credentials/provider setup.
- 260603: Product self-selling queue added so full SSD inventory can be audited for one required loop row per product before any autonomy claim.
- 260603: Safe product loop pass added: queue audit -> product selection -> CEO blueprint -> Market/Product offer -> strict bottleneck. It stops before outreach or Polar sync.

## Success Criteria

- `me solo products scan --root <path>` writes a JSON inventory without reading secrets.
- `me solo products queue` writes a self-selling queue with one row per inventory product.
- `me solo products audit` verifies queue coverage equals inventory coverage.
- `me solo products loop --once <product>` runs a safe pre-revenue pass and stops at the next strict evidence bottleneck.
- Inventory records product path, detectors, package manager, deploy signals, Polar signals, and next autonomy gate.
- SOP states real outreach can run only through campaign, qualification, checkout, provider-backed MRR, and fulfillment evidence.
- `me solo gates reconcile --repair` resets drift to the earliest missing strict evidence without creating fake proof.
- `me solo products select <query>` writes a CEO blueprint from inventory and validates `ceo-command`.
- `me solo products offer` writes `offer-validated.json` from local README/package/deployment evidence and records Market/Product department runs.
- `me solo artifact template growth-marketing` and `me solo artifact template sales-revenue` expose the required real outreach and Polar proof fields.
- Tests prove the command and docs contract exist.

## Unresolved Questions

- Final default scan root is `/Users/macbook`; scanner ignores common secret file names, hidden/tooling folders, and heavy build/cache directories.
- Which local product gets first autonomous self-selling run after inventory is generated.
