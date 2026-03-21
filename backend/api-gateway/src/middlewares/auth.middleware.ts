import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError, JwtPayload } from '@ace/shared';
import { config } from '../config/index';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export const authMiddleware = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    const err = new UnauthorizedError('Missing or invalid Authorization header');
    reply.status(401).send({ success: false, error: { code: err.code, message: err.message } });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;

    // Forward user context to downstream services
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-email'] = payload.email;
    req.headers['x-user-role'] = payload.role;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const err = new UnauthorizedError('Access token has expired');
      reply.status(401).send({ success: false, error: { code: err.code, message: err.message } });
    } else {
      const err = new UnauthorizedError('Invalid access token');
      reply.status(401).send({ success: false, error: { code: err.code, message: err.message } });
    }
  }
};

export const requireRole = (
  roles: Array<'admin' | 'user'>
) => async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (!req.user) {
    const err = new UnauthorizedError();
    reply.status(401).send({ success: false, error: { code: err.code, message: err.message } });
    return;
  }

  if (!roles.includes(req.user.role)) {
    const err = new ForbiddenError();
    reply.status(403).send({ success: false, error: { code: err.code, message: err.message } });
  }
};
