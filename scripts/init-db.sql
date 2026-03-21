-- AI Codebase Explainer — PostgreSQL initialization script
-- This script runs automatically when the postgres container first starts.
-- It ONLY installs extensions. All tables, types, and indexes are created
-- by the migration files in backend/services/*/src/migrations/.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
