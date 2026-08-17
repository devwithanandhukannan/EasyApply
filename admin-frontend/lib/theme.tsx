'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bgBase: string;
  bgSurface: string;
  bgSurfaceHover: string;
  bgGlass: string;
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryGlow: string;
  colorSecondary: string;
  borderSubtle: string;
  borderDefault: string;
  borderFocus: string;
  gradientPrimary: string;
  gradientCard: string;
  textColor: string;
  textMuted: string;
}

export const THEME_CONFIG: Record<ThemeMode, ThemeColors> = {
  dark: {
    bgBase: '#05070e',
    bgSurface: 'rgba(15, 18, 33, 0.75)',
    bgSurfaceHover: 'rgba(25, 30, 55, 0.85)',
    bgGlass: 'rgba(10, 14, 28, 0.65)',
    colorPrimary: '#6366f1',
    colorPrimaryHover: '#4f46e5',
    colorPrimaryGlow: 'rgba(99, 102, 241, 0.28)',
    colorSecondary: '#8b5cf6',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderDefault: 'rgba(99, 102, 241, 0.25)',
    borderFocus: '#6366f1',
    gradientPrimary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    gradientCard: 'linear-gradient(180deg, rgba(99, 102, 241, 0.06) 0%, rgba(10, 14, 28, 0.8) 100%)',
    textColor: '#f0f4ff',
    textMuted: '#94a3b8'
  },
  light: {
    bgBase: '#f8fafc',
    bgSurface: '#ffffff',
    bgSurfaceHover: '#f1f5f9',
    bgGlass: 'rgba(255, 255, 255, 0.85)',
    colorPrimary: '#4f46e5',
    colorPrimaryHover: '#4338ca',
    colorPrimaryGlow: 'rgba(79, 70, 229, 0.15)',
    colorSecondary: '#7c3aed',
    borderSubtle: 'rgba(0, 0, 0, 0.08)',
    borderDefault: 'rgba(79, 70, 229, 0.25)',
    borderFocus: '#4f46e5',
    gradientPrimary: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    gradientCard: 'linear-gradient(180deg, rgba(79, 70, 229, 0.04) 0%, rgba(255, 255, 255, 0.95) 100%)',
    textColor: '#0f172a',
    textMuted: '#64748b'
  }
};

export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const colors = THEME_CONFIG[mode];

  root.style.setProperty('--bg-base', colors.bgBase);
  root.style.setProperty('--bg-surface', colors.bgSurface);
  root.style.setProperty('--bg-surface-hover', colors.bgSurfaceHover);
  root.style.setProperty('--bg-glass', colors.bgGlass);
  root.style.setProperty('--color-primary', colors.colorPrimary);
  root.style.setProperty('--color-primary-hover', colors.colorPrimaryHover);
  root.style.setProperty('--color-primary-glow', colors.colorPrimaryGlow);
  root.style.setProperty('--color-secondary', colors.colorSecondary);
  root.style.setProperty('--border-subtle', colors.borderSubtle);
  root.style.setProperty('--border-default', colors.borderDefault);
  root.style.setProperty('--border-focus', colors.borderFocus);
  root.style.setProperty('--gradient-primary', colors.gradientPrimary);
  root.style.setProperty('--gradient-card', colors.gradientCard);
  root.style.setProperty('--text', colors.textColor);
  root.style.setProperty('--muted', colors.textMuted);

  if (mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', mode);
}

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  setMode: () => {},
  toggleMode: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('easyapply_theme_mode') as ThemeMode;
      if (savedMode === 'dark' || savedMode === 'light') {
        setModeState(savedMode);
        applyThemeMode(savedMode);
      } else {
        applyThemeMode('dark');
      }
    } catch {
      applyThemeMode('dark');
    }
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    applyThemeMode(newMode);
    try {
      localStorage.setItem('easyapply_theme_mode', newMode);
    } catch {
      // ignore
    }
  };

  const toggleMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
