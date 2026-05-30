-- Mekong Digital — leads table
-- Run locally:  wrangler d1 execute mekong-leads --local --file=./src/db/schema.sql
-- Run remote:   wrangler d1 execute mekong-leads --remote --file=./src/db/schema.sql

CREATE TABLE IF NOT EXISTS leads (
  id          TEXT    PRIMARY KEY,
  created_at  TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  phone       TEXT    NOT NULL,
  company     TEXT    NOT NULL,
  industry    TEXT    NOT NULL,  -- controlled vocab: INDUSTRIES[]
  budget      TEXT    NOT NULL,  -- controlled vocab: BUDGET_BANDS[]
  pain        TEXT,              -- optional free-text, max 500 chars
  variant     TEXT,              -- controlled vocab: VARIANTS[]
  notes       TEXT,              -- internal PM notes (filled manually)
  status      TEXT    NOT NULL DEFAULT 'new'
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_industry   ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_variant    ON leads(variant);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);

-- Pattern mining helper view (see docs/templates/pain-tag-schema.md for quarterly SQL queries)
CREATE VIEW IF NOT EXISTS lead_summary AS
SELECT
  industry,
  variant,
  budget,
  COUNT(*)         AS count,
  MIN(created_at)  AS first_seen,
  MAX(created_at)  AS last_seen
FROM leads
GROUP BY industry, variant, budget;
