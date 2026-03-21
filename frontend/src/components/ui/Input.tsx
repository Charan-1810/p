'use client';

import { motion } from 'framer-motion';
import { useState, ReactNode } from 'react';

interface InputProps {
  placeholder?: string;
  icon?: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  error?: string;
}

export function Input({
  placeholder,
  icon,
  value,
  onChange,
  onFocus,
  onBlur,
  className = '',
  error,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <motion.div
        className={`relative rounded-xl border transition-all duration-300 ${
          isFocused
            ? 'border-cyan-500/50 bg-white/10 shadow-lg shadow-cyan-500/20'
            : 'border-white/10 bg-white/5'
        }`}
        animate={{ boxShadow: isFocused ? '0 0 30px rgba(34, 211, 238, 0.2)' : 'none' }}
      >
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          className={`
            w-full bg-transparent py-4 text-white placeholder-gray-500 outline-none
            ${icon ? 'pl-12 pr-4' : 'px-4'}
            ${className}
          `}
        />
      </motion.div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </motion.div>
  );
}
