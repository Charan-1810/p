import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AskQuestionSchema, ValidationError } from '@ace/shared';
import { AiService } from '../services/ai.service';
import { EmbeddingService } from '../services/embedding.service';

const aiService = new AiService();
const embeddingService = new EmbeddingService();

export const aiRouter: FastifyPluginAsync = async (app) => {
  // ── POST /repos/:repoId/ask — main RAG Q&A endpoint ───────────────────
  app.post('/repos/:repoId/ask', async (req, reply) => {
    const { repoId } = req.params as { repoId: string };
    const userId = req.headers['x-user-id'] as string;

    const parsed = AskQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request', parsed.error.flatten().fieldErrors);
    }

    const result = await aiService.explainCode({
      question: parsed.data.question,
      repositoryId: repoId,
      sessionId: parsed.data.sessionId,
      userId,
    });

    return reply.send({ success: true, data: result });
  });

  // ── GET /repos/:repoId/onboarding — generate onboarding guide ─────────
  app.get('/repos/:repoId/onboarding', async (req, reply) => {
    const { repoId } = req.params as { repoId: string };
    const guide = await aiService.generateOnboarding(repoId);
    return reply.send({ success: true, data: { guide } });
  });

  // ── GET /repos/:repoId/sessions — list chat sessions ──────────────────
  app.get('/repos/:repoId/sessions', async (req, reply) => {
    const { repoId } = req.params as { repoId: string };
    const userId = req.headers['x-user-id'] as string;
    const sessions = await aiService.getSessions(repoId, userId);
    return reply.send({ success: true, data: sessions });
  });

  // ── GET /sessions/:sessionId — get session messages ───────────────────
  app.get('/sessions/:sessionId', async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string };
    const userId = req.headers['x-user-id'] as string;
    const session = await aiService.getSessionMessages(sessionId, userId);
    if (!session) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }
    return reply.send({ success: true, data: session });
  });

  // ── POST /repos/:repoId/embed — trigger embedding indexing ────────────
  app.post('/repos/:repoId/embed', async (req, reply) => {
    const { repoId } = req.params as { repoId: string };
    // Worker calls this endpoint after parser completes
    setImmediate(async () => {
      try {
        await embeddingService.ensureCollection();
        // Actual embedding is done by the workers; this endpoint just ensures collection exists
      } catch (err) {
        // Log and continue
      }
    });
    return reply.status(202).send({ success: true, data: { message: 'Embedding setup ready' } });
  });
};
