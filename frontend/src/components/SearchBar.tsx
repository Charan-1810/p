'use client';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { cn, getLanguageColor } from '@/lib/utils';

interface SearchBarProps { repoId: string; onResultClick?: (filePath: string, fileId?: string) => void; }

export function SearchBar({ repoId, onResultClick }: SearchBarProps) {
  const { query, updateQuery, searchType, setSearchType, results } = useSearch(repoId);

  return (
    <div className="relative w-full">
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Search files, functions, classes..."
            className="w-full bg-gray-800 text-white text-sm rounded-lg pl-9 pr-8 py-2 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
          />
          {query && (
            <button onClick={() => updateQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as 'hybrid' | 'semantic' | 'fulltext')}
          className="bg-gray-800 text-gray-300 text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="hybrid">Hybrid</option>
          <option value="semantic">Semantic</option>
          <option value="fulltext">Full-text</option>
        </select>
      </div>

      {results.data?.results && results.data.results.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500">{results.data.total} results</p>
          {results.data.results.map((r) => (
            <button
              key={r.id}
              onClick={() => onResultClick?.(r.filePath, r.id)}
              className="w-full text-left bg-gray-800 hover:bg-gray-750 rounded-lg px-3 py-2.5 transition-colors border border-transparent hover:border-gray-700"
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span
                  className={cn('px-1.5 py-0.5 rounded text-white text-[10px] font-medium')}
                  style={{ backgroundColor: r.type === 'file' ? '#3b82f6' : r.type === 'function' ? '#10b981' : '#f59e0b' }}
                >
                  {r.type}
                </span>
                {r.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLanguageColor(r.language) }} />
                    {r.language}
                  </span>
                )}
              </div>
              <p className="text-sm text-white font-medium truncate">{r.name ?? r.filePath.split('/').pop()}</p>
              <p className="text-xs text-gray-500 truncate font-mono mt-0.5">{r.filePath}</p>
              {r.snippet && <p className="text-xs text-gray-400 mt-1 line-clamp-2 font-mono">{r.snippet}</p>}
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && results.data?.results?.length === 0 && !results.isFetching && (
        <p className="text-sm text-gray-500 text-center py-8">No results for "{query}"</p>
      )}
    </div>
  );
}
