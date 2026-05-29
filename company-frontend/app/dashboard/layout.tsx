'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import CompanySidebar from '@/app/components/CompanySidebar';
import { Menu, Building2 } from 'lucide-react';

export default function CompanyDashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, company } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border border-zinc-900 border-t-zinc-400"></div>
          <p className="text-[11px] text-zinc-500 tracking-wider uppercase font-medium">Synchronizing Workspace Core...</p>
        </div>
      </div>
    );
  }

  const companyData = {
    name: company?.name || 'Company Workspace',
    email: company?.email || '',
    logoUrl: company?.logoUrl || null,
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans text-zinc-200 antialiased">
      {/* Structural Sidebar Drawer */}
      <CompanySidebar 
        company={companyData}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Stream Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Dynamic Mobile Top Header Bar */}
        <header className="flex md:hidden items-center justify-between px-5 h-14 bg-zinc-950 border-b border-zinc-900 shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold tracking-wide text-zinc-200 truncate max-w-[140px] uppercase">
              {companyData.name}
            </span>
          </div>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -mr-2 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-400 active:bg-zinc-900"
          >
            <Menu className="w-4 h-4" />
          </button>
        </header>

        {/* Dynamic Content View Container */}
        <main className="flex-1 overflow-y-auto bg-black custom-scrollbar">
          <div className="p-5 sm:p-8 max-w-7xl mx-auto w-full transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}