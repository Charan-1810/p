import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger, connectPostgres, connectNeo4j, closeNeo4j, closePostgres } from '@ace/shared';
import { graphRouter } from './controllers/graph.controller';

const PORT = parseInt(process.env.PORT ?? '4004', 10);
const app = Fastify({ logger: false, trustProxy: true });

app.register(helmet);
app.register(cors, { origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'] });

app.get('/health', async (_req, reply) => {
  reply.send({ success: true, data: { status: 'healthy', service: 'graph-service' } });
});

app.register(graphRouter, { prefix: '/api/v1/graph' });

app.setErrorHandler((error, _req, reply) => {
  logger.error({ err: error }, 'Graph service error');
  reply.status(error.statusCode ?? 500).send({
    success: false,
    error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message },
  });
});

const start = async () => {
  try {
    await connectPostgres();
    await connectNeo4j();
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info({ port: PORT }, '✅ Graph Service started');
  } catch (err) {
    logger.fatal({ err }, 'Failed to start Graph Service');
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await app.close(); await closePostgres(); await closeNeo4j(); process.exit(0); });
process.on('SIGINT', async () => { await app.close(); await closePostgres(); await closeNeo4j(); process.exit(0); });

start();
