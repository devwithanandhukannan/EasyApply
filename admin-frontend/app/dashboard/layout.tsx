'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  Cpu,
  Zap,
  LogOut,
  Palette,
} from 'lucide-react';
import { ThemeProvider } from '@/lib/theme';
import EasyApplyLogo from '@/app/components/EasyApplyLogo';

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

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        {/* Sidebar */}
        <nav className="sidebar">
          <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <EasyApplyLogo size="md" badge="Admin" />
          </div>

          <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
            {NAV.map((item, i) => {
              if ('section' in item) {
                return <div key={i} className="sidebar-section">{item.section}</div>;
              }
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a key={i} href={item.href} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, minHeight: '18px' }}>
              {mounted ? (user.name || 'Platform Admin') : ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, minHeight: '16px' }}>
              {mounted ? (user.email || 'admin@easyapply.com') : ''}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center', gap: 8 }}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
