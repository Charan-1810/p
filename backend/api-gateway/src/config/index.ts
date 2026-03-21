export const config = {
  port: parseInt(process.env.API_GATEWAY_PORT ?? '4000', 10),
  host: process.env.API_GATEWAY_HOST ?? '0.0.0.0',
  nodeEnv: process.env.NODE_ENV ?? 'development',

  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim()),

  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),

  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',

  services: {
    auth: process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001',
    repo: process.env.REPO_SERVICE_URL ?? 'http://localhost:4002',
    parser: process.env.PARSER_SERVICE_URL ?? 'http://localhost:4003',
    graph: process.env.GRAPH_SERVICE_URL ?? 'http://localhost:4004',
    search: process.env.SEARCH_SERVICE_URL ?? 'http://localhost:4005',
    ai: process.env.AI_SERVICE_URL ?? 'http://localhost:4006',
  },
} as const;
