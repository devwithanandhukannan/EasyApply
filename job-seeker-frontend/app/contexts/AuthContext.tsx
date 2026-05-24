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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setIsAuthenticated(true);
          setUser(response.data.user);
        } else {
          throw new Error();
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && (pathname === '/login' || pathname === '/')) {
      router.replace('/dashboard');
    }

    if (!isAuthenticated && pathname.startsWith('/dashboard')) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      router.push('/login');
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