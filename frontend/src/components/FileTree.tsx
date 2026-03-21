'use client';
import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui.store';

export interface FileTreeNode {
  id?: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  language?: string;
  children?: FileTreeNode[];
  linesOfCode?: number;
}

interface FileTreeProps {
  nodes: FileTreeNode[];
  depth?: number;
}

function FileNode({ node, depth = 0 }: { node: FileTreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const { selectedFileId, setSelectedFileId } = useUiStore();
  const isSelected = node.id && selectedFileId === node.id;

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 w-full text-left px-2 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {expanded ? <FolderOpen size={14} className="text-yellow-400" /> : <Folder size={14} className="text-yellow-400" />}
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children?.map((child) => (
          <FileNode key={child.path} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => node.id && setSelectedFileId(node.id)}
      className={cn(
        'flex items-center gap-1.5 w-full text-left px-2 py-1 text-sm rounded transition-colors',
        isSelected ? 'bg-blue-600/30 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-gray-800',
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <File size={13} className={cn(isSelected ? 'text-blue-400' : 'text-gray-500')} />
      <span className="truncate">{node.name}</span>
      {node.linesOfCode != null && (
        <span className="ml-auto text-xs text-gray-600 pr-1">{node.linesOfCode}</span>
      )}
    </button>
  );
}

export function FileTree({ nodes, depth = 0 }: FileTreeProps) {
  return (
    <div className="select-none">
      {nodes.map((node) => (
        <FileNode key={node.path} node={node} depth={depth} />
      ))}
    </div>
  );
}
