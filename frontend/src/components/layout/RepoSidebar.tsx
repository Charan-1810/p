'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Brain, FileCode, GitFork, Search, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui.store';

interface RepoSidebarProps { repoId: string; repoName?: string; }

const navItems = [
  { href: '', label: 'Overview', icon: LayoutGrid, exact: true },
  { href: '/results', label: 'Results', icon: Zap, exact: false },
  { href: '/files', label: 'Files', icon: FileCode, exact: false },
  { href: '/graph', label: 'Graph', icon: GitFork, exact: false },
  { href: '/ai', label: 'AI Chat', icon: Brain, exact: false },
  { href: '/search', label: 'Search', icon: Search, exact: false },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, exact: false },
];

export function RepoSidebar({ repoId, repoName }: RepoSidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen } = useUiStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-40 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Repository</p>
        <p className="text-sm text-white font-medium truncate mt-1">{repoName ?? repoId}</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const to = `/repos/${repoId}${href}`;
          const isActive = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={label}
              href={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1',
                isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
