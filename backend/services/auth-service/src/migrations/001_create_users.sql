-- Auth Service Migration: 001_create_users
-- Run order: 01

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email               VARCHAR(255) NOT NULL UNIQUE,
  username            VARCHAR(30)  NOT NULL UNIQUE,
  display_name        VARCHAR(100) NOT NULL,
  password_hash       TEXT         NOT NULL DEFAULT '',
  avatar_url          TEXT,
  role                user_role    NOT NULL DEFAULT 'user',
  email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
  github_id           VARCHAR(50)  UNIQUE,
  github_username     VARCHAR(100),
  github_access_token TEXT,
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email        ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username     ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_github_id    ON users (github_id) WHERE github_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at   ON users (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
