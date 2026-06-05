'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/app/lib/axios';

// Bitwise System Role Flags matching your system specifications
const ROLES = {
  COMPANY_ADMIN: 2,
  COMPANY_HR: 4,
  COMPANY_INTERVIEWER: 8,
  COMPANY_VIEWER: 16,
};

interface WorkspaceSummary {
  companyId: string;
  companyName: string;
  companyRoles: number;
}

interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  rolesMask: number;
  globalRolesMask: number;
  status: string;
  allWorkspaces: WorkspaceSummary[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  company: CompanyDetails | null;
  isAdmin: boolean;
  isHR: boolean;
  isInterviewer: boolean;
  isViewer: boolean;
  login: (payload: { user: any; company: any }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Runtime Bitwise Context Helpers Derived from active mask matrix state
  const rolesMask = user?.rolesMask || 0;
  const isAdmin = (rolesMask & ROLES.COMPANY_ADMIN) === ROLES.COMPANY_ADMIN;
  const isHR = (rolesMask & ROLES.COMPANY_HR) === ROLES.COMPANY_HR;
  const isInterviewer = (rolesMask & ROLES.COMPANY_INTERVIEWER) === ROLES.COMPANY_INTERVIEWER;
  const isViewer = !isAdmin && !isHR && !isInterviewer;

  // Session initialization - runs once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await api.get('/company/auth/session');
        if (response.data.success) {
          setIsAuthenticated(true);

          // Construct explicit profile properties mapping safely from team member payload structures
          setUser({
            id: response.data.user.id,
            userId: response.data.user.id,
            name: response.data.user.name || response.data.company.name.split(' ')[0] + ' Team',
            email: response.data.company.email,
            avatar: null,
            rolesMask: response.data.user.companyRoles,
            globalRolesMask: response.data.user.globalRoles,
            status: 'active',
            allWorkspaces: response.data.user.allWorkspaces || [] // <-- Hydrate the array here
          });

          setCompany(response.data.company);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
        setCompany(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Route protection - runs when auth state or pathname changes
  useEffect(() => {
    if (isLoading) return;

    const publicPaths = ['/', '/login', '/signup', '/accept-invite', '/set-password', '/verify-email'];
    const isPublicPath = publicPaths.includes(pathname);
    const isDashboardPath = pathname.startsWith('/dashboard');

    if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
      router.replace('/dashboard');
    } else if (!isAuthenticated && isDashboardPath) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = (loginPayload: any) => {
    if (loginPayload.user && loginPayload.company) {
      setUser({
        id: loginPayload.user.memberId || loginPayload.user.id,
        userId: loginPayload.user.userId || loginPayload.user.id,
        name: loginPayload.user.name || loginPayload.user.fullName || loginPayload.user.email?.split('@')[0],
        email: loginPayload.user.email,
        avatar: loginPayload.user.avatar || null,
        rolesMask: loginPayload.user.rolesMask || loginPayload.user.roles || 16,
        globalRolesMask: loginPayload.user.globalRolesMask || 1,
        status: loginPayload.user.status || 'active'
      });
      setCompany(loginPayload.company);
    } else {
      // Fallback alignment for plain assignments
      setUser(loginPayload);
    }
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setCompany(null);
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      company,
      isAdmin,
      isHR,
      isInterviewer,
      isViewer,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}