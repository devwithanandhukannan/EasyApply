// app/components/CompanySidebar.tsx
'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Building2,
  Briefcase,
} from 'lucide-react';

interface CompanySidebarProps {
  company: {
    name: string;
    email: string;
    logoUrl: string | null;
  };
}

export default function CompanySidebar({ company }: CompanySidebarProps) {
  const { logout } = useAuth();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
    { name: 'Team', href: '/dashboard/team', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-screen">
      {/* Company Info */}
      <div className="p-6 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5 text-black" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {company.name}
            </p>
            <p className="text-xs text-zinc-600 truncate">
              {company.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-white text-black' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-900">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}