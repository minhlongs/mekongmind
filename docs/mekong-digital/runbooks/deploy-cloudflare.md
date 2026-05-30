# Deploy Runbook — Cloudflare Pages + Workers

**Last updated:** 2026-04-28
**Stack:** Astro 5 frontend → CF Pages, Hono Worker → CF Workers + D1
**Domain (current placeholder):** `mekong-digital.pages.dev`

---

## Architecture overview

```
[GitHub main branch push]
   │
   ├─→ deploy-frontend.yml ──→ pnpm build (apps/web)  ──→ wrangler pages deploy ──→ mekong-digital.pages.dev
   │                                                                                         │
   │                                                                       (form POST)──────┘
   │                                                                                         ▼
   └─→ deploy-worker.yml   ──→ wrangler deploy --env production ──→ mekong-lead-api-production.<account>.workers.dev
                                                                              │
                                                                              ├──→ D1 mekong-leads (insert lead)
                                                                              ├──→ Resend (email founder)
                                                                              └──→ Telegram bot (alert)
```

Trigger: push to `main` with changed paths. Both workflows independent (different paths filter).

---

## One-time setup (~30 phút)

### 1. Create Cloudflare account + API token

a. Sign up: https://dash.cloudflare.com/sign-up (free tier đủ Y1)
b. Get Account ID:
   - Dashboard → Workers & Pages → sidebar phải, copy **Account ID** (32-char hex)
c. Create API Token:
   - Dashboard → My Profile → API Tokens → Create Token
   - Use template **"Edit Cloudflare Workers"** OR custom với permissions:
     - Account: `Workers Scripts:Edit`, `Pages:Edit`, `D1:Edit`, `Account Settings:Read`
     - Zone (nếu có domain): `Workers Routes:Edit`, `DNS:Edit`
   - Save token (CHỈ HIỆN 1 LẦN)

### 2. Set GitHub repo secrets

Repo Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | (token vừa tạo) |
| `CLOUDFLARE_ACCOUNT_ID` | (32-char hex) |

Variables (non-secret, also under same page):

| Name | Value |
|---|---|
| `PUBLIC_API_URL` | `https://mekong-lead-api-production.<account>.workers.dev` |
| `PUBLIC_SITE_URL` | `https://mekong-digital.pages.dev` |
| `WORKER_HEALTH_URL` | `https://mekong-lead-api-production.<account>.workers.dev/api/health` |

### 3. Create Cloudflare Pages project (one-time, dashboard)

a. Dashboard → Workers & Pages → Create application → Pages → Direct Upload
b. Project name: `mekong-digital` (must match `--project-name` flag in workflow)
c. Production branch: `main`
d. Skip "Connect to Git" — workflow uses Direct Upload instead

(Direct Upload via wrangler-action không cần GitHub integration trên CF dashboard — đỡ phải authorize.)

### 4. Run interactive setup script

```bash
cd /Users/macbook/mekong-digital
bash scripts/setup-cloudflare.sh
```

Script đi qua: wrangler login → D1 create → schema migrate → secrets put → deploy.

---

## Deploy workflow

### Manual (trigger workflow_dispatch)

GitHub repo → Actions → choose workflow → Run workflow.

### Auto (on push to main)

Path filter triggers each workflow independently:
- `apps/web/**` thay đổi → **deploy-frontend** chạy
- `workers/lead-api/**` thay đổi → **deploy-worker** chạy
- Cả hai có thể chạy song song.

### Local manual (emergency)

```bash
# Frontend
pnpm --filter @mekong/web build
npx wrangler pages deploy apps/web/dist --project-name=mekong-digital --branch=main

# Worker (production env)
cd workers/lead-api
npx wrangler deploy --env production --var BUILD_SHA:$(git rev-parse --short HEAD)
```

---

## Post-deploy verification (MANDATORY per binh-phap-cicd Rule 5)

Sau MỖI deploy:

```bash
bash scripts/verify-production.sh
# hoặc với custom URLs:
bash scripts/verify-production.sh https://yourdomain.vn https://api.yourdomain.vn/api/health
```

