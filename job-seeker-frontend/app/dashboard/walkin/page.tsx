'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import {
  Video,
  Users,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  KeyRound,
  LogOut,
  X,
  Radio,
  FileText,
  BadgeCheck,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import Link from 'next/link';
import { uploadResume } from '@/app/lib/resumeApi';

interface WalkInRoom {
  id: string;
  title: string;
  description: string | null;
  requiredSkills: string[];
  roomCode: string;
  livekitRoom: string;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  maxQueue: number;
  createdAt: string;
  company: {
    name: string;
    logoUrl: string | null;
    industry: string;
    isVerified: boolean;
    verificationBadge: string;
  };
  _count: {
    queue: number;
  };
  mySkillMatch?: number | null;
  hasApplied?: boolean;
  myEntry?: {
    id: string;
    status: string;
    skillScore: number;
    priorityScore: number;
    livekitToken?: string | null;
    waitingSince: string;
  } | null;
}

interface MyQueueEntry {
  id: string;
  roomId: string;
  status: 'waiting' | 'interviewing' | 'done' | 'skipped';
  skillScore: number;
  priorityScore: number;
  agingBonus: number;
  livekitToken?: string | null;
  waitingSince: string;
  queuePosition: number;
  room: {
    title: string;
    roomCode: string;
    livekitRoom: string;
    status: 'OPEN' | 'PAUSED' | 'CLOSED';
    requiredSkills: string[];
    company: {
      name: string;
      logoUrl: string | null;
      industry: string;
      isVerified: boolean;
      verificationBadge: string;
    };
    _count: {
      queue: number;
    };
  };
}

interface ResumeItem {
  id: string;
  name: string;
  isPrimary: boolean;
  atsScore?: number | null;
}

