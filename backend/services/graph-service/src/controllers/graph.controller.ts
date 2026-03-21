import { FastifyPluginAsync } from 'fastify';
import { GraphService } from '../services/graph.service';

const graphService = new GraphService();

export const graphRouter: FastifyPluginAsync = async (app) => {
  // Build graph for a repository (called by workers)
  app.post('/repos/:repoId/build', async (req, reply) => {
    const { repoId } = req.params as { repoId: string };
    setImmediate(() => graphService.buildGraph(repoId).catch(() => {}));
    return reply.status(202).send({ success: true, data: { message: 'Graph build queued' } });
  });

  // Get full dependency graph
  app.get('/repos/:repoId', async (req, reply) => {
    const { repoId } = req.params as { repoId: string };
    const graph = await graphService.getGraph(repoId);
    return reply.send({ success: true, data: graph });
  });

  // Get import chain for a specific file
  app.get('/repos/:repoId/files/:fileId/imports', async (req, reply) => {
    const { repoId, fileId } = req.params as { repoId: string; fileId: string };
    const { depth } = req.query as { depth?: string };
    const graph = await graphService.getImportChain(repoId, fileId, parseInt(depth ?? '3', 10));
    return reply.send({ success: true, data: graph });
  });
};
