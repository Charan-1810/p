import { Worker } from 'bullmq';
import { createBullMQConnection, logger, QUEUE_NAMES, connectRedis, closeRedis } from '@ace/shared';
import { cloneProcessor } from './processors/clone.processor';
import { parseProcessor } from './processors/parse.processor';
import { embedProcessor } from './processors/embed.processor';
import { graphProcessor } from './processors/graph.processor';

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? '5', 10);

async function main() {
  await connectRedis();
  const connection = createBullMQConnection();

  const workers: Worker[] = [
    new Worker(QUEUE_NAMES.CLONE, cloneProcessor, { connection, concurrency: CONCURRENCY }),
    new Worker(QUEUE_NAMES.PARSE, parseProcessor, { connection, concurrency: CONCURRENCY }),
    new Worker(QUEUE_NAMES.EMBED, embedProcessor, { connection, concurrency: 2 }),
    new Worker(QUEUE_NAMES.GRAPH, graphProcessor, { connection, concurrency: 3 }),
  ];

  for (const worker of workers) {
    worker.on('completed', (job) => logger.info({ jobId: job.id, queue: worker.name }, 'Job completed'));
    worker.on('failed', (job, err) => logger.error({ jobId: job?.id, queue: worker.name, err }, 'Job failed'));
    worker.on('error', (err) => logger.error({ err, queue: worker.name }, 'Worker error'));
  }

  logger.info({ queues: workers.map((w) => w.name) }, '✅ Workers started');

  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    await closeRedis();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start workers');
  process.exit(1);
});
