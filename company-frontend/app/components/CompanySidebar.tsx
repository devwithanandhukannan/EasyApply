// company-frontend/app/components/CompanySidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Users, Video } from 'lucide-react';

export default function CompanySidebar({ company }: { company: any }) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Job Postings', href: '/dashboard/jobs', icon: Briefcase },
    { name: 'Live Interviews', href: '/dashboard/interviews', icon: Video },
    { label: 'Team', href: '/dashboard/team', icon: Users }
  ];

  return (
    <div className="w-64 h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col text-white">
      <div className="p-6 border-b border-zinc-900">
        <h2 className="font-semibold text-sm tracking-wide text-white truncate">
          {company.name}
        </h2>
        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{company.email}</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          // Robust checking strategy matching base roots and deep dynamic nested layouts
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
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