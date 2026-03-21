import { apiClient } from '@/lib/api-client';

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { email: string; username: string; password: string; }
export interface AuthResponse {
  user: { id: string; email: string; username: string; role: string; avatarUrl?: string };
  tokens: { accessToken: string; refreshToken: string };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/login', payload);
    return res.data.data;
  },
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/register', payload);
    return res.data.data;
  },
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    await apiClient.post('/auth/logout', { refreshToken });
  },
  async me() {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },
  async exchangeGithubCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await apiClient.post('/auth/github/exchange', { code });
    return res.data.data;
  },
  getGithubLoginUrl(): string {
    return `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/v1/auth/github`;
  },
};
