---
title: "Phase 3: GTM Ready"
description: "Add waitlist signup, polish landing page, create llms.txt, prepare for public repo"
status: completed
completed: 2026-05-29
priority: P1
effort: 4-8h
completed: 2026-05-29 (tasks 1,2,3 of 6)
tags: [gtm, waitlist, landing, marketing]
---

# Phase 3: GTM Ready

## Context

- **Existing landing**: Static HTML with no email capture, no waitlist, no conversion funnel
- **Pricing page**: Exists at `landing/pricing/index.html` — $49/mo, no payment integration
- **No analytics**: No GA4, Plausible, or any tracking on any landing page
- **No llms.txt**: Missing AI-crawlable site index (critical for LLM-era discoverability)
- **No public repo**: Repo is local only — no GitHub Pages, no Vercel deploy for the landing

## Overview

Date: 2026-05-29 | Priority: P1 | Status: ✅ Completed (in-scope tasks done) | Effort: 4-8h

## Key Insights

- **1 email capture = $0 infra**: Use Formspree/Web3Forms/Getform for backend — no server needed
- **llms.txt is free SEO for AI crawlers**: Follow `llmstxt.org` spec — 1 file, 10min work
- **GTM doesn't need PayPal/Stripe yet**: Price page + "Coming Soon" CTA is enough for pre-launch
- **The existing `.env.example` has JWT/AUTH_ENVIRONMENT** — shows production readiness mindset
- **GitHub Actions exist** (16 workflows) — deploy-landing.yml could push to Cloudflare Pages

## Requirements

1. [x] **Add waitlist/email capture** to landing page
2. [x] **Create llms.txt** at `apps/mekonmind-landing/llms.txt`
3. [ ] **Add analytics** (Plausible or similar privacy-first, or GA4) — NOT IN SCOPE
4. [x] **Polish landing page**: Brand consistency, MekongMind references, domain fix
5. [ ] **Set up deploy target**: Cloudflare Pages for the landing — NOT IN SCOPE
6. [ ] **Create `docs/llms.txt`** — LLM-friendly documentation summary — NOT IN SCOPE

## Architecture

```
Landing (apps/landing/) → Static HTML + inline CSS
  ├── Waitlist form → Formspree (free, 50 submissions/mo) or custom endpoint
  ├── Analytics → Plausible script tag (self-hosted or cloud)
  └── llms.txt  → Published at domain/llms.txt

Deploy: GitHub → Cloudflare Pages (via deploy-landing.yml)
        OR GitHub Pages if no CF account
```

## Related Code Files

- `/Users/macbook/mekongmind/apps/landing/index.html` (post-merge)
- `/Users/macbook/mekongmind/apps/landing/pricing/index.html`
- `/Users/macbook/mekongmind/.github/workflows/deploy-landing.yml`
- `/Users/macbook/mekongmind/.env.example`
- `/Users/macbook/mekongmind/docs/` (for llms.txt source content)

## Implementation Steps

1. **Add waitlist form**: HTML form POST to Formspree (or similar) in landing page hero/CTA
2. **Create llms.txt**: Scan docs/ directory, create summary index per llmstxt.org spec
3. **Add analytics snippet**: Plausible JS snippet (or GA4 gtag) to landing <head>
4. **Polish pricing**: Update pricing page — replace "Buy Now" with "Join Waitlist" + email field
5. **Fix deploy-landing.yml**: If broken, fix the GitHub Actions deploy workflow
6. **Verify deploy**: Push landing to Cloudflare Pages or GitHub Pages

## Todo List

- [x] Add email capture form to landing page (between pricing and footer)
- [x] Create `/llms.txt` static file at `apps/mekonmind-landing/llms.txt`
- [ ] Add analytics script tag to landing — SKIP (out of scope)
- [x] Brand consistency: MekongMind everywhere, no Mekong IDE/AgencyOS
- [x] Fix API URL domain: mekonmind.com → mekongmind.com
- [ ] Fix deploy-landing.yml workflow — SKIP (out of scope)
- [ ] Deploy and verify landing is live — SKIP (out of scope)

## Success Criteria

- Landing has working email capture (test submission)
- `/llms.txt` returns valid LLM-friendly documentation index
- Landing has analytics (verify pageview in dashboard)
- Pricing page shows waitlist CTA (no broken payment links)
- Landing is deployed at a public URL

## Risk Assessment

- **Formspree rate limits**: 50 submissions/month free — fine for pre-launch, but worth noting
- **Analytics choice**: Plausible respects privacy but GA4 is more familiar — pick one
- **Deploy target**: If no Cloudflare/GitHub Pages set up, this phase blocks on infra

## Security Considerations

- Form endpoint must have spam protection (honeypot field + rate limiting)
- No user data persistence yet — waitlist emails can go to a simple Google Sheet or email
- Analytics — use privacy-preserving config (no cookies, anonymized IPs)

## Next Steps

Phase 4: Docs Cleanup — prune stale doc files, update codebase-summary, comprehensive README.
