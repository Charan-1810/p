'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { RepoSidebar } from '@/components/layout/RepoSidebar';
import { useRepo, useRepoStats, useRepoProgress } from '@/hooks/useRepo';
import { useUiStore } from '@/store/ui.store';
import {
  FileCode, GitFork, Brain, Search, BarChart3,
  Loader2, AlertCircle, CheckCircle, Clock, Star, Zap, Eye,
} from 'lucide-react';
import { formatNumber, getLanguageColor } from '@/lib/utils';

interface Params { repoId: string }

const FEATURES = [
  {
    href: '/files',
    label: 'File Explorer',
    icon: FileCode,
    color: 'text-blue-400',
    description: 'Browse and read source code with syntax highlighting across all files and directories.',
  },
  {
    href: '/graph',
    label: 'Dependency Graph',
    icon: GitFork,
    color: 'text-green-400',
    description: 'Visualize relationships between files and understand import/export dependencies.',
  },
  {
    href: '/search',
    label: 'Code Search',
    icon: Search,
    color: 'text-yellow-400',
    description: 'Search codebase using semantic and full-text search for faster code discovery.',
  },
  {
    href: '/ai',
    label: 'AI Chat',
    icon: Brain,
    color: 'text-purple-400',
    description: 'Ask AI-powered questions about architecture, implementation, and codebase patterns.',
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    color: 'text-red-400',
    description: 'View detailed metrics including language breakdown, files, functions, and complexity.',
  },
];

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  analyzed: { label: 'Analyzed', className: 'text-green-400 bg-green-900/30 border-green-800', icon: CheckCircle },
  failed: { label: 'Failed', className: 'text-red-400 bg-red-900/30 border-red-800', icon: AlertCircle },
  queued: { label: 'Queued', className: 'text-gray-400 bg-gray-800 border-gray-700', icon: Clock },
  cloning: { label: 'Cloning', className: 'text-yellow-400 bg-yellow-900/30 border-yellow-800', icon: Loader2 },
  parsing: { label: 'Parsing', className: 'text-yellow-400 bg-yellow-900/30 border-yellow-800', icon: Loader2 },
  embedding: { label: 'Embedding', className: 'text-yellow-400 bg-yellow-900/30 border-yellow-800', icon: Loader2 },
  graphing: { label: 'Building graph', className: 'text-yellow-400 bg-yellow-900/30 border-yellow-800', icon: Loader2 },
};

