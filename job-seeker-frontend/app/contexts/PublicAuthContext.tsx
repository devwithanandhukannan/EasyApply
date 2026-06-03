'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// Explicitly import your default service wrapper object from the correct file path
import publicAPIService from '@/app/lib/public'; 

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
      // Use publicAPIService containing the clean getCurrentUser mapping method
      const res: any = await publicAPIService.getCurrentUser();
      
      if (res && res.success && res.isAuthenticated) {
        setIsAuthenticated(true);
        setUser(res.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Context initialization auth check error:', error);
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