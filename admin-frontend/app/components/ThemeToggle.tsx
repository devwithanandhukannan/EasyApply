'use client';

import React from 'react';
import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { mode, toggleMode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label="Toggle color theme"
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      className={`p-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] transition-all cursor-pointer flex items-center justify-center shadow-xs active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform" />
      ) : (
        <Moon className="w-4 h-4 text-[#0071e3] transition-transform" />
      )}
    </button>
  );
}
