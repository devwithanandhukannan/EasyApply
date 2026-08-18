'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  Briefcase,
  Video,
  Zap,
  KeyRound,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Activity,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface Stats {
  companies: number;
  seekers: number;
  applications: number;
  subscriptions: number;
  activeJobs: number;
  openWalkInRooms: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { title: 'Total Companies', value: stats?.companies ?? 0, icon: Building2, href: '/dashboard/companies', iconColor: 'text-[#0071e3]', iconBg: 'bg-blue-500/10' },
    { title: 'Registered Job Seekers', value: stats?.seekers ?? 0, icon: Users, href: '/dashboard/seekers', iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10' },
    { title: 'Total Applications', value: stats?.applications ?? 0, icon: FileText, href: '/dashboard/ats', iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10' },
    { title: 'Active Subscriptions', value: stats?.subscriptions ?? 0, icon: CreditCard, href: '/dashboard/subscriptions', iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10' },
    { title: 'Active Job Postings', value: stats?.activeJobs ?? 0, icon: Briefcase, href: '/dashboard/companies', iconColor: 'text-cyan-500', iconBg: 'bg-cyan-500/10' },
    { title: 'Live Walk-in Rooms', value: stats?.openWalkInRooms ?? 0, icon: Video, href: '/dashboard/companies', iconColor: 'text-rose-500', iconBg: 'bg-rose-500/10' },
  ];

  return (
    <div className="w-full space-y-8">
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
            System Live
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
          Platform Overview
        </h1>
        <p className="text-xs sm:text-sm text-[#86868b] dark:text-slate-400 mt-1 font-medium">
          Real-time health, monetization &amp; activity metrics across EasyApply ecosystem
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#86868b] text-sm">
          <div className="inline-block w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-3" />
          <p>Synchronizing platform telemetry...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {statItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link key={idx} href={item.href} className="no-underline group">
                  <div className="stat-card p-6 rounded-2xl bg-white dark:bg-[#0f1221] border border-black/[0.06] dark:border-white/[0.08] shadow-xs group-hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] group-hover:bg-[#0071e3] group-hover:text-white transition-colors">
                        View <ArrowRight size={12} />
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#1d1d1f] dark:text-white tracking-tight mb-1">
                      {item.value.toLocaleString()}
                    </div>
                    <div className="text-xs font-semibold text-[#86868b] dark:text-slate-400">
                      {item.title}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Management & Security Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Management */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0f1221] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Zap size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1d1d1f] dark:text-white">Quick Management</h2>
                  <p className="text-[11px] text-[#86868b]">Control company workflows and system parameters</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/dashboard/companies"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#14182e] hover:bg-[#f2f2f7] dark:hover:bg-[#1a203d] text-[#1d1d1f] dark:text-white text-xs font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={16} className="text-[#0071e3]" />
                    <span>Manage Companies &amp; Feature Toggles</span>
                  </div>
                  <ChevronRight size={15} className="text-[#86868b] group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/dashboard/subscriptions"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#14182e] hover:bg-[#f2f2f7] dark:hover:bg-[#1a203d] text-[#1d1d1f] dark:text-white text-xs font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={16} className="text-purple-500" />
                    <span>Custom Subscription Matrix &amp; Plans</span>
                  </div>
                  <ChevronRight size={15} className="text-[#86868b] group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#14182e] hover:bg-[#f2f2f7] dark:hover:bg-[#1a203d] text-[#1d1d1f] dark:text-white text-xs font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <KeyRound size={16} className="text-amber-500" />
                    <span>System Credentials (Razorpay, SMTP, Groq, LiveKit)</span>
                  </div>
                  <ChevronRight size={15} className="text-[#86868b] group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/dashboard/ats"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#14182e] hover:bg-[#f2f2f7] dark:hover:bg-[#1a203d] text-[#1d1d1f] dark:text-white text-xs font-semibold transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Bot size={16} className="text-emerald-500" />
                    <span>Trigger ATS Batch Re-calculation</span>
                  </div>
                  <ChevronRight size={15} className="text-[#86868b] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Security & System Status */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0f1221] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1d1d1f] dark:text-white">Security &amp; System Status</h2>
                  <p className="text-[11px] text-[#86868b]">Infrastructure encryption and operational health</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-medium">
                <div className="flex justify-between items-center p-3 rounded-xl bg-[#fbfbfd] dark:bg-[#14182e] border border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-[#6e6e73] dark:text-slate-400">Credential Storage</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    AES-256 Encrypted
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-[#fbfbfd] dark:bg-[#14182e] border border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-[#6e6e73] dark:text-slate-400">Seeker Pricing Policy</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] border border-[#0071e3]/20">
                    <CheckCircle2 size={12} />
                    100% Free Forever
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-[#fbfbfd] dark:bg-[#14182e] border border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-[#6e6e73] dark:text-slate-400">Walk-in Priority Queue</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Activity size={12} />
                    Active (Skill + Aging)
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-[#fbfbfd] dark:bg-[#14182e] border border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-[#6e6e73] dark:text-slate-400">API Health Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
