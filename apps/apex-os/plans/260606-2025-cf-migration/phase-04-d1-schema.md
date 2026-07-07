# Phase 4: D1 Schema Migration
**Priority:** High
**Status:** Pending
**Dependencies:** Phase 3

## Requirements
Migrate existing Supabase schema to D1. Run migration via wrangler.

## Steps
1. Verify `wrangler.toml` has correct D1 database ID
2. Run: `wrangler d1 migrations apply apex-os-db`
3. Verify tables exist: `wrangler d1 execute apex-os-db --command "SELECT name FROM sqlite_master WHERE type='table'"`

## Source Schema
From `src/database/migrations/001_initial_schema.sql` (if exists)

## Success Criteria
- All tables created in D1
- Schema matches Supabase schema (minus PG-specific features)
- Migration is repeatable (wrangler tracks applied migrations)
