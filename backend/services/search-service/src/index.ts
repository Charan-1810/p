import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger } from '@ace/shared';
import { searchRouter } from './controllers/search.controller';
import { initTypesenseCollections } from './config/typesense';

const PORT = parseInt(process.env.PORT ?? '4005', 10);
const app = Fastify({ logger: false, trustProxy: true });

app.register(helmet);
app.register(cors, { origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'] });

app.get('/health', async (_req, reply) => {
  reply.send({ success: true, data: { status: 'healthy', service: 'search-service' } });
});

app.register(searchRouter, { prefix: '/api/v1/search' });

app.setErrorHandler((error, _req, reply) => {
  logger.error({ err: error }, 'Search service error');
  reply.status(error.statusCode ?? 500).send({
    success: false,
    error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message },
  });
});

const start = async () => {
  try {
    await initTypesenseCollections().catch((err: Error) => {
      logger.warn({ err }, 'Typesense unavailable — search indexing disabled');
    });
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info({ port: PORT }, '✅ Search Service started');
  } catch (err) {
    logger.fatal({ err }, 'Failed to start Search Service');
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await app.close(); process.exit(0); });
process.on('SIGINT', async () => { await app.close(); process.exit(0); });

start();
