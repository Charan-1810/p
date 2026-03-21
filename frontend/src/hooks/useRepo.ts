'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repoService } from '@/services/repo.service';

export function useRepos(page = 1) {
  return useQuery({ queryKey: ['repos', page], queryFn: () => repoService.listRepos(page) });
}

export function useRepo(id: string) {
  return useQuery({ queryKey: ['repo', id], queryFn: () => repoService.getRepo(id), enabled: !!id });
}

export function useRepoStats(id: string) {
  return useQuery({ queryKey: ['repo-stats', id], queryFn: () => repoService.getStats(id), enabled: !!id });
}

export function useRepoProgress(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['repo-progress', id],
    queryFn: () => repoService.getProgress(id),
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && data.progress >= 100 ? false : 3000;
    },
  });
}

export function useImportRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (githubUrl: string) => repoService.importRepo(githubUrl),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['repos'] });
    },
  });
}

export function useDeleteRepo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repoService.deleteRepo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['repos'] }),
  });
}

export function useRepoFiles(repoId: string) {
  return useQuery({ queryKey: ['repo-files', repoId], queryFn: () => repoService.getFiles(repoId), enabled: !!repoId });
}

export function useFileContent(repoId: string, fileId: string | null) {
  return useQuery({
    queryKey: ['file-content', repoId, fileId],
    queryFn: () => repoService.getFileContent(repoId, fileId!),
    enabled: !!repoId && !!fileId,
  });
}
