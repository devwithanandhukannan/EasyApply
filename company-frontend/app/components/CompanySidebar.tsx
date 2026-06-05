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
  LogOut 
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
  const { isAdmin, isHR, isInterviewer, isViewer, loading, logout } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredNav = useMemo(() => {
    const hasAccess = isMounted && !loading;

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
        icon: ScrollText, // Unique icon for templates
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
        icon: UserCheck, // Distinct validation profile icon for evaluated candidates
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
        name: 'Company Profile', 
        href: '/dashboard/profile', 
        icon: Building2, 
        visible: hasAccess && (isAdmin || isHR || isViewer) 
      }
    ].filter(item => item.visible);
  }, [isMounted, loading, isAdmin, isHR, isInterviewer, isViewer]);

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
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group duration-200 ${
              isActive 
                ? 'bg-zinc-900 border border-zinc-800 text-white shadow-md shadow-black/40' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/30 border border-transparent'
            }`}
          >
            <item.icon className={`h-4 w-4 shrink-0 transition-colors ${
              isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
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
        className={`hidden md:flex flex-col h-screen bg-zinc-950 border-r border-r-zinc-900 transition-all duration-300 relative z-30 select-none ${
          isCollapsed ? 'w-[70px]' : 'w-64'
        }`}
      >
        {/* Brand Space */}
        <div className="p-4 border-b border-zinc-900 h-[73px] flex items-center justify-between gap-3 overflow-hidden bg-zinc-900/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl shrink-0">
              <Building2 className="w-4 h-4 text-zinc-300" />
            </div>
            {!isCollapsed && company && (
              <div className="min-w-0 transition-opacity duration-200">
                <h2 className="font-semibold text-xs tracking-wide text-zinc-100 truncate uppercase">
                  {company.name}
                </h2>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">{company.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Toggle Pin */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-5 -right-3 p-1.5 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors shadow-xl"
        >
          <ChevronLeft className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigation Layer */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar mt-2">
          <NavLinks />
        </nav>

        {/* Desktop Logout Button */}
        <div className="p-3 border-t border-zinc-900">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent transition-all duration-200 group"
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-500/70 group-hover:text-red-400" />
            <span className={`transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER SHEET ───────────────────────────── */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-zinc-900 h-[73px] flex items-center justify-between">
          {company && (
            <div className="min-w-0">
              <h2 className="font-semibold text-xs tracking-wide text-zinc-200 truncate uppercase">{company.name}</h2>
              <p className="text-[10px] text-zinc-500 truncate">{company.email}</p>
            </div>
          )}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onClickItem={() => setIsMobileOpen(false)} />
        </nav>

        {/* Mobile Logout Button */}
        <div className="p-4 border-t border-zinc-900">
          <button
            onClick={() => {
              setIsMobileOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-500/70" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}