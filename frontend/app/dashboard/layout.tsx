'use client';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Sidebar user={user} />
      <main
        className={`transition-all duration-300 min-h-screen ${
          isMobile ? 'pt-16' : 'ml-72'
        }`}
      >
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}