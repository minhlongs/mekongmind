# Phase 1: CF Project Setup
**Priority:** Critical
**Status:** Pending
**Dependencies:** Phase 0

## Requirements
Create CF resources: D1 database, KV namespace, R2 bucket.

## Implementation Steps
1. `wrangler d1 create apex-os-db`
2. `wrangler kv namespace create AUTH_KV`
3. `wrangler r2 bucket create apex-os-uploads`
4. Create `wrangler.toml` with bindings
5. Generate `migrations/0001_init.sql`

## wrangler.toml
```toml
name = "apex-os"
main = ".open-next/worker.js"
compatibility_date = "2024-04-10"

[[d1_databases]]
binding = "DB"
database_name = "apex-os-db"
database_id = "PLACEHOLDER"

[[kv_namespaces]]
binding = "KV"
id = "PLACEHOLDER"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "apex-os-uploads"
```

## Migration SQL (D1)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE signals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  confidence REAL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE trades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  signal_id TEXT REFERENCES signals(id),
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL,
  amount REAL NOT NULL,
  price REAL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL REFERENCES users(id),
  referee_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  reward_cents INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_signals_user ON signals(user_id);
CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
```

## Success Criteria
- All 3 resources created
- wrangler.toml has placeholder IDs (filled after `wrangler d1 create` output)
- Migration file exists
