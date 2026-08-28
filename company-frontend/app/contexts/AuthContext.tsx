'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api, { setAccessToken } from '@/app/lib/axios';

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

interface CompanyDetails {
  id: string;
  name: string;
  email: string;
  logoUrl?: string | null;
  industry?: string | null;
  subscription?: {
    id?: string;
    isActive?: boolean;
    features?: Record<string, boolean>;
    plan?: {
      id?: string;
      name?: string;
      features?: Record<string, boolean>;
      maxJobPostings?: number;
      maxTeamMembers?: number;
    };
  } | null;
  [key: string]: any;
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
  permissions?: Record<string, string[]> | null;
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
  features: Record<string, boolean>;
  hasFeature: (key: string) => boolean;
  can: (moduleName: string, action?: string) => boolean;
  login: (payload: any) => void;
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

  const features = useMemo(() => {
    const raw = company?.subscription?.features || company?.subscription?.plan?.features;
    if (raw && typeof raw === 'object') {
      return {
        jobPostings: raw.jobPostings ?? true,
        kanban: raw.kanban ?? true,
        atsScoring: raw.atsScoring ?? true,
        aiResumeScan: raw.aiResumeScan ?? true,
        aiResumeBuilder: raw.aiResumeBuilder ?? true,
        walkinInterview: raw.walkinInterview ?? true,
        seekerDiscovery: raw.seekerDiscovery ?? true,
        crmTalentPool: raw.crmTalentPool ?? true,
        spotJobs: raw.spotJobs ?? true,
        offerLetters: raw.offerLetters ?? true,
        interviewScheduling: raw.interviewScheduling ?? true,
        teamWorkspace: raw.teamWorkspace ?? true,
      };
    }
    return {
      jobPostings: true,
      kanban: true,
      atsScoring: true,
      aiResumeScan: true,
      aiResumeBuilder: true,
      walkinInterview: true,
      seekerDiscovery: true,
      crmTalentPool: true,
      spotJobs: true,
      offerLetters: true,
      interviewScheduling: true,
      teamWorkspace: true,
    };
  }, [company]);

  const hasFeature = (key: string): boolean => {
    return Boolean((features as Record<string, boolean>)[key]);
  };

  const can = (moduleName: string, action: string = 'read'): boolean => {
    if (isAdmin) return true; // Admins have full access
    const userPerms = user?.permissions;

    if (!userPerms) {
      // Fallback matching system role
      if (isHR) {
        if (['jobs', 'walkin', 'interviews', 'talent_pool', 'discovery', 'offers', 'spot_jobs', 'team'].includes(moduleName)) {
          return true;
        }
      }
      if (isInterviewer) {
        if (['interviews', 'walkin', 'talent_pool'].includes(moduleName)) {
          if (['read', 'conduct', 'feedback', 'manage'].includes(action)) return true;
        }
        return action === 'read';
      }
      return action === 'read';
    }

    if (userPerms['*']?.includes('*') || userPerms[moduleName]?.includes('*')) {
      return true;
    }

    const actions = userPerms[moduleName];
    if (!Array.isArray(actions)) return false;
    if (actions.includes('manage')) return true;
    return actions.includes(action);
  };

  // Session initialization - runs once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('companyToken') || localStorage.getItem('token')) : null;
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setCompany(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/company/auth/session');
        if (response.data.success && (response.data.user || response.data.company)) {
          setIsAuthenticated(true);

          const rawUser = response.data.user || {};
          const rawCompany = response.data.company || rawUser.company || {};
          const computedRolesMask = rawUser.rolesMask || rawUser.companyRoles || rawUser.roles || (rawUser.role === 'owner' || rawUser.role === 'admin' ? 2 : 2);

          setUser({
            id: rawUser.id || rawCompany.id,
            userId: rawUser.userId || rawUser.id,
            name: rawUser.name || (rawCompany.name ? rawCompany.name + ' Admin' : 'Company Admin'),
            email: rawUser.email || rawCompany.email,
            avatar: rawUser.avatar || null,
            rolesMask: computedRolesMask,
            globalRolesMask: rawUser.globalRoles || 2,
            status: 'active',
            permissions: rawUser.permissions || null,
            allWorkspaces: rawUser.allWorkspaces || []
          });

          setCompany(rawCompany);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setCompany(null);
        }
      } catch (error: any) {
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

    const publicPaths = ['/', '/login', '/signup', '/accept-invite', '/set-password', '/verify-email', '/forgot-password', '/reset-password'];
    const isPublicPath = publicPaths.includes(pathname);
    const isDashboardPath = pathname.startsWith('/dashboard');

    if (isAuthenticated && (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password')) {
      router.replace('/dashboard');
    } else if (!isAuthenticated && isDashboardPath) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = (loginPayload: any) => {
    const token = loginPayload.token || loginPayload.accessToken;
    if (token) {
      setAccessToken(token);
    }
    const rawUser = loginPayload.user || loginPayload;
    const rawCompany = loginPayload.company || rawUser.company || null;
    const computedRolesMask = rawUser.rolesMask || rawUser.companyRoles || rawUser.roles || (rawUser.role === 'owner' || rawUser.role === 'admin' ? 2 : 2);

    setUser({
      id: rawUser.memberId || rawUser.id,
      userId: rawUser.userId || rawUser.id,
      name: rawUser.name || rawUser.fullName || (rawCompany?.name ? rawCompany.name + ' Admin' : 'Company Admin'),
      email: rawUser.email || rawCompany?.email || '',
      avatar: rawUser.avatar || null,
      rolesMask: computedRolesMask,
      globalRolesMask: rawUser.globalRolesMask || rawUser.globalRoles || 2,
      status: rawUser.status || 'active',
      permissions: rawUser.permissions || null,
      allWorkspaces: rawUser.allWorkspaces || []
    });
    setCompany(rawCompany);
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
      setAccessToken('');
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
      features,
      hasFeature,
      can,
      login,
      logout,
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