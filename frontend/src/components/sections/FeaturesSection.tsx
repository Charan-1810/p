'use client';

import { motion } from 'framer-motion';
import { FeatureCard } from '../ui/FeatureCard';
import {
  GitFork,
  Brain,
  BarChart3,
  Code2,
  Zap,
  Lock,
} from 'lucide-react';

const features = [
  {
    icon: <GitFork size={28} />,
    title: 'Dependency Graphs',
    description: 'Visualize import and call graphs with Neo4j-powered analysis. Understand code relationships instantly.',
  },
  {
    icon: <Brain size={28} />,
    title: 'AI-Powered Q&A',
    description: 'Ask questions about your codebase and get answers grounded in actual source code analysis.',
  },
  {
    icon: <BarChart3 size={28} />,
    title: 'Complexity Analysis',
    description: 'Get detailed metrics on cyclomatic complexity, maintainability index, and code quality.',
  },
  {
    icon: <Code2 size={28} />,
    title: 'Multi-Language Support',
    description: 'Analyze JavaScript, TypeScript, Python, Go, Java, C++ and more with equal precision.',
  },
  {
    icon: <Zap size={28} />,
    title: 'Instant Insights',
    description: 'Get comprehensive analysis in seconds, not hours. Real-time visualization of your codebase.',
  },
  {
    icon: <Lock size={28} />,
    title: 'Privacy-First',
    description: 'Your code stays private. All analysis happens securely without storing your repository.',
  },
];

export function FeaturesSection() {
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
            <span className="bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to understand, analyze, and improve your codebase
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard
              key={idx}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={idx * 0.1}
            />
          ))}
        </div>
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
