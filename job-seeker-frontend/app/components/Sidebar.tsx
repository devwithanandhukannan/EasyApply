'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Briefcase, 
  Calendar, 
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  Search,
  Settings,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Search, label: 'Browse Jobs', href: '/dashboard/jobs' },
    { icon: FileText, label: 'My Resumes', href: '/dashboard/resumes' },
    { icon: Briefcase, label: 'Applied Jobs', href: '/dashboard/applications' },
    { icon: Calendar, label: 'Interviews', href: '/dashboard/interviews' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
  ];

  const handleLogout = () => {
    logout();
  };

  const handleNavClick = () => {
    if (isMobile) {
      setShowMobileMenu(false);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-black border-b border-zinc-900 px-5 flex items-center justify-between z-50 h-16 font-mono">
          <div className="flex items-center space-x-3">
            <div className="w-7 w-7 bg-white rounded flex items-center justify-center">
              <span className="text-black font-bold text-xs tracking-tighter">J</span>
            </div>
            <span className="text-white font-bold text-xs uppercase tracking-widest">JobPortal</span>
          </div>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-1.5 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && showMobileMenu && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs切换 z-40 top-16"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Desktop/Mobile Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed top-16 left-0 right-0 h-[calc(100vh-64px)] bg-black border-b border-zinc-900 overflow-y-auto z-40 transform transition-transform duration-200 ${
                showMobileMenu ? 'translate-x-0' : '-translate-x-full'
              }`
            : `fixed top-0 left-0 h-screen bg-black border-r border-zinc-900 transition-all duration-300 z-50 flex flex-col ${
                isCollapsed ? 'w-20' : 'w-64'
              }`
        } font-mono`}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <div className="p-5 border-b border-zinc-900/60 flex items-center justify-between sticky top-0 bg-black">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
                  <span className="text-black font-bold text-xs tracking-tighter">J</span>
                </div>
                <span className="text-white font-bold text-xs uppercase tracking-widest">JobPortal</span>
              </div>
            )}
            {isCollapsed && (
              <div className="w-7 h-7 bg-white rounded flex items-center justify-center mx-auto">
                <span className="text-black font-bold text-xs tracking-tighter">J</span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-1.5 hover:bg-zinc-900 rounded border border-transparent hover:border-zinc-800 transition-colors text-zinc-500 hover:text-white ${
                isCollapsed ? 'mx-auto mt-0.5' : ''
              }`}
            >
              {isCollapsed ? <Menu size={16} /> : <X size={16} />}
            </button>
          </div>
        )}

        {/* User Account Info */}
        {/* User Account Info */}
<div className="p-4 border-b border-zinc-900/60">
  <div className="relative">
    <button
      onClick={() => !isCollapsed && !isMobile && setShowUserMenu(!showUserMenu)}
      className={`w-full flex items-center space-x-3 p-2 hover:bg-zinc-950 border border-transparent hover:border-zinc-900 rounded-lg transition-all ${
        isCollapsed ? 'justify-center' : ''
      }`}
      title={isCollapsed ? user?.name || 'User' : ''}
    >
      <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {/* 🎯 Safe optional chaining to prevent undefined profile crashes */}
        {user?.jobSeekerProfile?.profilePhotoUrl ? (
          <img 
            src={user.jobSeekerProfile.profilePhotoUrl} 
            alt={user?.name || 'User'} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <User size={14} className="text-zinc-400" />
        )}
      </div>
      {!isCollapsed && (
        <>
          <div className="flex-1 text-left min-w-0">
            <p className="text-zinc-200 text-xs font-semibold truncate uppercase tracking-tight">
              {/* 🎯 Fallback matrix if the inner setup profile isn't indexed yet */}
              {user?.jobSeekerProfile?.fullName || user?.name || 'User Profile'}
            </p>
            <p className="text-zinc-600 text-[10px] truncate mt-0.5">
              {user?.jobSeekerProfile?.email || user?.email || 'unconfigured@identity.net'}
            </p>
          </div>
          <ChevronDown
            size={12}
            className={`text-zinc-600 transition-transform duration-200 ${
              showUserMenu ? 'rotate-180 text-white' : ''
            }`}
          />
        </>
      )}
    </button>

    {/* User Dropdown Menu */}
    {showUserMenu && !isCollapsed && !isMobile && (
      <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden shadow-2xl z-50 p-1 space-y-0.5">
        <Link
          href="/dashboard/profile"
          onClick={() => setShowUserMenu(false)}
          className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors text-xs uppercase font-medium"
        >
          <User size={14} />
          <span>View Profile</span>
        </Link>
        <Link
          href="/dashboard/settings"
          onClick={() => setShowUserMenu(false)}
          className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors text-xs uppercase font-medium"
        >
          <Settings size={14} />
          <span>Settings</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border-t border-zinc-900/60 mt-1 pt-2 text-xs uppercase font-medium"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    )}
  </div>
</div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-1">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-xs uppercase tracking-wide border font-medium ${
                      isActive
                        ? 'bg-zinc-900 text-white border-zinc-800 shadow-sm'
                        : 'text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-zinc-950/50'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon size={16} className={isActive ? 'text-white' : 'text-zinc-500'} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - App Version (Desktop only) */}
        {!isCollapsed && !isMobile && (
          <div className="p-4 border-t border-zinc-900/60 bg-black">
            <div className="text-center text-[10px] tracking-tight text-zinc-700">
              <p className="uppercase font-bold tracking-widest text-zinc-600">JobPortal v1.0</p>
              <p className="mt-0.5">Evaluation Token Matrix</p>
            </div>
          </div>
        )}

        {/* Mobile Footer Actions */}
        {isMobile && (
          <div className="p-4 border-t border-zinc-900 bg-black grid grid-cols-3 gap-2">
            <Link
              href="/dashboard/profile"
              onClick={handleNavClick}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-950 text-[10px] uppercase font-bold space-y-1"
            >
              <User size={14} />
              <span>Profile</span>
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={handleNavClick}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-950 text-[10px] uppercase font-bold space-y-1"
            >
              <Settings size={14} />
              <span>Settings</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-900/60 bg-zinc-950 text-red-500 hover:text-red-400 text-[10px] uppercase font-bold space-y-1"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}