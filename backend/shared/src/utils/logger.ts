import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
          messageFormat: '[{service}] {msg}',
        },
      }
    : undefined,
  base: {
    service: process.env.SERVICE_NAME ?? 'ace-service',
    env: process.env.NODE_ENV ?? 'development',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.secret',
      '*.accessToken',
      '*.refreshToken',
      '*.githubAccessToken',
    ],
    censor: '[REDACTED]',
  },
});

export const createChildLogger = (bindings: Record<string, unknown>) =>
  logger.child(bindings);
