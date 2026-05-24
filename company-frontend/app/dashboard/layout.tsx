// app/dashboard/layout.tsx
'use client';

import { useAuth } from '@/app/contexts/AuthContext.tsx';
import CompanySidebar from '@/app/components/CompanySidebar';

export default function CompanyDashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white"></div>
          <p className="text-sm text-zinc-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const companyData = {
    name: user?.company?.name || 'Company Workspace',
    email: user?.company?.email || '',
    logoUrl: user?.company?.logoUrl || null,
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