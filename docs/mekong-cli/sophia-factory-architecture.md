# Sophia AI Factory — CTO Technical Architecture

**Version:** 1.0.0 | **Status:** Draft | **Created:** 2026-03-19
**Owner:** CTO Agent | **Target Complete:** 2026-04-02 (Week 2)

> AI-powered proposal generation factory for SEA agencies. Brand voice training + RAG + parallel section generation → professional proposals in minutes.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [AI Pipeline Design](#3-ai-pipeline-design)
4. [Data Model](#4-data-model)
5. [Infrastructure Design](#5-infrastructure-design)
6. [Security Design](#6-security-design)
7. [Scalability Plan](#7-scalability-plan)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Key Decisions & Trade-offs](#9-key-decisions--trade-offs)
10. [Open Questions](#10-open-questions)

---

## 1. Executive Summary

Sophia AI Factory is a SaaS platform that enables agencies in Southeast Asia to generate professional proposals using AI trained on their brand voice. The system ingests past proposals, learns writing patterns, and generates new proposals matching the agency's tone, structure, and quality standards.

### Core Value Proposition
- **Brand Voice Training:** Upload 5-10 past proposals → AI learns your style
- **Proposal Generation:** Input a brief → get a complete, on-brand proposal in minutes
- **SEA Language Support:** English + Vietnamese + Thai + Bahasa Indonesia
- **Multi-tenant:** Agencies operate in isolated workspaces

### Key Metrics Targets
| Metric | Target |
|--------|--------|
| Proposal generation time | < 60 seconds |
| Brand voice training time | < 5 minutes (async) |
| Concurrent users | 1,000+ |
| Uptime SLA | 99.9% |
| Cost per proposal | < $0.15 |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Web App     │  │  Mobile      │  │  API Clients         │   │
│  │  (Next.js 14)│  │  (Future)    │  │  (REST/GraphQL)      │   │
│  │  Vercel Edge │  │              │  │                      │   │
│  └──────┬───────┘  └──────────────┘  └──────────┬───────────┘   │
│         │                                       │               │
└─────────┼───────────────────────────────────────┼───────────────┘
          │                                       │
          ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Cloudflare Workers (Hono Router)                        │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────────┐  │    │
│  │  │ Auth        │ │ Rate        │ │ Request           │  │    │
│  │  │ Middleware  │ │ Limiting    │ │ Routing           │  │    │
│  │  │ (JWT/OAuth) │ │ (Token      │ │ /api/* → Services │  │    │
│  │  │             │ │  Bucket)    │ │ /ai/* → AI Svc    │  │    │
│  │  └─────────────┘ └─────────────┘ └───────────────────┘  │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌────────────────┐ ┌──────────────────┐
│   DATA LAYER     │ │   AI LAYER     │ │  STORAGE LAYER   │
│                  │ │                │ │                  │
│ ┌──────────────┐ │ │ ┌────────────┐ │ │ ┌──────────────┐ │
│ │ Supabase     │ │ │ │ AI Service │ │ │ │ Supabase     │ │
│ │ PostgreSQL   │ │ │ │ (Python    │ │ │ │ Storage      │ │
│ │              │ │ │ │  FastAPI)  │ │ │ │ (S3-compat)  │ │
│ │ • users      │ │ │ │            │ │ │ │              │ │
│ │ • orgs       │ │ │ │ • Proposal │ │ │ │ • Proposal   │ │
│ │ • proposals  │ │ │ │   Gen      │ │ │ │   PDFs       │ │
│ │ • templates  │ │ │ │ • Brand    │ │ │ │ • Brand      │ │
│ │ • brand_voice│ │ │ │   Voice AI │ │ │ │   Assets     │ │
│ │ • training   │ │ │ │ • RAG      │ │ │ │ • Templates  │ │
│ │   docs       │ │ │ │   Pipeline │ │ │ │              │ │
│ └──────┬───────┘ │ │ └─────┬──────┘ │ │ └──────────────┘ │
│        │         │ │       │        │ │                  │
│ ┌──────▼───────┐ │ │ ┌─────▼──────┐ │ │                  │
│ │ pgvector     │ │ │ │ OpenAI API │ │ │                  │
│ │ (embeddings) │ │ │ │ + Fine-tune│ │ │                  │
│ │              │ │ │ │ Models     │ │ │                  │
│ └──────────────┘ │ │ └────────────┘ │ │                  │
└──────────────────┘ └────────────────┘ └──────────────────┘
```

### 2.2 Component Detail

#### Frontend (Next.js 14 on Vercel)
| Component | Route | Description |
|-----------|-------|-------------|
| Landing Page | `/` | Marketing site, SEO-optimized |
| Auth Pages | `/auth/*` | Login, signup, forgot password |
| Dashboard | `/dashboard` | Proposal overview, stats |
| Proposal Editor | `/proposals/:id` | WYSIWYG editor, AI generation |
| Brand Trainer | `/brand-voice` | Upload docs, training status |
| Templates | `/templates` | Browse, customize templates |
| Settings | `/settings` | Billing, team, API keys |
| API Docs | `/api-docs` | Developer documentation |

#### API Gateway (Cloudflare Workers)
| Component | Purpose | Technology |
|-----------|---------|------------|
| Auth Middleware | JWT validation, tenant isolation | Hono + jose |
| Rate Limiting | Per-tenant fair usage | Cloudflare KV |
| Request Routing | Path-based routing to services | Hono Router |
| CORS Handling | Cross-origin config | Hono cors middleware |
| Request Logging | Audit trail, debugging | Cloudflare Analytics |

#### AI Service (Python FastAPI)
| Component | Purpose | Technology |
|-----------|---------|------------|
| Proposal Generator | Generate proposal sections | GPT-4 + prompt templates |
| Brand Voice Trainer | Analyze and learn brand style | OpenAI embeddings + analysis |
| RAG Pipeline | Retrieve brand context | pgvector + similarity search |
| Document Parser | Extract text from PDFs/DOCX | pdfplumber, python-docx |
| Quality Checker | Validate generated content | Rule-based + LLM scoring |
| Export Service | Convert to PDF/DOCX | WeasyPrint, python-docx |

### 2.3 Data Flow Diagrams

#### Brand Voice Training Flow
```
User uploads docs → Parser extracts text → Chunker splits into sections
       ↓
Embedding service generates vectors → Store in pgvector
       ↓
Analyzer extracts patterns (tone, structure, vocabulary)
       ↓
Brand Voice Profile created → Status updated to "trained"
       ↓
Notification sent to user (email/in-app)
```

#### Proposal Generation Flow
```
User inputs brief → Validate input → Check quota
       ↓
Retrieve brand voice embeddings (top-k from pgvector)
       ↓
Build context: brand profile + template + brief
       ↓
Generate sections in parallel (5-8 sections, GPT-4)
       ↓
Assemble sections → Quality check → Score >= 0.8?
       ↓ Yes
Store proposal → Return to user → Track usage
       ↓ No (< 0.8)
Regenerate failed sections (max 2 retries)
```

---

## 3. AI Pipeline Design

### 3.1 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI PIPELINE                               │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ INGESTION│───▶│PROCESSING│───▶│GENERATION│───▶│DELIVERY│ │
│  │          │    │          │    │          │    │        │ │
│  │ • File   │    │ • Text   │    │ • Context│    │ • PDF  │ │
│  │   Upload │    │   Extract│    │   Build  │    │   Export│ │
│  │ • Format │    │ • Chunk  │    │ • RAG    │    │ • DOCX │ │
│  │   Detect │    │   Split  │    │   Search │    │   Export│ │
│  │ • Validate│   │ • Embed  │    │ • Parallel│   │ • HTML │ │
│  │          │    │ • Analyze│    │   Gen    │    │   View │ │
│  └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │               │               │              │       │
│       ▼               ▼               ▼              ▼       │
│  Supabase         pgvector        OpenAI API     Storage    │
│  Storage                          + Fine-tune    + CDN      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Ingestion Layer

| Step | Component | Technology | Details |
|------|-----------|------------|---------|
| 1 | File Upload | Supabase Storage | PDF, DOCX, TXT, MD |
| 2 | Format Detection | python-magic | MIME type validation |
| 3 | Size Validation | Middleware | Max 50MB per file |
| 4 | Virus Scan | ClamAV (optional) | Security check |
| 5 | Storage | Supabase Storage | S3-compatible, encrypted |

**File Processing Limits:**
- Max file size: 50MB
- Supported formats: PDF, DOCX, TXT, MD
- Max files per training batch: 20
- Max characters per file: 500,000

### 3.3 Processing Layer

#### Text Extraction
```python
# PDF extraction
import pdfplumber
with pdfplumber.open(file_path) as pdf:
    text = "\n".join(page.extract_text() for page in pdf.pages)

# DOCX extraction
from docx import Document
doc = Document(file_path)
text = "\n".join(p.text for p in doc.paragraphs)
```

#### Chunking Strategy
| Strategy | Chunk Size | Overlap | Use Case |
|----------|------------|---------|----------|
| Semantic | 500-1000 tokens | 100 tokens | Brand voice analysis |
| Section-based | Variable | 0 | Template extraction |
| Fixed | 1000 tokens | 200 tokens | RAG retrieval |

#### Embedding Generation
| Model | Dimensions | Cost/1K tokens | Latency |
|-------|------------|----------------|---------|
| text-embedding-3-large | 3072 | $0.00013 | ~50ms |
| text-embedding-3-small | 1536 | $0.00002 | ~30ms |

**Decision:** Use `text-embedding-3-small` for cost efficiency. 1536 dimensions sufficient for brand voice similarity.

#### Brand Voice Analysis
Extract patterns from training documents:
- **Tone:** Formal, casual, persuasive, technical (LLM classification)
- **Structure:** Common section patterns, heading hierarchy
- **Vocabulary:** Frequent terms, jargon, forbidden words
- **Length:** Average section length, total proposal length
- **Formatting:** Bullet usage, table frequency, image placement

### 3.4 Generation Layer

#### Context Assembly
```json
{
  "system_prompt": "You are a proposal writer for {org_name}. Match their brand voice.",
  "brand_profile": {
    "tone": "professional_persuasive",
    "vocabulary": ["synergy", "transform", "deliver"],
    "forbidden": ["cheap", "best", "guaranteed"],
    "avg_section_length": 300,
    "structure_patterns": ["executive_summary", "scope", "timeline", "pricing"]
  },
  "template": { ... },
  "brief": {
    "client_name": "ABC Corp",
    "project_scope": "Digital transformation",
    "budget_range": "$50K-$100K",
    "timeline": "6 months"
  },
  "retrieved_context": [
    {"text": "...", "similarity": 0.92},
    {"text": "...", "similarity": 0.87}
  ]
}
```

#### Parallel Section Generation
```
┌─────────────────────────────────────────────────┐
│              Proposal Generation                 │
│                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │Executive│ │  Scope  │ │Timeline │ │Pricing ││
│  │ Summary │ │ of Work │ │ & Mile- │ │& Budget││
│  │         │ │         │ │ stones  │ │        ││
│  │ GPT-4   │ │ GPT-4   │ │ GPT-4   │ │ GPT-4  ││
│  │ ~15s    │ │ ~20s    │ │ ~10s    │ │ ~12s   ││
│  └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘│
│       │           │           │           │     │
│       └───────────┴───────────┴───────────┘     │
│                       │                         │
│              ┌────────▼────────┐                │
│              │   Assembler     │                │
│              │   + QC Score    │                │
│              │   ~5s           │                │
│              └─────────────────┘                │
│                                                  │
│  Total: ~45s (parallel) vs ~120s (sequential)   │
└─────────────────────────────────────────────────┘
```

#### Quality Check Scoring
| Criterion | Weight | Threshold |
|-----------|--------|-----------|
| Brand voice match | 30% | >= 0.8 |
| Content completeness | 25% | All required sections |
| Coherence | 20% | >= 0.7 |
| Factual accuracy | 15% | No hallucinated facts |
| Language quality | 10% | Grammar, spelling |

**Overall threshold:** 0.8 → Auto-regenerate if below

### 3.5 Delivery Layer

| Format | Technology | Use Case |
|--------|------------|----------|
| PDF | WeasyPrint | Final delivery, print-ready |
| DOCX | python-docx | Editable version for client |
| HTML | Jinja2 templates | Web preview, email |
| Markdown | Direct | API response, developer use |

---

## 4. Data Model

### 4.1 Complete Supabase Schema

```sql
-- ============================================================
-- SOPHIA AI FACTORY — COMPLETE DATABASE SCHEMA
-- Database: Supabase PostgreSQL + pgvector extension
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ============================================================
-- 1. AUTH & TENANCY
-- ============================================================

-- Organizations (Agencies)
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    domain          TEXT,                          -- Custom domain for white-label
    plan            TEXT NOT NULL DEFAULT 'free',  -- free, starter, growth, enterprise
    status          TEXT NOT NULL DEFAULT 'active',-- active, suspended, deleted
    proposals_limit INTEGER DEFAULT 10,            -- Monthly proposal quota
    proposals_used  INTEGER DEFAULT 0,
    storage_limit_mb INTEGER DEFAULT 500,          -- Storage quota
    storage_used_mb  INTEGER DEFAULT 0,
    settings        JSONB DEFAULT '{}',            -- Org-level settings
    metadata        JSONB DEFAULT '{}',            -- Arbitrary metadata
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Members (Users)
CREATE TABLE org_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL,                 -- Supabase auth.users.id
    role            TEXT NOT NULL DEFAULT 'member',-- admin, editor, member, viewer
    status          TEXT NOT NULL DEFAULT 'active',-- active, invited, suspended
    invited_by      UUID REFERENCES org_members(id),
    invited_at      TIMESTAMP WITH TIME ZONE,
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- API Keys (for programmatic access)
CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    key_hash        TEXT NOT NULL,                 -- Hashed API key (never store plain)
    prefix          TEXT NOT NULL,                 -- First 8 chars for identification
    permissions     TEXT[] DEFAULT '{read}'],      -- read, write, admin
    last_used_at    TIMESTAMP WITH TIME ZONE,
    expires_at      TIMESTAMP WITH TIME ZONE,
    revoked_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by      UUID REFERENCES org_members(id)
);

-- ============================================================
-- 2. BRAND VOICE
-- ============================================================

-- Brand Voice Profiles
CREATE TABLE brand_voices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                TEXT NOT NULL DEFAULT 'Default Brand Voice',
    status              TEXT NOT NULL DEFAULT 'not_trained',
    -- not_trained, training, trained, failed, needs_update
    training_progress   INTEGER DEFAULT 0,         -- 0-100%
    training_error      TEXT,                      -- Error message if failed
    -- Brand characteristics (auto-extracted)
    characteristics     JSONB DEFAULT '{}',
    -- {
    --   "tone": "professional_persuasive",
    --   "formality": 0.8,
    --   "avg_section_length": 300,
    --   "common_phrases": ["we believe", "our approach"],
    --   "forbidden_words": ["cheap", "best"],
    --   "structure_patterns": ["executive_summary", "scope", "timeline"],
    --   "language": "en",
    --   "vocabulary_richness": 0.75
    -- }
    -- Embedding summary
    embedding_stats     JSONB DEFAULT '{}',
    -- {
    --   "total_chunks": 150,
    --   "total_documents": 8,
    --   "avg_similarity": 0.82,
    --   "model": "text-embedding-3-small"
    -- }
    model_version       TEXT,                      -- AI model version used
    trained_at          TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, name)
);

-- Training Documents
CREATE TABLE training_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    brand_voice_id  UUID REFERENCES brand_voices(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    file_url        TEXT NOT NULL,                 -- Supabase Storage URL
    file_type       TEXT NOT NULL,                 -- pdf, docx, txt, md
    file_size_bytes INTEGER NOT NULL,
    -- Processing status
    status          TEXT NOT NULL DEFAULT 'pending',
    -- pending, processing, processed, failed
    error_message   TEXT,
    -- Extraction results
    extracted_text  TEXT,                          -- Full extracted text
    text_length     INTEGER,
    chunk_count     INTEGER DEFAULT 0,
    -- Metadata
    metadata        JSONB DEFAULT '{}',
    processed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand Voice Embeddings (pgvector)
CREATE TABLE brand_embeddings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    brand_voice_id  UUID NOT NULL REFERENCES brand_voices(id) ON DELETE CASCADE,
    document_id     UUID REFERENCES training_documents(id),
    -- The embedding vector (1536 dimensions for text-embedding-3-small)
    embedding       vector(1536),
    -- Chunk metadata
    chunk_text      TEXT NOT NULL,
    chunk_index     INTEGER NOT NULL,
    section_type    TEXT,                          -- executive_summary, scope, etc.
    document_source TEXT,                          -- Original file name
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector index for fast similarity search
CREATE INDEX ON brand_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ============================================================
-- 3. PROPOSALS
-- ============================================================

-- Proposal Templates
CREATE TABLE templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    category        TEXT,                          -- technology, marketing, consulting, etc.
    language        TEXT DEFAULT 'en',
    -- Template structure
    sections        JSONB NOT NULL,
    -- [
    --   {"id": "exec_summary", "name": "Executive Summary", "required": true,
    --    "prompt_template": "...", "max_length": 500},
    --   {"id": "scope", "name": "Scope of Work", "required": true, ...}
    -- ]
    is_public       BOOLEAN DEFAULT FALSE,         -- Shared across all orgs
    is_default      BOOLEAN DEFAULT FALSE,         -- Default template for org
    usage_count     INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proposals
CREATE TABLE proposals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_id     UUID REFERENCES templates(id),
    brand_voice_id  UUID REFERENCES brand_voices(id),
    -- Basic info
    title           TEXT NOT NULL,
    client_name     TEXT,
    client_email    TEXT,
    -- Brief input
    brief           JSONB NOT NULL,
    -- {
    --   "project_scope": "Digital transformation",
    --   "budget_range": "$50K-$100K",
    --   "timeline": "6 months",
    --   "requirements": ["...", "..."],
    --   "notes": "..."
    -- }
    -- Generated content
    content         JSONB,
    -- {
    --   "sections": {
    --     "exec_summary": {"content": "...", "status": "generated", "score": 0.92},
    --     "scope": {"content": "...", "status": "generated", "score": 0.88}
    --   },
    --   "overall_score": 0.90,
    --   "generated_at": "..."
    -- }
    -- Status
    status          TEXT NOT NULL DEFAULT 'draft',
    -- draft, generating, generated, reviewing, approved, sent, archived
    -- Generation metadata
    generation_meta JSONB DEFAULT '{}',
    -- {
    --   "model": "gpt-4",
    --   "tokens_used": 12500,
    --   "cost_usd": 0.12,
    --   "duration_seconds": 45,
    --   "retries": 0,
    --   "quality_scores": {"brand_match": 0.92, "completeness": 0.95}
    -- }
    -- Export files
    export_urls     JSONB DEFAULT '{}',
    -- {"pdf": "...", "docx": "..."}
    -- Tracking
    version         INTEGER DEFAULT 1,
    parent_id       UUID REFERENCES proposals(id), -- For regenerated versions
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_at    TIMESTAMP WITH TIME ZONE,
    sent_at         TIMESTAMP WITH TIME ZONE
);

-- Proposal Versions (audit trail)
CREATE TABLE proposal_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    version         INTEGER NOT NULL,
    content         JSONB NOT NULL,
    change_reason   TEXT,                          -- "Regenerated section X", "Manual edit"
    changed_by      UUID REFERENCES org_members(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. USAGE & BILLING
-- ============================================================

-- Usage Logs
CREATE TABLE usage_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID,
    action          TEXT NOT NULL,                 -- proposal_generate, brand_train, export
    resource_type   TEXT,                          -- proposal, brand_voice
    resource_id     UUID,
    tokens_used     INTEGER DEFAULT 0,
    cost_usd        NUMERIC(10, 4) DEFAULT 0,
    duration_ms     INTEGER,
    status          TEXT NOT NULL DEFAULT 'success',
    error_message   TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing Records
CREATE TABLE billing_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Polar.sh integration
    polar_subscription_id TEXT,
    polar_customer_id       TEXT,
    -- Billing details
    plan            TEXT NOT NULL,
    amount_cents    INTEGER NOT NULL,
    currency        TEXT DEFAULT 'USD',
    period_start    TIMESTAMP WITH TIME ZONE,
    period_end      TIMESTAMP WITH TIME ZONE,
    status          TEXT NOT NULL DEFAULT 'pending',
    -- pending, paid, failed, cancelled, refunded
    payment_method  TEXT,
    invoice_url     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. ACTIVITY & ANALYTICS
-- ============================================================

-- Activity Log
CREATE TABLE activity_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID,
    action          TEXT NOT NULL,                 -- login, proposal_create, brand_train, etc.
    resource_type   TEXT,
    resource_id     UUID,
    ip_address      TEXT,
    user_agent      TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Snapshots (daily aggregation)
CREATE TABLE analytics_daily (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    proposals_generated INTEGER DEFAULT 0,
    proposals_sent  INTEGER DEFAULT 0,
    brand_voice_trains INTEGER DEFAULT 0,
    tokens_used     INTEGER DEFAULT 0,
    cost_usd        NUMERIC(10, 4) DEFAULT 0,
    active_users    INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(org_id, date)
);

-- ============================================================
-- 6. INDEXES
-- ============================================================

-- Performance indexes
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_brand_voices_org_id ON brand_voices(org_id);
CREATE INDEX idx_training_documents_org_id ON training_documents(org_id);
CREATE INDEX idx_training_documents_brand_voice ON training_documents(brand_voice_id);
CREATE INDEX idx_brand_embeddings_org_id ON brand_embeddings(org_id);
CREATE INDEX idx_brand_embeddings_brand_voice ON brand_embeddings(brand_voice_id);
CREATE INDEX idx_templates_org_id ON templates(org_id);
CREATE INDEX idx_proposals_org_id ON proposals(org_id);
CREATE INDEX idx_proposals_status ON proposals(org_id, status);
CREATE INDEX idx_proposals_created ON proposals(org_id, created_at DESC);
CREATE INDEX idx_usage_logs_org_id ON usage_logs(org_id);
CREATE INDEX idx_usage_logs_created ON usage_logs(org_id, created_at DESC);
CREATE INDEX idx_billing_records_org_id ON billing_records(org_id);
CREATE INDEX idx_activity_logs_org_id ON activity_logs(org_id);
CREATE INDEX idx_analytics_daily_org_date ON analytics_daily(org_id, date);

-- ============================================================
-- 7. TRIGGERS (auto-updated timestamps)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_voices_updated_at
    BEFORE UPDATE ON brand_voices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_records_updated_at
    BEFORE UPDATE ON billing_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│  organizations  │       │   auth.users    │
│  (PK: id)       │       │   (Supabase)    │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │ 1:N                     │ 1:N
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│   org_members   │◄──────│                 │
│  (org_id, user) │       │                 │
└─────────────────┘       │                 │
         │                │                 │
         │ 1:N            │                 │
         ▼                │                 │
┌─────────────────┐       │                 │
│  brand_voices   │       │                 │
│  (org_id FK)    │       │                 │
└────────┬────────┘       │                 │
         │ 1:N            │                 │
         ▼                │                 │
┌─────────────────┐       │                 │
│training_documents│       │                 │
│  (brand_voice FK)        │                 │
└────────┬────────┘       │                 │
         │ 1:N            │                 │
         ▼                │                 │
┌─────────────────┐       │                 │
│ brand_embeddings│       │                 │
│  (brand_voice FK)        │                 │
└─────────────────┘       │                 │
                          │                 │
┌─────────────────┐       │                 │
│   templates     │       │                 │
│  (org_id FK)    │       │                 │
└────────┬────────┘       │                 │
         │ 1:N            │                 │
         ▼                │                 │
┌─────────────────┐       │                 │
│   proposals     │◄──────│                 │
│  (org_id,       │       │                 │
│   template_id,  │       │                 │
│   brand_voice)  │       │                 │
└────────┬────────┘       │                 │
         │ 1:N            │                 │
         ▼                │                 │
┌─────────────────┐       │                 │
│proposal_versions│       │                 │
└─────────────────┘       └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  usage_logs     │  │ billing_records │  │ activity_logs   │
│  (org_id FK)    │  │ (org_id FK)     │  │ (org_id FK)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐
│ analytics_daily │
│ (org_id FK)     │
└─────────────────┘
```

### 4.3 Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Organizations: users can only see their own orgs
CREATE POLICY org_access ON organizations
    USING (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Brand voices: org members only
CREATE POLICY brand_voice_access ON brand_voices
    USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Proposals: org members only
CREATE POLICY proposal_access ON proposals
    USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Templates: org members + public templates
CREATE POLICY template_access ON templates
    USING (
        org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
        OR is_public = true
    );

-- Training documents: org members only
CREATE POLICY training_doc_access ON training_documents
    USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Brand embeddings: org members only
CREATE POLICY brand_embedding_access ON brand_embeddings
    USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
```

---

## 5. Infrastructure Design

### 5.1 Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE TOPOLOGY                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    VERCEL (Frontend)                      │   │
│  │                                                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │ Edge Network │  │ Serverless  │  │  Static Assets  │   │   │
│  │  │ (CDN)        │  │ Functions   │  │  (Next.js)      │   │   │
│  │  │ SIN, HK, TYO │  │ (API Routes)│  │                 │   │   │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────────┘   │   │
│  │         │                │                                │   │
│  └─────────┼────────────────┼────────────────────────────────┘   │
│            │                │                                    │
│            ▼                ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              CLOUDFLARE (API Gateway)                     │   │
│  │                                                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │ Workers      │  │ KV Store    │  │  D1 (SQLite)    │   │   │
│  │  │ (Hono Router)│  │ (Rate Limit)│  │  (Cache/Config) │   │   │
│  │  │ SIN, HK, TYO │  │             │  │                 │   │   │
│  │  └──────┬──────┘  └─────────────┘  └─────────────────┘   │   │
│  │         │                                                  │   │
│  └─────────┼──────────────────────────────────────────────────┘   │
│            │                                                      │
│            ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AI SERVICE (Python FastAPI)                  │   │
│  │                                                            │   │
│  │  Deployed on: Cloudflare Workers (Python) OR              │   │
│  │                 Render/Railway (if Workers Python limited)│   │
│  │                                                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │ Proposal    │  │ Brand Voice │  │  Document       │   │   │
│  │  │ Generator   │  │ Trainer     │  │  Parser         │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│            ┌────────────────┼────────────────┐                 │
│            ▼                ▼                ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   SUPABASE   │  │   OPENAI     │  │   STORAGE    │         │
│  │              │  │              │  │              │         │
│  │ • PostgreSQL │  │ • GPT-4      │  │ • Supabase   │         │
│  │ • pgvector   │  │ • Embeddings │  │   Storage    │         │
│  │ • Auth       │  │ • Fine-tuned │  │   (S3)       │         │
│  │ • Realtime   │  │   Models     │  │ • R2 (CF)    │         │
│  │              │  │              │  │   (backup)   │         │
│  │ Region: SG   │  │              │  │ Region: SG   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Deployment Architecture

| Component | Platform | Region | Scaling |
|-----------|----------|--------|---------|
| Frontend | Vercel | Global Edge | Auto-scale |
| API Gateway | Cloudflare Workers | SIN, HK, TYO | Auto-scale |
| AI Service | Cloudflare Workers / Render | Singapore | 1-10 instances |
| Database | Supabase | Singapore (AWS ap-southeast-1) | Vertical + read replicas |
| Storage | Supabase Storage | Singapore | Auto-scale (S3) |
| Vector DB | pgvector (Supabase) | Singapore | Same as DB |
| CDN | Cloudflare + Vercel Edge | Global | Auto-scale |
| Queue (async) | Cloudflare Queues | Singapore | Auto-scale |

### 5.3 AI Service Deployment Options

**Option A: Cloudflare Workers (Python) — Preferred**
- Pros: Edge deployment, auto-scale, same infra as gateway
- Cons: Python Workers still in beta, limited package support
- Decision: Use if Python Workers GA by launch date

**Option B: Render/Railway — Fallback**
- Pros: Full Python support, easy deployment, good SEA latency from SG region
- Cons: Not edge, cold starts, manual scaling
- Decision: Use if Workers Python not ready

### 5.4 Environment Configuration

```bash
# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://api.sophiafactory.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# API Gateway (Cloudflare Workers)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx  # Service role key for admin operations
RATE_LIMIT_TOKENS=100
RATE_LIMIT_WINDOW=60

# AI Service
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4
EMBEDDING_MODEL=text-embedding-3-small
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
MAX_CONCURRENT_GENERATIONS=10
QUALITY_THRESHOLD=0.8
```

---

## 6. Security Design

### 6.1 Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User    │────▶│ Supabase Auth│────▶│  JWT Token   │
│  Login   │     │ (Email/OAuth)│     │  (access +   │
│          │◀────│              │◀────│   refresh)   │
└──────────┘     └──────────────┘     └──────┬───────┘
                                             │
                           ┌─────────────────┼─────────────────┐
                           ▼                 ▼                 ▼
                    ┌────────────┐    ┌────────────┐    ┌────────────┐
                    │ Vercel FE  │    │ CF Workers │    │ AI Service │
                    │ (SSR auth) │    │ (validate) │    │ (validate) │
                    └────────────┘    └────────────┘    └────────────┘
```

**Auth Methods:**
| Method | Provider | Use Case |
|--------|----------|----------|
| Email/Password | Supabase Auth | Primary login |
| Magic Link | Supabase Auth | Passwordless option |
| Google OAuth | Supabase Auth | Social login |
| API Key | Custom | Programmatic access |

### 6.2 Authorization Model

```
Role        | Brand Voice | Proposals | Templates | Billing | Team
------------|-------------|-----------|-----------|---------|------
admin       | CRUD        | CRUD      | CRUD      | Full    | Full
editor      | CRUD        | CRUD      | CRUD      | Read    | Read
member      | Read        | CRUD      | Read      | None    | None
viewer      | Read        | Read      | Read      | None    | None
```

### 6.3 Security Layers

| Layer | Mechanism | Implementation |
|-------|-----------|----------------|
| Network | TLS 1.3 | Enforced by Vercel + Cloudflare |
| Auth | JWT + RLS | Supabase Auth + Row-Level Security |
| API | Rate limiting | Cloudflare KV token bucket |
| Data | Encryption at rest | Supabase (AES-256) |
| Secrets | Env vars | Vercel + Cloudflare encrypted secrets |
| API Keys | Hashed storage | bcrypt hash, never stored plain |
| Input | Validation | Zod schemas on all endpoints |
| Output | Sanitization | HTML sanitization for user content |

### 6.4 API Key Security

```python
# API key generation and verification
import secrets
import bcrypt

def generate_api_key() -> tuple[str, str]:
    """Generate API key, return (plain_key, hash)"""
    plain = f"sk_sophia_{secrets.token_urlsafe(32)}"
    key_hash = bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()
    return plain, key_hash

def verify_api_key(plain: str, hashed: str) -> bool:
    """Verify API key against stored hash"""
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

### 6.5 Data Isolation

- **Tenant isolation:** Every query scoped by `org_id`
- **RLS enforcement:** Database-level access control
- **API key scoping:** Keys tied to specific org + permissions
- **Storage isolation:** Supabase Storage buckets per org

---

## 7. Scalability Plan

### 7.1 Current Capacity (Phase 1)

| Resource | Limit | Current Usage | Headroom |
|----------|-------|---------------|----------|
| Database | Supabase Pro (8GB RAM) | < 1GB | 8x |
| API Requests | Cloudflare Workers (unlimited) | N/A | Unlimited |
| AI API Calls | OpenAI TPM limit | N/A | Scale with usage |
| Storage | Supabase Storage (unlimited) | < 1GB | Unlimited |
| Bandwidth | Vercel Pro (1TB) | < 10GB | 100x |

### 7.2 Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| DB CPU | > 70% sustained | Upgrade to Supabase Team plan |
| Response time | > 2s p95 | Add read replicas |
| AI queue depth | > 50 pending | Scale AI service instances |
| Storage | > 80% of limit | Archive old proposals |
| Cost/proposal | > $0.20 | Optimize prompts, cache results |

### 7.3 SEA Regional Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  SEA REGIONAL DEPLOYMENT                     │
│                                                              │
│  Primary: Singapore (ap-southeast-1)                        │
│  ├── Supabase Database (primary)                            │
│  ├── AI Service (primary)                                   │
│  ├── Storage (primary)                                      │
│  └── Cloudflare Workers (SIN edge)                          │
│                                                              │
│  Secondary: Hong Kong (ap-east-1) — Phase 3                 │
│  ├── Read replica (Supabase)                                │
│  └── Cloudflare Workers (HK edge)                           │
│                                                              │
│  Tertiary: Tokyo (ap-northeast-1) — Phase 3                 │
│  ├── Read replica (Supabase)                                │
│  └── Cloudflare Workers (TYO edge)                          │
│                                                              │
│  CDN: Global (Vercel Edge + Cloudflare)                     │
│  ├── Static assets cached globally                          │
│  ├── API responses cached (5min TTL)                        │
│  └── Dynamic content: edge compute                          │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Caching Strategy

| Layer | What | TTL | Technology |
|-------|------|-----|------------|
| Browser | Static assets | 1 year | Vercel CDN |
| Edge | API responses | 5 min | Cloudflare Cache |
| App | Template cache | 1 hour | Cloudflare KV |
| AI | Embedding cache | 30 days | Supabase (pgvector) |
| Session | User sessions | 7 days | Supabase Auth |

### 7.5 Cost Optimization

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| Embedding caching | 30-50% | Cache brand embeddings, reuse |
| Prompt optimization | 20-30% | Minimize token usage |
| Parallel generation | 60% latency | Generate sections concurrently |
| Tiered models | 40-60% | Use GPT-3.5 for drafts, GPT-4 for final |
| Batch processing | 25% | Group training doc processing |

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) — CURRENT

| Task | Owner | Status |
|------|-------|--------|
| Database schema setup | CTO | In Progress |
| Supabase project config | CTO | Pending |
| RLS policies | CTO | Pending |
| Auth integration | FE | Pending |
| Basic API endpoints | API | Pending |
| Frontend scaffolding | FE | Pending |

**Deliverables:**
- [x] Architecture document (this doc)
- [ ] Supabase database with all tables
- [ ] Auth flow (signup/login)
- [ ] Basic dashboard shell
- [ ] API gateway with auth middleware

### Phase 2: Brand Voice (Weeks 3-4)

| Task | Owner | Status |
|------|-------|--------|
| File upload component | FE | Pending |
| Document parser service | AI | Pending |
| Embedding generation | AI | Pending |
| pgvector storage | AI | Pending |
| Brand voice analysis | AI | Pending |
| Training status UI | FE | Pending |

**Deliverables:**
- Upload 5-10 past proposals
- Automatic brand voice extraction
- Brand voice profile dashboard
- Training status tracking

### Phase 3: Proposal Generation (Weeks 5-6)

| Task | Owner | Status |
|------|-------|--------|
| Template system | FE+API | Pending |
| Brief input form | FE | Pending |
| Parallel section generation | AI | Pending |
| Quality check scoring | AI | Pending |
| Proposal editor | FE | Pending |
| PDF/DOCX export | AI | Pending |

**Deliverables:**
- Complete proposal generation flow
- WYSIWYG editor
- Export to multiple formats
- Quality scoring dashboard

### Phase 4: Polish & Launch (Weeks 7-8)

| Task | Owner | Status |
|------|-------|--------|
| Billing integration | API | Pending |
| Usage tracking | API | Pending |
| Analytics dashboard | FE | Pending |
| Performance optimization | All | Pending |
| Security audit | CTO | Pending |
| Load testing | CTO | Pending |

**Deliverables:**
- Production-ready platform
- Billing & quota enforcement
- Analytics & monitoring
- Security audit passed

### Phase 5: Scale (Weeks 9-12)

| Task | Owner | Status |
|------|-------|--------|
| Multi-language support | AI | Pending |
| Regional deployment | Ops | Pending |
| API programmatic access | API | Pending |
| White-label support | FE | Pending |
| Advanced analytics | FE | Pending |

---

## 9. Key Decisions & Trade-offs

### Decision 1: Supabase vs Custom PostgreSQL
**Decision:** Supabase
**Rationale:** Built-in Auth, RLS, real-time, storage. Faster time-to-market.
**Trade-off:** Vendor lock-in, but PostgreSQL is standard — migration possible.

### Decision 2: Cloudflare Workers vs Traditional Backend
**Decision:** Cloudflare Workers for API gateway, Python for AI service
**Rationale:** Edge performance, auto-scaling, cost-effective for API layer.
**Trade-off:** Python Workers limited — may need Render/Railway fallback.

### Decision 3: OpenAI vs Self-hosted Models
**Decision:** OpenAI API (GPT-4) + text-embedding-3-small
**Rationale:** Best quality, no infrastructure overhead, SEA language support.
**Trade-off:** Per-token cost, but offset by caching and optimization.

### Decision 4: pgvector vs Dedicated Vector DB
**Decision:** pgvector (Supabase)
**Rationale:** Same database, simpler architecture, no additional service.
**Trade-off:** Less scalable than Pinecone/Weaviate, but sufficient for Phase 1-3.

### Decision 5: Parallel vs Sequential Generation
**Decision:** Parallel section generation
**Rationale:** 60% faster (45s vs 120s), better UX.
**Trade-off:** Higher concurrent API usage, but within OpenAI TPM limits.

### Decision 6: Vercel vs Self-hosted Frontend
**Decision:** Vercel
**Rationale:** Edge network, auto-scaling, Next.js optimized, SEA regions.
**Trade-off:** Higher cost at scale, but negligible for Phase 1-3.

---

## 10. Open Questions

| # | Question | Impact | Owner | Status |
|---|----------|--------|-------|--------|
| 1 | Fine-tuned model availability for SEA languages? | AI quality | CTO | Research needed |
| 2 | Cloudflare Workers Python GA timeline? | AI service deployment | CTO | Monitor CF announcements |
| 3 | Supabase read replica cost for multi-region? | Infrastructure cost | CTO | Quote from Supabase |
| 4 | Maximum concurrent OpenAI API calls at Pro tier? | Generation throughput | CTO | Check OpenAI docs |
| 5 | Vietnamese/Thai/Bahasa proposal quality with GPT-4? | Product viability | AI | Test with samples |
| 6 | White-label custom domain complexity? | Phase 5 scope | FE | Architecture review |

---

## Appendix A: API Endpoint Specification

```
# Authentication
POST   /api/v1/auth/signup              # Create account
POST   /api/v1/auth/login               # Login
POST   /api/v1/auth/logout              # Logout
POST   /api/v1/auth/forgot-password     # Reset password
POST   /api/v1/auth/refresh             # Refresh token

# Organizations
GET    /api/v1/orgs                     # List user's orgs
POST   /api/v1/orgs                     # Create org
GET    /api/v1/orgs/:id                 # Get org details
PATCH  /api/v1/orgs/:id                 # Update org
DELETE /api/v1/orgs/:id                 # Delete org

# Members
GET    /api/v1/orgs/:id/members         # List members
POST   /api/v1/orgs/:id/members         # Invite member
PATCH  /api/v1/orgs/:id/members/:mid    # Update role
DELETE /api/v1/orgs/:id/members/:mid    # Remove member

# Brand Voice
GET    /api/v1/brand-voices             # List brand voices
POST   /api/v1/brand-voices             # Create brand voice
GET    /api/v1/brand-voices/:id         # Get brand voice
POST   /api/v1/brand-voices/:id/train   # Start training
GET    /api/v1/brand-voices/:id/status  # Training status
DELETE /api/v1/brand-voices/:id         # Delete brand voice

# Training Documents
POST   /api/v1/brand-voices/:id/docs    # Upload training doc
GET    /api/v1/brand-voices/:id/docs    # List training docs
DELETE /api/v1/brand-voices/:id/docs/:did # Delete doc

# Templates
GET    /api/v1/templates                # List templates (org + public)
POST   /api/v1/templates                # Create template
GET    /api/v1/templates/:id            # Get template
PATCH  /api/v1/templates/:id            # Update template
DELETE /api/v1/templates/:id            # Delete template

# Proposals
GET    /api/v1/proposals                # List proposals
POST   /api/v1/proposals                # Create proposal
GET    /api/v1/proposals/:id            # Get proposal
PATCH  /api/v1/proposals/:id            # Update proposal
POST   /api/v1/proposals/:id/generate   # Generate content
POST   /api/v1/proposals/:id/regenerate # Regenerate section
POST   /api/v1/proposals/:id/export     # Export (PDF/DOCX)
DELETE /api/v1/proposals/:id            # Delete proposal

# API Keys
GET    /api/v1/api-keys                 # List API keys
POST   /api/v1/api-keys                 # Create API key
DELETE /api/v1/api-keys/:id             # Revoke API key

# Usage & Billing
GET    /api/v1/usage                    # Get usage stats
GET    /api/v1/billing                  # Get billing info
GET    /api/v1/billing/invoices         # List invoices

# Analytics
GET    /api/v1/analytics                # Get analytics data
GET    /api/v1/analytics/daily          # Daily breakdown
```

---

## Appendix B: Technology Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 14.x | App Router, Server Components |
| React | 18.x | Concurrent features |
| TypeScript | 5.x | Strict mode |
| Tailwind CSS | 3.x | Utility-first |
| shadcn/ui | Latest | Radix UI + Tailwind |
| Python | 3.11+ | FastAPI support |
| FastAPI | 0.104+ | Async support |
| Hono | 4.x | Cloudflare Workers router |
| Supabase JS | 2.x | Client SDK |
| pgvector | 0.5+ | Vector similarity |
| OpenAI SDK | 4.x | Latest API |

---

*Document created: 2026-03-19 | Last updated: 2026-03-19*
*Next review: 2026-04-02 (Week 2 milestone)*
