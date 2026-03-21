import axios from 'axios';
import { Job } from 'bullmq';
import { queryOne, logger, REDIS_KEYS, getRedis } from '@ace/shared';
import { embedQueue } from '../queues';

const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL ?? 'http://localhost:4003';

export interface ParseJobData {
  repositoryId: string;
  userId: string;
  repoPath: string;
}

export async function parseProcessor(job: Job<ParseJobData>): Promise<void> {
  const { repositoryId, userId } = job.data;
  const redis = getRedis();

  const updateProgress = async (progress: number, message: string) => {
    await job.updateProgress(progress);
    await redis.set(REDIS_KEYS.ANALYSIS_PROGRESS(repositoryId), JSON.stringify({ progress, message }), 'EX', 3600);
  };

  try {
    await updateProgress(58, 'Starting code parsing...');
    await queryOne('UPDATE repositories SET status = $1 WHERE id = $2', ['analyzing', repositoryId]);

    const response = await axios.post(`${PARSER_SERVICE_URL}/api/v1/parser/repos/${repositoryId}/parse`, { localPath: job.data.repoPath }, {
      timeout: 300_000,
    });

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message ?? 'Parser service returned failure');
    }

    await updateProgress(75, 'Code parsing complete. Queuing embedding...');
    logger.info({ repositoryId }, 'Parse completed');

    await embedQueue.add(
      'embed',
      { repositoryId, userId },
      { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
    );
  } catch (err) {
    logger.error({ err, repositoryId }, 'Parse processor failed');
    await queryOne('UPDATE repositories SET status = $1, error_message = $2 WHERE id = $3', [
      'failed',
      err instanceof Error ? err.message : 'Unknown error',
      repositoryId,
    ]).catch(() => null);
    throw err;
  }
}
