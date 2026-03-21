import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

const createRedisClient = (role: 'client' | 'subscriber'): Redis => {
  const client = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: role === 'client' ? 3 : null,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  client.on('connect', () => logger.info(`✓ Redis [${role}] connected`));
  client.on('error', (err) => logger.error({ err }, `Redis [${role}] error`));
  client.on('close', () => logger.warn(`Redis [${role}] connection closed`));
  client.on('reconnecting', () => logger.info(`Redis [${role}] reconnecting...`));

  return client;
};

export const getRedis = (): Redis => {
  if (!redisClient) {
    redisClient = createRedisClient('client');
  }
  return redisClient;
};

export const getRedisSubscriber = (): Redis => {
  if (!redisSubscriber) {
    redisSubscriber = createRedisClient('subscriber');
  }
  return redisSubscriber;
};

export const connectRedis = async (): Promise<void> => {
  const client = getRedis();
  await client.ping();
};

// BullMQ requires maxRetriesPerRequest: null for blocking commands
export const createBullMQConnection = (): Redis => {
  return new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
  });
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  if (redisSubscriber) {
    await redisSubscriber.quit();
    redisSubscriber = null;
  }
  logger.info('Redis connections closed');
};

// ── Helper Utilities ──────────────────────────────────────────────────────
export const setCache = async (
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> => {
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await getRedis().setex(key, ttlSeconds, serialized);
  } else {
    await getRedis().set(key, serialized);
  }
};

export const getCache = async <T = unknown>(key: string): Promise<T | null> => {
  const value = await getRedis().get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const deleteCache = async (...keys: string[]): Promise<void> => {
  if (keys.length > 0) {
    await getRedis().del(...keys);
  }
};

export const publishEvent = async (channel: string, data: unknown): Promise<void> => {
  await getRedis().publish(channel, JSON.stringify(data));
};
