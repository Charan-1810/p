import axios from 'axios';
import { Job } from 'bullmq';
import { queryOne, logger, REDIS_KEYS, getRedis } from '@ace/shared';
import { graphQueue } from '../queues';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:4006';
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL ?? 'http://localhost:4005';

export interface EmbedJobData {
  repositoryId: string;
  userId: string;
}

export async function embedProcessor(job: Job<EmbedJobData>): Promise<void> {
  const { repositoryId, userId } = job.data;
  const redis = getRedis();

  const updateProgress = async (progress: number, message: string) => {
    await job.updateProgress(progress);
    await redis.set(REDIS_KEYS.ANALYSIS_PROGRESS(repositoryId), JSON.stringify({ progress, message }), 'EX', 3600);
  };

  try {
    await updateProgress(78, 'Generating code embeddings...');
    await queryOne('UPDATE repositories SET status = $1 WHERE id = $2', ['analyzing', repositoryId]);

    // Trigger embedding via AI service (embeddings are critical)
    const embedRes = await axios.post(`${AI_SERVICE_URL}/api/v1/ai/repos/${repositoryId}/embed`, {}, { timeout: 600_000 });

    if (!embedRes.data?.success) {
      throw new Error(embedRes.data?.error?.message ?? 'Embedding failed');
    }

    // Index for search (non-critical, attempt but don't block)
    await indexForSearch(repositoryId).catch((err) => {
      logger.warn({ err, repositoryId }, 'Search indexing failed (non-critical)');
    });

    await updateProgress(90, 'Embeddings complete. Building dependency graph...');
    logger.info({ repositoryId }, 'Embed completed');

    await graphQueue.add(
      'graph',
      { repositoryId, userId },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );
  } catch (err) {
    logger.error({ err, repositoryId }, 'Embed processor failed');
    await queryOne('UPDATE repositories SET status = $1, error_message = $2 WHERE id = $3', [
      'failed',
      err instanceof Error ? err.message : 'Unknown error',
      repositoryId,
    ]).catch(() => null);
    throw err;
  }
}

async function indexForSearch(repositoryId: string): Promise<void> {
  // Fetch files and index them in Typesense
  const repoRes = await axios.get(`${SEARCH_SERVICE_URL}/api/v1/search/repos/${repositoryId}/index`, {
    timeout: 60_000,
  }).catch(() => null);
  if (repoRes?.data?.success) {
    logger.debug({ repositoryId }, 'Search indexing triggered');
  }
}
