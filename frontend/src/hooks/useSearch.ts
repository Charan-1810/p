'use client';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/search.service';

export function useSearch(repoId: string) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'semantic' | 'fulltext' | 'hybrid'>('hybrid');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const timer = { current: 0 };
  const updateQuery = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDebouncedQuery(q), 300);
  }, []);

  const results = useQuery({
    queryKey: ['search', repoId, debouncedQuery, searchType],
    queryFn: () => searchService.search(repoId, debouncedQuery, searchType),
    enabled: !!repoId && debouncedQuery.length >= 2,
  });

  const suggestions = useQuery({
    queryKey: ['suggestions', repoId, query],
    queryFn: () => searchService.suggestions(repoId, query),
    enabled: !!repoId && query.length >= 1 && query.length < 5,
  });

  return { query, updateQuery, searchType, setSearchType, results, suggestions };
}
