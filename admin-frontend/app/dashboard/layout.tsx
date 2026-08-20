'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  Cpu,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/app/components/GlassToastContainer';
import EasyApplyLogo from '@/app/components/EasyApplyLogo';
import ThemeToggle from '@/app/components/ThemeToggle';

interface NavLinkItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavSectionItem {
  section: string;
}

type NavItem = NavLinkItem | NavSectionItem;

const NAV: NavItem[] = [
  { section: 'Platform' },
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Companies', href: '/dashboard/companies', icon: Building2 },
  { label: 'Job Seekers', href: '/dashboard/seekers', icon: Users },
  { section: 'Monetization' },
  { label: 'Subscriptions', href: '/dashboard/subscriptions', icon: CreditCard },
  { section: 'Platform Config' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'ATS Re-calc', href: '/dashboard/ats', icon: Cpu },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string }>({});
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('admin_token');
    const u = localStorage.getItem('admin_user');
    if (!token) {
      router.push('/login');
      return;
    }
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch {}
    }
  }, [router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="flex min-h-screen w-full bg-[#f5f4fc] dark:bg-[#090a10] text-[#111827] dark:text-[#f9fafb] font-sans antialiased transition-colors duration-300">
          
          {/* Mobile Top Header */}
          <header className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-white/90 dark:bg-[#121422]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between px-4">
            <EasyApplyLogo size="sm" badge="Admin" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </header>

          {/* Mobile Drawer Backdrop */}
          {isMobileOpen && (
            <div
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            />
          )}

          {/* Desktop & Mobile Sidebar */}
          <aside
            className={`fixed md:sticky top-0 h-screen z-50 flex flex-col border-r border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#0f1221] transition-all duration-300 ${
              isCollapsed ? 'md:w-20' : 'md:w-64'
            } ${
              isMobileOpen
                ? 'translate-x-0 w-72 shadow-2xl'
                : '-translate-x-full md:translate-x-0'
            }`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between min-h-[65px]">
              {!isCollapsed ? (
                <EasyApplyLogo size="md" badge="Admin" />
              ) : (
                <div className="mx-auto">
                  <EasyApplyLogo size="sm" />
                </div>
              )}
              
              {!isCollapsed && (
                <div className="hidden md:flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                    title="Collapse Sidebar"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              )}

              {isCollapsed && (
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="hidden md:flex w-8 h-8 rounded-xl items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors cursor-pointer absolute -right-4 top-5 bg-white dark:bg-[#0f1221] border border-black/[0.06] dark:border-white/[0.08] shadow-xs"
                  title="Expand Sidebar"
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

            {/* Navigation Links */}
            <div className="flex-1 py-4 overflow-y-auto px-3 space-y-1.5 custom-scrollbar">
              {NAV.map((item, i) => {
                if ('section' in item) {
                  if (isCollapsed) return <div key={i} className="my-2 border-t border-black/[0.06] dark:border-white/[0.08]" />;
                  return (
                    <div key={i} className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] dark:text-zinc-400 px-3 pt-3 pb-1">
                      {item.section}
                    </div>
                  );
                }
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={i}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#0071e3] text-white shadow-md shadow-[#0071e3]/20'
                        : 'text-[#4b5563] dark:text-zinc-300 hover:text-[#111827] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon size={17} className={isActive ? 'text-white' : 'text-[#86868b] dark:text-zinc-400 shrink-0'} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* User & Sign Out Footer */}
            <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#121528]">
              {!isCollapsed ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                      {getInitials(user.name, user.email)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#111827] dark:text-white truncate">
                        {mounted ? (user.name || 'Platform Admin') : 'Admin'}
                      </div>
                      <div className="text-[10px] text-[#86868b] dark:text-zinc-400 truncate">
                        {mounted ? (user.email || 'admin@easyapply.com') : ''}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {getInitials(user.name, user.email)}
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 min-w-0 p-4 sm:p-8 pt-20 md:pt-8 overflow-y-auto max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
