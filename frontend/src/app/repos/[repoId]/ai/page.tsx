'use client';

import { Navbar } from '@/components/layout/Navbar';
import { RepoSidebar } from '@/components/layout/RepoSidebar';
import { AiChat } from '@/components/AiChat';
import { useRepo } from '@/hooks/useRepo';
import { useOnboarding } from '@/hooks/useAi';
import { useUiStore } from '@/store/ui.store';
import { Loader2, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Params { repoId: string }

export default function AiPage({ params }: { params: Params }) {
  const { repoId } = params;
  const { data: repo } = useRepo(repoId);
  const { data: onboarding, isLoading: onboardingLoading } = useOnboarding(repoId);
  const { sidebarOpen } = useUiStore();

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <RepoSidebar repoId={repoId} repoName={repo?.fullName} />

      <div className={`pt-14 transition-all ${sidebarOpen ? 'pl-56' : 'pl-0'} h-[calc(100vh-3.5rem)] flex`}>
        {/* Onboarding guide panel */}
        <div className="w-96 border-r border-gray-800 bg-gray-900 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2 text-sm font-medium text-white">
            <BookOpen size={15} className="text-purple-400" /> Onboarding Guide
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {onboardingLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" /> Generating guide...</div>
            ) : onboarding?.guide ? (
              <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-gray-300 prose-headings:text-white prose-code:text-blue-300">
                {onboarding.guide}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-500 text-sm">Guide not available yet. AI needs to analyze the repository first.</p>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 overflow-hidden">
          <AiChat repoId={repoId} />
        </div>
      </div>
    </div>
  );
}
