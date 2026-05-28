'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { LayoutDashboard, Briefcase, Users, Video } from 'lucide-react';

export default function CompanySidebar({ company }: { company: any }) {
  const pathname = usePathname();
  const { isAdmin, isHR, isInterviewer } = useAuth();

  // Dynamic navigational array built with user visibility conditions
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard, 
      visible: true
    },
    { 
      name: 'Offers', 
      href: '/dashboard/offers', 
      icon: LayoutDashboard, 
      visible: true
    },
    { 
      name: 'Job Postings', 
      href: '/dashboard/jobs', 
      icon: Briefcase, 
      visible: isAdmin || isHR 
    },
    { 
      name: 'Live Interviews', 
      href: '/dashboard/interviews', 
      icon: Video, 
      visible: isAdmin || isHR || isInterviewer 
    },
    { 
      name: 'Team', 
      href: '/dashboard/team', 
      icon: Users, 
      visible: isAdmin || isHR // Restricted workspace controls
    }
  ];

  return (
    <div className="w-64 h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col text-white">
      <div className="p-6 border-b border-zinc-900">
        <h2 className="font-semibold text-sm tracking-wide text-white truncate uppercase font-mono">
          {company.name}
        </h2>
        <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">{company.email}</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation
          .filter((item) => item.visible)
          .map((item) => {
            // Check matching configurations cleanly across deep paths
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' 
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium font-mono transition-all ${
                  isActive 
                    ? 'bg-zinc-900 text-white border border-zinc-800' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                {item.name}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}