Verifies:
- [ ] Frontend HTTP 200
- [ ] `<html lang="vi">`
- [ ] Be Vietnam Pro font loaded
- [ ] Form action points to `/api/lead`
- [ ] Security headers (HSTS, CSP, X-Frame, X-Content-Type)
- [ ] All 4 variants return 200
- [ ] /thank-you HTTP 200
- [ ] Worker /api/health returns `"status":"ok"`
- [ ] Worker BUILD_SHA matches deployed commit

**Nếu FAIL → fix trước khi báo "done" (no exceptions).**

---

## Rollback

### Frontend
Cloudflare Pages giữ deploy history. Dashboard → mekong-digital → Deployments → click old deploy → "Rollback to this deployment".

CLI alternative:
```bash
npx wrangler pages deployment list --project-name=mekong-digital
npx wrangler pages deployment tail --project-name=mekong-digital  # debug logs
```

### Worker
Cloudflare keeps last 10 versions. Dashboard → mekong-lead-api-production → Deployments → Rollback.

CLI:
```bash
cd workers/lead-api
npx wrangler rollback --env production
```

### D1 schema
**KHÔNG có rollback tự động cho D1.** Schema changes destructive. Mỗi schema migration cần backward-compatible (additive) hoặc đi qua 2-step deploy (add column → backfill → switch reads → drop old). Document mỗi migration trong `workers/lead-api/src/db/migrations/`.

---

## Custom domain setup (sau khi đăng ký .vn)

### CF Pages custom domain

1. Dashboard → Pages → mekong-digital → Custom domains → Set up custom domain
2. Add `yourdomain.vn` (and `www.yourdomain.vn`)
3. CF tự thêm DNS record (CNAME → `mekong-digital.pages.dev`)
4. SSL/TLS auto-provisioned (~5-15 phút)
5. Update GitHub vars: `PUBLIC_SITE_URL=https://yourdomain.vn`
6. Update wrangler.toml [env.production.vars]: `ALLOWED_ORIGIN`, `SITE_URL` → `https://yourdomain.vn`
7. Update `apps/web/public/_headers` CSP nếu cần (form-action, connect-src)
8. Re-deploy

### Worker custom domain (api.yourdomain.vn)

1. Dashboard → Workers & Pages → mekong-lead-api-production → Settings → Triggers → Custom Domains → Add Custom Domain
2. Add `api.yourdomain.vn`
3. Update `PUBLIC_API_URL`, `WORKER_HEALTH_URL` GitHub vars
4. Re-deploy frontend

---

## Secrets management

### Set / rotate

```bash
cd workers/lead-api

# Set
npx wrangler secret put RESEND_API_KEY --env production
# Paste value khi prompt

# List (names only, not values)
npx wrangler secret list --env production

# Delete
npx wrangler secret delete RESEND_API_KEY --env production
```

### Rotation cadence
- `RESEND_API_KEY`: rotate 6 tháng/lần or khi nghi compromise
- `TELEGRAM_BOT_TOKEN`: rotate khi rời nhân viên có access bot
- `CLOUDFLARE_API_TOKEN`: rotate 12 tháng/lần
- D1 không có per-database secrets (auth qua API token)

---

## Cost expectations

Free tier limits (đủ cho Y1 < 10k lead/tháng):

| Service | Free quota | Beyond |
|---|---|---|
| CF Pages requests | 100k/day | $0.50/M |
| CF Pages bandwidth | unlimited | unlimited |
| CF Workers requests | 100k/day | $0.30/M |
| CF Workers CPU | 10ms/req | $12.50/M req-ms |
| D1 reads | 5M/day | $0.001/1k |
| D1 writes | 100k/day | $1/M |
| D1 storage | 5GB | $0.75/GB-mo |
| Resend | 100 email/day, 3000/mo | $20/mo for 50k |
| Telegram | unlimited | (Telegram free) |

Predicted Y1 cost: **$0/tháng** (nếu < ~3000 lead/tháng + < 100 email/ngày).

