-- Repo Service Migration: 002_create_repositories
-- Run order: 02

DO $$ BEGIN
  CREATE TYPE repo_status AS ENUM (
    'pending', 'cloning', 'cloned', 'analyzing', 'analyzed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS repositories (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  full_name           VARCHAR(512) NOT NULL,
  description         TEXT,
  url                 TEXT         NOT NULL,
  clone_url           TEXT         NOT NULL,
  default_branch      VARCHAR(100) NOT NULL DEFAULT 'main',
  language            VARCHAR(50),
  is_private          BOOLEAN      NOT NULL DEFAULT FALSE,
  stars               INTEGER      NOT NULL DEFAULT 0,
  forks               INTEGER      NOT NULL DEFAULT 0,
  size                INTEGER      NOT NULL DEFAULT 0,
  local_path          TEXT,
  status              repo_status  NOT NULL DEFAULT 'pending',
  analysis_progress   INTEGER      NOT NULL DEFAULT 0 CHECK (analysis_progress BETWEEN 0 AND 100),
  error_message       TEXT,
  last_analyzed_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repos_user_id    ON repositories (user_id);
CREATE INDEX IF NOT EXISTS idx_repos_status     ON repositories (status);
CREATE INDEX IF NOT EXISTS idx_repos_full_name  ON repositories (full_name);
CREATE INDEX IF NOT EXISTS idx_repos_created_at ON repositories (created_at DESC);

CREATE TRIGGER repositories_updated_at
  BEFORE UPDATE ON repositories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Files ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS repo_files (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id   UUID         NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  path            TEXT         NOT NULL,
  name            VARCHAR(255) NOT NULL,
  extension       VARCHAR(20)  NOT NULL DEFAULT '',
  language        VARCHAR(50),
  size            INTEGER      NOT NULL DEFAULT 0,
  lines_of_code   INTEGER      NOT NULL DEFAULT 0,
  content_hash    VARCHAR(64)  NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (repository_id, path)
);

CREATE INDEX IF NOT EXISTS idx_files_repo_id    ON repo_files (repository_id);
CREATE INDEX IF NOT EXISTS idx_files_language   ON repo_files (language);
CREATE INDEX IF NOT EXISTS idx_files_extension  ON repo_files (extension);

CREATE TRIGGER repo_files_updated_at
  BEFORE UPDATE ON repo_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Functions ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS functions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id         UUID        NOT NULL REFERENCES repo_files(id) ON DELETE CASCADE,
  repository_id   UUID        NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  start_line      INTEGER     NOT NULL,
  end_line        INTEGER     NOT NULL,
  parameters      JSONB       NOT NULL DEFAULT '[]',
  return_type     VARCHAR(100),
  is_async        BOOLEAN     NOT NULL DEFAULT FALSE,
  is_exported     BOOLEAN     NOT NULL DEFAULT FALSE,
  complexity      INTEGER     NOT NULL DEFAULT 1,
  docstring       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_functions_file_id  ON functions (file_id);
CREATE INDEX IF NOT EXISTS idx_functions_repo_id  ON functions (repository_id);
CREATE INDEX IF NOT EXISTS idx_functions_name     ON functions USING gin (name gin_trgm_ops);

-- ── Classes ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classes (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id         UUID         NOT NULL REFERENCES repo_files(id) ON DELETE CASCADE,
  repository_id   UUID         NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  start_line      INTEGER      NOT NULL,
  end_line        INTEGER      NOT NULL,
  super_class     VARCHAR(255),
  interfaces      JSONB        NOT NULL DEFAULT '[]',
  is_exported     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_file_id  ON classes (file_id);
CREATE INDEX IF NOT EXISTS idx_classes_repo_id  ON classes (repository_id);

-- ── Analyses ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analyses (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id   UUID         NOT NULL REFERENCES repositories(id) ON DELETE CASCADE UNIQUE,
  total_files     INTEGER      NOT NULL DEFAULT 0,
  total_functions INTEGER      NOT NULL DEFAULT 0,
  total_classes   INTEGER      NOT NULL DEFAULT 0,
  total_lines     INTEGER      NOT NULL DEFAULT 0,
  languages       JSONB        NOT NULL DEFAULT '{}',
  avg_complexity  NUMERIC(5,2) NOT NULL DEFAULT 0,
  analyzed_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Chat Sessions ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_sessions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id   UUID        NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255),
  messages        JSONB       NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_repo_user ON chat_sessions (repository_id, user_id);

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
