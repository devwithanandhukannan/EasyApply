// app/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/app/lib/axios';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Session initialization - runs once on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await api.get('/company/auth/session');
        
        if (response.data.success) {
          setIsAuthenticated(true);
          setUser({
            ...response.data.user,
            company: response.data.company
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - runs once

  // Route protection - runs when auth state or pathname changes
  useEffect(() => {
    if (isLoading) return; // Don't redirect while loading

    const publicPaths = ['/', '/login', '/signup'];
    const isPublicPath = publicPaths.includes(pathname);
    const isDashboardPath = pathname.startsWith('/dashboard');

    if (isAuthenticated && isPublicPath) {
      router.replace('/dashboard');
    } else if (!isAuthenticated && isDashboardPath) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, pathname]); // Removed router from deps

  const login = (loginPayload: any) => {
    if (loginPayload.user && loginPayload.company) {
      setUser({ ...loginPayload.user, company: loginPayload.company });
    } else {
      setUser(loginPayload);
    }
    setIsAuthenticated(true);
    // Navigation is handled by useEffect
  };

  const logout = async () => {
    try {
      await api.post('/company/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}