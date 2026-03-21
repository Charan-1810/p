'use client';

import { motion } from 'framer-motion';

export function GitHubOctocat() {
  // Animation variants
  const floatVariants = {
    animate: {
      y: [-20, 20, -20],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const rotateVariants = {
    animate: {
      rotate: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const armWaveVariants = {
    animate: {
      rotate: [0, -20, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const eyeBlinkVariants = {
    animate: {
      scaleY: [1, 0.1, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        times: [0, 0.9, 1],
      },
    },
  };

  return (
    <motion.div
      className="relative w-full max-w-md h-auto"
      variants={floatVariants}
      animate="animate"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      <svg viewBox="0 0 200 240" className="w-full h-auto drop-shadow-2xl">
        {/* Glow effect background */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f0f0f0', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Body */}
        <ellipse cx="100" cy="140" rx="55" ry="65" fill="url(#bodyGradient)" filter="url(#glow)" />

        {/* Head */}
        <circle cx="100" cy="70" r="45" fill="url(#bodyGradient)" filter="url(#glow)" />

        {/* Ears */}
        <circle cx="65" cy="30" r="15" fill="url(#bodyGradient)" filter="url(#glow)" />
        <circle cx="135" cy="30" r="15" fill="url(#bodyGradient)" filter="url(#glow)" />

        {/* Left Eye */}
        <motion.circle
          cx="80"
          cy="65"
          r="8"
          fill="#000"
          variants={eyeBlinkVariants}
          animate="animate"
          transformOrigin="80px 65px"
        />
        <circle cx="82" cy="63" r="2.5" fill="#ffffff" opacity="0.8" />

        {/* Right Eye */}
        <motion.circle
          cx="120"
          cy="65"
          r="8"
          fill="#000"
          variants={eyeBlinkVariants}
          animate="animate"
          transformOrigin="120px 65px"
        />
        <circle cx="122" cy="63" r="2.5" fill="#ffffff" opacity="0.8" />

        {/* Mouth */}
        <path d="M 90 85 Q 100 95 110 85" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Tentacles/Legs - Left */}
        <motion.path
          d="M 75 200 Q 60 220 50 230"
          stroke="#000"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: ['M 75 200 Q 60 220 50 230', 'M 75 200 Q 55 225 45 235', 'M 75 200 Q 60 220 50 230'],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Tentacles/Legs - Center Left */}
        <motion.path
          d="M 85 205 Q 75 225 70 240"
          stroke="#000"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: ['M 85 205 Q 75 225 70 240', 'M 85 205 Q 70 230 65 245', 'M 85 205 Q 75 225 70 240'],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />

        {/* Tentacles/Legs - Right */}
        <motion.path
          d="M 125 205 Q 135 225 140 240"
          stroke="#000"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: ['M 125 205 Q 135 225 140 240', 'M 125 205 Q 140 230 145 245', 'M 125 205 Q 135 225 140 240'],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />

        {/* Tentacles/Legs - Center Right */}
        <motion.path
          d="M 115 200 Q 130 220 140 230"
          stroke="#000"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: ['M 115 200 Q 130 220 140 230', 'M 115 200 Q 135 225 150 235', 'M 115 200 Q 130 220 140 230'],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Left Arm */}
        <motion.g
          animate={{
            rotate: [-10, -30, -10],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          transformOrigin="60px 110px"
        >
          <rect x="35" y="105" width="25" height="15" rx="7" fill="url(#bodyGradient)" filter="url(#glow)" />
          {/* Hand */}
          <circle cx="32" cy="120" r="10" fill="url(#bodyGradient)" filter="url(#glow)" />
        </motion.g>

        {/* Right Arm */}
        <motion.g
          animate={{
            rotate: [10, 30, 10],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          transformOrigin="140px 110px"
        >
          <rect x="140" y="105" width="25" height="15" rx="7" fill="url(#bodyGradient)" filter="url(#glow)" />
          {/* Hand */}
          <circle cx="173" cy="120" r="10" fill="url(#bodyGradient)" filter="url(#glow)" />
        </motion.g>

        {/* GitHub Sparkles/Stars */}
        <motion.circle
          cx="50"
          cy="40"
          r="3"
          fill="#fbbf24"
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0,
          }}
        />
        <motion.circle
          cx="150"
          cy="50"
          r="3"
          fill="#fbbf24"
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.5,
          }}
        />
        <motion.circle
          cx="170"
          cy="120"
          r="2.5"
          fill="#22d3ee"
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 1,
          }}
        />
        <motion.circle
          cx="30"
          cy="100"
          r="2.5"
          fill="#22d3ee"
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 1.5,
          }}
        />
      </svg>
    </motion.div>
  );
}
