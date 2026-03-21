'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analyze', href: '/analyze' },
    { label: 'Insights', href: '/insights' },
  ];

  return (
    <motion.nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/40 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-white font-black text-lg">A</span>
          </motion.div>
          <span className="text-white font-black hidden sm:block text-lg">ACE</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <motion.div key={item.label} whileHover={{ y: -2 }}>
              <Link
                href={item.href}
                className="text-gray-300 hover:text-white text-sm font-medium relative group"
              >
                {item.label}
                <motion.div
                  className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-600"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <motion.a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-300 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Github size={20} />
          </motion.a>

          <motion.button
            className="hidden sm:block px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In
          </motion.button>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="lg:hidden bg-black/50 backdrop-blur-xl border-t border-white/10"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-6 py-4 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block text-gray-300 hover:text-white text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button className="w-full px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-semibold text-sm mt-4">
            Sign In
          </button>
        </div>
      </motion.div>
    </motion.nav>
  );
}
