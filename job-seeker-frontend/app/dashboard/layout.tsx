'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { FcmProvider } from '../contexts/FcmContext';
import { ToastProvider } from '../components/GlassToastContainer';
import { ThemeProvider } from '@/app/lib/theme';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <ThemeProvider>
      <ToastProvider>
        <FcmProvider>
          <div className="flex h-screen bg-black text-zinc-200 font-sans antialiased overflow-hidden">
            {/* Structural Nav Layer */}
            <Sidebar user={user} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            
            {/* Content Stream Pipeline */}
            <main className="flex-1 min-w-0 overflow-y-auto pt-14 md:pt-0 custom-scrollbar">
              <div className="p-4 sm:p-6 lg:p-8 w-full max-w-full">
                {children}
              </div>
            </main>
          </div>
        </FcmProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
