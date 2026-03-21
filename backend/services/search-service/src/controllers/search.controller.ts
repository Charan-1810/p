import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SearchService } from '../services/search.service';

const searchService = new SearchService();

const SearchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  type: z.enum(['semantic', 'fulltext', 'hybrid']).optional().default('hybrid'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  language: z.string().optional(),
});

const SuggestQuerySchema = z.object({
  prefix: z.string().min(1).max(100),
});

export async function searchRouter(app: FastifyInstance): Promise<void> {
  app.get(
    '/repos/:repoId/search',
    async (
      req: FastifyRequest<{ Params: { repoId: string }; Querystring: Record<string, string> }>,
      reply: FastifyReply,
    ) => {
      const parse = SearchQuerySchema.safeParse(req.query);
      if (!parse.success) return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parse.error.message } });

      const { q, type, limit, language } = parse.data;
      const results = await searchService.search(req.params.repoId, q, { type, limit, language });
      return reply.send({ success: true, data: { results, total: results.length, query: q } });
    },
  );

  app.get(
    '/repos/:repoId/suggestions',
    async (
      req: FastifyRequest<{ Params: { repoId: string }; Querystring: Record<string, string> }>,
      reply: FastifyReply,
    ) => {
      const parse = SuggestQuerySchema.safeParse(req.query);
      if (!parse.success) return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: parse.error.message } });

      const suggestions = await searchService.getSuggestions(req.params.repoId, parse.data.prefix);
      return reply.send({ success: true, data: { suggestions } });
    },
  );

  app.post(
    '/repos/:repoId/index/files',
    async (
      req: FastifyRequest<{ Params: { repoId: string }; Body: Record<string, unknown> }>,
      reply: FastifyReply,
    ) => {
      const body = req.body as {
        id: string;
        filePath: string;
        language: string;
        content: string;
        linesOfCode: number;
        createdAt: number;
      };
      await searchService.indexFile({ repositoryId: req.params.repoId, ...body });
      return reply.status(201).send({ success: true, data: { indexed: true } });
    },
  );

  app.post(
    '/repos/:repoId/index/functions',
    async (
      req: FastifyRequest<{ Params: { repoId: string }; Body: Record<string, unknown> }>,
      reply: FastifyReply,
    ) => {
      const body = req.body as {
        id: string;
        fileId: string;
        filePath: string;
        name: string;
        language: string;
        signature: string;
        complexity: number;
        isExported: boolean;
        isAsync: boolean;
      };
      await searchService.indexFunction({ repositoryId: req.params.repoId, ...body });
      return reply.status(201).send({ success: true, data: { indexed: true } });
    },
  );

  app.delete(
    '/repos/:repoId/index',
    async (req: FastifyRequest<{ Params: { repoId: string } }>, reply: FastifyReply) => {
      await searchService.deleteRepositoryIndex(req.params.repoId);
      return reply.send({ success: true, data: { deleted: true } });
    },
  );
}
