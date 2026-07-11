# Phase 3.1: Inngest Setup & Config

**Owner:** Backend (forest layer)
**Effort:** 2h
**Blocker:** None

## What to Build

Install Inngest, configure CF Workers module, set up dev server, add D1 binding.

## Steps

### 1. Install dependencies

```bash
pnpm add inngest @inngest/cloudflare-workers
```

**Note:** Verify `@inngest/cloudflare-workers` supports Next.js 16 + CF Workers standalone output. If package doesn't exist or is incompatible, fallback to `@inngest/fetch` with custom Cloudflare handler.

### 2. Create `inngest.ts` (root)

```typescript
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "ultracode",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
```

### 3. Create `app/api/webhooks/inngest/route.ts`

```typescript
import { InngestCloudflare } from "@inngest/cloudflare-workers";
import { inngest } from "@/inngest";
import { onReviewRequested } from "@/forest/inngest/review-job";

export const maxDuration = 30; // CF Workers max

export const POST = InngestCloudflare({
  inngest,
  functions: [onReviewRequested],
  secret: process.env.INNGEST_SIGNING_KEY,
});
```

### 4. Update `wrangler.toml`

Add Inngest-compatible config:

```toml
name = "ultracode"
main = "out"
compatibility_date = "2025-07-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "ultracode-db"
database_id = "..."

[build]
command = "rm -rf out && node node_modules/next/dist/bin/next build"
output_directory = "out"
```

### 5. Update `.env.example`

```bash
# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...  # dev only; prod uses Inngest cloud
INNGEST_SERVER_URL=http://localhost:8288  # dev only
```

### 6. Install dev dependency for Inngest CLI

```bash
pnpm add -D inngest-cli
```

Verify local dev: `npx inngest start` → opens dashboard at `localhost:8288`.

## Files Changed

| File | Change |
|------|--------|
| `inngest.ts` | New — Inngest client instance |
| `app/api/webhooks/inngest/route.ts` | New — CF Workers handler for Inngest |
| `src/forest/inngest/` | New directory for Inngest functions |
| `.env.example` | Add INNGEST_* vars |
| `wrangler.toml` | No structural changes (D1 already configured) |
| `package.json` | Add `inngest`, `@inngest/cloudflare-workers` |

## Verification

```bash
pnpm install  # inngest packages added
npx inngest start  # starts dev server, opens dashboard
pnpm run build  # must pass, 0 TS errors
pnpm run type-check  # must pass
```

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `@inngest/cloudflare-workers` incompatible | Low | High | Fallback to `@inngest/fetch` + custom handler (4h extra) |
| Inngest dev server conflicts | Low | Medium | Use different port config if needed |
| D1 binding not available in Inngest context | Low | High | Pass DB client as step input, or use `env.DB` via CF module |
