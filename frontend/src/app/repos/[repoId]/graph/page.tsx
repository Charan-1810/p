'use client';
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { RepoSidebar } from '@/components/layout/RepoSidebar';
import { GraphViewer } from '@/components/GraphViewer';
import { useGraph } from '@/hooks/useGraph';
import { useRepo } from '@/hooks/useRepo';
import { useUiStore } from '@/store/ui.store';
import { Loader2, AlertCircle } from 'lucide-react';
import type { GraphNode } from '@/services/graph.service';

interface Params { repoId: string }

export default function GraphPage({ params }: { params: Params }) {
  const { repoId } = params;
  const { data: repo } = useRepo(repoId);
  const { data: graph, isLoading, error } = useGraph(repoId);
  const { sidebarOpen } = useUiStore();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <RepoSidebar repoId={repoId} repoName={repo?.fullName} />

      <div className={`pt-14 transition-all ${sidebarOpen ? 'pl-56' : 'pl-0'} h-[calc(100vh-3.5rem)] flex`}>
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 size={24} className="animate-spin mr-3" /> Loading graph...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-400">
              <AlertCircle size={20} className="mr-2" /> Failed to load graph
            </div>
          ) : graph ? (
            <GraphViewer graph={graph} onNodeClick={setSelectedNode} />
          ) : null}
        </div>

        {selectedNode && (
          <div className="w-72 border-l border-gray-800 bg-gray-900 p-4 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Node details</h3>
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500 block text-xs">Type</span><span className="text-white">{selectedNode.type}</span></div>
              <div><span className="text-gray-500 block text-xs">Name</span><span className="text-white font-mono">{selectedNode.name}</span></div>
              {selectedNode.filePath && <div><span className="text-gray-500 block text-xs">File</span><span className="text-blue-300 font-mono text-xs break-all">{selectedNode.filePath}</span></div>}
              {selectedNode.language && <div><span className="text-gray-500 block text-xs">Language</span><span className="text-white">{selectedNode.language}</span></div>}
              {selectedNode.linesOfCode != null && <div><span className="text-gray-500 block text-xs">Lines of code</span><span className="text-white">{selectedNode.linesOfCode}</span></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
