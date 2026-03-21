'use client';

import { Navbar } from '@/components/layout/Navbar';
import { RepoSidebar } from '@/components/layout/RepoSidebar';
import { FileTree } from '@/components/FileTree';
import { CodeViewer } from '@/components/CodeViewer';
import { useRepo, useRepoFiles, useFileContent, useRepoProgress } from '@/hooks/useRepo';
import { useUiStore } from '@/store/ui.store';
import { Loader2 } from 'lucide-react';

interface Params { repoId: string }

export default function FilesPage({ params }: { params: Params }) {
  const { repoId } = params;
  const { data: repo } = useRepo(repoId);
  const { data: files } = useRepoFiles(repoId);
  const { selectedFileId, sidebarOpen } = useUiStore();
  const { data: fileContent, isLoading: fileLoading } = useFileContent(repoId, selectedFileId);

  const isProcessing = repo && !['analyzed', 'failed'].includes(repo.status);
  const { data: progress } = useRepoProgress(repoId, !!isProcessing);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <RepoSidebar repoId={repoId} repoName={repo?.fullName} />

      <div className={`pt-14 transition-all ${sidebarOpen ? 'pl-56' : 'pl-0'} flex h-[calc(100vh-3.5rem)]`}>
        {/* File tree panel */}
        <div className="w-64 border-r border-gray-800 flex flex-col bg-gray-900 overflow-y-auto flex-shrink-0">
          <div className="p-3 border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">Files</div>

          {isProcessing && progress && (
            <div className="px-3 py-2 border-b border-gray-800">
              <div className="flex items-center gap-2 text-xs text-yellow-400">
                <Loader2 size={12} className="animate-spin" /> {progress.message}
              </div>
              <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 transition-all" style={{ width: `${progress.progress}%` }} />
              </div>
            </div>
          )}

          {files ? (
            <FileTree nodes={Array.isArray(files) ? files : (files as { tree: never[] }).tree ?? []} />
          ) : isProcessing ? (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
              <Loader2 size={16} className="animate-spin mr-2" /> Analyzing…
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
              No files found
            </div>
          )}
        </div>

        {/* Code viewer */}
        <div className="flex-1 overflow-hidden">
          {fileContent ? (
            <CodeViewer
              content={fileContent.content}
              language={fileContent.language}
              filePath={fileContent.filePath}
            />
          ) : fileLoading ? (
            <div className="flex items-center justify-center h-full text-gray-600">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
              <span className="text-4xl">📄</span>
              <p className="text-sm">Select a file from the tree to view its source</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
