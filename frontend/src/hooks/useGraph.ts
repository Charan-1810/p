'use client';
import { useQuery } from '@tanstack/react-query';
import { graphService } from '@/services/graph.service';

export function useGraph(repoId: string) {
  return useQuery({
    queryKey: ['graph', repoId],
    queryFn: () => graphService.getGraph(repoId),
    enabled: !!repoId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useImportChain(repoId: string, fileId: string | null, depth = 3) {
  return useQuery({
    queryKey: ['import-chain', repoId, fileId, depth],
    queryFn: () => graphService.getImportChain(repoId, fileId!, depth),
    enabled: !!repoId && !!fileId,
  });
}
