import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger, connectPostgres, connectRedis, closePostgres, closeRedis } from '@ace/shared';
import { parserRouter } from './controllers/parser.controller';

const PORT = parseInt(process.env.PORT ?? '4003', 10);
const app = Fastify({ logger: false, trustProxy: true, bodyLimit: 50 * 1024 * 1024 });

app.register(helmet);
app.register(cors, { origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'] });

app.get('/health', async (_req, reply) => {
  reply.send({ success: true, data: { status: 'healthy', service: 'parser-service' } });
});

app.register(parserRouter, { prefix: '/api/v1/parser' });

app.setErrorHandler((error, _req, reply) => {
  logger.error({ err: error }, 'Parser service error');
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
    logger.info({ port: PORT }, '✅ Parser Service started');
  } catch (err) {
    logger.fatal({ err }, 'Failed to start Parser Service');
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await app.close(); await closePostgres(); await closeRedis(); process.exit(0); });
process.on('SIGINT', async () => { await app.close(); await closePostgres(); await closeRedis(); process.exit(0); });

start();
