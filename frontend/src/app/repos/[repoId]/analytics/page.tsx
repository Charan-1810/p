'use client';

import { Navbar } from '@/components/layout/Navbar';
import { RepoSidebar } from '@/components/layout/RepoSidebar';
import { useRepo, useRepoStats } from '@/hooks/useRepo';
import { useUiStore } from '@/store/ui.store';
import { formatNumber, getLanguageColor } from '@/lib/utils';
import { FileCode, Braces, Box, AlignLeft, Loader2 } from 'lucide-react';

interface Params { repoId: string }

export default function AnalyticsPage({ params }: { params: Params }) {
  const { repoId } = params;
  const { data: repo } = useRepo(repoId);
  const { data: stats, isLoading } = useRepoStats(repoId);
  const { sidebarOpen } = useUiStore();

  const statCards = stats
    ? [
        { icon: FileCode, label: 'Files', value: formatNumber(stats.totalFiles), color: 'text-blue-400' },
        { icon: Braces, label: 'Functions', value: formatNumber(stats.totalFunctions), color: 'text-green-400' },
        { icon: Box, label: 'Classes', value: formatNumber(stats.totalClasses), color: 'text-yellow-400' },
        { icon: AlignLeft, label: 'Lines of code', value: formatNumber(stats.totalLines), color: 'text-purple-400' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <RepoSidebar repoId={repoId} repoName={repo?.fullName} />

      <div className={`pt-14 transition-all ${sidebarOpen ? 'pl-56' : 'pl-0'}`}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-xl font-bold text-white mb-6">Repository Analytics</h1>

          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader2 size={18} className="animate-spin" /> Loading stats...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statCards.map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <Icon size={20} className={`${color} mb-2`} />
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Language breakdown</h2>
                <div className="space-y-3">
                  {stats.languages.map(({ language, count, percentage }) => (
                    <div key={language}>
                      <div className="flex justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getLanguageColor(language) }} />
                          <span className="text-gray-300 capitalize">{language}</span>
                        </div>
                        <span className="text-gray-500">{count} files · {percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: getLanguageColor(language) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
