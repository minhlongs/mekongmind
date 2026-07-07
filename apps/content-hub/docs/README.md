# Mekong Content Hub

AI-powered content management platform cho nội bộ MekongMind.

## Cấu trúc dự án

```
apps/content-hub/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── submit/page.tsx   # Form submit nội dung mới
│   │   ├── audit/page.tsx    # Danh sách + duyệt/từ chối
│   │   ├── search/page.tsx   # Semantic search vault
│   │   └── api/              # API routes
│   ├── lib/
│   │   ├── supabase/         # Supabase client + repository
│   │   └── ai/               # OpenAI integration
│   ├── types/                # TypeScript interfaces
│   └── components/           # Reusable UI
├── supabase/migrations/      # SQL migration files
├── tests/                    # Vitest unit tests
└── docs/                     # Project documentation
```

## Chạy dự án

```bash
cd apps/content-hub
pnpm install
cp .env.example .env.local  # điền Supabase + OpenAI keys
npx supabase db push         # apply migration
pnpm dev                     # → http://localhost:3000
```

## Luồng hoạt động

1. **Submit** — Nhân viên submit bài → `status: pending`, `ai_content` rỗng
2. **AI Enrich** — Hệ thống tự gọi OpenAI → điền `ai_content` (tối ưu marketing)
3. **Audit** — Manager duyệt → `PATCH status=approved`
4. **Auto-tag** — Khi approved → tự generate `tags` + `embedding` (vector)
5. **Search** — Hybrid search: pgvector (ngữ nghĩa) + tsvector (từ khóa)

## Công nghệ

- Next.js 14 (App Router) + TypeScript
- TailwindCSS (inline styles, no shadcn dependency)
- Supabase (PostgreSQL + pgvector + D1-compatible)
- OpenAI GPT-4o-mini (enrich + tag) + text-embedding-3-small

## Tests

```bash
pnpm test   # 11/11 tests pass
```

## Deploy

```bash
pnpm build  # → .next/ (Next.js static + dynamic)
```
