'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MetricCard } from '../ui/MetricCard';
import { Users, Code2, Zap, TrendingUp } from 'lucide-react';

export function StatsSection() {
  const stats = [
    {
      icon: <Code2 size={28} />,
      label: 'Repositories Analyzed',
      value: '10K+',
    },
    {
      icon: <Users size={28} />,
      label: 'Active Developers',
      value: '50K+',
    },
    {
      icon: <Zap size={28} />,
      label: 'Analysis Speed',
      value: '<1s',
      suffix: 'avg',
    },
    {
      icon: <TrendingUp size={28} />,
      label: 'Accuracy Rate',
      value: '99.9%',
    },
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, idx) => (
            <MetricCard
              key={idx}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              delay={idx * 0.1}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-600/10 backdrop-blur-xl p-12 md:p-16 text-center overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          </div>

          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to analyze your codebase?
          </h2>

          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of developers who are already using ACE to understand their code better.
            Start your free analysis today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-cyan-500/50 transition-shadow whitespace-nowrap"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Free Analysis
              </motion.button>
            </Link>

            <Link href="/">
              <motion.button
                className="px-8 py-4 border-2 border-white/20 text-white rounded-lg font-bold text-lg hover:bg-white/5 hover:border-white/40 transition-all whitespace-nowrap"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                View Documentation
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
