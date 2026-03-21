'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface InsightCardProps {
  title: string;
  value: string | number;
  unit?: string;
  description: string;
  icon?: React.ReactNode;
  severity?: 'success' | 'warning' | 'critical';
  progress?: number;
  delay?: number;
}

export function InsightCard({
  title,
  value,
  unit,
  description,
  icon,
  severity = 'success',
  progress,
  delay = 0,
}: InsightCardProps) {
  const severityColors = {
    success: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  };

  const severityIcons = {
    success: <CheckCircle2 size={24} />,
    warning: <AlertTriangle size={24} />,
    critical: <AlertCircle size={24} />,
  };

  const colors = severityColors[severity];

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      whileInView={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      style={{ originY: 0 }}
    >
      <GlassCard
        className={`p-6 border-l-4 ${colors.border}`}
        hover={true}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
            {icon || severityIcons[severity]}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${colors.text}`}>{value}</span>
            {unit && <span className="text-gray-400">{unit}</span>}
          </div>
        </div>

        {progress !== undefined && (
          <motion.div className="mb-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r from-cyan-500 to-purple-600`}
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: delay + 0.2 }}
                viewport={{ once: true }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{progress}% complete</p>
          </motion.div>
        )}

        <p className="text-sm text-gray-400">{description}</p>
      </GlassCard>
    </motion.div>
  );
}
