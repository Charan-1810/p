import axios from 'axios';
import { Job } from 'bullmq';
import { queryOne, logger, REDIS_KEYS, getRedis } from '@ace/shared';

const GRAPH_SERVICE_URL = process.env.GRAPH_SERVICE_URL ?? 'http://localhost:4004';

export interface GraphJobData {
  repositoryId: string;
  userId: string;
}

export async function graphProcessor(job: Job<GraphJobData>): Promise<void> {
  const { repositoryId } = job.data;
  const redis = getRedis();

  const updateProgress = async (progress: number, message: string) => {
    await job.updateProgress(progress);
    await redis.set(REDIS_KEYS.ANALYSIS_PROGRESS(repositoryId), JSON.stringify({ progress, message }), 'EX', 3600);
  };

  try {
    await updateProgress(93, 'Building dependency graph...');
    await queryOne('UPDATE repositories SET status = $1 WHERE id = $2', ['analyzing', repositoryId]);

    const response = await axios.post(
      `${GRAPH_SERVICE_URL}/api/v1/graph/repos/${repositoryId}/build`,
      {},
      { timeout: 300_000 },
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error?.message ?? 'Graph service returned failure');
    }

    await updateProgress(100, 'Analysis complete!');

    await queryOne(
      'UPDATE repositories SET status = $1, analyzed_at = NOW(), updated_at = NOW() WHERE id = $2',
      ['analyzed', repositoryId],
    );

    logger.info({ repositoryId }, 'Full analysis pipeline completed successfully');
  } catch (err) {
    logger.error({ err, repositoryId }, 'Graph step failed — marking repo as failed');
    // Graph build is critical; if it fails, the analysis is incomplete
    await queryOne(
      'UPDATE repositories SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
      ['failed', err instanceof Error ? err.message : 'Graph build failed', repositoryId],
    ).catch(() => null);
    throw err;
  }
}