export default function WalkInRoomsPage() {
  const router = useRouter();
  const { showToast } = useGlassToast();

  const [rooms, setRooms] = useState<WalkInRoom[]>([]);
  const [myQueues, setMyQueues] = useState<MyQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [directCode, setDirectCode] = useState('');
  const [lookingUpCode, setLookingUpCode] = useState(false);

  // Join modal state
  const [selectedRoom, setSelectedRoom] = useState<WalkInRoom | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [joining, setJoining] = useState(false);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetchResumes();
  }, []);

  // Poll active queues every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMyQueuesSilent();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchRooms(), fetchMyQueues()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get(`/walkin/active-rooms?search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        setRooms(res.data.rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  const fetchMyQueues = async () => {
    try {
      const res = await api.get('/walkin/my-queues');
      if (res.data?.success) {
        setMyQueues(res.data.queues);
      }
    } catch (err) {
      console.error('Failed to fetch queues', err);
    }
  };

  const fetchMyQueuesSilent = async () => {
    try {
      const res = await api.get('/walkin/my-queues');
      if (res.data?.success) {
        setMyQueues(res.data.queues);
      }
    } catch {
      // silent
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes');
      if (res.data?.success) {
        setResumes(res.data.resumes || []);
        const primary = res.data.resumes?.find((r: ResumeItem) => r.isPrimary);
        if (primary) setSelectedResumeId(primary.id);
      }
    } catch {
      // ignore
    }
  };

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDirectCodeLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = directCode.trim().toUpperCase();
    if (!cleanCode) return;

    setLookingUpCode(true);
    try {
      const res = await api.get(`/walkin/rooms/${cleanCode}/info`);
      if (res.data?.success && res.data?.room) {
        setSelectedRoom(res.data.room);
        setJoinModalOpen(true);
        setDirectCode('');
      } else {
        showToast('Room Not Found', 'Please verify the room code and try again.', 'danger');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Room not found or no longer active.', 'danger');
    } finally {
      setLookingUpCode(false);
    }
  };

  const openJoinModal = (room: WalkInRoom) => {
    setSelectedRoom(room);
    setJoinModalOpen(true);
  };

  const handleConfirmJoin = async () => {
    if (!selectedRoom) return;
    setJoining(true);
    try {
      const res = await api.post(`/walkin/rooms/${selectedRoom.roomCode}/join`, {
        resumeId: selectedResumeId || undefined,
      });
      if (res.data?.success) {
        showToast(
          'Joined Queue!',
          `You are #${res.data.queuePosition} in queue for ${selectedRoom.title}`,
          'success'
        );
        setJoinModalOpen(false);
        fetchData();
      } else {
        showToast('Cannot Join', res.data?.message || 'Failed to join queue', 'danger');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to join queue', 'danger');
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveQueue = async (roomCode: string) => {
    setLeavingId(roomCode);
    try {
      const res = await api.post(`/walkin/rooms/${roomCode}/leave`);
      if (res.data?.success) {
        showToast('Left Queue', 'You have voluntarily left the walk-in queue.', 'info');
        fetchData();
      } else {
        showToast('Error', res.data?.message || 'Failed to leave queue', 'danger');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to leave queue', 'danger');
    } finally {
      setLeavingId(null);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-full pb-16">
      {/* ─── HERO BANNER ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/60 via-zinc-950 to-zinc-950 border border-indigo-500/20 p-6 sm:p-10 backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            <span>Instant Walk-In Interviews</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Live Walk-In Rooms & Priority Queue
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Skip traditional scheduling. Join live walk-in rooms hosted by employers, get instant AI skill matching, queue up in real time, and receive an instant call into 1-on-1 video interviews when your turn arrives.
          </p>

          {/* Quick Direct Code Input */}
          <form onSubmit={handleDirectCodeLookup} className="pt-2 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Have a room code? e.g. F4WAKG"
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white uppercase tracking-wider font-semibold placeholder:normal-case placeholder:text-zinc-500 placeholder:font-normal outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={lookingUpCode || !directCode.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {lookingUpCode ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <span>Lookup & Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ─── MY ACTIVE QUEUES TRACKER BANNER ──────────────────────────── */}
      {myQueues.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <h2 className="text-base font-bold text-white">Your Active Queues ({myQueues.length})</h2>
            </div>
            <button
              onClick={fetchMyQueues}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myQueues.map((q) => {
              const isInterviewing = q.status === 'interviewing';
              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all relative overflow-hidden backdrop-blur-xl ${
                    isInterviewing
                      ? 'bg-gradient-to-r from-emerald-950/60 via-zinc-950 to-zinc-950 border-emerald-500/50 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-950/90 border-indigo-500/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden text-lg font-bold text-zinc-400">
                        {q.room.company.logoUrl ? (
                          <img src={q.room.company.logoUrl} alt={q.room.company.name} className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="w-6 h-6 text-indigo-400" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-zinc-400">{q.room.company.name}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-md">
                            Code: {q.room.roomCode}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              isInterviewing
                                ? 'bg-emerald-500 text-black animate-bounce font-extrabold'
                                : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                            }`}
                          >
                            {isInterviewing ? '🎉 Recruiter Is Calling You!' : `Waiting in Queue (#${q.queuePosition})`}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white">{q.room.title}</h3>

                        <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1 flex-wrap">
                          <span>
                            Skill Match: <strong className="text-indigo-400 font-semibold">{Math.round(q.skillScore)}%</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Priority Score: <strong className="text-emerald-400 font-semibold">{Math.round(q.priorityScore)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Queue Size: <strong className="text-zinc-200">{q.room._count.queue} waiting</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      {isInterviewing ? (
                        <button
                          onClick={() => router.push(`/meet/${q.room.livekitRoom}?token=${encodeURIComponent(q.livekitToken || '')}`)}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all scale-105 animate-pulse"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Video Interview Now</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <Link
                            href={`/walkin/${q.room.roomCode}`}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-all"
                          >
                            View Live Position
                          </Link>
                          <button
                            onClick={() => handleLeaveQueue(q.room.roomCode)}
                            disabled={leavingId === q.room.roomCode}
                            className="px-3.5 py-2 bg-zinc-900/60 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/60 text-zinc-400 hover:text-rose-400 rounded-xl text-xs font-medium transition-all"
                          >
                            {leavingId === q.room.roomCode ? 'Leaving...' : 'Leave Queue'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── ACTIVE WALK-IN ROOMS DIRECTORY ───────────────────────────── */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white">Active Walk-In Rooms</h2>
            <p className="text-xs text-zinc-400">
              Browse public rooms open for immediate queuing across verified companies
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, company or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
            <p className="text-sm text-zinc-500">Loading open walk-in rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Video className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-zinc-200">No Open Walk-In Rooms Right Now</h3>
              <p className="text-xs text-zinc-500">
                {search
                  ? `No walk-in rooms matched "${search}". Try clearing your search.`
                  : 'Companies host walk-in rooms when actively evaluating candidates. Check back soon or enter a private room code above.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rooms.map((room) => {
              const inQueue = !!room.myEntry;
              const isFull = room._count.queue >= room.maxQueue;
              const isPaused = room.status === 'PAUSED';

              return (
                <div
                  key={room.id}
                  className={`bg-zinc-950 border rounded-2xl p-6 space-y-5 transition-all relative flex flex-col justify-between hover:border-zinc-700/80 ${
                    inQueue ? 'border-indigo-500/40 bg-indigo-950/10' : 'border-zinc-800/80'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden font-bold text-zinc-400">
                          {room.company.logoUrl ? (
                            <img src={room.company.logoUrl} alt={room.company.name} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-300">{room.company.name}</span>
                            {room.company.isVerified && (
                              <span title="Verified Company">
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-500">{room.company.industry || 'General'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {room.hasApplied && (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Applied</span>
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            room.status === 'OPEN'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                          }`}
                        >
                          {room.status}
                        </span>
                      </div>
                    </div>

                    {/* Room Info */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {room.title}
                      </h3>
                      {room.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {room.description}
                        </p>
                      )}
                    </div>

                    {/* Required Skills & Candidate Match */}
                    {room.requiredSkills.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 font-semibold uppercase tracking-wider">Required Skills</span>
                          {room.mySkillMatch !== null && room.mySkillMatch !== undefined && (
                            <span className="text-indigo-400 font-bold">
                              {Math.round(room.mySkillMatch)}% Profile Match
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {room.requiredSkills.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer & Queue Metrics */}
                  <div className="pt-4 border-t border-zinc-900 space-y-4">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>
                          Queue: <strong className="text-zinc-200">{room._count.queue}</strong> / {room.maxQueue}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Code: <code className="text-indigo-400 font-semibold">{room.roomCode}</code>
                      </span>
                    </div>

                    {/* Action button */}
                    {room.hasApplied || inQueue ? (
                      <Link
                        href={`/walkin/${room.roomCode}`}
                        className="w-full py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Applied • View Queue Status</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => openJoinModal(room)}
                        disabled={isPaused || isFull}
                        className="w-full py-2.5 bg-zinc-900 hover:bg-indigo-600 border border-zinc-800 hover:border-indigo-500 disabled:opacity-40 disabled:hover:bg-zinc-900 disabled:hover:border-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-black/40"
                      >
                        {isPaused ? (
                          <span>Room Temporarily Paused</span>
                        ) : isFull ? (
                          <span>Queue Capacity Full</span>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Join Walk-In Queue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── JOIN QUEUE CONFIRMATION MODAL ────────────────────────────── */}
      {joinModalOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setJoinModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold uppercase">
                {selectedRoom.company.name}
              </div>
              <h2 className="text-xl font-bold text-white">{selectedRoom.title}</h2>
              <p className="text-xs text-zinc-400">
                You are about to enter the live priority queue for immediate evaluation.
              </p>
            </div>

            {/* Required Skills match preview */}
            {selectedRoom.requiredSkills.length > 0 && (
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Required Skills for Scoring</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRoom.requiredSkills.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume / CV Selection & Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  Select or Upload Resume / CV
                </label>
                <label className="cursor-pointer text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>Upload New CV</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        showToast('Uploading CV...', 'Analyzing resume with AI parsing', 'info');
                        const res = await uploadResume(file, file.name.replace(/\.[^/.]+$/, ''));
                        if (res?.data?.success && res?.data?.data) {
                          showToast('CV Uploaded', `${res.data.data.name} is ready!`, 'success');
                          await fetchResumes();
                          setSelectedResumeId(res.data.data.id);
                        }
                      } catch (err: any) {
                        showToast('Upload Error', err.response?.data?.message || 'Failed to upload CV', 'danger');
                      }
                    }}
                  />
                </label>
              </div>

              {resumes.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {resumes.map((r) => (
                    <label
                      key={r.id}
                      onClick={() => setSelectedResumeId(r.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedResumeId === r.id
                          ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className={`w-4 h-4 shrink-0 ${selectedResumeId === r.id ? 'text-indigo-400' : 'text-zinc-500'}`} />
                        <span className="text-xs font-medium truncate">{r.name}</span>
                        {r.isPrimary && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-zinc-800 text-zinc-300 rounded">
                            Primary
                          </span>
                        )}
                        {r.atsScore && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 rounded">
                            ATS: {r.atsScore}
                          </span>
                        )}
                      </div>
                      <input
                        type="radio"
                        name="resumeChoice"
                        checked={selectedResumeId === r.id}
                        onChange={() => setSelectedResumeId(r.id)}
                        className="accent-indigo-500"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center space-y-2 bg-zinc-900/30">
                  <p className="text-xs text-zinc-400">No resumes found in your profile.</p>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Resume PDF</span>
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          showToast('Uploading CV...', 'Analyzing resume with AI parsing', 'info');
                          const res = await uploadResume(file, file.name.replace(/\.[^/.]+$/, ''));
                          if (res?.data?.success && res?.data?.data) {
                            showToast('CV Uploaded', `${res.data.data.name} uploaded!`, 'success');
                            await fetchResumes();
                            setSelectedResumeId(res.data.data.id);
                          }
                        } catch (err: any) {
                          showToast('Upload Error', err.response?.data?.message || 'Failed to upload CV', 'danger');
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setJoinModalOpen(false)}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJoin}
                disabled={joining}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scoring & Joining...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm & Enter Queue</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
