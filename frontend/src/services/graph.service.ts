import { apiClient } from '@/lib/api-client';

export interface GraphNode {
  id: string;
  type: string;
  name: string;
  filePath?: string;
  language?: string;
  linesOfCode?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const graphService = {
  async getGraph(repoId: string) {
    const res = await apiClient.get(`/graph/repos/${repoId}`);
    return res.data.data as DependencyGraph;
  },
  async buildGraph(repoId: string) {
    const res = await apiClient.post(`/graph/repos/${repoId}/build`);
    return res.data.data;
  },
  async getImportChain(repoId: string, fileId: string, depth = 3) {
    const res = await apiClient.get(`/graph/repos/${repoId}/files/${fileId}/imports`, { params: { depth } });
    return res.data.data as DependencyGraph;
  },
};
