'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  ScrollText, 
  Zap, 
  Briefcase, 
  UserCheck, 
  Video, 
  Users, 
  Building2, 
  ChevronLeft, 
  X,
  LogOut,
  DoorOpen,
  Search,
} from 'lucide-react';

interface SidebarProps {
  company: any;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

export default function CompanySidebar({ 
  company, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen 
}: SidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin, isHR, isInterviewer, isViewer, isLoading, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if (isHR) return 'HR';
    if (isInterviewer) return 'Interviewer';
    if (isViewer) return 'Viewer';
    return 'Member';
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredNav = useMemo(() => {
    const hasAccess = isMounted && !isLoading;

    return [
      { 
        name: 'Dashboard', 
        href: '/dashboard', 
        icon: LayoutDashboard, 
        visible: hasAccess 
      },
      { 
        name: 'Offers', 
        href: '/dashboard/offers', 
        icon: FileText, 
        visible: hasAccess && (isAdmin || isHR || isViewer) 
      },
      { 
        name: 'Templates', 
        href: '/dashboard/offer-templates', 
        icon: ScrollText,
        visible: hasAccess && (isAdmin || isHR) 
      },
      { 
        name: 'Spot Jobs', 
        href: '/dashboard/spot-jobs', 
        icon: Zap,
        visible: hasAccess && (isAdmin || isHR) 
      },
      { 
        name: 'Job Postings', 
        href: '/dashboard/jobs', 
        icon: Briefcase, 
        visible: hasAccess && (isAdmin || isHR || isViewer) 
      },
      { 
        name: 'Company Talent Pool', 
        href: '/dashboard/talent-pool', 
        icon: UserCheck,
        visible: hasAccess && (isAdmin || isHR || isInterviewer || isViewer) 
      },
      { 
        name: 'Live Interviews', 
        href: '/dashboard/interviews', 
        icon: Video, 
        visible: hasAccess && (isAdmin || isHR || isInterviewer || isViewer) 
      },
      { 
        name: 'Team Workspace', 
        href: '/dashboard/team', 
        icon: Users, 
        visible: hasAccess && (isAdmin) 
      },
      { 
        name: 'Walk-In Rooms', 
        href: '/dashboard/walkin', 
        icon: DoorOpen, 
        visible: hasAccess && (isAdmin || isHR || isInterviewer || isViewer) 
      },
      { 
        name: 'Seeker Discovery', 
        href: '/dashboard/discovery', 
        icon: Search, 
        visible: hasAccess && (isAdmin || isHR || isViewer) 
      },
      { 
        name: 'Company Profile', 
        href: '/dashboard/profile', 
        icon: Building2, 
        visible: hasAccess && (isAdmin || isHR || isViewer) 
      }
    ].filter(item => item.visible);
  }, [isMounted, isLoading, isAdmin, isHR, isInterviewer, isViewer]);

  const NavLinks = ({ onClickItem }: { onClickItem?: () => void }) => (
    <>
      {filteredNav.map((item) => {
        const isActive = item.href === '/dashboard' 
          ? pathname === '/dashboard' 
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClickItem}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all group duration-200 ${
              isActive 
                ? 'bg-black/[0.07] dark:bg-white/[0.12] text-[#1d1d1f] dark:text-white' 
                : 'text-[#6e6e73] dark:text-[#aeaeb2] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            <item.icon className={`h-4 w-4 shrink-0 transition-colors ${
              isActive ? 'text-[#1d1d1f] dark:text-white' : 'text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-white'
            }`} />
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ────────────────────────────────── */}
      <aside 
        className={`hidden md:flex flex-col h-screen bg-white dark:bg-[#1c1c1e] border-r border-black/[0.06] dark:border-white/[0.08] transition-all duration-300 relative z-30 select-none shrink-0 ${
          isCollapsed ? 'w-[70px]' : 'w-64'
        }`}
      >
        {/* Brand Space */}
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] min-h-[73px] py-4 flex items-center justify-between gap-3 overflow-hidden bg-[#f2f2f7]/40 dark:bg-[#2c2c2e]/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex-shrink-0 flex items-center justify-center overflow-hidden">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="w-4 h-4 text-[#1d1d1f] dark:text-[#f5f5f7]" />
              )}
            </div>
            {!isCollapsed && company && (
              <div className="min-w-0 transition-opacity duration-200">
                <h2 className="font-bold text-xs tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                  {company.name}
                </h2>
                <p className="text-[10px] text-[#86868b] truncate mt-0.5">{user?.email || company.email}</p>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Toggle Pin */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-5 -right-3 p-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1c1c1e] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors shadow-md cursor-pointer"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigation Layer */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar mt-2">
          <NavLinks />
        </nav>

        {/* Desktop Logout Button */}
        <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-all duration-200 group cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0 text-[#ff3b30]" />
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER SHEET ───────────────────────────── */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#1c1c1e] border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] min-h-[73px] py-4 flex items-center justify-between gap-3 bg-[#f2f2f7]/40 dark:bg-[#2c2c2e]/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex-shrink-0 flex items-center justify-center overflow-hidden">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="w-4 h-4 text-[#1d1d1f] dark:text-[#f5f5f7]" />
              )}
            </div>
            {company && (
              <div className="min-w-0">
                <h2 className="font-bold text-xs tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{company.name}</h2>
                <p className="text-[10px] text-[#86868b] truncate mt-0.5">{user?.email || company.email}</p>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onClickItem={() => setIsMobileOpen(false)} />
        </nav>

        {/* Mobile Logout Button */}
        <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={() => {
              setIsMobileOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0 text-[#ff3b30]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}