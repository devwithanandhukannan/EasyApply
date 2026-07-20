'use client';

import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { FcmProvider } from '../contexts/FcmContext';
import { ToastProvider } from '../components/GlassToastContainer'; // ⚡ ടോസ്റ്റ് പ്രൊവൈഡർ ഇമ്പോർട്ട് ചെയ്യുക

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <ToastProvider>
      <FcmProvider>
        <div className="min-h-screen bg-black text-zinc-200 font-sans antialiased flex">
          {/* Structural Nav Layer */}
          <Sidebar user={user} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          
          {/* Content Stream Pipeline */}
          <main className={`flex-1 min-w-0 overflow-y-auto transition-all duration-300 pt-14 md:pt-0 ${
            isCollapsed ? 'md:pl-20' : 'md:pl-64'
          }`}>
            <div className="p-5 sm:p-8 max-w-5xl mx-auto w-full min-h-screen">
              {children}
            </div>
          </main>
        </div>
      </FcmProvider>
    </ToastProvider>
  );
}