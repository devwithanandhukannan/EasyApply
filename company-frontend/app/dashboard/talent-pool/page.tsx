'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

export default function TalentPoolPage() {
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPool, setEditPool] = useState<Pool | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchPools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTalentPools();
      setPools(res.data.data ?? []);
    } catch {
      setError('Failed to load talent pools.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  const handleDelete = async (pool: Pool) => {
    if (!confirm(`Delete pool "${pool.name}"? This cannot be undone.`)) return;
    setDeletingId(pool.id);
    try {
      await deleteTalentPool(pool.id);
      setPools(prev => prev.filter(p => p.id !== pool.id));
    } catch {
      alert('Failed to delete pool.');
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = () => { setEditPool(null); setModalOpen(true); };
  const openEdit = (pool: Pool) => { setEditPool(pool); setModalOpen(true); };

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-zinc-800/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Talent Pools</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Segment and manage pipeline profiles for opportunistic sourcing strategies.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-50 text-zinc-950 text-sm font-medium rounded-xl hover:bg-zinc-200 active:bg-zinc-300 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Pool
        </button>
      </div>

      {/* Error Boundary Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-sm text-red-400 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Skeleton Loading Matrices */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[180px] bg-zinc-900/50 border border-zinc-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : pools.length === 0 ? (
        /* Refined Dark Empty Workspace State */
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 max-w-3xl mx-auto">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shadow-md mb-4">
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-zinc-200 mb-1">No execution parameters located</h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-sm px-4">
            No talent pooling segments generated inside this workspace yet. Create a cluster to begin assigning matching applicants.
          </p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-zinc-50 text-zinc-950 text-sm font-medium rounded-xl hover:bg-zinc-200 transition-all shadow-sm"
          >
            Instantiate Cluster Sequence
          </button>
        </div>
      ) : (
        /* Modernized Obsidian Pool Grid Workspace */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pools.map(pool => (
            <div
              key={pool.id}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 shadow-xl transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-zinc-100 text-[15px] leading-snug tracking-tight">
                    {pool.name}
                  </h3>
                  <span className="shrink-0 text-xs font-semibold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-700/50">
                    {pool._count.members} {pool._count.members === 1 ? 'candidate' : 'candidates'}
                  </span>
                </div>
                
                {pool.description ? (
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed pr-1">
                    {pool.description}
                  </p>
                ) : (
                  <p className="text-xs italic text-zinc-600 mt-1.5">No descriptive context configured.</p>
                )}
                
                <p className="text-[11px] font-medium text-zinc-500 tracking-wide mt-4 uppercase">
                  Created {new Date(pool.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>

              {/* Action Sequences */}
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/80">
                <button
                  onClick={() => router.push(`/dashboard/talent-pool/${pool.id}`)}
                  className="flex-1 text-xs font-semibold text-zinc-200 bg-zinc-950 border border-zinc-800 text-center py-2 rounded-xl hover:bg-zinc-800 hover:text-zinc-50 hover:border-zinc-700 transition-all active:bg-zinc-900"
                >
                  View Workspace Members
                </button>
                <button
                  onClick={() => openEdit(pool)}
                  className="p-2 text-zinc-500 hover:text-zinc-200 border border-transparent hover:border-zinc-800 rounded-xl hover:bg-zinc-950 transition-all"
                  title="Modify properties"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(pool)}
                  disabled={deletingId === pool.id}
                  className="p-2 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-950/50 rounded-xl hover:bg-red-950/30 transition-all disabled:opacity-40"
                  title="Purge trace"
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