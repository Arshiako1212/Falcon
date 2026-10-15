-- Created automatically at every start (safe to re-run). Kept here for reference.
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  phone      TEXT NOT NULL UNIQUE,
  pass       TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  last_login BIGINT NOT NULL,
  uploads    INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS cards (
  id         TEXT PRIMARY KEY,
  uid        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  views      INTEGER NOT NULL DEFAULT 0,
  data       JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS cards_uid_idx ON cards(uid);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  role  TEXT NOT NULL,
  uid   TEXT REFERENCES users(id) ON DELETE CASCADE,
  exp   BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS files (
  name       TEXT PRIMARY KEY,
  mime       TEXT NOT NULL,
  data       BYTEA NOT NULL,
  uid        TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS logs (
  id     BIGSERIAL PRIMARY KEY,
  t      BIGINT NOT NULL,
  who    TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT ''
);
