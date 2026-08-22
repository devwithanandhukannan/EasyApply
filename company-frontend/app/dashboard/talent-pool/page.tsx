'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {useGlassToast} from '@/app/components/GlassToastContainer';
import {
  getTalentPools,
  deleteTalentPool,
} from '../../lib/api/crm';
import TalentPoolModal from '../../components/TalentPoolModal';

interface Pool {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count: { members: number };
}

import { useAuth } from '@/app/contexts/AuthContext';
import LockedFeaturePaywall from '@/app/components/LockedFeaturePaywall';

export default function TalentPoolPage() {
  const router = useRouter();
  const { showToast } = useGlassToast();
  const { hasFeature } = useAuth();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPool, setEditPool] = useState<Pool | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const hasAccess = hasFeature('crmTalentPool');

  const fetchPools = useCallback(async () => {
    if (!hasAccess) return;
    setLoading(true);
    try {
      const res = await getTalentPools();
      setPools(res.data.data ?? []);
    } catch {
      setError('Failed to load talent pools.');
    } finally {
      setLoading(false);
    }
  }, [hasAccess]);

  useEffect(() => { 
    if (hasAccess) {
      fetchPools();
    }
  }, [fetchPools, hasAccess]);

  if (!hasAccess) {
    return (
      <LockedFeaturePaywall
        featureKey="crmTalentPool"
        featureTitle="Company Talent Pool & Candidate CRM"
        featureDescription="Segment and organize qualified candidate profiles into private talent pools for active and future recruitment pipelines."
      />
    );
  }

  const handleDelete = async (pool: Pool) => {
    if (!confirm(`Delete pool "${pool.name}"? This cannot be undone.`)) return;
    setDeletingId(pool.id);
    try {
      await deleteTalentPool(pool.id);
      setPools(prev => prev.filter(p => p.id !== pool.id));
    } catch {
      showToast('failed', 'Failed to delete pool.', 'danger');
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = () => { setEditPool(null); setModalOpen(true); };
  const openEdit = (pool: Pool) => { setEditPool(pool); setModalOpen(true); };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 text-[#1d1d1f] dark:text-[#f5f5f7]">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Company Talent Pools</h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-0.5">
            Segment and organize qualified candidate profiles for active and future recruitment pipelines.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold rounded-2xl transition-all shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Pool
        </button>
      </div>

      {/* Error Boundary Banner */}
      {error && (
        <div className="p-4 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl text-xs text-[#ff3b30] flex items-center gap-2 font-medium">
          <svg className="w-4 h-4 text-[#ff3b30] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Skeleton Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[200px] bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : pools.length === 0 ? (
        /* Refined Apple Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center border border-black/[0.06] dark:border-white/[0.08] rounded-3xl bg-white dark:bg-[#1c1c1e] max-w-2xl mx-auto shadow-sm p-8 space-y-4">
          <div className="w-14 h-14 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-[#0071e3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">No Talent Pools Created</h3>
            <p className="text-xs text-[#86868b] max-w-sm mt-1">
              Create talent pools to categorize, curate, and nurture candidates for your upcoming roles.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold rounded-2xl transition-all shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer"
          >
            Create Your First Pool
          </button>
        </div>
      ) : (
        /* Modern Apple Pool Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pools.map(pool => (
            <div
              key={pool.id}
              className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-[#1d1d1f] dark:text-[#f5f5f7] text-base leading-snug tracking-tight">
                    {pool.name}
                  </h3>
                  <span className="shrink-0 text-[11px] font-bold bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] dark:text-[#47a0ff] px-2.5 py-0.5 rounded-full">
                    {pool._count?.members ?? 0} {(pool._count?.members ?? 0) === 1 ? 'candidate' : 'candidates'}
                  </span>
                </div>
                
                {pool.description ? (
                  <p className="text-xs text-[#6e6e73] dark:text-[#aeaeb2] line-clamp-2 mt-1.5 leading-relaxed">
                    {pool.description}
                  </p>
                ) : (
                  <p className="text-xs italic text-[#86868b] mt-1.5">No description provided.</p>
                )}
                
                <p className="text-[10px] font-semibold text-[#86868b] tracking-wider mt-4 uppercase">
                  Created {new Date(pool.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
                <button
                  onClick={() => router.push(`/dashboard/talent-pool/${pool.id}`)}
                  className="flex-1 text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] text-center py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  View Members
                </button>
                <button
                  onClick={() => openEdit(pool)}
                  className="p-2.5 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08] rounded-xl hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-all cursor-pointer"
                  title="Edit Pool"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(pool)}
                  disabled={deletingId === pool.id}
                  className="p-2.5 text-[#ff3b30] hover:bg-[#ff3b30]/10 border border-black/[0.06] dark:border-white/[0.08] rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                  title="Delete Pool"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TalentPoolModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchPools}
        editPool={editPool}
      />
    </div>
  );
}