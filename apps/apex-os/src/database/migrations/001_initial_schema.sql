-- ApexOS D1 Schema for Cloudflare
-- Apply: wrangler d1 execute apex-os-db --file src/database/migrations/001_initial_schema.sql

-- Profiles (extends Better Auth user)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'trader' CHECK (role IN ('trader', 'admin', 'master_trader')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'premium', 'master')),
  referral_code TEXT UNIQUE,
  referred_by TEXT REFERENCES profiles(referral_code),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Trading signals from master traders
CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  master_trader_id TEXT NOT NULL REFERENCES profiles(id),
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
  entry_price REAL NOT NULL,
  stop_loss REAL,
  take_profit REAL,
  leverage INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  closed_at TEXT,
  pnl_percent REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Copy-trading relationships
CREATE TABLE IF NOT EXISTS copy_relationships (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  follower_id TEXT NOT NULL REFERENCES profiles(id),
  master_trader_id TEXT NOT NULL REFERENCES profiles(id),
  allocation_percent REAL DEFAULT 10.0,
  max_drawdown_percent REAL DEFAULT 20.0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(follower_id, master_trader_id)
);

-- Paper trading accounts
CREATE TABLE IF NOT EXISTS paper_accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL UNIQUE REFERENCES profiles(id),
  balance REAL DEFAULT 100000.00,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Referrals / viral economics
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  referrer_id TEXT NOT NULL REFERENCES profiles(id),
  referee_id TEXT NOT NULL REFERENCES profiles(id),
  tier TEXT DEFAULT 'bronze',
  total_revenue REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signals_master ON signals(master_trader_id);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_copy_follower ON copy_relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_copy_master ON copy_relationships(master_trader_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
