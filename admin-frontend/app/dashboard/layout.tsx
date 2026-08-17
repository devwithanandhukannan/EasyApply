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
} from 'lucide-react';

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      setUser({});
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <nav className="sidebar">
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>EasyApply</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Admin Panel</div>
            </div>
          </div>
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
  );
}
