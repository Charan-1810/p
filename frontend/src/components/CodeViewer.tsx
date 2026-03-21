'use client';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeViewerProps {
  content: string;
  language?: string;
  filePath?: string;
  height?: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  css: 'css',
  html: 'html',
  json: 'json',
  yaml: 'yaml',
  markdown: 'markdown',
  sql: 'sql',
  shell: 'shell',
};

export function CodeViewer({ content, language = 'plaintext', filePath, height = '100%' }: CodeViewerProps) {
  const monacoLang = LANGUAGE_MAP[language.toLowerCase()] ?? 'plaintext';
  return (
    <div className="flex flex-col h-full bg-gray-950">
      {filePath && (
        <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-400 font-mono bg-gray-900">
          {filePath}
        </div>
      )}
      <div className="flex-1">
        <MonacoEditor
          height={height}
          language={monacoLang}
          value={content}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'off',
            renderLineHighlight: 'line',
            smoothScrolling: true,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
