import { FastifyInstance } from 'fastify';
import httpProxy from '@fastify/http-proxy';
import { config } from '../config/index';
import { authMiddleware } from '../middlewares/auth.middleware';

// Routes that do NOT require authentication
const PUBLIC_ROUTES = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/github',
  '/api/v1/auth/github/callback',
  '/api/v1/auth/github/exchange',
  '/health',
]);

export const registerRoutes = (app: FastifyInstance): void => {
  // ── Auth Guard Hook ─────────────────────────────────────────────────────
  app.addHook('preHandler', async (req, reply) => {
    const isPublic = PUBLIC_ROUTES.has(req.url.split('?')[0]);
    if (!isPublic) {
      await authMiddleware(req, reply);
    }
  });

  // ── Service Proxies ─────────────────────────────────────────────────────

  // Auth Service — handles /api/v1/auth/*
  app.register(httpProxy, {
    upstream: config.services.auth,
    prefix: '/api/v1/auth',
    rewritePrefix: '/api/v1/auth',
    http2: false,
  });

  // Repo Service — handles /api/v1/repos/*
  app.register(httpProxy, {
    upstream: config.services.repo,
    prefix: '/api/v1/repos',
    rewritePrefix: '/api/v1/repos',
    http2: false,
  });

  // Parser Service — handles /api/v1/parser/*
  app.register(httpProxy, {
    upstream: config.services.parser,
    prefix: '/api/v1/parser',
    rewritePrefix: '/api/v1/parser',
    http2: false,
  });

  // Graph Service — handles /api/v1/graph/*
  app.register(httpProxy, {
    upstream: config.services.graph,
    prefix: '/api/v1/graph',
    rewritePrefix: '/api/v1/graph',
    http2: false,
  });

  // Search Service — handles /api/v1/search/*
  app.register(httpProxy, {
    upstream: config.services.search,
    prefix: '/api/v1/search',
    rewritePrefix: '/api/v1/search',
    http2: false,
  });

  // AI Service — handles /api/v1/ai/*
  app.register(httpProxy, {
    upstream: config.services.ai,
    prefix: '/api/v1/ai',
    rewritePrefix: '/api/v1/ai',
    http2: false,
  });
};
