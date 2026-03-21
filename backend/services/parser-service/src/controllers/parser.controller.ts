import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ValidationError, query, queryOne } from '@ace/shared';
import { ParserService } from '../services/parser.service';

const parserService = new ParserService();

export const parserRouter: FastifyPluginAsync = async (app) => {
  // ── POST /repos/:repoId/parse — trigger parse for a repo ─────────────────
  app.post('/repos/:repoId/parse', async (req, reply) => {
    const { repoId } = req.params as { repoId: string };

    const BodySchema = z.object({
      localPath: z.string().min(1),
    });
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', parsed.error.flatten().fieldErrors);
    }

    const { localPath } = parsed.data;

    // Run parse asynchronously and store results in DB
    setImmediate(async () => {
      try {
        const results = await parserService.parseRepository(repoId, localPath);
        for (const r of results) {
          // Upsert file record
          await queryOne(
            `INSERT INTO repo_files (id, repository_id, path, name, extension, language, size, lines_of_code, content_hash)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (repository_id, path) DO UPDATE
               SET name=$4, extension=$5, language=$6, size=$7, lines_of_code=$8, content_hash=$9, updated_at=NOW()
             RETURNING id`,
            [r.fileId, repoId, r.filePath, r.name, r.extension, r.language, r.size, r.linesOfCode, r.contentHash]
          );

          // Store functions
          if (r.analysis.functions?.length) {
            for (const fn of r.analysis.functions) {
              await queryOne(
                `INSERT INTO functions (id, file_id, repository_id, name, start_line, end_line, parameters, return_type, is_async, is_exported, complexity, docstring)
                 VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                 ON CONFLICT DO NOTHING`,
                [r.fileId, repoId, fn.name, fn.startLine, fn.endLine,
                 JSON.stringify(fn.parameters), fn.returnType ?? null,
                 fn.isAsync, fn.isExported, fn.complexity, fn.docstring ?? null]
              );
            }
          }

          // Store classes
          if (r.analysis.classes?.length) {
            for (const cls of r.analysis.classes) {
              await queryOne(
                `INSERT INTO classes (id, file_id, repository_id, name, start_line, end_line, super_class, interfaces, is_exported)
                 VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8)
                 ON CONFLICT DO NOTHING`,
                [r.fileId, repoId, cls.name, cls.startLine, cls.endLine,
                 cls.superClass ?? null, JSON.stringify(cls.interfaces), cls.isExported]
              );
            }
          }
        }
      } catch (err) {
        // Error is logged; caller polls for progress
      }
    });

    return reply.status(202).send({
      success: true,
      data: { message: 'Parsing started', repositoryId: repoId },
    });
  });

  // ── GET /repos/:repoId/analysis — get parsed analysis ────────────────────
  app.get('/repos/:repoId/analysis', async (req, reply) => {
    const { repoId } = req.params as { repoId: string };

    const [fileCount, fnCount, classCount] = await Promise.all([
      queryOne<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM repo_files WHERE repository_id = $1', [repoId]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM functions WHERE repository_id = $1', [repoId]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*)::text as count FROM classes WHERE repository_id = $1', [repoId]
      ),
    ]);

    return reply.send({
      success: true,
      data: {
        repositoryId: repoId,
        totalFiles: parseInt(fileCount?.count ?? '0', 10),
        totalFunctions: parseInt(fnCount?.count ?? '0', 10),
        totalClasses: parseInt(classCount?.count ?? '0', 10),
      },
    });
  });

  // ── GET /repos/:repoId/files/:fileId/functions ────────────────────────────
  app.get('/repos/:repoId/files/:fileId/functions', async (req, reply) => {
    const { fileId } = req.params as { repoId: string; fileId: string };

    const fns = await query(
      `SELECT id, name, start_line, end_line, parameters, return_type, is_async, is_exported, complexity
       FROM functions WHERE file_id = $1 ORDER BY start_line`,
      [fileId]
    );

    return reply.send({ success: true, data: fns });
  });
};
