'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { ArrowUpRight, Briefcase, Users, FileText, Loader2 } from 'lucide-react';
import api from '@/app/lib/axios';

interface Job {
  id: string;
  title: string;
  department?: string;
  jobType: string;
  locationType: string;
  location?: string;
  status: string;
  deadline?: string;
  openings: number;
  createdAt: string;
  totalApplications: number;
  applicationBreakdown: Record<string, number>;
}

interface DashboardSummary {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
}

export default function DashboardPage() {
  const { user, company } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>({ totalJobs: 0, activeJobs: 0, totalApplications: 0 });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/company/dashboard');
      if (response.data.success) {
        setSummary(response.data.summary);
        setJobs(response.data.jobs || []);
      }
    } catch (err: any) {
      console.error('Failed to resolve enterprise dashboard sequence:', err);
      setError('Failed to sync workspace parameters from the core network.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const metrics = [
    { 
      label: 'Active Pipelines', 
      value: loading ? '...' : String(summary.activeJobs), 
      context: `Out of ${summary.totalJobs} total roles`, 
      icon: Briefcase,
    },
    { 
      label: 'Total Applications', 
      value: loading ? '...' : String(summary.totalApplications), 
      context: 'Aggregated across cycles', 
      icon: Users,
    },
    { 
      label: 'Average Velocity', 
      value: loading ? '...' : summary.totalJobs > 0 ? (summary.totalApplications / summary.totalJobs).toFixed(1) : '0.0', 
      context: 'Applicants per cluster node', 
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Profile Info Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            Welcome back, {company?.name || 'Workspace Leader'}
          </h1>
          <p className="mt-1 text-sm text-[#86868b] font-medium">
            Review your dynamic team metrics and platform pipeline logs.
          </p>
        </div>
      </div>

      {/* Error Bound Warning Block */}
      {error && (
        <div className="p-4 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl text-sm text-[#ff3b30] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#ff3b30]" />
          {error}
        </div>
      )}

      {/* Metrics Parameter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {metrics.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between w-full">
              <span className="text-xs text-[#86868b] font-bold tracking-wider uppercase">{stat.label}</span>
              <div className="w-9 h-9 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0">
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            
            <div className="mt-4">
              <span className="text-3xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                {stat.value}
              </span>
              <p className="text-xs text-[#86868b] font-medium mt-1">
                {stat.context}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Structured Pipelines / Job Posting Monitor */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50 flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Active Pipeline Sourcing Profiles</h2>
          <span className="text-[10px] text-[#86868b] font-bold tracking-wider uppercase bg-[#f2f2f7] dark:bg-[#2c2c2e] px-2.5 py-1 rounded-full border border-black/[0.04] dark:border-white/[0.06]">Real-Time Sync</span>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-[#0071e3] animate-spin" />
            <p className="text-xs text-[#86868b]">Resolving cluster telemetry logs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xs text-[#86868b]">No telemetry parameters found on active postings.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                      {job.title}
                    </h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      job.status === 'active' 
                        ? 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border border-[#34c759]/20' 
                        : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] border border-black/[0.04] dark:border-white/[0.06]'
                    }`}>
                      {job.status}
                    </span>
                    {job.department && (
                      <span className="text-[10px] bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 px-2.5 py-0.5 rounded-full font-semibold">
                        {job.department}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2.5 text-xs text-[#86868b] flex-wrap">
                    <span className="capitalize">{job.jobType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{job.locationType} {job.location ? `(${job.location})` : ''}</span>
                    <span>•</span>
                    <span>{job.openings} {job.openings === 1 ? 'Opening' : 'Openings'}</span>
                  </div>
                </div>

                {/* Pipeline Progression Metrics mapping */}
                <div className="flex items-center gap-6 justify-between md:justify-end shrink-0">
                  <div className="text-left md:text-right min-w-[100px]">
                    <span className="block text-lg font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
                      {job.totalApplications}
                    </span>
                    <span className="block text-[10px] uppercase font-bold text-[#86868b] tracking-wider">
                      Total Profiles
                    </span>
                  </div>

                  <div className="h-8 w-[1px] bg-black/[0.06] dark:bg-white/[0.08] hidden sm:block" />

                  {/* Navigation Route Link Trigger */}
                  <a
                    href={`/dashboard/jobs/${job.id}`}
                    className="w-9 h-9 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#0071e3] text-[#86868b] hover:text-white transition-all flex items-center justify-center group/btn shadow-xs"
                    title="Inspect application nodes"
                  >
                    <ArrowUpRight className="w-4 h-4 transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}