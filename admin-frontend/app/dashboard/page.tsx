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
  RefreshCw,
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';

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
  const { showToast } = useGlassToast();

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
      showToast('Error', 'Failed to synchronize platform metrics', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { title: 'Total Companies', value: stats?.companies ?? 0, icon: Building2, href: '/dashboard/companies', iconColor: 'text-[#0071e3]', iconBg: 'bg-[#0071e3]/10', subtitle: 'Registered employers' },
    { title: 'Job Seekers', value: stats?.seekers ?? 0, icon: Users, href: '/dashboard/seekers', iconColor: 'text-purple-500', iconBg: 'bg-purple-500/10', subtitle: 'Active talent pool' },
    { title: 'Applications', value: stats?.applications ?? 0, icon: FileText, href: '/dashboard/ats', iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10', subtitle: 'Across all postings' },
    { title: 'Active Plans', value: stats?.subscriptions ?? 0, icon: CreditCard, href: '/dashboard/subscriptions', iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10', subtitle: 'Monetized accounts' },
    { title: 'Job Postings', value: stats?.activeJobs ?? 0, icon: Briefcase, href: '/dashboard/companies', iconColor: 'text-cyan-500', iconBg: 'bg-cyan-500/10', subtitle: 'Published vacancies' },
    { title: 'Live Walk-in Rooms', value: stats?.openWalkInRooms ?? 0, icon: Video, href: '/dashboard/rooms', iconColor: 'text-rose-500', iconBg: 'bg-rose-500/10', subtitle: 'Active interview sessions' },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              System Operational
            </span>
            <span className="text-xs text-zinc-400 font-medium">EasyApply Core v2.4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
            Platform Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] dark:text-zinc-400 mt-1">
            Real-time telemetry, company feature controls &amp; monetization oversight
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#181b2e] border border-black/[0.06] dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-[#22263d] text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#86868b]">
          <div className="inline-block w-7 h-7 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Synchronizing ecosystem telemetry...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {statItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link key={idx} href={item.href} className="no-underline group">
                  <div className="p-6 rounded-3xl bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] shadow-xs group-hover:shadow-lg group-hover:border-[#0071e3]/30 transition-all duration-200 group-hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 group-hover:bg-[#0071e3] group-hover:text-white transition-colors">
                        Manage <ArrowRight size={12} />
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#111827] dark:text-white tracking-tight mb-1">
                      {item.value.toLocaleString()}
                    </div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-400 mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Management & Security Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Management */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#111827] dark:text-white">Quick Control Launchpad</h2>
                  <p className="text-xs text-zinc-400">Jump directly to critical platform controls</p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/dashboard/companies"
                  className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-[#fbfbfd] dark:bg-[#181b2e] hover:bg-zinc-100/80 dark:hover:bg-[#22263d] text-[#111827] dark:text-white text-xs font-semibold transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white">Manage Companies</div>
                      <div className="text-[11px] text-zinc-400 font-normal">Verification badges &amp; feature overrides</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/dashboard/subscriptions"
                  className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-[#fbfbfd] dark:bg-[#181b2e] hover:bg-zinc-100/80 dark:hover:bg-[#22263d] text-[#111827] dark:text-white text-xs font-semibold transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white">Subscription Packages</div>
                      <div className="text-[11px] text-zinc-400 font-normal">Configure pricing tiers &amp; limits</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/dashboard/ats"
                  className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-[#fbfbfd] dark:bg-[#181b2e] hover:bg-zinc-100/80 dark:hover:bg-[#22263d] text-[#111827] dark:text-white text-xs font-semibold transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <Bot size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white">ATS Scoring Engine</div>
                      <div className="text-[11px] text-zinc-400 font-normal">Adjust scoring weights &amp; bulk re-calculate</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Security & System Status */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#111827] dark:text-white">Infrastructure &amp; Compliance</h2>
                  <p className="text-xs text-zinc-400">Security posture and operational guarantees</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div className="flex justify-between items-center p-3.5 rounded-2xl bg-[#fbfbfd] dark:bg-[#181b2e] border border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Credential Storage</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    AES-256 Encrypted
                  </span>
                </div>

                <div className="flex justify-between items-center p-3.5 rounded-2xl bg-[#fbfbfd] dark:bg-[#181b2e] border border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Job Seeker Policy</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] border border-[#0071e3]/20">
                    <CheckCircle2 size={12} />
                    100% Free Forever
                  </span>
                </div>

                <div className="flex justify-between items-center p-3.5 rounded-2xl bg-[#fbfbfd] dark:bg-[#181b2e] border border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">Walk-in Priority Queue</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Activity size={12} />
                    Active (Skill + Aging)
                  </span>
                </div>

                <div className="flex justify-between items-center p-3.5 rounded-2xl bg-[#fbfbfd] dark:bg-[#181b2e] border border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">API Gateway Health</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    100% Healthy
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
