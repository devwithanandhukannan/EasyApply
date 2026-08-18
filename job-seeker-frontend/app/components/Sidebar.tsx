'use client';

import { useState } from 'react';
import { 
  FileText, 
  Briefcase, 
  Calendar,
  CalendarDays, 
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
  Globe,
  Building2,
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
    { icon: CalendarDays, label: 'Calendar', href: '/dashboard/calendar' },
    { icon: Calendar, label: 'Interviews', href: '/dashboard/interviews' },
    { icon: Video, label: 'Walk-In Rooms', href: '/dashboard/walkin' },
    { icon: User, label: 'Profile Workspace', href: '/dashboard/profile' },
    { icon: Zap, label: 'Spot Jobs', href: '/dashboard/spot-jobs' },
    { icon: Globe, label: 'Public Directory', href: '/companies' },
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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group relative ${
              isActive
                ? 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#0071e3]/20 font-bold'
                : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f2f2f7] dark:hover:text-[#f5f5f7] dark:hover:bg-[#2c2c2e]'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#0071e3]' : 'text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-[#f5f5f7]'}`} />
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
        className={`hidden md:flex flex-col h-screen bg-white dark:bg-[#1c1c1e] border-r border-black/[0.06] dark:border-white/[0.08] transition-all duration-300 relative z-30 shrink-0 select-none ${
          isCollapsed ? 'w-[70px]' : 'w-64'
        }`}
      >
        {/* Core Brand Header */}
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] h-[73px] flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {isCollapsed ? (
              <div className="p-2 text-[#0071e3] flex items-center justify-center">
                <Rocket size={20} className="text-[#0071e3] fill-[#0071e3] transform -rotate-12" />
              </div>
            ) : (
              <EasyApplyLogo size="md" />
            )}
          </div>
        </div>

        {/* Action Toggle Pin */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-5 -right-3 p-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1c1c1e] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors shadow-xs cursor-pointer"
        >
          <ChevronLeft className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* User Workspace Profile Component */}
        <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="relative">
            <button
              onClick={() => !isCollapsed && setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center gap-3 p-2 hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] border border-transparent rounded-2xl transition-all cursor-pointer ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center shrink-0 overflow-hidden">
                {user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl ? (
                  <img 
                    src={user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl} 
                    alt={user?.fullName || user?.name || 'User'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#86868b]" />
                )}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-semibold truncate tracking-tight">
                      {user?.fullName || user?.jobSeekerProfile?.fullName || user?.name || 'User Profile'}
                    </p>
                    <p className="text-[#86868b] text-[10px] truncate mt-0.5 font-medium">
                      {user?.email || user?.jobSeekerProfile?.email || 'user@easyapply.io'}
                    </p>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-[#86868b] transition-transform duration-200 ${showUserMenu ? 'rotate-180 text-[#1d1d1f] dark:text-white' : ''}`} />
                </>
              )}
            </button>

            {/* User Dropdown Menu Card */}
            {showUserMenu && !isCollapsed && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl overflow-hidden shadow-xl z-50 p-1.5 space-y-0.5">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors text-xs font-medium"
                >
                  <User className="w-3.5 h-3.5 text-[#86868b]" />
                  <span>View Profile</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors text-xs font-medium"
                >
                  <Settings className="w-3.5 h-3.5 text-[#86868b]" />
                  <span>Settings</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#ff3b30]/10 text-[#ff3b30] border-t border-black/[0.06] dark:border-white/[0.08] mt-1 pt-2 text-xs font-medium cursor-pointer"
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#1c1c1e] border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center overflow-hidden">
              {user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl ? (
                <img src={user?.profilePhotoUrl || user?.jobSeekerProfile?.profilePhotoUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-[#86868b]" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-xs text-[#1d1d1f] dark:text-white truncate">{user?.fullName || user?.jobSeekerProfile?.fullName || 'Candidate'}</h2>
              <p className="text-[10px] text-[#86868b] truncate">{user?.email || user?.jobSeekerProfile?.email || 'user@easyapply.io'}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg border border-black/[0.06] dark:border-white/[0.08] text-[#86868b]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onClickItem={() => setIsMobileOpen(false)} />
        </nav>

        {/* Mobile Actions Drawer Footer */}
        <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50 grid grid-cols-2 gap-1.5">
          <Link
            href="/dashboard/settings"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center justify-center gap-2 p-2 rounded-xl border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-white dark:hover:bg-[#2c2c2e] text-xs font-medium"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 p-2 rounded-xl border border-[#ff3b30]/20 bg-[#ff3b30]/10 text-[#ff3b30] text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}