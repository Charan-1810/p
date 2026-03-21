'use client';

import { motion } from 'framer-motion';

interface BadgeProps {
  icon?: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'success';
}

export function Badge({ icon, label, variant = 'primary' }: BadgeProps) {
  const variants = {
    primary: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    secondary: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    success: 'bg-green-500/20 text-green-300 border-green-500/30',
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${variants[variant]}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </motion.div>
  );
}
