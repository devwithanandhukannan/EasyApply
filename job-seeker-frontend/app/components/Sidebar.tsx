'use client';

import { useState } from 'react';
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
  Home,
  ChevronLeft,
  Video,
  Zap,
  Rocket,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import EasyApplyLogo from './EasyApplyLogo';

interface SidebarProps {
  user?: any;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function Sidebar({ user, isCollapsed: propIsCollapsed, setIsCollapsed: propSetIsCollapsed }: SidebarProps) {
  const [localIsCollapsed, setLocalIsCollapsed] = useState(false);
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localIsCollapsed;
  const setIsCollapsed = propSetIsCollapsed !== undefined ? propSetIsCollapsed : setLocalIsCollapsed;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Search, label: 'Browse Jobs', href: '/dashboard/jobs' },
    { icon: FileText, label: 'My Resumes', href: '/dashboard/resumes' },
    { icon: Briefcase, label: 'Applied Jobs', href: '/dashboard/applications' },
    { icon: Calendar, label: 'Interviews', href: '/dashboard/interviews' },
    { icon: Video, label: 'Walk-In Rooms', href: '/dashboard/walkin' },
    { icon: User, label: 'Profile Workspace', href: '/dashboard/profile' },
    { icon: Zap, label: 'Spot Jobs', href: '/dashboard/spot-jobs' },
  ];

  const handleLogout = () => {
    logout();
  };

  const NavLinks = ({ onClickItem }: { onClickItem?: () => void }) => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/dashboard' 
          ? pathname === '/dashboard' 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClickItem}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'}`} />
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* ─── MOBILE CONTAINER HEADER ───────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-5 flex items-center justify-between z-40 h-14">
        <EasyApplyLogo size="sm" />
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── DESKTOP SIDEBAR ────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 shrink-0 select-none ${
          isCollapsed ? 'w-[70px]' : 'w-64'
        }`}
      >
        {/* Core Brand Header */}
        <div className="p-4 border-b border-gray-200 h-[73px] flex items-center justify-between gap-3 overflow-hidden bg-gray-50/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {isCollapsed ? (
              <div className="p-2 text-blue-600 flex items-center justify-center">
                <Rocket size={20} className="text-blue-600 fill-blue-600 transform -rotate-12" />
              </div>
            ) : (
              <EasyApplyLogo size="md" />
            )}
          </div>
        </div>

        {/* Action Toggle Pin */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-5 -right-3 p-1.5 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm"
        >
          <ChevronLeft className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* User Workspace Profile Component */}
        <div className="p-3 border-b border-gray-200 bg-gray-50/30">
          <div className="relative">
            <button
              onClick={() => !isCollapsed && setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center gap-3 p-2 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-xl transition-all ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                {user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl ? (
                  <img 
                    src={user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl} 
                    alt={user?.fullName || user?.name || 'User'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-gray-500" />
                )}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-gray-900 text-xs font-semibold truncate tracking-tight">
                      {user?.fullName || user?.jobSeekerProfile?.fullName || user?.name || 'User Profile'}
                    </p>
                    <p className="text-gray-500 text-[10px] truncate mt-0.5">
                      {user?.email || user?.jobSeekerProfile?.email || 'user@easyapply.io'}
                    </p>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180 text-gray-700' : ''}`} />
                </>
              )}
            </button>

            {/* User Dropdown Menu Card */}
            {showUserMenu && !isCollapsed && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg z-50 p-1 space-y-0.5 animate-fade-in">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-xs font-medium"
                >
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span>View Profile</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors text-xs font-medium"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-500" />
                  <span>Settings</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 border-t border-gray-100 mt-1 pt-2 text-xs font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
          <NavLinks />
        </nav>
      </aside>

      {/* ─── MOBILE DRAWER SHEET ───────────────────────────── */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
              {user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl ? (
                <img src={user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-gray-500" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-xs text-gray-900 truncate">{user?.fullName || user?.jobSeekerProfile?.fullName || 'Candidate'}</h2>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || user?.jobSeekerProfile?.email || 'user@easyapply.io'}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onClickItem={() => setIsMobileOpen(false)} />
        </nav>

        {/* Mobile Actions Drawer Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 grid grid-cols-2 gap-1.5">
          <Link
            href="/dashboard/settings"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center justify-center gap-2 p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-medium"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 p-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}