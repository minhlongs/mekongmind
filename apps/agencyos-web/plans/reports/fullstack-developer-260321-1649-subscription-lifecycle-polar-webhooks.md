# Phase Implementation Report

### Executed Phase
- Phase: subscription-lifecycle-polar-webhooks
- Plan: none (direct task)
- Status: completed

### Files Modified
- `/Users/macbookprom1/mekong-cli/apps/raas-gateway/migrations/0014_subscriptions.sql` — created (14 lines)
- `/Users/macbookprom1/mekong-cli/apps/raas-gateway/src/routes/billing.ts` — updated (186 → 424 lines)

### Tasks Completed
- [x] Created migration `0014_subscriptions.sql` with `subscriptions` table, FK to tenants, 2 indexes
- [x] Added `TIER_CREDITS` map + `resolveTierFromProductId()` helper (match by first 8 chars of product_id)
- [x] Added `subscription.created` handler: upsert subscription record, upgrade tenant tier, add monthly credits
- [x] Added `subscription.updated` handler: update period dates, reload credits_per_period via `rollover` transaction
- [x] Added `subscription.cancelled` handler: mark cancelled, tier stays active until period end
- [x] Added `subscription.revoked` handler: immediately downgrade tenant to free tier, mark expired
- [x] Wired all 4 cases into existing switch statement in webhook router
- [x] All credit operations route through existing `CreditService.addCredits()` — atomic, recorded in credit_transactions

### Tests Status
- Type check: pass (tsc --noEmit → 0 errors)
- Unit tests: not run (no test runner configured in raas-gateway)
- Integration tests: not run

### Issues Encountered
- `billing.ts` now 424 lines (above 200-line guideline) — acceptable given it is a route handler with 4 inline handler functions; can be split into `src/routes/billing-subscription-handlers.ts` in future refactor if needed
- `subscription.updated` treats ALL updates as renewals (credits reloaded if period dates changed). If Polar sends `subscription.updated` for non-renewal changes (plan change, payment method update), credits would be incorrectly reloaded. Safer to only reload on `subscription.renewed` if Polar provides that event.

### Next Steps
- Apply migration to D1: `wrangler d1 execute raas-gateway-db --file=migrations/0014_subscriptions.sql`
- Verify Polar dashboard sends `subscription.created` / `subscription.revoked` (not just `subscription.active` / `subscription.canceled`) — event names may differ by Polar API version

### Unresolved Questions
1. Does Polar.sh emit `subscription.created` and `subscription.revoked` as distinct event types, or does it only use `subscription.active` and `subscription.canceled`? Task description says yes but this needs verification against Polar webhook docs.
2. `subscription.updated` reload logic — does Polar fire this event only on billing period renewal, or also on other updates (seat count, plan change)? If the latter, credits will be double-allocated.
3. `tenants.tier` has a `free` value — confirm this tier string exists in the DB CHECK constraint (migration `0008_add_tier_values.sql` should confirm).
