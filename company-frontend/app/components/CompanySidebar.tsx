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
  Lock,
  Sparkles,
  Globe,
  ExternalLink,
  CalendarDays,
} from 'lucide-react';
import CustomBusinessRequestModal from './CustomBusinessRequestModal';

interface SidebarProps {
  company: any;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

export default function CompanySidebar({ 
  company: propCompany, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen 
}: SidebarProps) {
  const pathname = usePathname();
  const { user, company: authCompany, isAdmin, isHR, isInterviewer, isViewer, isCustom, isLoading, logout, features, can } = useAuth();
  const company = propCompany || authCompany;
  const [isMounted, setIsMounted] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if (isCustom) return 'Custom';
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
        visible: hasAccess,
        isLocked: false,
      },
      { 
        name: 'Job Postings', 
        href: '/dashboard/jobs', 
        icon: Briefcase, 
        visible: hasAccess && can('jobs', 'read'),
        isLocked: !features.jobPostings,
      },
      { 
        name: 'Walk-In Rooms', 
        href: '/dashboard/walkin', 
        icon: DoorOpen, 
        visible: hasAccess && can('walkin', 'read'),
        isLocked: !features.walkinInterview,
      },
      { 
        name: 'Seeker Discovery', 
        href: '/dashboard/discovery', 
        icon: Search, 
        visible: hasAccess && can('discovery', 'read'),
        isLocked: !features.seekerDiscovery,
      },
      { 
        name: 'Company Talent Pool', 
        href: '/dashboard/talent-pool', 
        icon: UserCheck,
        visible: hasAccess && can('talent_pool', 'read'),
        isLocked: !features.crmTalentPool,
      },
      { 
        name: 'Calendar & Schedule', 
        href: '/dashboard/calendar', 
        icon: CalendarDays, 
        visible: hasAccess,
        isLocked: false,
      },
      { 
        name: 'Live Interviews', 
        href: '/dashboard/interviews', 
        icon: Video, 
        visible: hasAccess && can('interviews', 'read'),
        isLocked: !features.interviewScheduling,
      },
      { 
        name: 'Spot Jobs', 
        href: '/dashboard/spot-jobs', 
        icon: Zap,
        visible: hasAccess && can('spot_jobs', 'read'),
        isLocked: !features.spotJobs,
      },
      { 
        name: 'Offers', 
        href: '/dashboard/offers', 
        icon: FileText, 
        visible: hasAccess && can('offers', 'read'),
        isLocked: !features.offerLetters,
      },
      { 
        name: 'Templates', 
        href: '/dashboard/offer-templates', 
        icon: ScrollText, 
        visible: hasAccess && can('offers', 'read'),
        isLocked: !features.offerLetters,
      },
      { 
        name: 'Team Workspace', 
        href: '/dashboard/team', 
        icon: Users, 
        visible: hasAccess && (isAdmin || can('team', 'read')),
        isLocked: !features.teamWorkspace && (company?.subscription?.plan?.maxTeamMembers ?? 1) <= 1,
      },
      { 
        name: 'Company Profile', 
        href: '/dashboard/profile', 
        icon: Building2, 
        visible: hasAccess,
        isLocked: false,
      },
      { 
        name: 'Public Directory', 
        href: typeof window !== 'undefined' && window.location.hostname.includes('dearresume.com')
          ? 'https://dearresume.com/companies'
          : typeof window !== 'undefined' && (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('easyapply'))
          ? 'https://cloudflare.easyapply-jobseeker.pages.dev/companies'
          : (process.env.NEXT_PUBLIC_JOBSEEKER_URL || 'http://localhost:3000') + '/companies', 
        icon: Globe, 
        visible: hasAccess,
        isLocked: false,
        isExternal: true,
      }
    ].filter(item => item.visible);
  }, [isMounted, isLoading, isAdmin, isHR, isInterviewer, isViewer, features, company]);

  const NavLinks = ({ onClickItem }: { onClickItem?: () => void }) => (
    <>
      {filteredNav.map((item) => {
        const isActive = !item.isExternal && (item.href === '/dashboard' 
          ? pathname === '/dashboard' 
          : pathname.startsWith(item.href));

        if (item.isExternal) {
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClickItem}
              className="flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all group duration-200 text-[#6e6e73] dark:text-[#aeaeb2] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] border border-transparent"
            >
              <div className="flex items-center gap-3 min-w-0">
                <item.icon className="h-4 w-4 shrink-0 text-[#86868b] group-hover:text-[#0071e3] transition-colors" />
                <span className={`truncate transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
                  {item.name}
                </span>
              </div>
              <span className={`shrink-0 flex items-center justify-center ${isCollapsed ? 'hidden' : ''}`}>
                <ExternalLink className="w-3 h-3 text-[#aeaeb2] group-hover:text-[#0071e3]" />
              </span>
            </a>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClickItem}
            className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all group duration-200 relative ${
              isActive 
                ? 'bg-black/[0.07] dark:bg-white/[0.12] text-[#1d1d1f] dark:text-white' 
                : item.isLocked
                ? 'text-[#8e8e93] dark:text-[#636366] opacity-50 hover:opacity-85 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                : 'text-[#6e6e73] dark:text-[#aeaeb2] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <item.icon className={`h-4 w-4 shrink-0 transition-colors ${
                isActive 
                  ? 'text-[#1d1d1f] dark:text-white' 
                  : item.isLocked 
                  ? 'text-[#aeaeb2] dark:text-[#636366]' 
                  : 'text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-white'
              }`} />
              <span className={`truncate transition-opacity duration-200 ${isCollapsed ? 'md:hidden opacity-0' : 'opacity-100'}`}>
                {item.name}
              </span>
            </div>
            
            {item.isLocked && (
              <span className={`shrink-0 flex items-center justify-center ${isCollapsed ? 'absolute top-1.5 right-1.5 md:block hidden' : ''}`}>
                <Lock className="w-3 h-3 text-[#aeaeb2] dark:text-[#636366]" />
              </span>
            )}
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
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    {getRoleLabel()}
                  </span>
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full truncate max-w-[90px]">
                    {company?.subscription?.plan?.name || 'Free Tier'}
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

        {/* Custom Business Request Banner (Desktop) */}
        {!isCollapsed && (
          <div className="p-3 mx-3 mb-2 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px] font-bold text-gray-900">Custom Business Plan</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
              Need custom features or bulk hiring capacities?
            </p>
            <button
              onClick={() => setRequestModalOpen(true)}
              className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-xs transition-colors text-center"
            >
              Request Features
            </button>
          </div>
        )}

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
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    {getRoleLabel()}
                  </span>
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-full truncate max-w-[90px]">
                    {company?.subscription?.plan?.name || 'Free Tier'}
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

        {/* Custom Business Request Banner (Mobile) */}
        <div className="p-3 mx-4 mb-2 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] font-bold text-gray-900">Custom Business Plan</span>
          </div>
          <button
            onClick={() => {
              setIsMobileOpen(false);
              setRequestModalOpen(true);
            }}
            className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-xs transition-colors text-center mt-1"
          >
            Request Custom Features
          </button>
        </div>

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

      {/* Custom Business Plan Request Modal */}
      <CustomBusinessRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
    </>
  );
}