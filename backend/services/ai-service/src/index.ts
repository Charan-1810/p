import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger, connectPostgres, connectRedis, closePostgres, closeRedis } from '@ace/shared';
import { aiRouter } from './controllers/ai.controller';

const PORT = parseInt(process.env.PORT ?? '4006', 10);
const app = Fastify({ logger: false, trustProxy: true });

app.register(helmet);
app.register(cors, { origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'] });

app.get('/health', async (_req, reply) => {
  reply.send({ success: true, data: { status: 'healthy', service: 'ai-service' } });
});

app.register(aiRouter, { prefix: '/api/v1/ai' });

app.setErrorHandler((error, _req, reply) => {
  logger.error({ err: error }, 'AI service error');
  reply.status(error.statusCode ?? 500).send({
    success: false,
    error: { code: error.code ?? 'INTERNAL_ERROR', message: error.message },
  });
});

const start = async () => {
  try {
    await connectPostgres();
    await connectRedis();
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info({ port: PORT }, '✅ AI Service started');
  } catch (err) {
    logger.fatal({ err }, 'Failed to start AI Service');
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await app.close(); await closePostgres(); await closeRedis(); process.exit(0); });
process.on('SIGINT', async () => { await app.close(); await closePostgres(); await closeRedis(); process.exit(0); });

start();