---

## Monitoring

### Built-in (free)
- CF Pages: Analytics tab (Web Analytics privacy-friendly, no cookies)
- CF Workers: Observability tab (logs, errors, CPU time)
- D1: queries dashboard
- Resend: dashboard sent/delivered/bounced

### External (recommend khi có 50+ lead/tháng)
- Sentry frontend: free 5k events/mo
- Sentry Workers: free same quota
- Better Uptime / Cronitor: ping `/api/health` mỗi 60s, alert Slack/Zalo

### Alerts (manual setup)
- CF Workers: Dashboard → Notifications → Worker error rate > 5% → email
- D1: Dashboard → Notifications → Database approaching 5GB

---

## Troubleshooting

### Deploy fails: "Account ID not found"
- Check GitHub secret `CLOUDFLARE_ACCOUNT_ID` matches Dashboard right sidebar
- API token must have access to that account

### Deploy fails: "D1 binding not found"
- D1 database not created yet → run `npx wrangler d1 create mekong-leads`
- Update `wrangler.toml` database_id (cả top-level + [env.production])

### Form returns 500
- Check Worker observability tab for stack trace
- Common: D1 `mekong-leads` không có table → re-run schema migration
- Common: secrets không set trong production env → `wrangler secret list --env production`

### Email không đến
- Check Resend dashboard for bounces
- `RESEND_FROM_ADDRESS` phải verified (DKIM + SPF) — `onboarding@resend.dev` chỉ test, rate-limited
- Check spam folder

### CSP blocks something
- Check browser console for CSP violation
- Update `apps/web/public/_headers` CSP directives, redeploy frontend
- Common: cần thêm domain vào `connect-src` or `script-src`

### CORS error
- Worker `[env.production.vars] ALLOWED_ORIGIN` phải khớp frontend domain
- Update + redeploy worker

---

## Pre-launch checklist

Run all before public announcement:

- [ ] All GitHub secrets set: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- [ ] All GitHub vars set: `PUBLIC_API_URL`, `PUBLIC_SITE_URL`, `WORKER_HEALTH_URL`
- [ ] Cloudflare Pages project `mekong-digital` exists
- [ ] D1 database `mekong-leads` created with valid `database_id` in `wrangler.toml` (BOTH top-level and `[env.production]`)
- [ ] D1 schema migrated remote
- [ ] Worker secrets set in production env: `RESEND_API_KEY` (+ optional Telegram)
- [ ] Resend domain verified (or accept `onboarding@resend.dev` test rate limits)
- [ ] `wrangler.toml [env.production.vars]` updated:
  - [ ] `ALLOWED_ORIGIN` = final domain
  - [ ] `RESEND_FROM_ADDRESS` = verified
  - [ ] `LEAD_NOTIFICATION_TO` = real founder email(s)
  - [ ] `SITE_URL` = final domain
- [ ] First deploy succeeds (manual workflow_dispatch trigger)
- [ ] `bash scripts/verify-production.sh` returns exit 0
- [ ] Test full lead flow: visit site → fill form → confirm thank-you redirect → email arrives → Telegram alert (if configured) → D1 row exists (`wrangler d1 execute mekong-leads --remote --command='SELECT * FROM leads ORDER BY created_at DESC LIMIT 5'`)
- [ ] Privacy Policy page exists (legal req for lead capture)
- [ ] Terms of Service page exists (recommended)
- [ ] `og-image.svg` replaced với real OG image
- [ ] Logo + brand assets finalized (after rename from `mekong-digital`)

---

## Open Questions

1. Custom domain plan — `.vn` hay `.com`/`.dev`? Cần đăng ký trước khi tighten CSP.
2. Resend domain verification timeline — typically 24-48h DKIM propagation. Plan deploy trước hay sau?
3. Backup D1 — Cloudflare backup mỗi giờ free tier nhưng restore qua dashboard. Cần manual export script không (R2 nightly dump)?
4. Cloudflare Web Analytics vs PostHog — built-in free vs richer events. Khi nào switch?
