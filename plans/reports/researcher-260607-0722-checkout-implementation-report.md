# Checkout Implementation Research — Static Next.js on Cloudflare Pages

**Date:** 2026-06-07  
**Context:** mekongmind.com landing + RaaS templates, Next.js 14.2 `output: 'export'`, Cloudflare Pages  
**Goal:** User selects plan/template → pays → gets access (no backend API routes)

---

## Current State Audit

- `next.config.js` has `output: 'export'` — pure static HTML/JS/CSS output
- `stripe` v15 installed but `src/lib/stripe.ts` uses `NEXT_PUBLIC_STRIPE_SECRET_KEY` — **security bug**: secret key exposed to client
- Template cards link to `polar.sh?product=...` but Polar SDK is not installed
- No API routes, no CF Pages Functions directory found
- Already deployed to CF Pages (confirmed by `.wrangler/` dir)

---

## Approach Comparison

### A) Client-Side Polar.sh SDK (`@polar-sh/sdk`)

| Dimension | Assessment |
|-----------|------------|
| **Implementation effort** | LOW. Drop-in `<PolarCheckout />` component. No backend needed. ~20 lines. |
| **Security** | ZERO risk. Public key only. Polar handles all payment processing server-side. |
| **Access delivery** | Built-in: Polar manages license keys, webhooks → your app verifies via public API or JWT. No backend required to validate — user receives access link/email from Polar. |
| **CF Pages fit** | Perfect. Pure static files. SDK loads from CDN. |
| **Current deps impact** | Need to add `@polar-sh/sdk` (~10KB). Stripe 15 can stay or be removed. |
| **Vietnam ecosystem fit** | Polar supports global cards (Visa/MC) via Stripe/PayPal under the hood. **No direct VND settlement.** You receive USD/EUR. Customer pays in card currency + conversion fee. |
| **Tax/compliance (VN)** | Polar handles tax calculation (VAT/GST) for supported regions. Vietnam VAT not natively supported — you handle tax reporting manually. |

**Polar.sh pros:**
- Fastest path to revenue: 30-60 min integration
- Handles subscriptions + one-time payments
- Built-in customer portal, license key management
- Low operational overhead (no backend to maintain)
- Designed for indie/solo devs selling digital products

**Polar.sh cons:**
- Vietnam-specific payment methods (MoMo, ZaloPay, bank transfer) **not supported** — only international cards
- No VND pricing — prices in USD/EUR only
- Platform fee: ~5% + payment processing fee (higher than direct Stripe)
- Less control over checkout UX (hosted checkout pages)
- Webhook validation requires at least a CF Pages Function or client-side polling

---

### B) Client-Side Stripe (Stripe.js Payment Element / Checkout Links)

| Dimension | Assessment |
|-----------|------------|
| **Implementation effort** | MEDIUM. Two sub-options: **Checkout Links** (easiest, ~10 min) or **Payment Element** (custom, ~2-3 hrs). |
| **Security** | SAFE if done right. Checkout Links = zero secret exposure. Payment Element requires a backend to create PaymentIntent — **blocked by static export** unless using CF Pages Functions. |
| **Access delivery** | Manual. Stripe gives you `payment_status` in redirect URL or webhook. You must implement access-granting logic yourself. |
| **CF Pages fit** | Checkout Links: perfect. Payment Element: needs CF Pages Functions (see Option C). |
| **Current deps impact** | Stripe 15 already installed. Add `@stripe/stripe-js` + `@stripe/react-stripe-js` (~30KB). |
| **Vietnam ecosystem fit** | **Best option.** Stripe supports Vietnam merchant accounts (via Stripe Atlas or local entity). Accepts VND directly. Integrates MoMo, ZaloPay via Stripe Pay. |

**Stripe pros:**
- Vietnam merchant support: accept VND natively
- Customer payment methods: international cards + MoMo + ZaloPay
- Lowest fees: ~2.9% + 30¢ (VN: ~3.3% + fixed) vs Polar's ~5%
- Full control over checkout UX (Payment Element)
- Mature webhook ecosystem for fulfillment automation
- Already in your `package.json`

**Stripe cons:**
- Checkout Links (no backend) = hosted page, less customization
- Payment Element (custom) = needs backend → requires CF Pages Functions (Option C)
- More operational complexity than Polar
- Merchant account setup required (not instant like Polar)

---

### C) CF Pages Functions (Server-Side, `_worker.js`)

