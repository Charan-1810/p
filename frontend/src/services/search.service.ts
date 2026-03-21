import { apiClient } from '@/lib/api-client';

export interface SearchResult {
  id: string;
  type: 'file' | 'function' | 'class';
  filePath: string;
  name?: string;
  snippet?: string;
  language?: string;
  score: number;
}

export const searchService = {
  async search(repoId: string, query: string, type: 'semantic' | 'fulltext' | 'hybrid' = 'hybrid', limit = 20) {
    const res = await apiClient.get(`/search/repos/${repoId}/search`, { params: { q: query, type, limit } });
    return res.data.data as { results: SearchResult[]; total: number };
  },
  async suggestions(repoId: string, prefix: string) {
    const res = await apiClient.get(`/search/repos/${repoId}/suggestions`, { params: { prefix } });
    return res.data.data.suggestions as string[];
  },
};
