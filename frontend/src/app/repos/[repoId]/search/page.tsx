'use client';

import { Navbar } from '@/components/layout/Navbar';
import { RepoSidebar } from '@/components/layout/RepoSidebar';
import { SearchBar } from '@/components/SearchBar';
import { useRepo } from '@/hooks/useRepo';
import { useUiStore } from '@/store/ui.store';

interface Params { repoId: string }

export default function SearchPage({ params }: { params: Params }) {
  const { repoId } = params;
  const { data: repo } = useRepo(repoId);
  const { sidebarOpen } = useUiStore();

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <RepoSidebar repoId={repoId} repoName={repo?.fullName} />

      <div className={`pt-14 transition-all ${sidebarOpen ? 'pl-56' : 'pl-0'}`}>
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-xl font-bold text-white mb-6">Search Codebase</h1>
          <SearchBar repoId={repoId} />
        </div>
      </div>
    </div>
  );
}
