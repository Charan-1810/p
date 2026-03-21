import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import {
  Repository,
  RepoFile,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  getCache,
  setCache,
  getRedis,
  REDIS_KEYS,
  QUEUE_NAMES,
  logger,
  query,
} from '@ace/shared';
import { RepoRepository } from '../repositories/repo.repository';
import { Queue } from 'bullmq';
import type { PaginationInput, ImportRepoInput } from '@ace/shared';

const REPOS_DIR = process.env.REPOS_DIR ?? path.join(process.cwd(), 'repos');
const GITHUB_API = 'https://api.github.com';

export class RepoService {
  private readonly repo = new RepoRepository();
  private readonly cloneQueue: Queue;

  constructor() {
    this.cloneQueue = new Queue(QUEUE_NAMES.CLONE, {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    });
  }

  async listUserRepos(
    userId: string,
    pagination: PaginationInput
  ): Promise<{ repos: Repository[]; meta: { total: number; page: number; limit: number; hasNext: boolean } }> {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    const { repos, total } = await this.repo.findByUserId(userId, { limit, offset });
    return {
      repos,
      meta: { total, page, limit, hasNext: offset + repos.length < total },
    };
  }

  async importRepo(userId: string, input: ImportRepoInput): Promise<Repository> {
    // Normalize GitHub URL to API format
    const repoInfo = await this.fetchGithubRepoInfo(input.url, input.githubToken);

    // Check for duplicate — allow re-import of failed repos
    const existing = await this.repo.findByFullName(userId, repoInfo.full_name);
    if (existing) {
      if (existing.status !== 'failed') {
        throw new ConflictError(`Repository '${repoInfo.full_name}' is already imported`);
      }
      // Re-queue the clone job for the failed repo
      await this.repo.updateStatus(existing.id, 'pending', 0);
      await this.cloneQueue.add(
        'clone',
        { repositoryId: existing.id, userId, cloneUrl: existing.cloneUrl, branch: existing.defaultBranch, githubToken: input.githubToken },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: { count: 100 }, removeOnFail: { count: 50 } },
      );
      logger.info({ repoId: existing.id, fullName: existing.fullName }, 'Failed repository re-queued');
      return existing;
    }

    const repoId = uuidv4();
    const localPath = path.join(REPOS_DIR, repoId);

    const repo = await this.repo.create({
      id: repoId,
      userId,
      name: repoInfo.name,
      fullName: repoInfo.full_name,
      description: repoInfo.description,
      url: repoInfo.html_url,
      cloneUrl: repoInfo.clone_url,
      defaultBranch: input.branch ?? repoInfo.default_branch,
      language: repoInfo.language,
      isPrivate: repoInfo.private,
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      size: repoInfo.size,
      localPath,
      status: 'pending',
      analysisProgress: 0,
    });

