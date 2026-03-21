'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  className = '',
  hover = true,
  delay = 0,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -8, scale: 1.02 } : {}}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className={`
        relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl
        hover:bg-white/10 hover:border-white/20 transition-all duration-300
        ${className}
      `}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}
