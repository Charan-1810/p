import path from 'path';
import fs from 'fs/promises';
import { simpleGit } from 'simple-git';
import { Job } from 'bullmq';
import { queryOne, logger, REDIS_KEYS, getRedis } from '@ace/shared';
import { parseQueue } from '../queues';

const REPOS_BASE = process.env.REPOS_BASE_PATH ?? '/tmp/ace-repos';

export interface CloneJobData {
  repositoryId: string;
  userId: string;
  cloneUrl: string;
  fullName?: string;
  branch: string;
  githubToken?: string;
}

export async function cloneProcessor(job: Job<CloneJobData>): Promise<void> {
  const { repositoryId, cloneUrl, fullName, branch } = job.data;
  const redis = getRedis();

  const updateProgress = async (progress: number, message: string) => {
    await job.updateProgress(progress);
    await redis.set(REDIS_KEYS.ANALYSIS_PROGRESS(repositoryId), JSON.stringify({ progress, message }), 'EX', 3600);
    logger.info({ repositoryId, progress, message }, 'Clone progress');
  };

  try {
    await updateProgress(5, 'Starting repository clone');

    await queryOne<{ id: string }>('UPDATE repositories SET status = $1 WHERE id = $2 RETURNING id', [
      'cloning',
      repositoryId,
    ]);

    const repoPath = path.join(REPOS_BASE, repositoryId);
    await fs.rm(repoPath, { recursive: true, force: true });
    await fs.mkdir(repoPath, { recursive: true });

    const git = simpleGit();
    await updateProgress(15, 'Cloning repository...');

    try {
      await git.clone(cloneUrl, repoPath, ['--branch', branch, '--depth', '1', '--single-branch']);
    } catch (cloneErr) {
      // Branch not found — fall back to cloning the default branch
      logger.warn({ repositoryId, branch, err: cloneErr }, 'Branch not found, retrying without --branch');
      await fs.rm(repoPath, { recursive: true, force: true });
      await fs.mkdir(repoPath, { recursive: true });
      await git.clone(cloneUrl, repoPath, ['--depth', '1', '--single-branch']);
    }

    await updateProgress(40, 'Repository cloned. Counting files...');

    const fileCount = await countFiles(repoPath);

    await queryOne(
      'UPDATE repositories SET status = $1, local_path = $2, file_count = $3, updated_at = NOW() WHERE id = $4',
      ['cloned', repoPath, fileCount, repositoryId],
    );

    await updateProgress(50, 'Clone complete. Queuing analysis...');

    await parseQueue.add(
      'parse',
      { repositoryId, userId: job.data.userId, repoPath },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    await updateProgress(55, 'Parse job queued.');
    logger.info({ repositoryId, fullName }, 'Clone completed successfully');
  } catch (err) {
    logger.error({ err, repositoryId }, 'Clone processor failed');
    await queryOne('UPDATE repositories SET status = $1, error_message = $2 WHERE id = $3', [
      'failed',
      err instanceof Error ? err.message : 'Unknown error',
      repositoryId,
    ]).catch(() => null);
    throw err;
  }
}

async function countFiles(dir: string): Promise<number> {
  let count = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const ignored = new Set(['.git', 'node_modules', '__pycache__', '.venv', 'vendor']);
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    if (entry.isDirectory()) count += await countFiles(path.join(dir, entry.name));
    else count++;
  }
  return count;
}
