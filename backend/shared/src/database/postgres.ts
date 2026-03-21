import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected PostgreSQL pool error');
    });

    pool.on('connect', () => {
      logger.debug('New PostgreSQL connection established');
    });
  }
  return pool;
};

export const query = async <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> => {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    logger.warn({ query: text, duration }, 'Slow PostgreSQL query detected');
  }

  return result.rows as T[];
};

export const queryOne = async <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> => {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
};

export const withTransaction = async <T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const connectPostgres = async (): Promise<void> => {
  const client = await getPool().connect();
  try {
    await client.query('SELECT 1');
    logger.info('✓ PostgreSQL connected');
  } finally {
    client.release();
  }
};

export const closePostgres = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('PostgreSQL pool closed');
  }
};
