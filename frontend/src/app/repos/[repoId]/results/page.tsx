'use client';

import { Navbar } from '@/components/layout/Navbar';
import { RepoSidebar } from '@/components/layout/RepoSidebar';
import { AnalysisResults } from '@/components/AnalysisResults';
import { AiChat } from '@/components/AiChat';
import { useRepo } from '@/hooks/useRepo';
import { useUiStore } from '@/store/ui.store';
import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Params { repoId: string }

interface ProgressData {
  status: string;
  progress: number;
}

export default function ResultsPage({ params }: { params: Params }) {
  const { repoId } = params;
  const { data: repo, isLoading: repoLoading, refetch: refetchRepo } = useRepo(repoId);
  const { sidebarOpen } = useUiStore();
  const [chatQuestion, setChatQuestion] = useState('');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Poll for analysis progress
  useEffect(() => {
    if (!repoId || !isPolling || !repo) return;

    const pollProgress = async () => {
      try {
        const res = await apiClient.get(`/repos/${repoId}/analysis/progress`);
        const data = res.data.data as ProgressData;
        setProgress(data);

        // Stop polling once analysis is complete
        if (data.status === 'analyzed') {
          setIsPolling(false);
          refetchRepo();
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    // Poll immediately and then every 2 seconds
    pollProgress();
    const interval = setInterval(pollProgress, 2000);

    return () => clearInterval(interval);
  }, [repoId, isPolling, repo, refetchRepo]);

  const handleAskAI = (question: string) => {
    setChatQuestion(question);
    // This will scroll to chat and populate it
    const chatElement = document.getElementById('ai-chat-container');
    if (chatElement) {
      chatElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Show loading state while analysis is in progress
  const isAnalyzing = repo && (repo.status === 'pending' || repo.status === 'cloning' || repo.status === 'parsing' || repo.status === 'embedding' || repo.status === 'graphing');

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <RepoSidebar repoId={repoId} repoName={repo?.fullName} />

      <div className={`pt-14 transition-all ${sidebarOpen ? 'pl-56' : 'pl-0'}`}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">{repo?.fullName}</h1>
          <p className="text-gray-400 mb-8">Analysis Results & Insights</p>

          {isAnalyzing && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Loader2 className="text-blue-400 animate-spin" size={24} />
                <div>
                  <h2 className="text-lg font-semibold text-white">Analyzing Repository</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Status: <span className="font-mono text-blue-400">{repo?.status}</span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progress?.progress ?? 0}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">{progress?.progress ?? 0}% complete</p>

              <div className="mt-6 text-sm text-gray-400">
                <p>This typically takes 1-3 minutes depending on repository size:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                  <li>🔄 Cloning repository from GitHub</li>
                  <li>🔍 Parsing code and extracting functions/classes</li>
                  <li>🧠 Generating AI embeddings</li>
                  <li>🌐 Building knowledge graph</li>
                </ul>
              </div>
            </div>
          )}

          {repo?.status === 'analyzed' && (
            <>
              <div className="flex items-center gap-2 mb-6 text-green-400">
                <CheckCircle size={20} />
                <span className="font-medium">Analysis Complete</span>
              </div>

              {/* Analysis Results with AI Chat */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Results Column */}
                <div className="lg:col-span-2">
                  <AnalysisResults repoId={repoId} onAskAI={handleAskAI} />
                </div>

                {/* AI Chat Sidebar */}
                <div id="ai-chat-container" className="h-[calc(100vh-10rem)] sticky top-20">
                  <div className="h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-800 text-sm font-medium text-white">
                      Ask AI about this code
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <AiChat repoId={repoId} initialQuestion={chatQuestion} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {repo?.status === 'failed' && (
            <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 flex items-center gap-4">
              <AlertCircle className="text-red-400" size={24} />
              <div>
                <h2 className="text-lg font-semibold text-red-400">Analysis Failed</h2>
                <p className="text-red-300 text-sm mt-1">{repo.errorMessage || 'An error occurred during analysis'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
