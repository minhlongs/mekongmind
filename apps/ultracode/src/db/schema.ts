export const CREATE_USERS_TABLE = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE NOT NULL,
  login TEXT NOT NULL,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  github_access_token TEXT,
  tier TEXT DEFAULT 'free' NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')) NOT NULL
)
`;

export const CREATE_REPOS_TABLE = /* sql */ `
CREATE TABLE IF NOT EXISTS repos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  platform TEXT DEFAULT 'github' NOT NULL,
  default_branch TEXT DEFAULT 'main',
  private INTEGER DEFAULT 0 NOT NULL,
  settings TEXT,
  connected_at TEXT DEFAULT (datetime('now')) NOT NULL,
  last_synced_at TEXT,
  UNIQUE(user_id, full_name)
)
`;

export const CREATE_REVIEWS_TABLE = /* sql */ `
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  pull_number INTEGER NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  findings_count INTEGER DEFAULT 0,
  started_at TEXT DEFAULT (datetime('now')) NOT NULL,
  completed_at TEXT
)
`;

export const CREATE_FINDINGS_TABLE = /* sql */ `
CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  severity TEXT DEFAULT 'info' NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  line_start INTEGER,
  line_end INTEGER,
  suggestion TEXT,
  status TEXT DEFAULT 'open' NOT NULL,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL
)
`;

export const CREATE_SPRINTS_TABLE = /* sql */ `
CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  status TEXT DEFAULT 'planned' NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')) NOT NULL
)
`;

export const INDEX_REPOS_USER_ID =
  "CREATE INDEX IF NOT EXISTS idx_repos_user_id ON repos(user_id)";
export const INDEX_REVIEWS_REPO_ID =
  "CREATE INDEX IF NOT EXISTS idx_reviews_repo_id ON reviews(repo_id)";
export const INDEX_FINDINGS_REVIEW_ID =
  "CREATE INDEX IF NOT EXISTS idx_findings_review_id ON findings(review_id)";
export const INDEX_SPRINTS_REPO_ID =
  "CREATE INDEX IF NOT EXISTS idx_sprints_repo_id ON sprints(repo_id)";

export const ADD_GITHUB_TOKEN_COLUMN =
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT";

export const ALL_MIGRATIONS = [
  CREATE_USERS_TABLE,
  CREATE_REPOS_TABLE,
  CREATE_REVIEWS_TABLE,
  CREATE_FINDINGS_TABLE,
  CREATE_SPRINTS_TABLE,
  INDEX_REPOS_USER_ID,
  INDEX_REVIEWS_REPO_ID,
  INDEX_FINDINGS_REVIEW_ID,
  INDEX_SPRINTS_REPO_ID,
  ADD_GITHUB_TOKEN_COLUMN,
];
