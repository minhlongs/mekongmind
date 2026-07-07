# Hermes Portfolio Self-Selling Progress

## Scope

Objective: every local SSD product enters MekongMind/Hermes DNA and moves toward `/goal $1M MRR` with Polar.sh as canonical revenue truth.

## Current Evidence

| Check | Result |
|---|---|
| Kill switch | `STOP_ABSENT` |
| Product inventory | `state/products/local-product-inventory.json` has 1159 products |
| Self-selling queue | `state/products/self-selling-queue.json` has 1159 products |
| Queue coverage | `me solo products audit` PASS |
| Strict queue contract | `me solo products audit --strict` PASS |
| Self-selling completion | `me solo products audit --self-selling` FAIL by design: 0/1159 complete |
| Active product | `tiktok-shop-api` |
| Active pre-revenue products | 12 |
| Queued products remaining | 1147 |
| Product snapshots | active rows have `last_snapshot`; duplicate names use path-hash snapshot dirs |
| Active goal | `goal-20260603-155338` |
| Current product gate | `offer-validated` |
| Local MVP health | `http://localhost:3002/health` PASS |
| Product tests | `npm test` PASS, 25 checks |
| Next strict bottleneck | `quality-compliance` for `mvp-live` |

## Work Completed This Pass

- Added audit modes:
  - `me solo products audit --strict`
  - `me solo products audit --self-selling`
- `--strict` verifies target `$1M MRR`, required stages, required evidence paths, next command, and Polar.sh canonical warning for every queue row.
- `--self-selling` fails unless every product row reaches `self-selling` status. This prevents false completion reports.
- Re-bound `tiktok-shop-api` to active goal `goal-20260603-155338` by running `me solo products loop --once tiktok-shop-api`.
- Verified active CEO, Market Intelligence, and Product Strategy artifacts.
- Added semantic validation for high-risk gate proof:
  - Quality & Compliance cannot pass with blocking release decision.
  - Platform Operations cannot pass without HTTP 200, verified version match, and real reachable provider.
  - Sales & Revenue cannot pass without Polar.sh provider, synced/verified provider status, paid/active/signed status, and `current_mrr > 0`.
- Updated `state/evidence/mvp-live.json` with real local Docker, health, pricing, test, and blocker evidence.
- Added safe batch command: `me solo products batch --limit <N>`.
- Batch command runs only pre-revenue coverage: queue -> CEO blueprint -> Market/Product offer -> strict bottleneck.
- Batch command writes product-specific snapshots under `state/products/evidence/<product>/` and restores shared active-goal artifacts after each batch.
- Batch selection now uses exact product path first, then unique name, before fuzzy scoring. This prevents duplicate folder names like `src-tauri` from resolving to the same product.
- Strict queue audit now requires `last_snapshot` for any active product beyond `company-blueprint`.
- Advanced safe portfolio coverage to:
  - `mvp`
  - `mekong-cli-main`
  - `dashboard`
  - `ide-ui`
  - `mekong-ide`
  - `src-tauri`
  - `src-tauri` under nested path
  - `dashboard` under `algo-trader`
  - `mekong-ide` under `/Users/macbook`
  - `src-tauri` under `/Users/macbook/mekong-ide/packages/desktop`
  - `ide-ui` under `/Users/macbook/mekongmind/apps/ide`
  - `tiktok-shop-api`

## Verification

```bash
me solo products audit --strict
me solo products audit --self-selling
me solo products batch --limit 5
curl -fsS http://localhost:3002/health
curl -fsS http://localhost:3002/api/v1/pricing
npm test # in /Users/macbook/tiktok-shop-api
me solo artifact validate ceo-command state/evidence/company-blueprint.json
me solo artifact validate market-intelligence state/evidence/offer-validated.json
me solo artifact validate product-strategy state/evidence/offer-validated.json
me solo artifact validate engineering-factory state/evidence/mvp-live.json
me solo artifact validate quality-compliance state/evidence/mvp-live.json
me solo artifact validate platform-operations state/evidence/mvp-live.json
python3 -m pytest tests/test_registry.py -q
```

Results:

- Strict portfolio audit: PASS, 1159 products under control.
- Self-selling completion audit: expected FAIL, 0 self-selling, 1159 incomplete.
- Safe batch pass: PASS; no real outreach, no Polar mutation, no revenue sync.
- Shared active-goal artifacts restored to `tiktok-shop-api` after batch.
- Active pre-revenue coverage: 12 products.
- Duplicate-name regression test: PASS.
- Artifact validation: PASS for CEO, Market Intelligence, Product Strategy.
- Engineering Factory artifact: PASS.
- Quality & Compliance artifact: FAIL semantic contract because release decision is blocking.
- Platform Operations artifact: FAIL semantic contract because public provider/version match is not verified.
- `npm test` in `tiktok-shop-api`: PASS, 25 checks.
- `npm run test:mock`: FAIL before assertions with `EADDRINUSE` because port 3000 is occupied.
- Wrapper tests: 73 passed, 1 skipped, 65 subtests passed.

## Remaining Work

| Department | Missing Proof |
|---|---|
| Quality & Compliance | non-blocking release decision for public production / real outreach |
| Platform Operations | public provider, commit/version match, production health, rollback, monitoring |
| Growth Marketing | real bounded campaign/email/outreach proof |
| Sales & Revenue | Polar checkout/subscription, provider evidence, provider sync status, current MRR |
| Customer Success | fulfillment proof without founder-only bottleneck |
| Knowledge & Memory | reusable playbook and clone readiness |

## Unresolved Questions

- Which product after `tiktok-shop-api` should be activated next: `cashclaw` or queue order?
- What verified Polar export path should be used for `POLAR_MRR_FILE` when Sales & Revenue is ready?
- What identity/channel is approved for real outreach so Growth/Sales can send without personal-identity risk?
- Should `tiktok-shop-api` remain blocked on GCP billing, or should Platform Operations choose another public provider for first live proof?
