-- ApexOS D1/SQLite Schema
-- Converted from Supabase Postgres schema

-- ============================================================
-- Better Auth users table (replaces Supabase auth.users)
-- ============================================================
create table if not exists users (
  id text primary key,
  email text unique not null,
  emailVerified integer default 0,
  name text,
  image text,
  createdAt text default (datetime('now')),
  updatedAt text default (datetime('now'))
);

create index if not exists idx_users_email on users(email);

-- ============================================================
-- Profiles (extends Better Auth users)
-- ============================================================
create table if not exists profiles (
  id text primary key references users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'trader' check (role in ('trader','admin','master_trader')),
  plan text default 'free' check (plan in ('free','starter','growth','premium','master')),
  referral_code text unique,
  referred_by text references profiles(referral_code),
  created_at text default (datetime('now')),
  updated_at text default (datetime('now'))
);

-- ============================================================
-- Trading signals from master traders
-- ============================================================
create table if not exists signals (
  id text primary key,
  master_trader_id text not null references users(id),
  symbol text not null,
  side text not null check (side in ('LONG','SHORT')),
  entry_price real not null,
  stop_loss real,
  take_profit real,
  leverage integer default 1,
  status text default 'active' check (status in ('active','closed','cancelled')),
  closed_at text,
  pnl_percent real,
  created_at text default (datetime('now'))
);

create index if not exists idx_signals_master on signals(master_trader_id);
create index if not exists idx_signals_status on signals(status);

-- ============================================================
-- Copy-trading relationships
-- ============================================================
create table if not exists copy_relationships (
  id text primary key,
  follower_id text not null references users(id),
  master_trader_id text not null references users(id),
  allocation_percent real default 10.0,
  max_drawdown_percent real default 20.0,
  is_active integer default 1,
  created_at text default (datetime('now')),
  unique(follower_id, master_trader_id)
);

create index if not exists idx_copy_follower on copy_relationships(follower_id);
create index if not exists idx_copy_master on copy_relationships(master_trader_id);

-- ============================================================
-- Paper trading accounts
-- ============================================================
create table if not exists paper_accounts (
  id text primary key,
  user_id text not null unique references users(id),
  balance real default 100000.00,
  created_at text default (datetime('now')),
  updated_at text default (datetime('now'))
);

create index if not exists idx_paper_user on paper_accounts(user_id);

-- ============================================================
-- Referrals / viral economics
-- ============================================================
create table if not exists referrals (
  id text primary key,
  referrer_id text not null references users(id),
  referee_id text not null references users(id),
  tier text default 'bronze',
  total_revenue real default 0,
  created_at text default (datetime('now'))
);

create index if not exists idx_referrals_referrer on referrals(referrer_id);
create index if not exists idx_referrals_referee on referrals(referee_id);

-- ============================================================
-- Auto-generate referral_code on profile insert
-- ============================================================
create trigger if not exists trg_referral_code
after insert on profiles
for each row
when new.referral_code is null
begin
  update profiles set referral_code = lower(hex(randomblob(4))) where id = new.id;
end;

-- ============================================================
-- Auto-update updatedAt timestamps
-- ============================================================
create trigger if not exists trg_profiles_updated
after update on profiles
for each row
begin
  update profiles set updated_at = datetime('now') where id = old.id;
end;

create trigger if not exists trg_paper_accounts_updated
after update on paper_accounts
for each row
begin
  update paper_accounts set updated_at = datetime('now') where id = old.id;
end;
