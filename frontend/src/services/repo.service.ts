import { apiClient } from '@/lib/api-client';

export interface Repository {
  id: string;
  fullName: string;
  description?: string;
  language?: string;
  stars: number;
  status: string;
  analysisProgress?: number;
  errorMessage?: string;
  createdAt: string;
  analyzedAt?: string;
}

export interface RepoStats {
  totalFiles: number;
  totalFunctions: number;
  totalClasses: number;
  totalLines: number;
  languages: Array<{ language: string; count: number; percentage: number }>;
}

export const repoService = {
  async listRepos(page = 1, limit = 20) {
    const res = await apiClient.get('/repos', { params: { page, limit } });
    return res.data.data as { repos: Repository[]; total: number; page: number };
  },
  async importRepo(githubUrl: string) {
    const res = await apiClient.post('/repos', { url: githubUrl });
    return res.data.data as Repository;
  },
  async getRepo(id: string) {
    const res = await apiClient.get(`/repos/${id}`);
    return res.data.data as Repository;
  },
  async deleteRepo(id: string) {
    await apiClient.delete(`/repos/${id}`);
  },
  async reanalyze(id: string) {
    const res = await apiClient.post(`/repos/${id}/reanalyze`);
    return res.data.data;
  },
  async getStats(id: string) {
    const res = await apiClient.get(`/repos/${id}/stats`);
    return res.data.data as RepoStats;
  },
  async getProgress(id: string) {
    const res = await apiClient.get(`/repos/${id}/analysis/progress`);
    return res.data.data as { progress: number; message: string };
  },
  async getFiles(id: string) {
    const res = await apiClient.get(`/repos/${id}/files`);
    return res.data.data;
  },
  async getFileContent(repoId: string, fileId: string) {
    const res = await apiClient.get(`/repos/${repoId}/files/${fileId}`);
    return res.data.data as { content: string; language: string; filePath: string };
  },
};
