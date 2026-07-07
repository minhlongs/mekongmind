# Binh Phap Strategic Analysis — Checkout Implementation Decision
**Project:** mekongmind.com (MekongMind RaaS Marketplace)
**Date:** 2026-06-07
**Analyst:** Claude Opus 4.8 (Architect)
**Classification:** Decision Document — CEO Handoff Gate

---

## 1. Terrain Analysis (地形 —现状分析)

### Architecture Constraints (Hard Facts)

| Constraint | Detail | Implication |
|---|---|---|
| Build output | `output: 'export'` | Static HTML only — zero server runtime |
| Hosting | Cloudflare Pages | No Node.js workers unless separate `functions/` added |
| API layer | `app/api/` does NOT exist | Cannot create App Router API routes in current config |
| Stripe package | `stripe@15.0.0` in mvp/ | Node.js-only SDK — cannot execute in browser |
| `stripe.ts` BUG | Uses `NEXT_PUBLIC_STRIPE_SECRET_KEY` | Exposes secret key to client — **SECURITY VULNERABILITY** |
| Template links | `https://polar.sh?product=...` | Hardcoded placeholder URLs — no real product IDs |
| Polar SDK | NOT installed in mvp/ | No Polar client library available |
| Polar infra | EXISTS in `cli/src/services/polar_client.py` + `apps/well/` | Polar integration exists elsewhere in monorepo — reusable pattern |

### Critical Bug Found
`src/lib/stripe.ts:3` uses `NEXT_PUBLIC_STRIPE_SECRET_KEY` — this prefix makes env vars available to browser. Stripe **secret keys must NEVER be client-exposed**. Correct key is `STRIPE_SECRET_KEY` (server-only). Current code would:
1. Fail at build time (key not in .env during static export)
2. Leak secret key to anyone who Views Source

### Monorepo Polar Assets Available
- `cli/src/services/polar_client.py` — working Polar API client
- `cli/src/raas/polar_webhook_handler.py` — webhook handler
- `apps/well/src/services/polar-checkout-service.ts` — TypeScript checkout service
- `apps/well/src/lib/polar-overage-client.ts` — Polar overage client
- **Polar integration is proven elsewhere — this is reusable institutional knowledge**

---

## 2. Option Comparison Matrix (兵勢 — Force Assessment)

| Dimension | A: Polar Redirect Links | B: Polar.js SDK (client) | C: CF Pages Functions | D: Stripe.js Client |
|---|---|---|---|---|
| **Implementation time** | 30 min | 2-3 hours | 4-6 hours | 2-3 hours |
| **New dependencies** | 0 | 1 (`@polar-sh/sdk`) | 1 (CF Functions runtime) | 2 (`@stripe/stripe-js`, `@stripe/react-stripe-js`) |
| **Backend required** | No | No | Yes (CF Workers) | No |
| **Server-side code** | None | None | Required | None |
| **Conversion tracking** | None (blind) | Full (session, events) | Full (webhooks) | Full (webhooks) |
| **Security risk** | Low | Low (publishable key only) | Medium (secret handling) | Medium (publishable key only) |
| **Build config change** | None | None | Major (re-enable SSR) | None |
| **CEO handoff readiness** | 3/10 | 7/10 | 9/10 | 6/10 |
| **RaaS monetization** | Basic | Full | Full | Full |
| **Time to first dollar** | Immediate | Same day | 1-2 days | Same day |
| **Complexity** | Minimal | Low | High | Medium |
| **Risks** | No tracking, placeholder-only | Polar client-side maturity | SSRed build breaks static hosting | Requires Stripe account + products |

### Detailed Scoring (兵貴神速 — Speed = Essence)

```
Score: 10 = optimal, 1 = unacceptable

                    Speed  Security  Cost  Complexity  CEO Ready  RaaS Capable
A: Polar Links      10     9         10    10          3          4
B: Polar.js SDK     7      9         8     7           7          8
C: CF Functions     3      6         4     2           9          9
D: Stripe.js        7      7         5     6           6          7
```

