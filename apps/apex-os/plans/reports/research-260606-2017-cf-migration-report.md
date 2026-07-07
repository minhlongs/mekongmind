# Research Report: Chuyển ApexOS sang Cloudflare-Only Stack
**Ngày:** 2026-06-06
**Phạm vi:** Tách apex-os thành dự án độc lập, loại bỏ Supabase, chuyển toàn bộ hạ tầng sang hệ sinh thái Cloudflare + OSS

---

## Executive Summary

Cloudflare ecosystem đủ sức thay thế toàn bộ hạ tầng hiện tại của ApexOS:
- **Auth:** Better Auth (OSS) → Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite managed) + KV (cache/sessions)
- **Storage:** Cloudflare R2 (S3-compatible, no egress fees)
- **Deploy:** Cloudflare Pages (Next.js qua OpenNext adapter)
- **Payments:** Polar.sh / SePay giữ nguyên (không phụ thuộc CF)

Ưu điểm chính: giảm phụ thuộc Supabase, tận dụng edge computing, zero egress fees, monorepo-friendly.

---

## Key Findings

### 1. Cloudflare Pages + Next.js (OpenNext)
- OpenNext adapter biến Next.js output thành format CF Pages hiểu
- SSR/SSG/ISR đều hỗ trợ
- Middleware chạy dạng Worker
- **Lưu ý:** Cần OpenNext v3+ tương thích Next.js 14.x

### 2. Auth: Better Auth (OSS)
- Framework-agnostic, works với Cloudflare Workers
- Hỗ trợ: email/password, OAuth, magic link, 2FA
- Session storage: D1/KV
- Open source, self-hostable
- GitHub: https://github.com/better-auth/better-auth

### 3. Database: Cloudflare D1
- SQLite managed, SQL syntax chuẩn
- Migrations qua Wrangler CLI
- Giới hạn: 10GB/database, query < 30s
- Phù hợp cho MVP → scale đến 1M rows

### 4. Storage: Cloudflare R2
- S3-compatible API
- Không phí egress (tiết kiệm lớn cho file-heavy apps)
- Bucket riêng cho user uploads, reports

### 5. Cache: Cloudflare KV
- Key-value, eventual consistency
- Dùng cho: sessions, rate limiting, feature flags

---

## Implementation Mapping

| Hiện tại (Supabase) | Cloudflare Stack | Lý do |
|---|---|---|
| Supabase Auth | Better Auth + KV | OSS, CF-native, zero lock-in |
| Supabase Postgres | Cloudflare D1 | Managed SQLite, zero ops |
| Supabase Storage | Cloudflare R2 | No egress fees |
| Supabase Edge Functions | Cloudflare Pages Functions | Tích hợp sẵn |
| Vercel/Netlify deploy | Cloudflare Pages | CDN tích hợp, WAF free |

---

## Architecture Mới

```
┌──────────────────────────────────────┐
│         Cloudflare Pages             │
│  ┌────────────────────────────────┐  │
│  │  Next.js (OpenNext adapter)    │  │
│  │  ┌──────────┐  ┌────────────┐ │  │
│  │  │ Pages    │  │ Functions  │ │  │
│  │  │ (SSR)    │  │ (API)      │ │  │
│  │  └──────────┘  └────────────┘ │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
           │           │
           ▼           ▼
  ┌──────────────┐ ┌──────────────┐
  │  D1 (SQLite) │ │  KV Store    │
  │  - users     │ │  - sessions  │
  │  - signals   │ │  - rate limit│
  │  - trades    │ │  - cache     │
  │  - referrals │ │              │
  └──────────────┘ └──────────────┘
           │
           ▼
  ┌──────────────┐
  │  R2 Storage  │
  │  - uploads   │
  │  - reports   │
  └──────────────┘
```

---

## Quick Start Commands

```bash
# 1. Install CF tooling
npm install -g wrangler

# 2. Login
wrangler login

# 3. Create D1 database
wrangler d1 create apex-os-db
wrangler d1 migrations create apex-os-db init

# 4. Create KV namespace
wrangler kv namespace create AUTH_KV

# 5. Create R2 bucket
wrangler r2 bucket create apex-os-uploads

# 6. Configure OpenNext
npm install @opennextjs/cloudflare
```

---

## OSS Alternatives Summary

| Nhu cầu | Giải pháp OSS | Cloudflare Native |
|---|---|---|
| Auth | Better Auth | Workers + KV |
| Database | D1 (SQLite) | Managed |
| Cache | - | KV |
| File Storage | - | R2 |
| Queue | - | Queues |
| Vector Search | - | Vectorize |
| AI Inference | - | Workers AI |

---

## Unresolved Questions

1. **Migration path từ Supabase → CF:** Cần script migrate data (users, schema) từ Postgres sang D1
2. **Polar/SePay integration:** Giữ nguyên, không thay đổi
3. **Python backend (Phase 5):** Chuyển sang CF Workers với WASM? Hoặc keep riêng + CF Pages proxy?
4. **D1 limits cho growth:** 10GB/DB có đủ cho scale? Cần sharding strategy?

---

## Next Steps

1. Create migration plan: Supabase schema → D1 SQL
2. Setup CF account + project
3. Configure OpenNext adapter
4. Implement Better Auth với KV sessions
5. Migrate DB schema từ `src/database/migrations/` sang D1
6. Update deploy pipeline (wrangler.toml)
