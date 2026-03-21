import { query, queryOne, Repository, RepoFile } from '@ace/shared';

interface RepoRow {
  id: string; user_id: string; name: string; full_name: string;
  description: string | null; url: string; clone_url: string;
  default_branch: string; language: string | null; is_private: boolean;
  stars: number; forks: number; size: number; local_path: string | null;
  status: string; analysis_progress: number; error_message: string | null;
  last_analyzed_at: Date | null; created_at: Date; updated_at: Date;
}

interface FileRow {
  id: string; repository_id: string; path: string; name: string;
  extension: string; language: string | null; size: number;
  lines_of_code: number; content_hash: string; created_at: Date; updated_at: Date;
}

const mapRepo = (r: RepoRow): Repository => ({
  id: r.id, userId: r.user_id, name: r.name, fullName: r.full_name,
  description: r.description ?? undefined, url: r.url, cloneUrl: r.clone_url,
  defaultBranch: r.default_branch, language: r.language ?? undefined,
  isPrivate: r.is_private, stars: r.stars, forks: r.forks, size: r.size,
  localPath: r.local_path ?? undefined, status: r.status as Repository['status'],
  analysisProgress: r.analysis_progress, errorMessage: r.error_message ?? undefined,
  lastAnalyzedAt: r.last_analyzed_at ?? undefined,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

const mapFile = (f: FileRow): RepoFile => ({
  id: f.id, repositoryId: f.repository_id, path: f.path, name: f.name,
  extension: f.extension, language: f.language ?? undefined, size: f.size,
  linesOfCode: f.lines_of_code, contentHash: f.content_hash,
  createdAt: f.created_at, updatedAt: f.updated_at,
});

export class RepoRepository {
  async findById(id: string): Promise<Repository | null> {
    const row = await queryOne<RepoRow>('SELECT * FROM repositories WHERE id = $1', [id]);
    return row ? mapRepo(row) : null;
  }

  async findByFullName(userId: string, fullName: string): Promise<Repository | null> {
    const row = await queryOne<RepoRow>(
      'SELECT * FROM repositories WHERE user_id = $1 AND full_name = $2', [userId, fullName]
    );
    return row ? mapRepo(row) : null;
  }

  async findByUserId(
    userId: string,
    opts: { limit: number; offset: number }
  ): Promise<{ repos: Repository[]; total: number }> {
    const [countRow, rows] = await Promise.all([
      queryOne<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM repositories WHERE user_id = $1', [userId]
      ),
      query<RepoRow>(
        'SELECT * FROM repositories WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, opts.limit, opts.offset]
      ),
    ]);
    return { repos: rows.map(mapRepo), total: parseInt(countRow?.count ?? '0', 10) };
  }

  async create(input: Omit<Repository, 'createdAt' | 'updatedAt'>): Promise<Repository> {
    const row = await queryOne<RepoRow>(
      `INSERT INTO repositories (
        id, user_id, name, full_name, description, url, clone_url,
        default_branch, language, is_private, stars, forks, size,
        local_path, status, analysis_progress
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *`,
      [
        input.id, input.userId, input.name, input.fullName, input.description ?? null,
        input.url, input.cloneUrl, input.defaultBranch, input.language ?? null,
        input.isPrivate, input.stars, input.forks, input.size,
        input.localPath ?? null, input.status, input.analysisProgress ?? 0,
      ]
    );
    return mapRepo(row!);
  }

  async updateStatus(id: string, status: string, progress: number, errorMessage?: string): Promise<void> {
    await query(
      `UPDATE repositories SET status = $1, analysis_progress = $2,
       error_message = $3, updated_at = NOW() WHERE id = $4`,
      [status, progress, errorMessage ?? null, id]
    );
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await query(
      'UPDATE repositories SET analysis_progress = $1, updated_at = NOW() WHERE id = $2',
      [progress, id]
    );
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM repositories WHERE id = $1', [id]);
  }

  async getFiles(repositoryId: string): Promise<RepoFile[]> {
    const rows = await query<FileRow>(
      'SELECT * FROM repo_files WHERE repository_id = $1 ORDER BY path',
      [repositoryId]
    );
    return rows.map(mapFile);
  }

  async getFile(fileId: string): Promise<RepoFile | null> {
    const row = await queryOne<FileRow>('SELECT * FROM repo_files WHERE id = $1', [fileId]);
    return row ? mapFile(row) : null;
  }

  async upsertFile(file: Omit<RepoFile, 'createdAt' | 'updatedAt'>): Promise<RepoFile> {
    const row = await queryOne<FileRow>(
      `INSERT INTO repo_files (id, repository_id, path, name, extension, language, size, lines_of_code, content_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (repository_id, path) DO UPDATE
         SET name=$4, extension=$5, language=$6, size=$7, lines_of_code=$8, content_hash=$9, updated_at=NOW()
       RETURNING *`,
      [file.id, file.repositoryId, file.path, file.name, file.extension,
       file.language ?? null, file.size, file.linesOfCode, file.contentHash]
    );
    return mapFile(row!);
  }

  async getStats(repositoryId: string) {
    const [analysis, langRows] = await Promise.all([
      queryOne<{
        total_files: string; total_functions: string; total_classes: string;
        total_lines: string; avg_complexity: string;
      }>(
        `SELECT
          (SELECT COUNT(*) FROM repo_files WHERE repository_id = $1)::text        AS total_files,
          (SELECT COUNT(*) FROM functions   WHERE repository_id = $1)::text        AS total_functions,
          (SELECT COUNT(*) FROM classes     WHERE repository_id = $1)::text        AS total_classes,
          (SELECT COALESCE(SUM(lines_of_code), 0) FROM repo_files WHERE repository_id = $1)::text AS total_lines,
          (SELECT COALESCE(AVG(complexity), 0)    FROM functions   WHERE repository_id = $1)::text AS avg_complexity`,
        [repositoryId]
      ),
      query<{ language: string; file_count: string }>(
        `SELECT language, COUNT(*)::text AS file_count
         FROM repo_files WHERE repository_id = $1 AND language IS NOT NULL
         GROUP BY language ORDER BY file_count DESC`,
        [repositoryId]
      ),
    ]);

    return {
      totalFiles: parseInt(analysis?.total_files ?? '0', 10),
      totalFunctions: parseInt(analysis?.total_functions ?? '0', 10),
      totalClasses: parseInt(analysis?.total_classes ?? '0', 10),
      totalLines: parseInt(analysis?.total_lines ?? '0', 10),
      avgComplexity: parseFloat(analysis?.avg_complexity ?? '0'),
      languageBreakdown: Object.fromEntries(
        langRows.map((r) => [r.language, parseInt(r.file_count, 10)])
      ),
    };
  }
}
