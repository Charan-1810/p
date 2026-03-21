'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, GitFork, Trash2, Clock, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useRepos, useImportRepo, useDeleteRepo } from '@/hooks/useRepo';
import { cn, formatNumber } from '@/lib/utils';
import type { Repository } from '@/services/repo.service';

const STATUS_ICONS: Record<string, React.ElementType> = {
  analyzed: CheckCircle,
  failed: AlertCircle,
  cloning: Loader2,
  parsing: Loader2,
  embedding: Loader2,
  graphing: Loader2,
};

function RepoCard({ repo, onDelete }: { repo: Repository; onDelete: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const StatusIcon = STATUS_ICONS[repo.status] ?? Clock;
  const isProcessing = ['cloning', 'parsing', 'embedding', 'graphing', 'queued', 'analyzing', 'pending', 'cloned'].includes(repo.status);
  const isAnalyzed = repo.status === 'analyzed';
  const isFailed = repo.status === 'failed';

  return (
    <Link
      href={`/repos/${repo.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group block"
    >
      <div className={cn(
        'relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 overflow-hidden transition-all duration-300 cursor-pointer',
        isHovered && !isFailed && 'border-teal-500 shadow-2xl shadow-teal-500/20 -translate-y-1',
        isFailed && 'border-red-500/50 shadow-2xl shadow-red-500/20'
      )}>
        {/* Animated background gradient on hover */}
        <div className={cn(
          'absolute inset-0 opacity-0 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent transition-opacity duration-300',
          isHovered && !isFailed && 'opacity-100',
          isFailed && 'from-red-500/10'
        )} />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                'text-lg font-bold text-white truncate group-hover:text-teal-300 transition-colors duration-300',
                isFailed && 'text-red-300'
              )}>
                {repo.fullName}
              </h3>
              {repo.description && (
                <p className="text-sm text-slate-400 mt-2 line-clamp-2 group-hover:text-slate-300 transition-colors">
                  {repo.description}
                </p>
              )}
              {isFailed && repo.errorMessage && (
                <p className="text-sm text-red-400 mt-2">Error: {repo.errorMessage}</p>
              )}
            </div>
            
            <div className={cn(
              'flex flex-col items-end gap-2 flex-shrink-0',
              'text-xs font-medium transition-all duration-300'
            )}>
              <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border', 
                isAnalyzed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : isFailed ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-slate-700/50 border-slate-600 text-slate-300'
              )}>
                <StatusIcon size={12} className={isProcessing ? 'animate-spin' : ''} />
                <span className="capitalize font-semibold">{repo.status}</span>
              </div>
            </div>
          </div>

          {/* Language and stars info */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              {repo.language && (
                <span className="px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 border border-slate-600">
                  {repo.language}
                </span>
              )}
            </div>
            {repo.stars > 0 && (
              <span className="flex items-center gap-1">⭐ {formatNumber(repo.stars)}</span>
            )}
          </div>
        </div>

        {/* Action indicator */}
        {isAnalyzed && (
          <div className="absolute bottom-4 right-4 text-teal-400 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Zap size={16} />
          </div>
        )}

        {/* Delete button overlay */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(repo.id);
            }}
            className="absolute top-4 right-4 z-20 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-lg opacity-0 animate-in fade-in duration-200"
            title="Delete repository"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, error } = useRepos(1);
  const importRepo = useImportRepo();
  const deleteRepo = useDeleteRepo();
  const [githubUrl, setGithubUrl] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    importRepo.mutate(githubUrl, {
      onSuccess: () => {
        setGithubUrl('');
      },
      onError: (err) => {
        console.error('Import error:', err);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Animations */}
        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.98);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .animate-slide-up {
            animation: slideUp 0.6s ease-out backwards;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out backwards;
          }
          
          .animate-scale-in {
            animation: scaleIn 0.5s ease-out backwards;
          }
          
          .stagger-1 { animation-delay: 0.1s; }
          .stagger-2 { animation-delay: 0.2s; }
          .stagger-3 { animation-delay: 0.3s; }
        `}</style>

        {/* Hero section */}
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4 bg-gradient-to-r from-teal-200 via-cyan-200 to-blue-200 bg-clip-text text-transparent">
            Your Code Journey
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl">
            Import repositories, analyze code structure, and explore your codebase with AI-powered insights
          </p>
        </div>

        {/* Import form section */}
        <div className="mb-16 animate-slide-up stagger-1">
          <div className="relative">
            {/* Form container with gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <form onSubmit={handleImport} className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <GitFork size={24} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Import New Repository</h2>
              </div>
              
              <p className="text-sm text-slate-400 mb-6">
                Paste a GitHub repository URL to start analyzing and exploring your code
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 bg-slate-800/50 text-white text-base rounded-2xl px-6 py-4 outline-none border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 placeholder-slate-500 font-mono transition-all duration-300"
                />
                <button
                  type="submit"
                  disabled={importRepo.isPending || !githubUrl.trim()}
                  className={cn(
                    'px-8 py-4 rounded-2xl font-semibold text-white text-base transition-all duration-300 flex items-center gap-2 whitespace-nowrap',
                    importRepo.isPending || !githubUrl.trim()
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-2xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105'
                  )}
                >
                  {importRepo.isPending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Import</span>
                    </>
                  )}
                </button>
              </div>

              {importRepo.isError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">
                    {(importRepo.error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Import failed. Please try again.'}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Previously Imported Repos Section */}
        {!isLoading && data?.repos && data.repos.length > 0 && (
          <div className="mb-16 animate-slide-up stagger-2">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Your Repository Collection</h2>
              <p className="text-slate-400">
                {data.repos.length} {data.repos.length === 1 ? 'repository' : 'repositories'} • Click any to explore
              </p>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 h-48 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.repos.map((repo, index) => (
                  <div key={repo.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.08}s` }}>
                    <RepoCard repo={repo} onDelete={(id) => deleteRepo.mutate(id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && data?.repos?.length === 0 && (
          <div className="text-center py-20 animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-6">
              <GitFork size={32} className="text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No repositories yet</h3>
            <p className="text-slate-400 mb-8 max-w-md">
              Get started by importing your first GitHub repository above to analyze code structure and explore with AI insights
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-400">
              <Plus size={16} />
              <span className="text-sm">Import your first repo to begin</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
