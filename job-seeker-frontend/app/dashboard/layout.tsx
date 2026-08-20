'use client';

import { useState, Suspense } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { FcmProvider } from '../contexts/FcmContext';
import { ToastProvider } from '../components/GlassToastContainer';
import { ThemeProvider } from '@/app/lib/theme';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <ToastProvider>
      <FcmProvider>
        <div
          className="flex h-screen font-sans antialiased overflow-hidden transition-colors duration-200"
          style={{ backgroundColor: 'var(--bg-base)', color: 'var(--foreground)' }}
        >
          {/* Structural Nav Layer */}
          <Suspense fallback={<aside className="w-64 bg-white dark:bg-[#1c1c1e] shrink-0" />}>
            <Sidebar user={user} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          </Suspense>
          
          {/* Content Stream Pipeline */}
          <main className="flex-1 min-w-0 overflow-y-auto pt-14 md:pt-0 custom-scrollbar">
            <div className="p-4 sm:p-6 lg:p-8 w-full max-w-full">
              {children}
            </div>
          </main>
        </div>
      </FcmProvider>
    </ToastProvider>
  );
}
