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
} from 'lucide-react';

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
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    setMsg(null);
    try {
      const res = await api.post(`/admin/ats/recalculate/${jobId.trim()}`);
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setJobId('');
        fetchJobs();
      } else {
        setMsg({ type: 'error', text: res.data.message });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to trigger batch recalculation' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">ATS Batch Re-Calculation Engine</h1>
        <p className="page-subtitle">Throttled asynchronous AI recalculation of candidate resume scores for massive pools</p>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg.text}</span>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setMsg(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Trigger Form */}
      <div className="glass" style={{ padding: '32px', marginBottom: '32px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '8px' }}>
          <Cpu size={20} className="text-indigo-400" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Trigger Recalculation for a Job Posting</h3>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
          Recalculates match scores for all submitted candidate CVs against the latest job criteria in batches of 5 (with a 3s delay) to stay strictly within Groq API rate limits.
        </p>

        <form onSubmit={handleTrigger} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <label className="label">Job Posting UUID</label>
            <input
              className="input"
              placeholder="e.g. 7c9e6679-7425-40de-944b-e07fc1f90ae7"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            <span>{loading ? 'Triggering...' : 'Start Recalculation'}</span>
          </button>
        </form>
      </div>

      {/* Running / Recent Jobs */}
      <div className="glass" style={{ padding: '32px', width: '100%', boxSizing: 'border-box' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>Active & Recent Batch Jobs</h3>

        {jobs.length === 0 ? (
          <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '32px' }}>
            No background batch recalculations currently active.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {jobs.map((job) => {
              const pct = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;
              return (
                <div key={job.jobPostingId} style={{ background: 'var(--surface2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                        Job Posting: <code style={{ color: 'var(--accent)' }}>{job.jobPostingId}</code>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        Started: {new Date(job.startedAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div>
                      <span className={`badge ${job.status === 'completed' ? 'badge-green' : 'badge-yellow'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {job.status === 'completed' ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Activity size={13} />
                            <span>Processing...</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: 'var(--border)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div
                      style={{
                        background: 'linear-gradient(90deg, var(--accent), var(--success))',
                        height: '100%',
                        width: `${pct}%`,
                        transition: 'width 0.4s ease',
                      }}
                    ></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)' }}>
                    <span>{job.done} of {job.total} CVs analyzed</span>
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
