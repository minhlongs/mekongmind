# Mekong Content Hub — System Architecture

## Tổng quan kiến trúc

3-tier architecture:
```
┌─────────────────────────────────────────────┐
│  Next.js App Router (Client + Server)        │
│  ┌──────────┬──────────┬──────────────────┐ │
│  │  Submit  │  Audit   │  Search Vault    │ │
│  │  (form)  │ (CRUD)   │ (hybrid search)  │ │
│  └────┬─────┴────┬─────┴────────┬─────────┘ │
│       │          │               │            │
│       ▼          ▼               ▼            │
│  API Routes: /api/contents, /enrich, /tag,   │
│              /search, /health                │
└──────────────────────┬──────────────────────┘
                       │
              ┌────────▼────────┐
              │  Supabase        │
              │  ┌────────────┐ │
              │  │  contents  │ │
              │  │  (table)   │ │
              │  └─────┬──────┘ │
              │        │        │
              │  ┌─────▼──────┐ │
              │  │ search_    │ │
              │  │ contents() │ │ ← pgvector + tsvector hybrid
              │  └───────────┘ │
              └────────────────┘
                       │
              ┌────────▼────────┐
              │  OpenAI API     │
              │  GPT-4o-mini    │
              │  text-embedding │
              └─────────────────┘
```

## Database Schema

Table `contents`:
- `id` (uuid, PK)
- `title` (text)
- `original_content` (text)
- `ai_content` (text, nullable)
- `status` (enum: pending/approved/rejected)
- `tags` (text[])
- `department` (text)
- `embedding` (vector(1536))
- `created_at`, `updated_at` (timestamptz)

Indexes: HNSW on embedding, GIN on tags, GIN on tsvector.

## Trigger Logic

- INSERT with `status=pending` → background job calls `/api/enrich`
- PATCH `status=approved` → calls `/api/tag` → generate tags + embedding
