# Handover Checklist (Project Closeout)

**When:** After UAT pass + final payment milestone
**Who:** PM + Tech Lead + Customer
**Duration:** 1–2h on-site or Zoom

---

## Pre-handover (PM responsibility)

- [ ] All deliverables in SOW completed
- [ ] All bugs from UAT fixed and verified
- [ ] Production deploy successful
- [ ] Last invoice issued and paid (or scheduled)
- [ ] Internal retro doc draft (`04-retro.md`) written

## Documentation handover

- [ ] User manual (PDF) — Vietnamese, screenshots
- [ ] Admin manual (PDF) — login, common tasks
- [ ] Video walkthrough (5–10 min) on Google Drive
- [ ] FAQ document (anticipate top 10 questions)
- [ ] Architecture diagram (1 page, draw.io exported PNG)
- [ ] API documentation (if applicable, Swagger/Redoc URL)

## Access handover

### Code
- [ ] GitHub repo: transfer ownership OR add customer as admin
- [ ] Source code zip backup (in case customer doesn't use Git)
- [ ] Build artifacts (if needed)

### Hosting & Infrastructure
- [ ] Domain: customer is registered owner (we never own customer's domain)
- [ ] Cloudflare account: customer's account (or transfer site)
- [ ] DNS records documented (export to Notion `customers/{slug}/03-deliverables/dns.md`)
- [ ] SSL cert (Cloudflare auto, doc the setup)

### Database & Data
- [ ] Supabase project: transfer to customer's org OR keep ours with read-export
- [ ] Database schema documented (ER diagram)
- [ ] Initial data seed script (if any)
- [ ] Backup procedure documented

### Third-party services
- [ ] Resend / email provider: customer's account
- [ ] Payment gateway (Polar/Stripe/VietQR): customer's account
- [ ] Mapbox / Goong / external APIs: customer's keys
- [ ] Sentry / monitoring: customer's account or shared (per agreement)

### Credentials
- [ ] All passwords transferred via 1Password / Bitwarden / sealed envelope
- [ ] API keys revoked from our team after handover (except agreed maintenance access)
- [ ] Update IP allowlist if any

## Knowledge handover

- [ ] 1h walkthrough session (recorded)
- [ ] Customer can perform 5 critical tasks unassisted (verified)
- [ ] Customer's tech contact added to our Slack channel (if maintenance retainer)
- [ ] Emergency contact list shared

## Warranty period (30 days post-handover)

- [ ] Warranty terms documented in SOW reminded
- [ ] Bug priority levels explained:
  - **Critical** (site down, data loss): 24h response
  - **Major** (feature broken): 5 day fix
  - **Minor** (cosmetic, edge case): 14 day fix
- [ ] Single point of contact for warranty issues

## Maintenance retainer transition (if signed)

- [ ] Maintenance contract signed
- [ ] Monthly billing setup
- [ ] Slack/Zalo support channel created
- [ ] SLA reminded
- [ ] Schedule 30-day check-in

## Internal closeout (after handover)

- [ ] Update Notion `customers/{slug}/04-retro.md` (mandatory)
- [ ] Update Pain Tag CSV with `status=won`, `closed_at`, final `deal_size`
- [ ] Add to portfolio (if customer consents — explicit yes/no)
- [ ] Schedule 30/60/90-day check-in calls
- [ ] PM logs lessons learned in next Dev Council
- [ ] Code/design assets evaluated for `@mekong/*` shared lib promotion

## Customer consent for portfolio / case study

Ask explicitly (after delivery, before invoice paid):
- [ ] Logo & company name displayed on portfolio site? (yes/no)
- [ ] Public case study with metrics? (yes/no)
- [ ] Quote / testimonial? (yes/no)
- [ ] Reference call for prospects? (yes/no, with frequency cap)

Record in `customers/{slug}/consent.md`. Honor strictly.

## Post-handover follow-ups

| When | What |
|---|---|
| Day 7 | Quick Zalo: "everything OK?" |
| Day 30 | Formal check-in call (30 min) |
| Day 60 | Email: any new pain points? upsell opportunities? |
| Day 90 | NPS survey + retro from customer side |
| Day 180 | Re-engagement: new project? referral ask |
| Day 365 | Anniversary touch-point |
