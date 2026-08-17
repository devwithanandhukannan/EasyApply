import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import EasyApplyLogo from '@/app/components/EasyApplyLogo';

/**
 * Sticky header with a subtle background blur that reacts to scroll position.
 * Apple‑style minimalist design.
 */
const Header: React.FC = () => {
  const { scrollY } = useScroll();
  // Map scroll position to a CSS blur string and background opacity string
  const blur = useTransform(scrollY, [0, 200], ['blur(0px)', 'blur(12px)']);
  const bgOpacity = useTransform(scrollY, [0, 200], ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.9)']);

  return (
    <motion.header
      className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 border-b border-white/10 backdrop-blur"
      style={{
        backdropFilter: blur,
        backgroundColor: bgOpacity,
      }}
    >
      <EasyApplyLogo size="md" badge="Seekers" />
      <nav className="hidden md:flex items-center gap-8">
        <button className="text-sm text-gray-600 hover:text-gray-900 transition" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
        <button className="text-sm text-gray-600 hover:text-gray-900 transition" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How It Works</button>
        <button className="text-sm text-gray-600 hover:text-gray-900 transition" onClick={() => window.location.href = '/login'}>Sign In</button>
      </nav>
    </motion.header>
  );
};

export default Header;
