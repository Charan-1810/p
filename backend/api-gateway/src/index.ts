import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { logger } from '@ace/shared';
import { registerRoutes } from './routes/index';
import { config } from './config/index';

const app = Fastify({
  logger: false, // We use pino directly
  trustProxy: true,
  requestTimeout: 30_000,
  bodyLimit: 10 * 1024 * 1024, // 10MB
});

// ── Plugins ───────────────────────────────────────────────────────────────
app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

app.register(cors, {
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
});

app.register(rateLimit, {
  global: true,
  max: config.rateLimitMax,
  timeWindow: config.rateLimitWindowMs,
  errorResponseBuilder: (_req, context) => ({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    },
  }),
  keyGenerator: (req) =>
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
    req.ip,
});

// ── Request Logging ───────────────────────────────────────────────────────
app.addHook('onRequest', async (req: FastifyRequest) => {
  req.log = logger.child({
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
  }) as any;
});

app.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
  logger.info({
    requestId: req.id,
    method: req.method,
    url: req.url,
    statusCode: reply.statusCode,
    responseTime: reply.elapsedTime.toFixed(2),
  }, 'Request completed');
});

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/health', async (_req, reply) => {
  return reply.status(200).send({
    success: true,
    data: {
      status: 'healthy',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ── Routes ────────────────────────────────────────────────────────────────
registerRoutes(app);

// ── Global Error Handler ──────────────────────────────────────────────────
app.setErrorHandler((error, req, reply) => {
  logger.error({ err: error, requestId: req.id }, 'Unhandled gateway error');

  const statusCode = error.statusCode ?? 500;
  reply.status(statusCode).send({
    success: false,
    error: {
      code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
      message:
        statusCode >= 500
          ? 'Internal server error'
          : error.message,
    },
  });
});

app.setNotFoundHandler((_req, reply) => {
  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(
      { port: config.port, env: process.env.NODE_ENV },
      `🚀 API Gateway running on port ${config.port}`
    );
  } catch (err) {
    logger.fatal({ err }, 'Failed to start API Gateway');
    process.exit(1);
  }
};

// ── Graceful Shutdown ─────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down API Gateway...`);
  try {
    await app.close();
    logger.info('API Gateway stopped');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

export default app;
