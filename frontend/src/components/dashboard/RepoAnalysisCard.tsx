'use client';

import { motion } from 'framer-motion';
import { Github, Star, GitFork as Repo, Eye } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface RepoAnalysisCardProps {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  watchers: number;
  url: string;
  lastUpdated: string;
  owner: string;
  delay?: number;
}

export function RepoAnalysisCard({
  name,
  description,
  language,
  stars,
  forks,
  watchers,
  url,
  lastUpdated,
  owner,
  delay = 0,
}: RepoAnalysisCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
    >
      <GlassCard className="p-6" hover={true}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Github className="w-8 h-8 text-cyan-400" />
            <div>
              <h3 className="text-lg font-bold text-white">{name}</h3>
              <p className="text-sm text-gray-400">{owner}</p>
            </div>
          </div>
          <motion.a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.1 }}
          >
            <Github className="w-5 h-5 text-cyan-400" />
          </motion.a>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>

        {/* Language badge */}
        <div className="mb-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300">
            {language}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-white/10">
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={16} className="text-yellow-400" />
              <span className="text-lg font-bold text-white">{stars}</span>
            </div>
            <p className="text-xs text-gray-400">Stars</p>
          </motion.div>

          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Repo size={16} className="text-purple-400" />
              <span className="text-lg font-bold text-white">{forks}</span>
            </div>
            <p className="text-xs text-gray-400">Forks</p>
          </motion.div>

          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye size={16} className="text-cyan-400" />
              <span className="text-lg font-bold text-white">{watchers}</span>
            </div>
            <p className="text-xs text-gray-400">Watchers</p>
          </motion.div>
        </div>

        <p className="text-xs text-gray-500 mt-4">Updated {lastUpdated}</p>
      </GlassCard>
    </motion.div>
  );
}
