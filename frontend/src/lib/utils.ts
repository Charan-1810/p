import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function getLanguageColor(lang: string): string {
  const colors: Record<string, string> = {
    javascript: '#f1e05a',
    typescript: '#3178c6',
    python: '#3572A5',
    java: '#b07219',
    go: '#00ADD8',
    rust: '#dea584',
    ruby: '#701516',
    css: '#563d7c',
    html: '#e34c26',
    markdown: '#083fa1',
  };
  return colors[lang.toLowerCase()] ?? '#8b949e';
}
