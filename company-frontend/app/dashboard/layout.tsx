'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import CompanySidebar from '@/app/components/CompanySidebar';

export default function CompanyDashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, company } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border border-zinc-800 border-t-white"></div>
          <p className="text-xs text-zinc-500 font-mono">Loading active profile matrix...</p>
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
    <div className="flex h-screen bg-black overflow-hidden">
      <CompanySidebar company={companyData} />
      <main className="flex-1 overflow-y-auto bg-black">
        <div className="p-6 md:p-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}