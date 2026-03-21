'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';

const steps = [
  {
    number: '01',
    title: 'Connect Repository',
    description: 'Paste your GitHub repository URL and let ACE analyze your codebase.',
    icon: '📂',
  },
  {
    number: '02',
    title: 'AI Analysis',
    description: 'Our AI engine processes your code and generates comprehensive insights.',
    icon: '🤖',
  },
  {
    number: '03',
    title: 'Explore Results',
    description: 'Navigate dependency graphs, metrics, and AI-generated insights.',
    icon: '📊',
  },
  {
    number: '04',
    title: 'Take Action',
    description: 'Use insights to improve code quality, reduce complexity, and optimize performance.',
    icon: '⚡',
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            How <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">ACE</span> Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Simple, powerful process to understand any codebase
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 gap-8">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-8 h-full" hover={true} delay={idx * 0.1}>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-600/30 text-2xl">
                      {step.icon}
                    </div>
                  </div>

                  <div className="flex-grow">
                    <div className="text-5xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text mb-2">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/5 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
