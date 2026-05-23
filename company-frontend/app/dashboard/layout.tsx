'use client';

import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import CompanySidebar from '@/app/components/CompanySidebar';

// 1. We create an inner component to safely use the useAuth hook
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading, user } = useAuth();

  // Prevents layout shift/flashing while checking the HTTP cookie
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  // Fallback to empty object if user data isn't ready yet for the sidebar
  const companyData = user?.company || { name: 'Loading...', email: '' };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Pass the authenticated user's company info to the sidebar */}
      <CompanySidebar company={companyData} />
      
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}

// 2. The main layout wraps everything in the Provider boundary
export default function CompanyDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}