# Mekong Content Hub — Deployment Guide

## Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase project (local or cloud)
- OpenAI API key

## Setup

```bash
# 1. Clone & install
git clone <repo>
cd mekongmind/apps/content-hub
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with Supabase URL/anon key + OpenAI key

# 3. Apply database migration
npx supabase db push
# Or manually run: supabase/migrations/001_initial_schema.sql

# 4. Start dev server
pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | Yes | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Yes | Supabase anon key |
| OPENAI_API_KEY | Yes | OpenAI API key for enrich/tag |
| NEXT_PUBLIC_APP_URL | No | App URL (default: localhost:3000) |

## Production Build

```bash
pnpm build    # Next.js build
pnpm start    # Start production server
```

## Database Reset

```bash
npx supabase db reset   # drops + re-applies all migrations + seed
```
