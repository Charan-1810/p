import { Queue } from 'bullmq';
import { getRedis, QUEUE_NAMES } from '@ace/shared';

let connection: ReturnType<typeof getRedis> | null = null;

function getConnection() {
  if (!connection) connection = getRedis();
  return connection;
}

export const cloneQueue = new Queue(QUEUE_NAMES.CLONE, { connection: getConnection() as unknown as import('ioredis').Redis });
export const parseQueue = new Queue(QUEUE_NAMES.PARSE, { connection: getConnection() as unknown as import('ioredis').Redis });
export const embedQueue = new Queue(QUEUE_NAMES.EMBED, { connection: getConnection() as unknown as import('ioredis').Redis });
export const graphQueue = new Queue(QUEUE_NAMES.GRAPH, { connection: getConnection() as unknown as import('ioredis').Redis });
export const securityQueue = new Queue(QUEUE_NAMES.SECURITY_SCAN, { connection: getConnection() as unknown as import('ioredis').Redis });
