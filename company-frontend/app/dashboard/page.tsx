// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/app/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-6">
        <h1 className="text-2xl font-semibold text-white">
          Welcome back, {user?.company?.name || 'User'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your workspace and team
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Projects', value: '12', change: '+2 this week' },
          { label: 'Active Users', value: '48', change: '+5 this month' },
          { label: 'Completion Rate', value: '94%', change: '+3% this week' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 hover:border-zinc-800 transition-colors"
          >
            <p className="text-sm text-zinc-500 font-medium">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-zinc-600">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <div className="h-2 w-2 rounded-full bg-white"></div>
              <div className="flex-1">
                <p className="text-sm text-white">Activity item {item}</p>
                <p className="text-xs text-zinc-600 mt-0.5">Just now</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}