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
  Shield,
} from 'lucide-react';
import { ThemeProvider } from '@/lib/theme';
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
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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
      <div className="flex min-h-screen w-full bg-[#f5f5f7] dark:bg-[#05070e] text-[#1d1d1f] dark:text-[#f1f5f9] font-sans antialiased transition-colors duration-300">
        {/* Sidebar */}
        <aside className="sidebar border-r border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#0f1221] shadow-xs">
          {/* Logo Area */}
          <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <EasyApplyLogo size="md" badge="Admin" />
            <ThemeToggle />
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-4 overflow-y-auto px-2 space-y-1">
            {NAV.map((item, i) => {
              if ('section' in item) {
                return (
                  <div key={i} className="text-[10px] font-bold uppercase tracking-wider text-[#86868b] dark:text-slate-400 px-3.5 pt-4 pb-1.5">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0071e3]/10 dark:bg-[#0071e3]/20 text-[#0071e3] dark:text-[#2997ff] shadow-xs'
                      : 'text-[#6e6e73] dark:text-slate-400 hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#0071e3] dark:text-[#2997ff]' : 'text-[#86868b]'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User & Sign Out Footer */}
          <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#13172b]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {getInitials(user.name, user.email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1d1d1f] dark:text-white truncate">
                  {mounted ? (user.name || 'Platform Admin') : 'Admin'}
                </div>
                <div className="text-[10px] text-[#86868b] dark:text-slate-400 truncate">
                  {mounted ? (user.email || 'admin@easyapply.com') : ''}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c223d] hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900 text-[#6e6e73] dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
