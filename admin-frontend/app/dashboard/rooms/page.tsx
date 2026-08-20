'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import {
  Search,
  Video,
  DoorOpen,
  Building2,
  Trash2,
  Play,
  Pause,
  XCircle,
  Copy,
  Check,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';

interface CompanyInfo {
  id: string;
  name: string;
  email: string;
  logoUrl: string | null;
  industry: string | null;
}

interface QueueCandidate {
  id: string;
  status: string;
  skillScore: number;
  priorityScore: number;
  waitingSince: string;
  jobSeekerProfile: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface WalkInRoom {
  id: string;
  companyId: string;
  company: CompanyInfo;
  title: string;
  description: string | null;
  requiredSkills: string[];
  minExperience: string | null;
  priorityThreshold: number;
  evaluationCriteria: string | null;
  roomCode: string;
  livekitRoom: string;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  maxQueue: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    queue: number;
  };
  queue: QueueCandidate[];
}

interface RoomStats {
  totalRooms: number;
  openRooms: number;
  pausedRooms: number;
  closedRooms: number;
  activeQueueCount: number;
}

export default function AdminWalkInRoomsPage() {
  const [rooms, setRooms] = useState<WalkInRoom[]>([]);
  const [stats, setStats] = useState<RoomStats>({
    totalRooms: 0,
    openRooms: 0,
    pausedRooms: 0,
    closedRooms: 0,
    activeQueueCount: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<WalkInRoom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status updating state
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const { showToast } = useGlassToast();

  const fetchRooms = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await api.get(`/admin/walkin/rooms?${params.toString()}`);
      if (res.data.success) {
        setRooms(res.data.rooms || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch rooms:', err);
      showToast('Error', err.response?.data?.message || 'Failed to retrieve walk-in rooms', 'danger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, statusFilter, showToast]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Handle Search Input with Enter / Debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRooms();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Copied', `Room Code ${code} copied to clipboard`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleUpdateStatus = async (roomId: string, newStatus: 'OPEN' | 'PAUSED' | 'CLOSED') => {
    setUpdatingStatusId(roomId);
    try {
      const res = await api.put(`/admin/walkin/rooms/${roomId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast('Status Updated', `Room status changed to ${newStatus}`, 'success');
        setRooms(prev =>
          prev.map(r => (r.id === roomId ? { ...r, status: newStatus } : r))
        );
        fetchRooms(true);
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
      showToast('Error', err.response?.data?.message || 'Failed to update status', 'danger');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/walkin/rooms/${roomToDelete.id}`);
      if (res.data.success) {
        showToast('Room Deleted', res.data.message || `Deleted room [${roomToDelete.roomCode}]`, 'success');
        setDeleteModalOpen(false);
        setRoomToDelete(null);
        fetchRooms(true);
      }
    } catch (err: any) {
      console.error('Failed to delete room:', err);
      showToast('Delete Failed', err.response?.data?.message || 'Could not delete room', 'danger');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-12 font-sans">
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Live Interview Infrastructure
            </span>
            <span className="text-xs text-zinc-400 font-medium">Real-Time WebRTC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
            Walk-In Live Rooms
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Search, monitor, control live status, and manage company walk-in video interview rooms across the platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRooms(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1c1c1e] hover:bg-zinc-100 dark:hover:bg-[#2c2c2e] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-2xl transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── STAT METRICS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#141415] border border-zinc-200/80 dark:border-white/[0.08] p-4 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Total Rooms</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0071e3] flex items-center justify-center">
              <DoorOpen size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{stats.totalRooms}</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Configured rooms</p>
        </div>

        <div className="bg-white dark:bg-[#141415] border border-zinc-200/80 dark:border-white/[0.08] p-4 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Live & Open</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Video size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{stats.openRooms}</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Accepting candidates</p>
        </div>

        <div className="bg-white dark:bg-[#141415] border border-zinc-200/80 dark:border-white/[0.08] p-4 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Paused</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Pause size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{stats.pausedRooms}</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Temporary break</p>
        </div>

        <div className="bg-white dark:bg-[#141415] border border-zinc-200/80 dark:border-white/[0.08] p-4 rounded-3xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Closed</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-500/10 text-zinc-500 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-600 dark:text-zinc-400 tracking-tight">{stats.closedRooms}</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Ended sessions</p>
        </div>

        <div className="bg-white dark:bg-[#141415] border border-zinc-200/80 dark:border-white/[0.08] p-4 rounded-3xl shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Live In-Queue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{stats.activeQueueCount}</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Job seekers waiting</p>
        </div>
      </div>

      {/* ─── CONTROLS & SEARCH BAR ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#141415] border border-zinc-200/80 dark:border-white/[0.08] p-4 rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code (e.g. FMPZZ3), title, company, skill..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-[#1c1c1e] border border-zinc-200 dark:border-white/10 rounded-2xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#0071e3] transition"
          />
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#1c1c1e] p-1.5 rounded-2xl border border-zinc-200/60 dark:border-white/5 w-full md:w-auto overflow-x-auto">
          {[
            { key: 'ALL', label: 'All Rooms' },
            { key: 'OPEN', label: 'Live / Open' },
            { key: 'PAUSED', label: 'Paused' },
            { key: 'CLOSED', label: 'Closed' },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-[#2c2c2e] text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── ROOMS GRID ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
          <p className="text-xs font-medium">Scanning live walk-in rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white dark:bg-[#141415] border border-zinc-200/80 dark:border-white/[0.08] rounded-3xl p-12 text-center space-y-3">
          <DoorOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">No Walk-In Rooms Found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            {search || statusFilter !== 'ALL'
              ? 'No rooms match your current search query or status filter. Try clearing the filters.'
              : 'There are currently no walk-in rooms created by employers on the platform.'}
          </p>
          {(search || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold rounded-2xl text-zinc-800 dark:text-white transition cursor-pointer"
            >
              Clear Search Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => {
            const isLive = room.status === 'OPEN';
            const isPaused = room.status === 'PAUSED';
            const isClosed = room.status === 'CLOSED';
            const queueCount = room._count?.queue ?? 0;
            const utilization = Math.min(100, Math.round((queueCount / (room.maxQueue || 50)) * 100));

            return (
              <div
                key={room.id}
                className="bg-white dark:bg-[#141415] border border-zinc-200/80 dark:border-white/[0.08] rounded-3xl p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between space-y-4"
              >
                {/* Top: Company info & Status Badge */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-[#202022] border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden font-bold text-sm text-[#0071e3]">
                        {room.company?.logoUrl ? (
                          <img src={room.company.logoUrl} alt={room.company.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {room.company?.name || 'Company'}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate">{room.company?.email}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                        isLive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isPaused
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                      }`}
                    >
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      {room.status}
                    </span>
                  </div>

                  {/* Room Title & Code */}
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug">
                      {room.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => handleCopyCode(room.roomCode)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-[#0071e3] dark:text-blue-400 text-xs font-mono font-bold transition cursor-pointer"
                        title="Click to copy room code"
                      >
                        {copiedCode === room.roomCode ? <Check size={12} /> : <Copy size={12} />}
                        <span>CODE: {room.roomCode}</span>
                      </button>

                      {room.minExperience && (
                        <span className="text-[11px] text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                          Exp: {room.minExperience}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Required Skills Tags */}
                  {room.requiredSkills && room.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {room.requiredSkills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300"
                        >
                          {skill}
                        </span>
                      ))}
                      {room.requiredSkills.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-[10px] text-zinc-400 font-medium">
                          +{room.requiredSkills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Queue Meter */}
                  <div className="bg-zinc-50 dark:bg-[#1a1a1c] border border-zinc-200/60 dark:border-white/5 p-3 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                        <Users size={13} className="text-[#0071e3]" />
                        Active Queue
                      </span>
                      <span className="text-zinc-900 dark:text-white font-mono">
                        {queueCount} / {room.maxQueue}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          utilization > 80 ? 'bg-rose-500' : utilization > 50 ? 'bg-amber-500' : 'bg-[#0071e3]'
                        }`}
                        style={{ width: `${utilization}%` }}
                      />
                    </div>

                    {/* Active candidate / top queue preview */}
                    {room.queue && room.queue.length > 0 ? (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate pt-0.5">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200">Next:</span>{' '}
                        {room.queue[0]?.jobSeekerProfile?.fullName || 'Candidate'} ({Math.round(room.queue[0]?.priorityScore || 0)} pts)
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 italic pt-0.5">Queue is currently empty</p>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-2">
                  {/* Status Toggle buttons */}
                  <div className="flex items-center gap-1">
                    {room.status !== 'OPEN' && (
                      <button
                        onClick={() => handleUpdateStatus(room.id, 'OPEN')}
                        disabled={updatingStatusId === room.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                        title="Set room to Open"
                      >
                        <Play size={12} />
                        <span>Open</span>
                      </button>
                    )}
                    {room.status === 'OPEN' && (
                      <button
                        onClick={() => handleUpdateStatus(room.id, 'PAUSED')}
                        disabled={updatingStatusId === room.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                        title="Pause room"
                      >
                        <Pause size={12} />
                        <span>Pause</span>
                      </button>
                    )}
                    {room.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleUpdateStatus(room.id, 'CLOSED')}
                        disabled={updatingStatusId === room.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                        title="Close room"
                      >
                        <XCircle size={12} />
                        <span>Close</span>
                      </button>
                    )}
                  </div>

                  {/* Delete Room Button */}
                  <button
                    onClick={() => {
                      setRoomToDelete(room);
                      setDeleteModalOpen(true);
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    title="Delete room"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── PAGINATION ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/10">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing Page <span className="font-bold text-zinc-900 dark:text-white">{page}</span> of{' '}
            <span className="font-bold text-zinc-900 dark:text-white">{totalPages}</span> ({total} rooms)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-white dark:bg-[#1c1c1e] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-white dark:bg-[#1c1c1e] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 disabled:opacity-30 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
      {deleteModalOpen && roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Delete Walk-In Room?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                You are about to permanently delete{' '}
                <strong className="text-zinc-900 dark:text-white font-bold">
                  [{roomToDelete.roomCode}] {roomToDelete.title}
                </strong>{' '}
                belonging to <strong className="text-zinc-900 dark:text-white">{roomToDelete.company?.name}</strong>.
              </p>
              <p className="text-xs text-rose-500 font-semibold pt-1">
                ⚠️ All active waiting queue entries, candidate registrations, and live video sessions for this room will be permanently wiped.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setRoomToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-2xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/20"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
