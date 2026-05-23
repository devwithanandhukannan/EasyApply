'use client';
import CompanySidebar from '@/app/components/CompanySidebar';
import { useAuth } from '@/app/contexts/AuthContext.tsx';

export default function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <CompanySidebar company={user} />
      <main className="flex-1 ml-0 md:ml-72 overflow-y-auto">
        <div className="p-4 md:p-8 mt-16 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}