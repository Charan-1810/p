import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  TokenPair,
  JwtPayload,
  getRedis,
  REDIS_KEYS,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  logger,
} from '@ace/shared';
import { UserRepository } from '../repositories/user.repository';
import type { RegisterInput, LoginInput } from '@ace/shared';

const SALT_ROUNDS = 12;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
const REFRESH_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7 days
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';

export class AuthService {
  private readonly repo = new UserRepository();

  async register(input: RegisterInput): Promise<{ user: Omit<User, 'passwordHash' | 'githubAccessToken'>; tokens: TokenPair }> {
    const existingByEmail = await this.repo.findByEmail(input.email);
    if (existingByEmail) {
      throw new ConflictError('An account with this email already exists');
    }

    const existingByUsername = await this.repo.findByUsername(input.username);
    if (existingByUsername) {
      throw new ConflictError('This username is already taken');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await this.repo.create({
      id: uuidv4(),
      email: input.email,
      username: input.username,
      displayName: input.displayName ?? input.username,
      passwordHash,
      role: 'user',
      emailVerified: false,
    });

    const tokens = await this.generateTokenPair(user);
    logger.info({ userId: user.id }, 'New user registered');

    return { user: this.sanitizeUser(user), tokens };
  }

  async login(input: LoginInput): Promise<{ user: Omit<User, 'passwordHash' | 'githubAccessToken'>; tokens: TokenPair }> {
    const user = await this.repo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.repo.updateLastLogin(user.id);
    const tokens = await this.generateTokenPair(user);
    logger.info({ userId: user.id }, 'User logged in');

    return { user: this.sanitizeUser(user), tokens };
  }

  async githubLogin(code: string): Promise<TokenPair> {
    // Exchange code for GitHub access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    const githubToken = tokenResponse.data.access_token as string;
    if (!githubToken) {
      throw new UnauthorizedError('Failed to obtain GitHub access token');
    }

    // Fetch GitHub user profile
    const [profileRes, emailRes] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${githubToken}` },
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${githubToken}` },
      }),
    ]);

    const githubUser = profileRes.data;
    const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
      emailRes.data;
    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email ??
      emails.find((e) => e.verified)?.email ??
      githubUser.email;

    if (!primaryEmail) {
      throw new UnauthorizedError('No verified email found on GitHub account');
    }

    // Upsert user
    let user = await this.repo.findByGithubId(String(githubUser.id));

    if (!user) {
      user = await this.repo.findByEmail(primaryEmail);
    }

    if (user) {
      user = await this.repo.updateGithubInfo(user.id, {
        githubId: String(githubUser.id),
        githubUsername: githubUser.login,
        githubAccessToken: githubToken,
        avatarUrl: githubUser.avatar_url,
      });
    } else {
      let username = githubUser.login.toLowerCase();
      const usernameExists = await this.repo.findByUsername(username);
      if (usernameExists) {
        username = `${username}-${uuidv4().slice(0, 6)}`;
      }

      user = await this.repo.create({
        id: uuidv4(),
        email: primaryEmail,
        username,
        displayName: githubUser.name ?? githubUser.login,
        passwordHash: '',
        role: 'user',
        emailVerified: true,
        githubId: String(githubUser.id),
        githubUsername: githubUser.login,
        githubAccessToken: githubToken,
        avatarUrl: githubUser.avatar_url,
      });
    }

    logger.info({ userId: user.id, method: 'github' }, 'User authenticated via GitHub');
    return this.generateTokenPair(user);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Verify refresh token is stored in Redis (allows revocation)
    const redis = getRedis();
    const stored = await redis.get(REDIS_KEYS.REFRESH_TOKEN(payload.sub));
    if (stored !== refreshToken) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    const user = await this.repo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Invalidate old token
    await redis.del(REDIS_KEYS.REFRESH_TOKEN(payload.sub));

    return this.generateTokenPair(user);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;
      await getRedis().del(REDIS_KEYS.REFRESH_TOKEN(payload.sub));
    } catch {
      // Token was already invalid; logout is idempotent
    }
  }

  async getUserById(userId: string): Promise<Omit<User, 'passwordHash' | 'githubAccessToken'>> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    return this.sanitizeUser(user);
  }

  async updateUser(
    userId: string,
    data: { displayName?: string; avatarUrl?: string }
  ): Promise<Omit<User, 'passwordHash' | 'githubAccessToken'>> {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    const updated = await this.repo.update(userId, data);
    return this.sanitizeUser(updated);
  }

  // ── Private Helpers ───────────────────────────────────────────────────

  private async generateTokenPair(user: { id: string; email: string; role: string }): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as 'admin' | 'user',
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Store refresh token in Redis with TTL
    await getRedis().setex(
      REDIS_KEYS.REFRESH_TOKEN(user.id),
      REFRESH_EXPIRES_SECONDS,
      refreshToken
    );

    return { accessToken, refreshToken, expiresIn: 15 * 60 }; // 15 minutes in seconds
  }

  private sanitizeUser(user: Record<string, unknown>): Omit<User, 'passwordHash' | 'githubAccessToken'> {
    const { passwordHash: _, githubAccessToken: __, ...safe } = user as any;
    return safe;
  }
}
