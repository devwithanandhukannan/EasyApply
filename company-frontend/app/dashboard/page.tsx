'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { ArrowUpRight, Briefcase, Users, FileText, Sparkles, Loader2 } from 'lucide-react';
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
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>({ totalJobs: 0, activeJobs: 0, totalApplications: 0 });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/company/dashboard'); // Corresponds to getCompanyDashboard
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
      accent: 'text-zinc-400 bg-zinc-900 border-zinc-800'
    },
    { 
      label: 'Total Applications', 
      value: loading ? '...' : String(summary.totalApplications), 
      context: 'Aggregated across cycles', 
      icon: Users,
      accent: 'text-zinc-400 bg-zinc-900 border-zinc-800'
    },
    { 
      label: 'Average Velocity', 
      value: loading ? '...' : summary.totalJobs > 0 ? (summary.totalApplications / summary.totalJobs).toFixed(1) : '0.0', 
      context: 'Applicants per cluster node', 
      icon: FileText,
      accent: 'text-zinc-400 bg-zinc-900 border-zinc-800'
    },
  ];

  return (
    <div className="space-y-8 min-h-screen bg-zinc-950 text-zinc-100 p-1">
      
      {/* Header Profile Info Panel */}
      <div className="border-b border-zinc-800/60 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-50 tracking-tight sm:text-2xl">
            Welcome back, {user?.company?.name || 'Workspace Leader'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-medium">
            Review your dynamic team metrics and platform pipeline logs.
          </p>
        </div>
        
        
      </div>

      {/* Error Bound Warning Block */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-sm text-red-400 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          {error}
        </div>
      )}

      {/* Metrics Parameter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {metrics.map((stat, idx) => (
          <div
            key={idx}
            className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 hover:border-zinc-800 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between w-full">
              <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">{stat.label}</span>
              <div className={`p-2 rounded-xl border ${stat.accent}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            
            <div className="mt-4">
              <span className="text-3xl font-bold text-zinc-50 tracking-tight">
                {stat.value}
              </span>
              <p className="text-[11px] text-zinc-500 font-medium mt-1">
                {stat.context}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Structured Pipelines / Job Posting Monitor */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Pipeline Sourcing Profiles</h2>
          <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Real-Time Sync</span>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
            <p className="text-xs text-zinc-500">Resolving cluster telemetry logs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 border-t border-zinc-900">
            <p className="text-xs text-zinc-500">No telemetry parameters found on active postings.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-5 hover:bg-zinc-900/40 transition-all duration-150 group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-zinc-100 group-hover:text-zinc-50 tracking-tight">
                      {job.title}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border uppercase tracking-wider ${
                      job.status === 'active' 
                        ? 'bg-green-950/30 text-green-400 border-green-900/30' 
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                    }`}>
                      {job.status}
                    </span>
                    {job.department && (
                      <span className="text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-800/80 px-2 py-0.5 rounded-md">
                        {job.department}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
                    <span>{job.jobType.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{job.locationType} {job.location ? `(${job.location})` : ''}</span>
                    <span>•</span>
                    <span>{job.openings} Openings</span>
                  </div>
                </div>

                {/* Pipeline Progression Metrics mapping */}
                <div className="flex items-center gap-6 justify-between md:justify-end shrink-0">
                  <div className="text-left md:text-right min-w-[100px]">
                    <span className="block text-lg font-bold text-zinc-200 tracking-tight">
                      {job.totalApplications}
                    </span>
                    <span className="block text-[10px] uppercase font-semibold text-zinc-600 tracking-wide">
                      Total Profiles
                    </span>
                  </div>

                  <div className="h-9 w-[1px] bg-zinc-800 hidden sm:block" />

                  {/* Navigation Route Link Trigger */}
                  <a
                    href={`/dashboard/jobs/${job.id}`}
                    className="p-2 text-zinc-500 hover:text-zinc-200 border border-transparent hover:border-zinc-800 rounded-xl hover:bg-zinc-950 transition-all flex items-center justify-center group/btn"
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