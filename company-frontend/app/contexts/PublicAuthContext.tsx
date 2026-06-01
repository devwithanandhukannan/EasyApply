// app/contexts/PublicAuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { publicAPI } from '@/app/lib/api/public';

interface PublicUser {
  userId: string;
  fullName: string;
  email: string;
  globalRoles: number;
  jobSeekerProfileId: string;
}

interface PublicAuthContextType {
  isAuthenticated: boolean;
  user: PublicUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PublicAuthContext = createContext<PublicAuthContextType | undefined>(undefined);

export function PublicAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await publicAPI.getCurrentUser();
      if (res.success && res.isAuthenticated) {
        setIsAuthenticated(true);
        setUser(res.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <PublicAuthContext.Provider value={{ isAuthenticated, user, loading, refresh }}>
      {children}
    </PublicAuthContext.Provider>
  );
}

export function usePublicAuth() {
  const context = useContext(PublicAuthContext);
  if (!context) {
    throw new Error('usePublicAuth must be used within PublicAuthProvider');
  }
  return context;
}