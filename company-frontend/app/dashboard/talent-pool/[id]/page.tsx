'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getTalentPoolMembers,
  removeTalentPoolMember,
} from '../../../lib/api/crm';

interface Member {
  id: string;
  createdAt: string;
  jobSeekerProfile: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    profilePhotoUrl?: string;
    location?: string;
    availabilityStatus: string;
    skills: { name: string }[];
  };
}

interface Pool {
  id: string;
  name: string;
  description?: string;
}

// Sophisticated, muted tones for the black theme workspace
const availabilityColors: Record<string, string> = {
  available: 'bg-green-950/40 text-green-400 border-green-900/30',
  not_available: 'bg-red-950/40 text-red-400 border-red-900/30',
  spot_available: 'bg-amber-950/40 text-amber-400 border-amber-900/30',
};

const availabilityLabels: Record<string, string> = {
  available: 'Available',
  not_available: 'Not Available',
  spot_available: 'Open to Offers',
};

export default function TalentPoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [pool, setPool] = useState<Pool | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTalentPoolMembers(id);
      setPool(res.data.pool);
      setMembers(res.data.data ?? []);
    } catch {
      setError('Failed to load pool members.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRemove = async (member: Member) => {
    if (!confirm(`Remove ${member.jobSeekerProfile.fullName} from this pool?`)) return;
    setRemovingId(member.id);
    try {
      await removeTalentPoolMember(id, member.id);
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch {
      alert('Failed to remove member.');
    } finally {
      setRemovingId(null);
    }
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return (
      m.jobSeekerProfile.fullName.toLowerCase().includes(q) ||
      m.jobSeekerProfile.email.toLowerCase().includes(q) ||
      (m.jobSeekerProfile.location ?? '').toLowerCase().includes(q) ||
      m.jobSeekerProfile.skills.some(s => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navigation Breadcrumb */}
      <button
        onClick={() => router.push('/dashboard/talent-pool')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 mb-6 transition-colors group"
      >
        <svg className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pools
      </button>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-5 border-b border-zinc-800/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{pool?.name ?? 'Talent Pool'}</h1>
          {pool?.description ? (
            <p className="text-sm text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">{pool.description}</p>
          ) : (
            <p className="text-xs italic text-zinc-600 mt-1.5">No pipeline criteria description assigned.</p>
          )}
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mt-3">
            {members.length} {members.length === 1 ? 'candidate' : 'candidates'} segmented
          </p>
        </div>
      </div>

      {/* Error Output block */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-sm text-red-400 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Search Controller Layer */}
      {!loading && members.length > 0 && (
        <div className="relative mb-6">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            placeholder="Query workspace criteria by candidate name, skill tag, or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-all shadow-inner"
          />
        </div>
      )}

      {/* Grid Allocation Blocks */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-zinc-900/50 border border-zinc-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty Filter Bounds Layout */
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-300">
            {search ? 'No data matches requested lookup sequence.' : 'This segment contains no active candidate vectors.'}
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            {search ? 'Verify matching string values and evaluate fallback sequences.' : 'Map application records to this sequence using profile action routes.'}
          </p>
        </div>
      ) : (
        /* Sourcing Row Cards */
        <div className="space-y-3">
          {filtered.map(member => {
            const p = member.jobSeekerProfile;
            const initials = p.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div
                key={member.id}
                className="bg-zinc-900 border border-zinc-800/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-start gap-4 min-w-0">
                  {/* Photo Node */}
                  <div className="shrink-0">
                    {p.profilePhotoUrl ? (
                      <img
                        src={p.profilePhotoUrl}
                        alt={p.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-zinc-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-semibold text-sm">
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Operational Metrics metadata */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-zinc-100 text-sm tracking-tight">{p.fullName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${availabilityColors[p.availabilityStatus] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {availabilityLabels[p.availabilityStatus] ?? p.availabilityStatus}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{p.email}</p>
                    {p.location && (
                      <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                        <span className="text-zinc-600">📍</span> {p.location}
                      </p>
                    )}
                    
                    {p.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {p.skills.slice(0, 5).map(s => (
                          <span key={s.name} className="text-[11px] font-medium bg-zinc-950 border border-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded-md">
                            {s.name}
                          </span>
                        ))}
                        {p.skills.length > 5 && (
                          <span className="text-[10px] font-medium text-zinc-500 self-center pl-1">
                            +{p.skills.length - 5} additional
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking Timestamp Sequences + Action Vectors */}
                <div className="shrink-0 flex sm:flex-col items-between sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 text-right">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-600 sm:hidden">Segmented</span>
                    <p className="text-xs text-zinc-500 font-medium">
                      {new Date(member.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleRemove(member)}
                    disabled={removingId === member.id}
                    className="text-xs font-semibold text-zinc-400 hover:text-red-400 disabled:opacity-40 flex items-center gap-1.5 py-1 px-2 hover:bg-red-950/20 rounded-lg transition-colors border border-transparent hover:border-red-900/30"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {removingId === member.id ? 'Purging Trace...' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}