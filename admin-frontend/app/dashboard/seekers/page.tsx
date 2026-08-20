'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';

interface Seeker {
  id: string;
  fullName: string;
  email: string;
  location: string | null;
  availabilityStatus: string;
  discoverable: boolean;
  aiResumeBuilderEnabled: boolean;
  createdAt: string;
  _count: {
    applications: number;
    skills: number;
  };
}

export default function SeekersPage() {
  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useGlassToast();

  useEffect(() => {
    fetchSeekers();
  }, [page, search]);

  const fetchSeekers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/seekers?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setSeekers(res.data.seekers);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
      showToast('Error', 'Failed to fetch job seekers', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAiResume = async (s: Seeker) => {
    const nextVal = !(s.aiResumeBuilderEnabled ?? true);
    // Optimistic UI update
    setSeekers(prev => prev.map(item => item.id === s.id ? { ...item, aiResumeBuilderEnabled: nextVal } : item));
    try {
      const res = await api.put(`/admin/seekers/${s.id}/ai-resume-builder`, {
        aiResumeBuilderEnabled: nextVal,
      });
      if (res.data.success) {
        showToast(
          'Updated',
          `AI Resume Builder for ${s.fullName} is now ${nextVal ? 'ENABLED' : 'LOCKED'}.`,
          'success'
        );
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update status', 'danger');
      fetchSeekers();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
            Job Seeker Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] dark:text-zinc-400 mt-1">
            Manage candidate profiles, discovery opt-in states, and AI CV builder permissions
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="input pl-10 pr-4 py-2 text-xs rounded-2xl"
            placeholder="Search seekers by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Seekers Table Card */}
      <div className="glass-card rounded-3xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121422] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9fafb] dark:bg-[#181b2e] border-b border-black/[0.06] dark:border-white/[0.08] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Candidate</th>
                <th className="py-3.5 px-4">Location &amp; Skills</th>
                <th className="py-3.5 px-4">Availability</th>
                <th className="py-3.5 px-4">Discovery Opt-In</th>
                <th className="py-3.5 px-4">Applications</th>
                <th className="py-3.5 px-4 text-center">AI CV Builder</th>
                <th className="py-3.5 px-5 text-right">Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400 font-medium">
                    <div className="inline-block w-5 h-5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading candidate directory...</p>
                  </td>
                </tr>
              ) : seekers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400">
                    No job seekers found matching your query.
                  </td>
                </tr>
              ) : (
                seekers.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.fullName ? s.fullName.slice(0, 2).toUpperCase() : 'CA'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-white truncate max-w-xs">{s.fullName || 'Anonymous Candidate'}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1 font-semibold">
                        <MapPin size={12} className="text-zinc-400" />
                        <span>{s.location || 'Remote / Not specified'}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">{s._count.skills} verified skills</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        s.availabilityStatus === 'available'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {s.availabilityStatus === 'available' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        <span className="capitalize">{s.availabilityStatus}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        s.discoverable
                          ? 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] border border-[#0071e3]/20'
                          : 'bg-zinc-100 dark:bg-white/10 text-zinc-500'
                      }`}>
                        {s.discoverable ? (
                          <>
                            <Eye size={12} />
                            <span>Opted-In</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} />
                            <span>Private</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      <span>{s._count.applications}</span>
                      <span className="text-[11px] font-normal text-zinc-400"> applied</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleAiResume(s)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                          (s.aiResumeBuilderEnabled ?? true)
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {(s.aiResumeBuilderEnabled ?? true) ? 'Active' : 'Locked'}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300">
                        <ShieldCheck size={12} className="text-[#0071e3]" />
                        <span>Free Forever</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#15182a] text-xs text-zinc-500">
          <div>
            Showing <span className="font-bold text-zinc-800 dark:text-zinc-200">{seekers.length}</span> of <span className="font-bold text-zinc-800 dark:text-zinc-200">{total}</span> candidates
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181b2e] hover:bg-zinc-50 dark:hover:bg-[#22263d] disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span className="px-2 font-semibold">Page {page} of {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181b2e] hover:bg-zinc-50 dark:hover:bg-[#22263d] disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