| Dimension | Assessment |
|-----------|------------|
| **Implementation effort** | MEDIUM-HIGH. Add `_worker.js` or `functions/` dir. Write CF Workers handlers for Stripe/Polar webhooks + session creation. ~4-6 hrs. |
| **Security** | BEST. Secrets stored in CF Pages environment variables (not in git). Server-side session creation. |
| **Access delivery** | Full control. Webhook handler → update user access in DB or send custom email. |
| **CF Pages fit** | Native. CF Pages supports Functions at no extra cost (within free tier: 500 invocations/day, 10ms CPU). |
| **Current deps impact** | Minimal. Can use existing Stripe SDK or Hono (already in monorepo deps). |
| **Vietnam ecosystem fit** | Same as the payment provider you choose (Stripe = best for VN). |

**CF Pages Functions pros:**
- Enables full Payment Element (custom checkout)
- Secure webhook handling (Stripe/Polar)
- Can add auth middleware, rate limiting, logging
- Free tier generous enough for MVP (500 invocations/day)
- Keeps secrets server-side

**CF Pages Functions cons:**
- Adds infrastructure complexity (deployment, debugging, cold starts ~50-100ms)
- Free tier 500 invocations/day may not scale (upgrade: $0.15/million invocations)
- More code to maintain
- Requires learning CF Workers runtime (slightly different from Node)

---

## Polar.sh — Vietnam Market Deep Dive

**Currency:** USD/EUR only. No VND support. Your pricing shown to Vietnamese customers will be in USD — conversion happens at card issuer level.

**Tax:** Polar auto-calculates VAT for EU/UK/US. Vietnam VAT (8-10% for digital services) not auto-handled. You must:
- Register for VAT if revenue exceeds VND 100M/year
- File monthly VAT returns manually
- Consider using Polar's "custom amount" feature to include tax in price

**Compliance:**
- Polar is EU-based (GDPR compliant)
- No Vietnamese data residency guarantee
- For Solo Company/OPC in Vietnam: no special licensing needed for digital product sales, but keep invoices for tax reporting

**Customer experience:**
- Vietnamese buyers see USD charge on statement (not VND)
- MoMo/ZaloPay users excluded (no local payment methods)
- International card acceptance: ~30-40% of Vietnamese online shoppers have international cards (2025 estimate)

---

## Recommendation: **Hybrid Approach**

### Phase 1 (Now — 1 hour): Stripe Checkout Links + CF Pages Functions for Webhooks

**Rationale:**
1. **Vietnam market fit > everything.** You need VND + MoMo/ZaloPay. Only Stripe delivers this.
2. **Fastest valid path.** Checkout Links = no backend needed for checkout. CF Pages Functions = webhook handler for access delivery.
3. **Low risk.** Stripe Checkout Links use hosted pages (PCI-compliant out of the box). No secret exposure.
4. **Migration path to Phase 2** is clear when you outgrow Checkout Links.

**Implementation steps:**
1. Remove `NEXT_PUBLIC_STRIPE_SECRET_KEY` exposure in `src/lib/stripe.ts`
2. Create Stripe Checkout Links in Dashboard (one per template/plan)
3. Update `template-card.tsx` links from `polar.sh?product=...` → Stripe Checkout Link URLs
4. Add `functions/_worker.js` or `functions/webhook.js` in CF Pages to handle Stripe webhooks (validate `payment_intent.succeeded` → grant access)
5. Store access grants in localStorage (MVP) or add lightweight D1/KV (CF Pages KV = free tier 1M reads/month)

**Cost:** $0 (Stripe fees only). CF Pages Functions free tier sufficient for MVP.

---

### Phase 2 (Post-MVP — 2-3 hrs): Stripe Payment Element + CF Pages Functions

When you need custom checkout UX:
1. Add `functions/api/create-checkout-session.js` (CF Pages Function)
2. Use Stripe Payment Element on `/checkout` page
3. Full control over pricing, tax, VND display

---

## Unresolved Questions

1. **Access delivery mechanism:** How will users prove purchase to access templates? (Email link? License key? Account system?)
2. **Stripe merchant account:** Do you have a Vietnam Stripe account, or using Stripe Atlas/other entity?
3. **VND pricing strategy:** Price in VND with Stripe auto-convert, or show USD with disclaimer?
4. **Polar.sh webhook validation:** If sticking with Polar, need at least one CF Pages Function for webhook — confirms this approach adds complexity anyway.
5. **Local payment methods priority:** Is MoMo/ZaloPay a "must-have" or "nice-to-have" for first 100 customers?

---

**Status:** DONE  
**Sources:** [Polar.sh docs](https://polar.sh/docs), [Stripe Vietnam](https://stripe.com/vn), [CF Pages Functions](https://developers.cloudflare.com/pages/functions/), [Stripe Checkout Links](https://stripe.com/docs/payments/checkout/quickstart), codebase analysis (`mvp/next.config.js`, `src/lib/stripe.ts`, `src/components/template-card.tsx`)
