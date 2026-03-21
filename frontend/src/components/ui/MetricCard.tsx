'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  delay?: number;
}

export function MetricCard({
  icon,
  label,
  value,
  suffix = '',
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 text-cyan-400">
          {icon}
        </div>
      </div>
      
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-white">{value}</span>
        {suffix && <span className="text-lg text-gray-400">{suffix}</span>}
      </div>
    </motion.div>
  );
}
