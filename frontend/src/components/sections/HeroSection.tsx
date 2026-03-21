'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Github, Zap } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { GitHubOctocat } from '../ui/GitHubOctocat';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left content */}
          <div>
        {/* Badge */}
        <motion.div
          className="flex justify-start mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge icon={<Zap size={14} />} label="AI-Powered Code Analysis" variant="primary" />
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span className="bg-gradient-to-r from-cyan-400 via-white to-purple-600 bg-clip-text text-transparent">
            Understand Your
          </span>
          <br />
          <span className="text-white">Codebase</span>
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
            Like Never Before
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="text-left text-lg md:text-xl text-gray-300 mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Import your GitHub repository and get deep AI-powered insights about code complexity, dependencies, and quality in seconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-start gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <Link href="/register">
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-bold text-lg flex items-center gap-2 hover:shadow-xl hover:shadow-cyan-500/50 transition-shadow"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Analyze Repository <ArrowRight size={20} />
            </motion.button>
          </Link>

          <motion.a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 border-2 border-white/20 text-white rounded-lg font-bold text-lg flex items-center gap-2 hover:bg-white/5 hover:border-white/40 transition-all"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Github size={20} /> Star on GitHub
          </motion.a>
        </motion.div>
          </div>

          {/* Right side - Animated Octocat */}
          <motion.div
            className="flex justify-center items-center"
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <GitHubOctocat />
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-3 gap-4 mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          {[
            { label: '10K+', value: 'Repositories Analyzed' },
            { label: '99.9%', value: 'Accuracy Rate' },
            { label: '<1s', value: 'Response Time' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              className="relative p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm"
              whileHover={{ borderColor: 'rgba(34, 211, 238, 0.3)' }}
            >
              <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                {stat.label}
              </div>
              <div className="text-xs md:text-sm text-gray-400">{stat.value}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
