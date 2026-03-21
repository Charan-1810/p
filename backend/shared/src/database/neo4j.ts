import neo4j, { Driver, Session } from 'neo4j-driver';
import { logger } from '../utils/logger';

let driver: Driver | null = null;

export const getDriver = (): Driver => {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI ?? 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER ?? 'neo4j',
        process.env.NEO4J_PASSWORD ?? 'neo4jpassword'
      ),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 5000,
        maxTransactionRetryTime: 30000,
        logging: {
          level: 'warn',
          logger: (level, message) => {
            if (level === 'error') logger.error({ source: 'neo4j' }, message);
            else logger.warn({ source: 'neo4j' }, message);
          },
        },
      }
    );
  }
  return driver;
};

export const connectNeo4j = async (): Promise<void> => {
  await getDriver().verifyConnectivity();
  logger.info('✓ Neo4j connected');
};

export const closeNeo4j = async (): Promise<void> => {
  if (driver) {
    await driver.close();
    driver = null;
    logger.info('Neo4j driver closed');
  }
};

export const runCypher = async <T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
  database?: string
): Promise<T[]> => {
  const session: Session = getDriver().session({ database });
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record) => {
      const obj: Record<string, unknown> = {};
      record.keys.forEach((key) => {
        const value = record.get(key);
        obj[key as string] =
          neo4j.isInt(value) ? value.toNumber() : value;
      });
      return obj as T;
    });
  } finally {
    await session.close();
  }
};

export const runCypherWrite = async (
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<void> => {
  const session = getDriver().session();
  try {
    const tx = session.beginTransaction();
    try {
      await tx.run(cypher, params);
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } finally {
    await session.close();
  }
};
