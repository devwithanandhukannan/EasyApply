'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface SidebarProps {
  company?: {
    name: string;
    email: string;
    logo?: string;
  };
}

export default function CompanySidebar({ company }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const pathname = usePathname();
  const { logout } = useAuth(); // Now safe to grab globally!

  // Optional: Add window-resize listeners for mobile states if needed
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside className={`bg-white border-r border-gray-200 transition-all ${isCollapsed ? 'w-16' : 'w-64'} hidden md:flex flex-col h-full`}>
      {/* Sidebar Header / Logo */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        {!isCollapsed && <span className="font-bold text-lg text-gray-800">{company?.name || 'Company'}</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 ml-auto"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        <Link 
          href="/dashboard" 
          className={`flex items-center space-x-3 p-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span>📊</span>
          {!isCollapsed && <span>Overview</span>}
        </Link>
        
        <Link 
          href="/dashboard/resumes" 
          className={`flex items-center space-x-3 p-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith('/dashboard/resumes') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <span>📄</span>
          {!isCollapsed && <span>Resumes</span>}
        </Link>
      </nav>

      {/* Sidebar Footer / User Menu */}
      <div className="p-4 border-t border-gray-100 relative">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex flex-col truncate max-w-[150px]">
              <span className="text-sm font-semibold text-gray-700 truncate">{company?.name}</span>
              <span className="text-xs text-gray-400 truncate">{company?.email}</span>
            </div>
          )}
          <button 
            onClick={() => logout()} 
            className="p-2 text-gray-500 hover:text-red-600 rounded hover:bg-red-50"
            title="Log out"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}