'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { ArrowUpRight, TrendingUp, Users, Layers2, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const metrics = [
    { 
      label: 'Active Pipelines', 
      value: '12', 
      change: '+2 this week', 
      icon: Layers2,
      accent: 'text-blue-400 bg-blue-500/5 border-blue-500/10'
    },
    { 
      label: 'Sourced Talents', 
      value: '48', 
      change: '+5 this month', 
      icon: Users,
      accent: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
    },
    { 
      label: 'Offer Yield Rate', 
      value: '94%', 
      change: '+3% this cycle', 
      icon: TrendingUp,
      accent: 'text-amber-400 bg-amber-500/5 border-amber-500/10'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Profile Info Panel */}
      <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight sm:text-2xl">
            Welcome back, {user?.company?.name || 'Workspace Leader'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 font-medium">
            Review your dynamic team metrics and platform pipeline logs.
          </p>
        </div>
        
        {/* Subtle Action Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] font-medium text-zinc-400 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
          <span>Enterprise Mode Enabled</span>
        </div>
      </div>

      {/* Metrics Parameter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((stat, idx) => (
          <div
            key={idx}
            className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-5 hover:border-zinc-800/80 transition-all duration-300 relative group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between w-full">
              <span className="text-xs text-zinc-400 font-medium tracking-wide">{stat.label}</span>
              <div className={`p-2 rounded-xl border ${stat.accent}`}>
                <stat.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div className="mt-4">
              <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-500">
                <span className="text-emerald-500 font-semibold">{stat.change.split(' ')[0]}</span>
                <span>{stat.change.substring(stat.change.indexOf(' '))}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Structured Activity Log Section */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-xl shadow-black/30">
        <div className="p-5 border-b border-zinc-900/80 bg-zinc-900/10">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">System Event Timeline</h2>
        </div>
        
        <div className="divide-y divide-zinc-900">
          {[
            { msg: 'Technical evaluation submitted for Senior Frontend Profile', sub: 'Author: System Node Alpha', time: 'Just now' },
            { msg: 'Custom offer letter template initialized and saved to cloud storage', sub: 'Author: HR Operator', time: '20 mins ago' },
            { msg: 'Live workspace interview link generated for pipeline candidate', sub: 'Author: Interview Service', time: '1 hour ago' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 hover:bg-zinc-900/20 transition-all duration-200 group gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 group-hover:bg-zinc-400 transition-colors shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                    {item.msg}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{item.sub}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-zinc-600 font-medium">{item.time}</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 group-hover:text-zinc-400 transition-all transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}