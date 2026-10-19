-- D1 schema for the lead backend. Apply once:
--   npx wrangler d1 execute margarita-leads --remote --file=worker/schema.sql
-- Personal data: never log request bodies; delete leads after 24 months
-- unless Margarita is working with them (docs/LEAD-SYSTEM.md).

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  lang TEXT,
  source TEXT,
  page TEXT,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  unsubscribed_at TEXT
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  goal TEXT,
  lang TEXT,
  page TEXT,
  brief TEXT NOT NULL,
  fields TEXT NOT NULL
);
