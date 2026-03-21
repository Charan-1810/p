import { query, queryOne } from '@ace/shared';

interface UserRow {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: 'admin' | 'user';
  github_id: string | null;
  github_username: string | null;
  github_access_token: string | null;
  email_verified: boolean;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

interface CreateUserInput {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
  githubId?: string;
  githubUsername?: string;
  githubAccessToken?: string;
  avatarUrl?: string;
}

const mapRow = (row: UserRow) => ({
  id: row.id,
  email: row.email,
  username: row.username,
  displayName: row.display_name,
  avatarUrl: row.avatar_url ?? undefined,
  role: row.role,
  githubId: row.github_id ?? undefined,
  githubUsername: row.github_username ?? undefined,
  githubAccessToken: row.github_access_token ?? undefined,
  emailVerified: row.email_verified,
  passwordHash: row.password_hash,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class UserRepository {
  async findById(id: string) {
    const row = await queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    return row ? mapRow(row) : null;
  }

  async findByEmail(email: string) {
    const row = await queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
    return row ? mapRow(row) : null;
  }

  async findByUsername(username: string) {
    const row = await queryOne<UserRow>('SELECT * FROM users WHERE username = $1', [username]);
    return row ? mapRow(row) : null;
  }

  async findByGithubId(githubId: string) {
    const row = await queryOne<UserRow>(
      'SELECT * FROM users WHERE github_id = $1',
      [githubId]
    );
    return row ? mapRow(row) : null;
  }

  async create(input: CreateUserInput) {
    const row = await queryOne<UserRow>(
      `INSERT INTO users (
        id, email, username, display_name, password_hash, role,
        email_verified, github_id, github_username, github_access_token, avatar_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        input.id,
        input.email,
        input.username,
        input.displayName,
        input.passwordHash,
        input.role,
        input.emailVerified,
        input.githubId ?? null,
        input.githubUsername ?? null,
        input.githubAccessToken ?? null,
        input.avatarUrl ?? null,
      ]
    );
    return mapRow(row!);
  }

  async update(id: string, data: { displayName?: string; avatarUrl?: string }) {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.displayName !== undefined) {
      setClauses.push(`display_name = $${idx++}`);
      values.push(data.displayName);
    }
    if (data.avatarUrl !== undefined) {
      setClauses.push(`avatar_url = $${idx++}`);
      values.push(data.avatarUrl);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const row = await queryOne<UserRow>(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return mapRow(row!);
  }

  async updateGithubInfo(
    id: string,
    data: {
      githubId: string;
      githubUsername: string;
      githubAccessToken: string;
      avatarUrl?: string;
    }
  ) {
    const row = await queryOne<UserRow>(
      `UPDATE users
       SET github_id = $1, github_username = $2, github_access_token = $3,
           avatar_url = COALESCE($4, avatar_url), updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [data.githubId, data.githubUsername, data.githubAccessToken, data.avatarUrl ?? null, id]
    );
    return mapRow(row!);
  }

  async updateLastLogin(id: string) {
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  }
}
