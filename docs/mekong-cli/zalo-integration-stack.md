# Tech Stack Specification: Zalo Integration & LLM Lead Parser

This document details the selected technology stack and design patterns for the Zalo integration microservice inside the `mekong-cli` monorepo. The architecture is designed for low-latency, edge-optimized execution using Cloudflare Workers.

## 1. Core Frameworks & Runtime
- **Runtime:** Cloudflare Workers (V8 isolate environment).
- **Web Framework:** **Hono** (v4+). Chosen for its lightweight footprint, extremely fast routing, and native support for Cloudflare Workers bindings.
- **Programming Language:** **TypeScript** (strict mode enabled).

## 2. Database Layer
- **Database:** **Cloudflare D1** (serverless SQLite database).
- **ORM / Query Builder:** **Drizzle ORM** (TypeScript-first ORM) for type-safe query building and database schema migrations.
- **Migration Tooling:** `drizzle-kit` for generating SQL migrations and applying them locally/remotely via Wrangler.

## 3. Security & Validation
- **Payload Validation:** **Zod** (via `@hono/zod-validator`) to validate incoming Zalo webhook event formats.
- **Signature Verification:** Global **Web Crypto API** (`crypto.subtle`) for timing-safe HMAC-SHA256 signature checks. This avoids bulky Node.js polyfills and maximizes edge execution speed.
- **Request Cloning:** Hono's `c.req.cloneRawRequest()` is utilized to clone the incoming payload. This allows signature verification middleware to read the body without preventing downstream routes or validators from consuming it.

## 4. AI & Parsing Layer
- **LLM Engine:** **Cloudflare Workers AI**.
- **Model:** `@cf/meta/llama-3-8b-instruct` (or similar high-efficiency instructor model).
- **JSON Mode:** Utilizing Workers AI `response_format: { type: "json_object" }` to guarantee structured JSON output matching our Zod schema.
- **Routing/Fallback:** Fallback configurations to external API endpoints (e.g. DashScope) if the edge AI binding becomes unavailable or hits quota limits.

## 5. Directory Structure Layout
The microservice will be bootstraped as a package or app inside the monorepo:
```
packages/zalo-parser/
├── wrangler.toml         # Cloudflare Wrangler configuration
├── package.json          # Dependency declarations
├── tsconfig.json         # TypeScript configuration
├── schema.sql            # Database schema migration
├── src/
│   ├── index.ts          # Main application entry (Hono app)
│   ├── types.ts          # Environment and model type definitions
│   ├── schema.ts         # Drizzle database tables definitions
│   ├── crypto.ts         # HMAC signature verification logic
│   └── parser.ts         # Workers AI lead extraction logic
└── tests/
    └── index.test.ts     # Vitest unit tests for verification
```
