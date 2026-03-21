import { FastifyPluginAsync } from 'fastify';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ValidationError,
  getRedis,
  UnauthorizedError,
} from '@ace/shared';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

// Redis TTLs (seconds)
const OAUTH_STATE_TTL = 10 * 60;   // 10 minutes
const OAUTH_CODE_TTL  = 5 * 60;    // 5 minutes

export const authRouter: FastifyPluginAsync = async (app) => {
  // ── POST /register ──────────────────────────────────────────────────────
  app.post('/register', async (req, reply) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.flatten();
      throw new ValidationError('Validation failed', details.fieldErrors);
    }
    const result = await authService.register(parsed.data);
    return reply.status(201).send({ success: true, data: result });
  });

  // ── POST /login ─────────────────────────────────────────────────────────
  app.post('/login', async (req, reply) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
    }
    const result = await authService.login(parsed.data);
    return reply.send({ success: true, data: result });
  });

  // ── POST /refresh ───────────────────────────────────────────────────────
  app.post('/refresh', async (req, reply) => {
    const parsed = RefreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', parsed.error.flatten().fieldErrors);
    }
    const result = await authService.refreshTokens(parsed.data.refreshToken);
    return reply.send({ success: true, data: result });
  });

  // ── POST /logout ────────────────────────────────────────────────────────
  app.post('/logout', async (req, reply) => {
    const parsed = RefreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body');
    }
    await authService.logout(parsed.data.refreshToken);
    return reply.send({ success: true, data: { message: 'Logged out successfully' } });
  });

  // ── GET /github ─────────────────────────────────────────────────────────
  app.get('/github', async (_req, reply) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const callbackUrl = process.env.GITHUB_CALLBACK_URL;
    const scope = 'read:user user:email repo';

    // Generate a cryptographically random state value and persist it in Redis
    // so the callback can verify it (prevents CSRF attacks).
    const state = randomBytes(32).toString('hex');
    await getRedis().set(`oauth_state:${state}`, '1', 'EX', OAUTH_STATE_TTL);

    const githubAuthUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl ?? '')}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${state}`;

    return reply.redirect(githubAuthUrl);
  });

  // ── GET /github/callback ────────────────────────────────────────────────
  app.get('/github/callback', async (req, reply) => {
    const { code, state } = req.query as { code?: string; state?: string };

    // Verify the state to protect against CSRF attacks.
    if (!state) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing OAuth state parameter' },
      });
    }
    const redis = getRedis();
    const stateKey = `oauth_state:${state}`;
    const stored = await redis.get(stateKey);
    if (!stored) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid or expired OAuth state' },
      });
    }
    // Consume the state — one-time use only.
    await redis.del(stateKey);

    if (!code) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'GitHub OAuth code is required' },
      });
    }

    const result = await authService.githubLogin(code);

    // Issue a short-lived one-time code that the frontend will exchange for tokens.
    // This avoids placing long-lived tokens in the URL (browser history / server logs).
    const oauthCode = randomBytes(32).toString('hex');
    await redis.set(
      `oauth_code:${oauthCode}`,
      JSON.stringify({ accessToken: result.accessToken, refreshToken: result.refreshToken }),
      'EX',
      OAUTH_CODE_TTL,
    );

    const frontendUrl = process.env.FRONTEND_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return reply.redirect(`${frontendUrl}/auth/callback?code=${oauthCode}`);
  });

  // ── POST /github/exchange ────────────────────────────────────────────────
  // Exchanges the short-lived one-time OAuth code for real access/refresh tokens.
  app.post('/github/exchange', async (req, reply) => {
    const ExchangeSchema = z.object({ code: z.string().min(1) });
    const parsed = ExchangeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', parsed.error.flatten().fieldErrors);
    }

    const redis = getRedis();
    const raw = await redis.get(`oauth_code:${parsed.data.code}`);
    if (!raw) {
      throw new UnauthorizedError('OAuth code is invalid or has already been used');
    }
    // Consume the code — one-time use only.
    await redis.del(`oauth_code:${parsed.data.code}`);

    const tokens = JSON.parse(raw) as { accessToken: string; refreshToken: string };
    return reply.send({ success: true, data: tokens });
  });

  // ── GET /me ─────────────────────────────────────────────────────────────
  app.get('/me', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    const user = await authService.getUserById(userId);
    return reply.send({ success: true, data: user });
  });

  // ── PATCH /me ────────────────────────────────────────────────────────────
  app.patch('/me', async (req, reply) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    const UpdateSchema = z.object({
      displayName: z.string().min(1).max(100).trim().optional(),
      avatarUrl: z.string().url().optional(),
    });
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
    }
    const user = await authService.updateUser(userId, parsed.data);
    return reply.send({ success: true, data: user });
  });
};