export default function RepoOverviewPage({ params }: { params: Params }) {
  const { repoId } = params;
  const { data: repo, isLoading: repoLoading } = useRepo(repoId);
  const { data: stats } = useRepoStats(repoId);
  const { sidebarOpen } = useUiStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'features'>('overview');

  const isProcessing = repo && !['analyzed', 'failed'].includes(repo.status);
  const { data: progress } = useRepoProgress(repoId, !!isProcessing);

  const badge = repo ? (STATUS_BADGE[repo.status] ?? STATUS_BADGE.queued) : null;
  const StatusIcon = badge?.icon ?? Clock;
  const spinning = ['cloning', 'parsing', 'embedding', 'graphing'].includes(repo?.status ?? '');

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <RepoSidebar repoId={repoId} repoName={repo?.fullName} />

      <div className={`pt-14 transition-all ${sidebarOpen ? 'pl-56' : 'pl-0'}`}>
        
        {/* Nike-inspired Hero Section */}
        {!repoLoading && repo && (
          <div className="relative overflow-hidden bg-gradient-to-br from-black via-gray-950 to-black border-b border-gray-900/50">
            <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
                {/* Left side - Text */}
                <div className="flex-1 max-w-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    {badge && (
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${badge.className}`}>
                        <StatusIcon size={16} className={spinning ? 'animate-spin' : ''} />
                        {badge.label}
                      </div>
                    )}
                  </div>
                  
                  <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight tracking-tight mb-4">
                    {repo.fullName}
                  </h1>
                  
                  {repo.description && (
                    <p className="text-xl text-gray-400 leading-relaxed mb-6 max-w-xl">
                      {repo.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    {repo.language && (
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                        <span className="text-gray-300 font-medium">{repo.language}</span>
                      </div>
                    )}
                    {repo.stars > 0 && (
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-400" />
                        <span className="text-gray-300 font-medium">{formatNumber(repo.stars)} stars</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Stats Grid */}
                {stats && (
                  <div className="grid grid-cols-2 gap-4 lg:gap-6">
                    {[
                      { label: 'Files', value: formatNumber(stats.totalFiles), icon: FileCode, color: 'from-blue-600 to-blue-400' },
                      { label: 'Functions', value: formatNumber(stats.totalFunctions), icon: Zap, color: 'from-green-600 to-green-400' },
                      { label: 'Classes', value: formatNumber(stats.totalClasses), icon: Eye, color: 'from-purple-600 to-purple-400' },
                      { label: 'Lines', value: formatNumber(stats.totalLines), icon: Brain, color: 'from-red-600 to-red-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className={`bg-gradient-to-br ${color} bg-opacity-10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center`}>
                        <Icon size={28} className="mx-auto mb-3 text-white/60" />
                        <p className="text-3xl font-black text-white">{value}</p>
                        <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-semibold">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress */}
              {isProcessing && progress && (
                <div className="mt-8 bg-gray-900/50 backdrop-blur-sm border border-yellow-900/30 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-yellow-300 flex items-center gap-2 font-semibold">
                      <Loader2 size={16} className="animate-spin" /> {progress.message}
                    </span>
                    <span className="text-gray-400 text-sm font-bold">{progress.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-500"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {repo.status === 'failed' && (
                <div className="mt-8 bg-red-900/20 border border-red-800/50 rounded-2xl p-6 flex items-start gap-4 text-red-300">
                  <AlertCircle size={20} className="flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-lg">Analysis Failed</p>
                    <p className="text-red-400 mt-2">
                      The repository could not be fully analyzed. Try importing again from the{' '}
                      <Link href="/dashboard" className="underline hover:text-red-200 font-semibold">dashboard</Link>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 border-b border-gray-900/50">
          <div className="flex gap-0">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'results', label: 'Analysis Results', icon: CheckCircle },
              { id: 'features', label: 'Explore Features', icon: Zap },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`px-6 py-4 font-semibold text-sm uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              {repoLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-gray-500" size={32} />
                </div>
              ) : !repo ? (
                <div className="text-center py-12 text-gray-500">Repository not found</div>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Repository Overview</h2>
                    <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-8">
                      <p className="text-gray-300 leading-relaxed">
                        {repo.description || 'No description available for this repository.'}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <span className="px-4 py-2 rounded-full bg-gray-800 text-gray-300 text-sm font-medium">
                          Updated {new Date(repo.analyzedAt || repo.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Analysis Results</h2>
                {stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { icon: FileCode, label: 'Total Files', value: stats.totalFiles, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      { icon: Zap, label: 'Functions', value: stats.totalFunctions, color: 'text-green-400', bg: 'bg-green-500/10' },
                      { icon: Eye, label: 'Classes', value: stats.totalClasses, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                      { icon: Brain, label: 'Lines of Code', value: stats.totalLines, color: 'text-red-400', bg: 'bg-red-500/10' },
                      { icon: GitFork, label: 'Languages', value: (stats as any).languages?.length || 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    ].map(({ icon: Icon, label, value, color, bg }) => (
                      <div key={label} className={`${bg} border border-gray-800/50 rounded-2xl p-8 text-center`}>
                        <Icon size={32} className={`mx-auto mb-4 ${color}`} />
                        <p className="text-4xl font-black text-white">{formatNumber(value)}</p>
                        <p className="text-gray-400 mt-3 font-semibold">{label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">No analysis results available yet</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Explore Codebase Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {FEATURES.map(({ href, label, icon: Icon, color, description }) => (
                    <Link
                      key={href}
                      href={`/repos/${repoId}${href}`}
                      className="group relative bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 hover:border-gray-700 rounded-2xl p-8 transition-all duration-300 overflow-hidden hover:transform hover:scale-105"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gray-800/50 group-hover:bg-gray-700/50 ${color} mb-4 transition-colors`}>
                        <Icon size={28} />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-100 transition-colors">{label}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                        {description}
                      </p>
                      
                      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">
                        Explore
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
