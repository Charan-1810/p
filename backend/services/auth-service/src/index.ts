import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger, connectPostgres, connectRedis, closePostgres, closeRedis } from '@ace/shared';
import { authRouter } from './controllers/auth.controller';

const PORT = parseInt(process.env.PORT ?? '4001', 10);

const app = Fastify({ logger: false, trustProxy: true });

app.register(helmet);
app.register(cors, {
  origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
  credentials: true,
});

// Health check
app.get('/health', async (_req, reply) => {
  reply.send({
    success: true,
    data: { status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() },
  });
});

// Register auth routes
app.register(authRouter, { prefix: '/api/v1/auth' });

// Error handler
app.setErrorHandler((error, _req, reply) => {
  logger.error({ err: error }, 'Auth service error');
  const statusCode = error.statusCode ?? 500;
  reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message: statusCode >= 500 ? 'Internal server error' : error.message,
    },
  });
});

const start = async () => {
  try {
    await connectPostgres();
    await connectRedis();
    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info({ port: PORT }, '✅ Auth Service started');
  } catch (err) {
    logger.fatal({ err }, 'Failed to start Auth Service');
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down Auth Service`);
  await app.close();
  await closePostgres();
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
