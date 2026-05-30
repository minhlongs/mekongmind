# Knowledge Base Structure (Notion + Repo)

**Goal:** Mỗi project sản xuất 1 deliverable + 1 reusable insight + 1 customer-facing doc. Codified, không trong đầu PM.

---

## Notion top-level

```
📁 Mekong Digital (workspace)
├── 🏠 Home (dashboard)
├── 👥 Team
│   ├── Founders Agreement
│   ├── ESOP plan
│   ├── Hiring guide
│   └── On-boarding checklist (new hire)
├── 📋 Templates
│   ├── SOW (5 service types)
│   ├── Discovery Form
│   ├── Founders Agreement
│   ├── NDA + Service Agreement
│   ├── Change Request form
│   └── Closeout Retro form
├── 💼 Customers
│   ├── {customer-slug-1}/
│   │   ├── 00-discovery.md
│   │   ├── 01-sow.md
│   │   ├── 02-decisions.md
│   │   ├── 03-deliverables/ (links to repo)
│   │   ├── 04-retro.md (mandatory at closeout)
│   │   └── 05-followup-log.md
│   ├── {customer-slug-2}/
│   └── ...
├── 📊 Pipelines (Airtable embedded)
│   ├── leads (discovery → proposal)
│   ├── active-projects (signed → in-progress)
│   ├── retainers (monthly billing)
│   └── pain-tags (CSV mining table)
├── 📚 Runbooks
│   ├── deploy-cloudflare-pages.md
│   ├── setup-supabase-rls.md
│   ├── kiotviet-api-integration.md
│   ├── misa-connector-howto.md
│   ├── zalo-oa-verification-process.md
│   ├── zns-template-approval.md
│   ├── domain-vn-registration.md
│   └── handover-checklist.md
├── 🎨 Brand
│   ├── Logo + variants
│   ├── Color palette + tokens
│   ├── Typography
│   ├── Voice & tone guide
│   └── Photography guidelines
├── 💰 Finance
│   ├── Pricing matrix
│   ├── Cost structure
│   ├── Cap table
│   └── Monthly P&L (Airtable)
├── 📈 Strategy
│   ├── Roadmap (12mo)
│   ├── Quarterly reviews
│   ├── OKRs
│   └── Decision log
└── 🔬 Research
    ├── Market research (links to plans/reports/)
    ├── Competitive scan (quarterly)
    ├── Customer pain pattern mining (Q-output)
    └── Tech radar (stack decisions log)
```

---

## Customer folder convention

Slug: kebab-case `{industry}-{name}-{location-3letter}`. VD `agr-htx-tanphu-dt`, `food-cafe-binh-thuy-ct`.

### `00-discovery.md` (filled at intake)
- Output từ `templates/intake-form.md`
- ALL fields filled (không skip)
- Pain tag CSV row appended

### `01-sow.md` (filled at proposal)
- Copy từ relevant SOW template
- Customize scope, price, timeline
- Cross-link với `00-discovery.md`

### `02-decisions.md` (architectural decisions log)
- Mỗi decision có format: Context / Decision / Alternatives / Rationale / Reversibility
- VD: "Decision: dùng Astro thay vì Next cho landing — Rationale: KH không cần app/auth, perf+SEO ưu tiên"

### `03-deliverables/`
- Link tới repo GitHub
- Demo URLs
- Assets folder Google Drive

### `04-retro.md` (MANDATORY at closeout — NO EXCEPTIONS)
Format:
```md
# Closeout Retro: {customer-slug}

**Date:** YYYY-MM-DD
**PM:** ___
**Duration:** ___ weeks
**Final price:** ___ (vs original SOW: ___)

## What worked
- ...

## What was hard / wasted time
- ...

## Patterns repeated from previous projects
- (cross-link other 04-retro.md files where same pattern observed)

## Patterns NEW (potentially repeatable)
- (this is product candidate signal!)

## Code/design assets to extract → shared lib
- ...

## Customer satisfaction (1-5): ___
## NPS asked? (yes/no): ___ Score: ___

## Next steps
- [ ] Add to portfolio (with consent)
- [ ] Schedule 30-day check-in
- [ ] Upsell opportunity: ___
```

### `05-followup-log.md`
- Hàng tháng/quý touch-base log
- Bugs, requests, upsell signals

---

## Repo structure (parallel to Notion customers/)

```
mekong-digital/ (this repo)
├── docs/                    # ← Notion mirror (markdown source of truth, ko commit data khách)
├── packages/                # shared lib npm packages
│   ├── ui/
│   ├── lead-form/
│   ├── zalo-oa-sdk/
│   ├── kiotviet-connector/
│   └── ...
├── apps/                    # internal apps (Y2+) — KHÔNG đặt customer code ở đây
│   ├── marketing/           # mekongdigital.vn (sau khi greenlit)
│   └── internal-dashboard/  # Y2
├── workers/                 # Cloudflare Workers utility (lead-api, etc.)
└── plans/                   # implementation plans (per /ck:plan)

# Per-customer repo (separate, in same GitHub Org):
mekong-digital/customer-{slug}/   # private repo per customer
├── apps/
│   ├── web/
│   └── admin/
├── ...
└── README.md (links to Notion 03-deliverables)
```

**KHÔNG commit customer code vào core repo.** IP isolation.

---

## Permissions matrix (Notion + GitHub)

| Resource | Founder | Senior dev | Junior dev | Designer | Sales | Contractor |
|---|---|---|---|---|---|---|
| Founders Agreement | RW | — | — | — | — | — |
| Customers / | RW | R (assigned only) | R (assigned only) | R (assigned only) | RW | R (assigned only) |
| Templates | RW | RW | R | RW (brand only) | RW (SOW) | R |
| Pipelines | RW | R | — | — | RW | — |
| Runbooks | RW | RW | RW | R | R | R |
| Brand | RW | R | R | RW | R | R (NDA) |
| Finance | RW | — | — | — | R (sales own data) | — |
| Strategy | RW | R (read-only) | — | — | R (read-only) | — |
| Research | RW | RW | RW | RW | RW | R (NDA) |
| GitHub Org `core/` | Admin | Maintain | Write | — | — | Read |
| GitHub Org `customer-*/` | Admin | Maintain (assigned) | Write (assigned) | — | — | Write (NDA) |

---

## Daily/weekly hygiene

**Daily (PM/founder):**
- 15-min standup (Slack hoặc on-site)
- Update task in Linear/Notion
- Log customer touch-points (Zalo/email screenshots → customer folder)

**Weekly (whole team):**
- 1h Dev Council: discuss patterns, ratify shared lib changes
- 30-min Sales review: pipeline + lead quality

**Monthly:**
- Project P&L per customer
- Pattern mining preview (CSV pivot)
- 1:1 founder review (career + roadblock)

**Quarterly:**
- Pain pattern mining → product candidate review
- Architecture review (kill abstractions used <2x)
- OKR review + reset
- Compensation review
