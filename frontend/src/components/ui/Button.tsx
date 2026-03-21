'use client';

import { motion } from 'framer-motion';
import { buttonVariants, type ButtonVariantProps } from './button.styles';
import { ReactNode } from 'react';

interface ButtonProps extends ButtonVariantProps {
  children: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  whileHover?: any;
  whileTap?: any;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  whileHover,
  whileTap,
}: ButtonProps) {
  const baseStyles = buttonVariants({ variant, size });

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} relative overflow-hidden ${className}`}
      whileHover={whileHover || { scale: 1.05, y: -2 }}
      whileTap={whileTap || { scale: 0.95 }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
      {children}
    </motion.button>
  );
}
