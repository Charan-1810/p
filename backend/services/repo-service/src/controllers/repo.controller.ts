import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ImportRepoSchema, ValidationError, PaginationSchema } from '@ace/shared';
import { RepoService } from '../services/repo.service';

const repoService = new RepoService();

export const repoRouter: FastifyPluginAsync = async (app) => {
  // ── GET / — list user repos ─────────────────────────────────────────────
  app.get('/', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string;
    const pagination = PaginationSchema.parse(req.query);
    const result = await repoService.listUserRepos(userId, pagination);
    return reply.send({ success: true, data: result.repos, meta: result.meta });
  });

  // ── POST / — import a repository ────────────────────────────────────────
  app.post('/', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string;
    const parsed = ImportRepoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid repository URL', parsed.error.flatten().fieldErrors);
    }
    const repo = await repoService.importRepo(userId, parsed.data);
    return reply.status(202).send({ success: true, data: repo });
  });

  // ── GET /:id ─────────────────────────────────────────────────────────────
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.headers['x-user-id'] as string;
    const repo = await repoService.getRepo(id, userId);
    return reply.send({ success: true, data: repo });
  });

  // ── DELETE /:id ──────────────────────────────────────────────────────────
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.headers['x-user-id'] as string;
    await repoService.deleteRepo(id, userId);
    return reply.status(204).send();
  });

  // ── POST /:id/reanalyze ──────────────────────────────────────────────────
  app.post('/:id/reanalyze', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.headers['x-user-id'] as string;
    await repoService.triggerReanalysis(id, userId);
    return reply.status(202).send({ success: true, data: { message: 'Analysis queued' } });
  });

  // ── GET /:id/files ───────────────────────────────────────────────────────
  app.get('/:id/files', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.headers['x-user-id'] as string;
    const files = await repoService.getFileTree(id, userId);
    return reply.send({ success: true, data: files });
  });

  // ── GET /:id/files/:fileId ───────────────────────────────────────────────
  app.get('/:id/files/:fileId', async (req, reply) => {
    const { id, fileId } = req.params as { id: string; fileId: string };
    const userId = req.headers['x-user-id'] as string;
    const file = await repoService.getFileContent(id, fileId, userId);
    return reply.send({ success: true, data: file });
  });

  // ── GET /:id/stats ───────────────────────────────────────────────────────
  app.get('/:id/stats', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.headers['x-user-id'] as string;
    const stats = await repoService.getRepoStats(id, userId);
    return reply.send({ success: true, data: stats });
  });

  // ── GET /:id/analysis/progress ───────────────────────────────────────────
  app.get('/:id/analysis/progress', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.headers['x-user-id'] as string;
    const progress = await repoService.getAnalysisProgress(id, userId);
    return reply.send({ success: true, data: progress });
  });

  // ── GET /:id/analysis ────────────────────────────────────────────────────
  app.get('/:id/analysis', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.headers['x-user-id'] as string;
    const analysis = await repoService.getAnalysisData(id, userId);
    return reply.send({ success: true, data: analysis });
  });
};
