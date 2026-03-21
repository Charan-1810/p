'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
    >
      {/* Gradient accent on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative">
        {/* Icon */}
        <motion.div
          className="mb-6 inline-block p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 text-cyan-400 group-hover:text-cyan-300"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 leading-relaxed text-sm">
          {description}
        </p>

        {/* Bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"
          initial={{ width: 0 }}
          whileHover={{ width: '40px' }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </motion.div>
  );
}
