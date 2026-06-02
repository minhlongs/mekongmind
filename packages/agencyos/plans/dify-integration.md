# Dify Integration Plan — Mekong Mind / AgencyOS
Date: 2026-06-02
Repo: https://github.com/langgenius/dify

## Goal
Surface Dify capabilities (model management, RAG pipelines, agentic workflows) as AgencyOS services so internal tools can call LLM apps without leaving our stack.

## Current State
- AgencyOS: Clean-architecture Python package (domain/infrastructure/adapters)
- Dify: Cloned to `/Users/macbook/dify` (headless backend + frontend, FastAPI + Celery + Redis)

## Phases

### Phase 1 — Repo survey & integration points (this doc)
- [x] Clone Dify
- [x] Read AGENTS.md and architecture
- Identify integration surface: Dify API, model providers, RAG engine
- Gap: AgencyOS has no LLM/app orchestration module

### Phase 2 — Integration adapter layer (`adapters/dify/`)
Create thin Dify client that:
- Lists / creates apps (Dify "applications")
- Runs chat-completions against a Dify app
- Uploads / queries knowledge bases
- Reuses Dify model providers (OpenAI, Anthropic, etc.)

### Phase 3 — Domain entities
Add `LLMApp` and `LLMConversation` aggregates in domain layer.

### Phase 4 — Use cases
- `create_llm_app`
- `chat_with_app`
- `upload_knowledge`
- `query_knowledge`

### Phase 5 — Tests
Unit tests for adapters + use cases.

### Phase 6 — CLI exposure
Expose `agencyos dify chat`, `agencyos dify app create`, etc.
