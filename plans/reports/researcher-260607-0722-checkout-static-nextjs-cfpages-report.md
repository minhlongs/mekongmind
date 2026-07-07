# Checkout Implementation Research — Static Next.js on Cloudflare Pages

## Current State
- `/Users/macbook/mekongmind/mvp/next.config.js`: `output: 'export'` (static)
- Already uses `stripe` SDK in `src/lib/stripe.ts` (currently configured for server-side)
- Template cards link directly to `https://polar.sh?product=...` (no SDK yet)
- Existing Stripe setup assumes server-side session creation (not usable in static export)
- CF Pages has Functions support via `_worker.js` or `functions/` directory

## Approach Comparison

### A) Client-side Polar.sh (`@polar-sh/sdk` browser)
- Effort: LOW. Drop-in `<CheckoutButton>` or `window.Polar`. No backend required.
- Security: SAFE. Polar handles all sensitive logic client-side; public key only.
- Flow: select plan → Polar checkout popup → webhook → grant access (manual/email).
- Vietnam fit: Polar natively supports global cards + PayPal; does NOT natively support MoMo, ZaloPay, or VND. Tax/compliance: Polar handles EU VAT, US tax; Vietnam-specific tax (VAT/GTGT) is manual or absent.
- Limitation: requires webhook endpoint to mark order complete — but static site has no webhook listener unless you add CF Pages Functions.

### B) Client-side Stripe (Stripe.js / Payment Element / Checkout Links)
- Effort: MEDIUM. Checkout Links easiest (no JS SDK needed, just link). Payment Element most flexible.
- Security: SAFE. Publishable key is public by design; Stripe.js handles card data in Stripe's iframe.
- Flow A (Checkout Links): create links in Stripe Dashboard → hardcode in template cards → redirect to Stripe-hosted page → back to success URL. No code needed beyond links.
- Flow B (Stripe.js): embed Payment Element client-side; requires `stripe.confirmPayment()` with a client secret — which normally requires backend `stripe.paymentIntents.create()`. Workaround: pre-create PaymentIntents via Stripe Dashboard or CF Functions.
- Vietnam fit: Stripe does NOT currently operate in Vietnam (no local acquiring). Users pay with international cards only. No MoMo/ZaloPay. FX conversion at Stripe rate + potential issuer declines for Vietnam-issued cards.

### C) CF Pages Functions (`_worker.js`)
- Effort: MEDIUM-HIGH. Requires moving from pure static export to hybrid: static pages + `functions/` directory for API routes.
- Security: FULL control. Secret API keys stay in CF env vars; server creates sessions/PaymentIntents; client only gets client-safe tokens.
- Flow: select plan → `/api/checkout` CF Function creates Stripe/Polar session → redirect to hosted checkout → webhook → grant access via KV/DB.
- Vietnam fit: same payment-method limits as A/B, but you can add custom logic (e.g., redirect MoMo users to alternative flow).
- Cost: CF Pages Functions free tier = 500 invocations/day; paid = $0.15/million invocations. Negligible for early stage.

## Polar.sh vs Stripe — Vietnam Market Fit

| Dimension | Polar.sh | Stripe |
|---|---|---|
| Developer DX for solo/indie | Excellent (hosted checkout, SDK, webhooks) | Excellent but more config |
| Card acceptance | Global cards, PayPal | Global cards, Apple/Google Pay |
| Vietnam local methods (MoMo/ZaloPay) | No native support | No native support |
| VND pricing | Show any price; Polar settles in EUR/USD | Show any price; settles in USD/EUR |
| Vietnam tax/VAT | Manual; no built-in GTGT | Manual; no Vietnam tax layer |
| Subscription management | Built-in tiers, usage-based add-ons | Built-in (Subscriptions API) |
| Webhook reliability | Good (retries, signature) | Excellent (mature infra) |
| Fee structure | ~5% + payment processor fee | ~2.9% + $0.30 (Stripe rate) |
| Solo Company / OPC alignment | High — indie-friendly brand, lower setup friction | Medium — requires Stripe account + verification |

## Recommendation

**Option B (Stripe Checkout Links) for immediate launch, migrate to Option C (CF Pages Functions) when ready for webhooks.**

Rationale:
1. FASTEST path to payment: create 3 Stripe Checkout Links (Starter/Pro/Enterprise) in Dashboard, paste into template cards. Zero code. Deploys today.
2. YOU ALREADY HAVE `stripe` v15 in `mvp/package.json`. No new dependency.
3. CF Pages Functions is a 30-minute migration when you need webhooks/access control — just add a `functions/` dir, keep static export for pages.
4. Polar.sh is attractive for DX but adds a new payment processor + does NOT solve Vietnam local payments either. Switching cost is low if starting with Stripe.
5. For Vietnam market specifically: neither solves MoMo/ZaloPay today. Budget for a separate MoMo integration later (MoMo has public API + sandbox).

## Implementation Effort Estimate

| Phase | What | Time |
|---|---|---|
| Phase 1 (today) | Create 3 Stripe Checkout Links, replace Polar hrefs with Stripe links, add success/cancel pages | 1-2 hours |
| Phase 2 (week 1) | Add CF Pages Functions `/api/checkout` for dynamic session creation, webhook handler for access grants | 4-6 hours |
| Phase 3 (later) | Add MoMo payment method via MoMo API + CF Functions | 1-2 days |

## Security Notes
- Stripe Checkout Links: publishable key not needed at all for link-based flow (no JS SDK required)
- CF Functions: store `STRIPE_SECRET_KEY` in CF env vars, never in client bundle
- Never expose `NEXT_PUBLIC_STRIPE_SECRET_KEY` to browser — current `stripe.ts` does this incorrectly; fix before any client-side Stripe code ships

## Sources
- Stripe Vietnam availability: Stripe official docs (not available as of 2025)
- Polar.sh docs: polar.sh/docs
- CF Pages Functions: developers.cloudflare.com/pages/platform/functions
- Mekongmind codebase: `mvp/next.config.js`, `mvp/src/lib/stripe.ts`, `mvp/src/components/template-card.tsx`

## Unresolved Questions
- Do you have a Stripe account already? If not, Stripe requires a non-Vietnam entity (Singapore/US/EU company) or Stripe Atlas.
- How will "grant access" work after payment? Email delivery? Manual? CRM?
- Will you need subscription (recurring) or one-time template purchases?
- Is MoMo integration a hard requirement for launch or post-launch?
- CF Pages Functions — has the project already enabled Functions in Pages settings?