    // Enqueue the clone job
    await this.cloneQueue.add(
      'clone',
      {
        repositoryId: repo.id,
        userId,
        cloneUrl: repo.cloneUrl,
        branch: repo.defaultBranch,
        githubToken: input.githubToken,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    logger.info({ repoId: repo.id, fullName: repo.fullName }, 'Repository import queued');
    return repo;
  }

  async getRepo(id: string, userId: string): Promise<Repository> {
    const cached = await getCache<Repository>(REDIS_KEYS.REPO_CACHE(id));
    if (cached) return cached;

    const repo = await this.repo.findById(id);
    if (!repo) throw new NotFoundError('Repository', id);
    if (repo.userId !== userId) throw new ForbiddenError();

    await setCache(REDIS_KEYS.REPO_CACHE(id), repo, 60);
    return repo;
  }

  async deleteRepo(id: string, userId: string): Promise<void> {
    const repo = await this.repo.findById(id);
    if (!repo) throw new NotFoundError('Repository', id);
    if (repo.userId !== userId) throw new ForbiddenError();

    // Remove local clone
    if (repo.localPath) {
      try {
        await fs.rm(repo.localPath, { recursive: true, force: true });
      } catch {
        logger.warn({ repoId: id }, 'Could not remove local repo clone');
      }
    }

    await this.repo.delete(id);
    logger.info({ repoId: id }, 'Repository deleted');
  }

  async triggerReanalysis(id: string, userId: string): Promise<void> {
    const repo = await this.getRepo(id, userId);
    if (repo.status === 'analyzing' || repo.status === 'cloning') {
      throw new ConflictError('Repository is currently being analyzed');
    }

    await this.repo.updateStatus(id, 'pending', 0);
    await this.cloneQueue.add(
      'clone',
      { repositoryId: id, userId, cloneUrl: repo.cloneUrl, branch: repo.defaultBranch },
      { attempts: 3 }
    );
  }

  async getFileTree(
    repoId: string,
    userId: string
  ): Promise<{ tree: FileTreeNode[] }> {
    const repo = await this.getRepo(repoId, userId);
    const files = await this.repo.getFiles(repoId);
    return { tree: buildFileTree(files) };
  }

  async getFileContent(
    repoId: string,
    fileId: string,
    userId: string
  ): Promise<{ file: RepoFile; content: string }> {
    await this.getRepo(repoId, userId); // Access check
    const file = await this.repo.getFile(fileId);
    if (!file || file.repositoryId !== repoId) throw new NotFoundError('File', fileId);

    // Read from local filesystem
    const repo = await this.repo.findById(repoId);
    if (!repo?.localPath) throw new NotFoundError('Repository local clone', repoId);

    const fullPath = path.join(repo.localPath, file.path);
    const content = await fs.readFile(fullPath, 'utf-8');
    return { file, content };
  }

  async getRepoStats(repoId: string, userId: string) {
    await this.getRepo(repoId, userId);
    const stats = await this.repo.getStats(repoId);
    
    // Transform languageBreakdown to languages array with percentages
    const langArray = Object.entries(stats.languageBreakdown ?? {}).map(
      ([language, count]) => ({ language, count })
    );
    const totalCount = langArray.reduce((sum, item) => sum + item.count, 0);
    
    return {
      totalFiles: stats.totalFiles,
      totalFunctions: stats.totalFunctions,
      totalClasses: stats.totalClasses,
      totalLines: stats.totalLines,
      languages: langArray.map(item => ({
        language: item.language,
        count: item.count,
        percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
      })),
    };
  }

  async getAnalysisProgress(repoId: string, userId: string) {
    const repo = await this.getRepo(repoId, userId);
    const redis = getRedis();
    const raw = await redis.get(REDIS_KEYS.ANALYSIS_PROGRESS(repoId)).catch(() => null);
    const live = raw ? (JSON.parse(raw) as { progress: number; message?: string }) : null;
    return {
      status: repo.status,
      progress: live?.progress ?? repo.analysisProgress ?? 0,
      message: live?.message,
      errorMessage: repo.errorMessage,
    };
  }

  async getAnalysisData(repoId: string, userId: string) {
    const { query } = await import('@ace/shared');
    await this.getRepo(repoId, userId); // Auth check

    // Get all stats
    const stats = await this.repo.getStats(repoId);
    const totalFiles = stats.totalFiles ?? 0;
    const totalFunctions = stats.totalFunctions ?? 0;
    const totalClasses = stats.totalClasses ?? 0;

    // Get languages breakdown
    const langResults = await query<{ language: string; count: number }>(
      `SELECT language, COUNT(*) as count 
       FROM repo_files 
       WHERE repository_id = $1 AND language IS NOT NULL
       GROUP BY language 
       ORDER BY count DESC`,
      [repoId]
    );
    const languages: Record<string, number> = {};
    langResults.forEach(r => {
      if (r.language) languages[r.language] = r.count;
    });

    // Get top 10 functions
    const topFunctions = await query<{ name: string; language: string }>(
      `SELECT f.name, rf.language
       FROM functions f
       JOIN repo_files rf ON f.file_id = rf.id
       WHERE f.repository_id = $1
       ORDER BY f.complexity DESC, f.name ASC
       LIMIT 10`,
      [repoId]
    );

    // Get top 10 classes
    const topClasses = await query<{ name: string; language: string }>(
      `SELECT c.name, rf.language
       FROM classes c
       JOIN repo_files rf ON c.file_id = rf.id
       WHERE c.repository_id = $1
       ORDER BY c.name ASC
       LIMIT 10`,
      [repoId]
    );

    return {
      totalFiles,
      totalFunctions,
      totalClasses,
      languages,
      topFunctions,
      topClasses,
    };
  }

  private async fetchGithubRepoInfo(url: string, token?: string) {
    // Extract owner/repo from URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/|$)/);
    if (!match) throw new ValidationError('Could not parse GitHub repository URL');

    const [, owner, repo] = match;
    const apiUrl = `${GITHUB_API}/repos/${owner}/${repo}`;

    try {
      const res = await axios.get(apiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(process.env.GITHUB_ACCESS_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}` }
            : {}),
        },
        timeout: 10_000,
      });
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        throw new NotFoundError('GitHub repository');
      }
      throw err;
    }
  }
}

// ── File Tree Builder ────────────────────────────────────────────────────────

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  fileId?: string;
  language?: string;
  linesOfCode?: number;
}

function buildFileTree(files: RepoFile[]): FileTreeNode[] {
  const root: Record<string, FileTreeNode> = {};

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          type: isLast ? 'file' : 'directory',
          ...(isLast
            ? { fileId: file.id, language: file.language, linesOfCode: file.linesOfCode }
            : { children: [] }),
        };
      }

      if (!isLast) {
        if (!current[part].children) current[part].children = [];
        current = Object.fromEntries(
          (current[part].children ?? []).map((c) => [c.name, c])
        );
        // Need to rebuild after the loop
      }
    }
  }

  // Convert to sorted array
  const toArray = (nodes: Record<string, FileTreeNode>): FileTreeNode[] =>
    Object.values(nodes)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((n) => (n.children ? { ...n, children: toArray(Object.fromEntries((n.children).map(c => [c.name, c]))) } : n));

  return toArray(root);
}
