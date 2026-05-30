# lead-api — Cloudflare Worker

Lead capture API for Mekong Digital landing page.

**Stack:** Hono v4 + Cloudflare D1 + Resend + Telegram

## First-time setup

```bash
# 1. Install deps (from repo root)
pnpm install

# 2. Create D1 database
npx wrangler d1 create mekong-leads

# 3. Copy the returned database_id into wrangler.toml [[d1_databases]] section

# 4. Run schema migration (local)
pnpm --filter @mekong/lead-api run db:migrate:local

# 5. Set secrets
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN   # optional
npx wrangler secret put TELEGRAM_CHAT_ID     # optional

# 6. Local dev (http://localhost:8787)
pnpm --filter @mekong/lead-api run dev

# 7. Dry-run build check
pnpm --filter @mekong/lead-api run build

# 8. Deploy
pnpm --filter @mekong/lead-api run deploy
```

## Endpoints

| Method | Path         | Description                        |
|--------|--------------|------------------------------------|
| GET    | /api/health  | Health check, returns build SHA    |
| POST   | /api/lead    | Submit lead (JSON or form-encoded) |

## Environment variables

| Name                | Type   | Required | Notes                                     |
|---------------------|--------|----------|-------------------------------------------|
| ALLOWED_ORIGIN      | var    | yes      | Comma-separated origins, supports `*`     |
| RESEND_API_KEY      | secret | yes      | Resend API key                            |
| TELEGRAM_BOT_TOKEN  | secret | no       | Telegram bot token for notifications      |
| TELEGRAM_CHAT_ID    | secret | no       | Telegram chat ID                          |
| BUILD_SHA           | var    | no       | Injected at build time for /api/health    |

## Before production

- Replace `from: 'Mekong Digital <onboarding@resend.dev>'` in `src/email/resend.ts` with a verified Resend domain
- Replace `to: ['founder@mekongdigital.example']` with the real notification email
- Run schema migration on remote: `pnpm --filter @mekong/lead-api run db:migrate:remote`
- Update `ALLOWED_ORIGIN` var in `wrangler.toml` to include the production Pages domain
