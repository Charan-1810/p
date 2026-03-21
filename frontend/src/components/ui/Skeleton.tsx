'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  count?: number;
  type?: 'card' | 'text' | 'circle' | 'line';
}

export function Skeleton({
  className = '',
  count = 1,
  type = 'card',
}: SkeletonProps) {
  const skeletonVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const getDefaultStyle = () => {
    switch (type) {
      case 'circle':
        return 'w-12 h-12 rounded-full';
      case 'line':
        return 'h-4 rounded';
      case 'text':
        return 'h-6 rounded';
      case 'card':
      default:
        return 'h-48 rounded-2xl';
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`bg-gradient-to-r from-white/5 to-white/10 ${getDefaultStyle()} ${className}`}
          variants={skeletonVariants}
          animate="animate"
        />
      ))}
    </>
  );
}
