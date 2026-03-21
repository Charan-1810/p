#!/usr/bin/env ts-node
/**
 * Database migration runner.
 * Usage:  npx ts-node scripts/migrate.ts
 *
 * Scans backend/services/<name>/src/migrations/*.sql in lexicographic order
 * and applies any that have not been run yet, tracked in the `schema_migrations` table.
 */

import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';
import { glob } from 'glob';

const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  database: process.env.POSTGRES_DB ?? 'acedb',
  user: process.env.POSTGRES_USER ?? 'aceuser',
  password: process.env.POSTGRES_PASSWORD ?? 'acepassword',
});

async function run() {
  const client = await pool.connect();
  try {
    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         SERIAL PRIMARY KEY,
        filename   VARCHAR(500) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Collect all SQL files
    const sqlFiles = await glob('backend/services/*/src/migrations/*.sql', { cwd: path.resolve(__dirname, '..') });
    // Also include the init script
    sqlFiles.unshift('scripts/init-db.sql');

    const sorted = [...new Set(sqlFiles)].sort();

    // Already applied
    const { rows } = await client.query<{ filename: string }>('SELECT filename FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.filename));

    for (const file of sorted) {
      if (applied.has(file)) {
        console.log(`  ✓ already applied: ${file}`);
        continue;
      }
      console.log(`  → applying: ${file}`);
      const sql = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`    ✅ done`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`    ❌ failed:`, err);
        process.exit(1);
      }
    }

    console.log('\nAll migrations applied.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => { console.error(err); process.exit(1); });