**A wins on Speed + Cost + Complexity.** Loses on CEO readiness and RaaS depth — but those can be addressed in Phase 2.

---

## 3. Binh Phap Recommendation (兵法 — Strategic Decision)

### PRIMARY RECOMMENDATION: Option A + Phase B Upgrade Path

**以正合奇勝** (Conventional + Surprise):
- **Phase 1 (正合):** Deploy Polar redirect links immediately — zero backend, zero config changes
- **Phase 2 (奇勝):** Upgrade to Polar.js client SDK once CFO/pricing is finalized

### Rationale

#### 1. 知己 (Know Yourself)
- Team velocity: Solo dev, M1 16GB constraints (per README: "no many browser/subagent")
- Time pressure: CEO handoff readiness — need working checkout THIS WEEK
- Existing capability: Polar integration proven in `cli/` and `apps/well/` — team knows Polar patterns
- Current state: Static export, no server, CF Pages only

#### 2. 知彼 (Know the Enemy/Context)
- Customer expectation: "I want to buy a template" — redirect to payment page is sufficient
- Polar.sh advantage: Built for exactly this use case (RaaS/software products)
- CF Pages limitation: No server runtime in static export — CF Functions require structural change
- Stripe disadvantage: Requires backend for checkout session creation (can't do client-only safely)

#### 3. 兵貴神速 (Speed is Essence)
- Option A: 30 minutes to deployable checkout
- Option C: 4-6 hours minimum, breaks current build config
- **A 10x faster than C — and C is the only "better" option**

#### 4. 先計戰勝 (Calculate Before Fighting)
The "upgrade path" from A → B is painless:
- Phase 1: Template cards link to `https://polar.sh/checkout/{product_id}`
- Phase 2: Replace `<a href>` with Polar.js SDK `checkout()` call
- Same template card component, just swap the click handler
- No schema changes, no migration, no new files

---

## 4. Implementation Roadmap (Execution Phases)

### Phase 1: Deploy Working Checkout (30 min) — THIS WEEK

**Goal:** Working checkout links on templates page. CEO can demo.

#### Step 1: Create Polar Products (10 min)
```bash
# Via Polar Dashboard (manual, one-time):
# 1. Go to https://polar.sh/settings/products
# 2. Create 6 products matching template cards:
#    - fnb-cloud-kitchen ($149)
#    - dropship-hub ($99)
#    - saas-launchpad ($299)
#    - agency-os ($249)
#    - creator-economy ($79)
#    - freelance-stack ($49)
# 3. Copy checkout URLs: https://polar.sh/checkout/{product_id}
```

#### Step 2: Update Template Card Component (10 min)
**File:** `mvp/src/components/template-card.tsx`

Change line 32 from:
```tsx
href={`https://polar.sh?product=${template.name.toLowerCase().replace(/\s+/g, '-')}`}
```
To:
```tsx
href={`https://polar.sh/checkout/${template.productSlug}`}
```

Add `productSlug` to template data (or map in component).

#### Step 3: Add Polar Env Config (5 min)
**File:** `mvp/.env.local` (add):
```
NEXT_PUBLIC_POLAR_ACCESS_TOKEN=polar_xxx  # for future SDK use
NEXT_PUBLIC_POLAR_ORGANIZATION_ID=org_xxx
```

#### Step 4: Fix Stripe Security Bug (5 min)
**File:** `mvp/src/lib/stripe.ts`
```diff
- export const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!, {
+ export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
```

This is a **blocking bug** — fix before any other work.

#### Step 5: Verify Build (5 min)
```bash
cd mvp && npm run build
```
Must pass with zero errors before deploy.

### Phase 2: Polar.js SDK Upgrade (2-3 hours) — NEXT SPRINT

**Goal:** Client-side checkout with session tracking, webhooks, subscription management.

#### Prerequisites
- Polar account with products created (from Phase 1)
- Polar publishable key obtained (`polar_at_xxx` for access token)
- CFO approves pricing tiers

#### Steps
1. Install `@polar-sh/sdk` in `mvp/`
2. Create `mvp/src/lib/polar.ts` (client-side Polar client)
3. Add checkout page: `mvp/src/app/checkout/page.tsx`
4. Replace `<a href>` in TemplateCard with `polar.checkout()` SDK call
5. Add Polar webhook endpoint (via CF Pages Functions or Polar → CLI webhook)
6. Add order confirmation page

### Phase 3: RaaS Revenue Infrastructure (1-2 weeks) — PRODUCTION

**Goal:** Full monetization: subscriptions, usage tracking, overage billing.

- Webhook handler for subscription events
- Customer portal (Polar provides hosted)
- Usage metering if per-seat billing needed
- Analytics integration (track conversion funnel)

### Phase 4: CEO Handoff Package (ongoing)

- Admin dashboard for revenue metrics
- Customer list + MRR tracking
- Churn alerts
- Self-serve documentation

---

## 5. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Polar.sh service downtime | Low | Medium | Links break → no checkout. Mitigate: Phase 2 adds fallback messaging |
| Product slug mismatch | Medium | Low | Validate slugs against Polar dashboard before deploy |
| Price changes require Polar update | Medium | Low | Single source of truth: Polar dashboard. Template prices display-only |
| Customer expects instant delivery | Medium | High | Add "You'll receive access within 24h" messaging on checkout |
| Stripe bug leaks secret key | **HIGH** (if deployed) | **CRITICAL** | **Fix BEFORE deploy — see Phase 1 Step 4** |
| CF Pages build cache stale after .env change | Low | Low | Clear build cache on deploy: `rm -rf .next && npm run build` |
| Polar SDK maturity (Phase 2) | Unknown | Medium | Evaluate SDK docs before committing. Fallback: keep redirect links |

---

## 6. Final Verdict (决断)

### Decision: Option A (Polar Redirect Links) NOW → Option B (Polar.js SDK) LATER

**Rationale summary:**
1. **兵贵神速:** 30 minutes to working checkout vs 4-6 hours for CF Functions
2. **知己知彼:** Static export is a hard constraint — fighting it wastes time
3. **以正合:** Redirect links solve 80% of need (customer can pay) with 5% of effort
4. **奇勝:** SDK upgrade path is clean — swap click handler, no schema changes
5. **KISS:** Zero new dependencies, zero config changes, zero risk of breaking build
6. **CFO/CEO ready:** Can demo checkout flow today, iterate on tracking later

### Immediate Actions (Today)
1. [ ] Fix `stripe.ts` security bug — `NEXT_PUBLIC_STRIPE_SECRET_KEY` → `STRIPE_SECRET_KEY`
2. [ ] Create 6 Polar products in dashboard
3. [ ] Update template-card.tsx with real Polar checkout URLs
4. [ ] Add Polar env vars to .env.local
5. [ ] Build + deploy + verify

### Phase 2 Trigger
- CFO approves pricing tiers
- CEO requests conversion tracking
- Customer asks for subscription management

---

## Appendix: What Was Eliminated and Why

### Option C (CF Pages Functions) — Eliminated
- Requires abandoning `output: 'export'` — major build config rewrite
- Adds CF Workers runtime compatibility risk
- 15x slower than Option A
- No benefit over Option B for this use case (both need Polar anyway)

### Option D (Stripe.js) — Eliminated
- Requires full Stripe account setup + product creation in Stripe dashboard
- Stripe is NOT referenced in project docs — Polar IS
- Would mean maintaining TWO payment integrations (Stripe + Polar)
- Higher monthly cost than Polar for subscription billing

### Option B (Polar.js SDK NOW) — Deferred
- SDK maturity unknown — need to evaluate docs first
- No publishable key available yet (needs Polar dashboard access)
- Redirect links (A) deliver 80% value in 5% of time

---

*Report follows Binh Phap principles: 知己知彼 (know both sides), 兵貴神速 (speed is essence), 以正合奇勝 (conventional + surprise).*
*All analysis based on actual codebase inspection — no assumptions about project state.*
