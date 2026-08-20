'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Play,
  Loader2,
  CheckCircle2,
  Activity,
  X,
  Cpu,
  Bot,
  Zap,
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';

interface BatchJob {
  jobPostingId: string;
  status: string;
  total: number;
  done: number;
  startedAt: string;
}

export default function AtsBatchPage() {
  const [jobId, setJobId] = useState('');
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useGlassToast();

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/admin/ats/jobs');
      if (res.data.success) {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/admin/ats/recalculate/${jobId.trim()}`);
      if (res.data.success) {
        showToast('Triggered', res.data.message, 'success');
        setJobId('');
        fetchJobs();
      } else {
        showToast('Error', res.data.message, 'danger');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to trigger batch recalculation', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
          ATS Batch Re-Calculation Engine
        </h1>
        <p className="text-xs sm:text-sm text-[#6b7280] dark:text-zinc-400 mt-1">
          Asynchronous AI re-evaluation of applicant match scores for large candidate pools
        </p>
      </div>

      {/* Trigger Form Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Trigger Batch Re-Calculation</h3>
            <p className="text-xs text-zinc-400">
              Re-evaluates match scores for all submitted candidate CVs against the updated job description using Groq LLM.
            </p>
          </div>
        </div>

        <form onSubmit={handleTrigger} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end pt-2">
          <div className="flex-1">
            <label className="label">Job Posting UUID</label>
            <input
              className="input"
              placeholder="e.g. 7c9e6679-7425-40de-944b-e07fc1f90ae7"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-xs flex items-center justify-center gap-1.5 h-[42px] px-5 shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            <span>{loading ? 'Triggering Engine...' : 'Start Recalculation'}</span>
          </button>
        </form>
      </div>

      {/* Active & Recent Batch Jobs */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">Active &amp; Recent Batch Tasks</h3>

        {jobs.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs font-medium">
            No background batch recalculations currently queued or running.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;
              return (
                <div
                  key={job.jobPostingId}
                  className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#181b2e] border border-black/[0.04] dark:border-white/[0.06] space-y-3"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white">
                        Job Posting: <code className="text-[#0071e3] font-mono text-[11px]">{job.jobPostingId}</code>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Started at {new Date(job.startedAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      job.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {job.status === 'completed' ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Activity size={12} className="animate-spin" />
                          <span>Processing...</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#0071e3] to-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold">
                    <span>{job.done} of {job.total} CVs processed</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
