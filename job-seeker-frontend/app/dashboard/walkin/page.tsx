'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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

export interface CvScoreMatrix {
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  strengths: string[];
  missingSkills: string[];
  matchedSkills: string[];
  summary: string;
  recommendation: 'STRONG_MATCH' | 'GOOD_MATCH' | 'MODERATE_MATCH' | 'POOR_MATCH';
}

interface WalkInRoom {
  id: string;
  title: string;
  description: string | null;
  requiredSkills: string[];
  minExperience?: string | null;
  priorityThreshold?: number;
  evaluationCriteria?: string | null;
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
    agingBonus?: number;
    minutesWaiting?: number;
    effectivePriority?: number;
    cvAnalysis?: CvScoreMatrix | null;
    livekitToken?: string | null;
    waitingSince: string;
  } | null;
}

interface MyQueueEntry {
  id: string;
  roomId: string;
  status: 'waiting' | 'priority' | 'interviewing' | 'accepted' | 'done' | 'skipped' | 'rejected';
  skillScore: number;
  priorityScore: number;
  agingBonus: number;
  minutesWaiting?: number;
  effectivePriority?: number;
  cvAnalysis?: CvScoreMatrix | null;
  livekitToken?: string | null;
  waitingSince: string;
  queuePosition: number;
  room: {
    title: string;
    roomCode: string;
    livekitRoom: string;
    status: 'OPEN' | 'PAUSED' | 'CLOSED';
    requiredSkills: string[];
    minExperience?: string | null;
    evaluationCriteria?: string | null;
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

  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'applied'>('all');

  const appliedRoomsCount = useMemo(
    () => rooms.filter((r) => r.hasApplied || r.myEntry).length,
    [rooms]
  );
  const newRoomsCount = useMemo(
    () => rooms.filter((r) => !r.hasApplied && !r.myEntry).length,
    [rooms]
  );

  const displayedRooms = useMemo(() => {
    if (activeTab === 'new') {
      return rooms.filter((r) => !r.hasApplied && !r.myEntry);
    }
    if (activeTab === 'applied') {
      return rooms.filter((r) => r.hasApplied || r.myEntry);
    }
    return rooms;
  }, [rooms, activeTab]);

  useEffect(() => {
    fetchData();
    fetchResumes();
  }, []);

  // Poll active queues and rooms every 5 seconds for real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMyQueuesSilent();
      fetchRoomsSilent();
    }, 5000);
    return () => clearInterval(interval);
  }, [search]);

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

  const fetchRoomsSilent = async () => {
    try {
      const res = await api.get(`/walkin/active-rooms?search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        setRooms(res.data.rooms);
      }
    } catch {
      // silent
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
    <div className="space-y-8 w-full max-w-full">
      {/* ─── HEADER / HERO SECTION ───────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-zinc-950 to-zinc-950 border border-indigo-500/30 p-6 sm:p-8 lg:p-10 backdrop-blur-xl w-full">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Walk-In Interview Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Queue Live, Interview Fast
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Skip traditional scheduling delays. Join live walk-in queues, get prioritized by your skills, and connect directly with hiring managers in 1-on-1 video rooms.
            </p>
          </div>

          {/* Quick Room Code Input */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 w-full lg:w-84 space-y-3 shrink-0 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>Have a Private Room Code?</span>
            </div>
            <form onSubmit={handleDirectCodeLookup} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. F4WAKG"
                maxLength={6}
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value.toUpperCase())}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 font-mono font-bold tracking-wider uppercase outline-none transition-all"
              />
              <button
                type="submit"
                disabled={lookingUpCode || !directCode.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
              >
                {lookingUpCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Join</span>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── ACTIVE QUEUE STATUS TRACKER (IF IN ANY QUEUE) ───────────── */}
      {myQueues.length > 0 && (
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                Your Active Queue Tracker ({myQueues.length})
              </h2>
            </div>
            <span className="text-[11px] text-zinc-500">Live 5s Polling Active</span>
          </div>

          <div className="grid grid-cols-1 gap-3 w-full">
            {myQueues.map((q) => {
              const isInterviewing = q.status === 'interviewing';

              return (
                <div
                  key={q.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all w-full ${
                    isInterviewing
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-zinc-950 border-indigo-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isInterviewing
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {isInterviewing ? <Video className="w-5 h-5" /> : `#${q.queuePosition}`}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{q.room.title}</span>
                          <span className="text-xs text-zinc-400 font-medium">({q.room.company.name})</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              isInterviewing
                                ? 'bg-emerald-500 text-black font-extrabold animate-bounce'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                          <span>
                            Skill Match: <strong className="text-indigo-400 font-semibold">{Math.round(q.skillScore)}%</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Priority: <strong className="text-emerald-400 font-semibold">{Math.round(q.priorityScore)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Waiting: <strong className="text-zinc-200">{q.room._count.queue}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isInterviewing ? (
                        <button
                          onClick={() => router.push(`/meet/${q.room.livekitRoom}?token=${encodeURIComponent(q.livekitToken || '')}`)}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all animate-pulse"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Video Interview Now</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLeaveQueue(q.room.roomCode)}
                          disabled={leavingId === q.room.roomCode}
                          className="px-3.5 py-2 bg-zinc-900/60 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-900/60 text-zinc-400 hover:text-rose-400 rounded-xl text-xs font-medium transition-all"
                        >
                          {leavingId === q.room.roomCode ? 'Leaving...' : 'Leave Queue'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── ACTIVE WALK-IN ROOMS DIRECTORY (FULL WIDTH) ──────────────── */}
      <div className="space-y-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Walk-In Rooms Directory</h2>
            <p className="text-xs text-zinc-400">
              Browse rooms for immediate evaluation or monitor your live queue progress
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter Tabs Toggle Buttons */}
            <div className="flex items-center p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Rooms ({rooms.length})
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'new'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Available ({newRoomsCount})</span>
              </button>
              <button
                onClick={() => setActiveTab('applied')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'applied'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Applied ({appliedRoomsCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rooms or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3 w-full">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
            <p className="text-sm text-zinc-500">Loading walk-in rooms...</p>
          </div>
        ) : displayedRooms.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-16 text-center space-y-4 w-full">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Video className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-zinc-200">
                {activeTab === 'applied'
                  ? 'No Applied Walk-In Rooms'
                  : activeTab === 'new'
                  ? 'No New Rooms Available'
                  : 'No Walk-In Rooms Found'}
              </h3>
              <p className="text-xs text-zinc-500">
                {search
                  ? `No walk-in rooms matched "${search}". Try clearing your search.`
                  : activeTab === 'applied'
                  ? 'You have not queued into any walk-in rooms yet. Switch to "Available" to join an open room.'
                  : 'Companies host walk-in rooms when actively evaluating candidates. Check back soon!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
            {displayedRooms.map((room) => {
              const appliedEntry = room.myEntry;
              const isApplied = Boolean(room.hasApplied || appliedEntry);
              const isFull = room._count.queue >= room.maxQueue;
              const isPaused = room.status === 'PAUSED';

              const entryStatus = appliedEntry?.status;
              const isInterviewing = entryStatus === 'interviewing';
              const isPriority = entryStatus === 'priority';
              const isWaiting = entryStatus === 'waiting';
              const isAccepted = entryStatus === 'accepted' || entryStatus === 'done';
              const isSkipped = entryStatus === 'skipped' || entryStatus === 'rejected';

              // FULL CARD STATUS BACKGROUND THEMES
              let cardThemeClass = 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700';
              if (isInterviewing) {
                cardThemeClass = 'bg-emerald-950/35 border-emerald-500/80 shadow-xl shadow-emerald-500/15';
              } else if (isAccepted) {
                cardThemeClass = 'bg-emerald-950/25 border-emerald-500/50 shadow-lg shadow-emerald-950/40';
              } else if (isSkipped) {
                cardThemeClass = 'bg-rose-950/20 border-rose-600/40 shadow-sm';
              } else if (isPriority) {
                cardThemeClass = 'bg-violet-950/25 border-violet-500/50 shadow-md shadow-violet-500/10';
              } else if (isWaiting) {
                cardThemeClass = 'bg-sky-950/20 border-sky-500/40 shadow-sm';
              }

              return (
                <div
                  key={room.id}
                  className={`border rounded-2xl p-6 space-y-5 transition-all relative flex flex-col justify-between ${cardThemeClass}`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden font-bold text-zinc-400">
                          {room.company.logoUrl ? (
                            <img src={room.company.logoUrl} alt={room.company.name} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-200">{room.company.name}</span>
                            {room.company.isVerified && (
                              <span title="Verified Company">
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400">{room.company.industry || 'General'}</span>
                        </div>
                      </div>

                      {/* Prominent Status Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isInterviewing ? (
                          <span className="px-3 py-1 text-[11px] font-extrabold bg-emerald-500 text-black rounded-full uppercase tracking-wider animate-bounce flex items-center gap-1.5 shadow-md shadow-emerald-500/30">
                            <Video className="w-3.5 h-3.5" />
                            <span>Live Interview</span>
                          </span>
                        ) : isAccepted ? (
                          <span className="px-3 py-1 text-[11px] font-extrabold bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Accepted</span>
                          </span>
                        ) : isSkipped ? (
                          <span className="px-3 py-1 text-[11px] font-extrabold bg-rose-500/20 border border-rose-500/50 text-rose-300 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Rejected</span>
                          </span>
                        ) : isPriority ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-violet-500/20 border border-violet-500/40 text-violet-300 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-violet-400" />
                            <span>Priority Queue</span>
                          </span>
                        ) : isWaiting ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-sky-500/20 border border-sky-500/40 text-sky-300 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-400" />
                            <span>In Queue</span>
                          </span>
                        ) : null}

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

                    {/* Room Title & Description */}
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {room.title}
                      </h3>
                      {room.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {room.description}
                        </p>
                      )}
                    </div>

                    {/* Required Skills & Match */}
                    {room.requiredSkills.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 font-semibold uppercase tracking-wider">Required Skills</span>
                          {room.mySkillMatch !== null && room.mySkillMatch !== undefined && (
                            <span className="text-indigo-300 font-bold">
                              {Math.round(room.mySkillMatch)}% Profile Match
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {room.requiredSkills.map((s, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 text-[11px] bg-black/40 border border-white/10 text-zinc-300 rounded-md font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── IN-CARD STATUS OR ACTION FOOTER ─────────────────── */}
                  <div className="pt-4 border-t border-white/10 space-y-3.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span>
                          Queue: <strong className="text-zinc-200">{room._count.queue}</strong> / {room.maxQueue}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Code: <code className="text-indigo-400 font-semibold">{room.roomCode}</code>
                      </span>
                    </div>

                    {/* DIRECT IN-CARD EXPERIENCE (CLEAN, NO NESTED BOXES) */}
                    {isApplied ? (
                      <div>
                        {isInterviewing ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                              <span>Recruiter is waiting in the video room!</span>
                            </div>
                            <button
                              onClick={() => router.push(`/meet/${room.livekitRoom}?token=${encodeURIComponent(appliedEntry?.livekitToken || '')}`)}
                              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all animate-pulse"
                            >
                              <Video className="w-4 h-4" />
                              <span>Join Video Call Now</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        ) : isAccepted ? (
                          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold pt-1">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Application Accepted & Qualified</span>
                            </span>
                          </div>
                        ) : isSkipped ? (
                          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold pt-1">
                            <span className="flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-rose-400" />
                              <span>Application Status: Rejected / Skipped</span>
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10">
                                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">AI Match Score</div>
                                <div className="font-black text-indigo-400 text-base">
                                  {Math.round(appliedEntry?.cvAnalysis?.overallScore ?? appliedEntry?.skillScore ?? room.mySkillMatch ?? 0)}%
                                </div>
                              </div>
                              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10">
                                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Queue Priority</div>
                                <div className="font-black text-emerald-400 text-base">
                                  {Math.round(appliedEntry?.effectivePriority ?? appliedEntry?.priorityScore ?? 0)}
                                </div>
                              </div>
                            </div>

                            {/* Dynamic Aging Boost Pill */}
                            <div className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
                              <span className="flex items-center gap-1.5 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Waited {appliedEntry?.minutesWaiting ?? 0}m</span>
                              </span>
                              <span className="text-[11px] font-semibold text-amber-400">
                                +{Math.round(appliedEntry?.agingBonus ?? 0)} aging pts boost
                              </span>
                            </div>

                            {/* AI Summary Quote if present */}
                            {appliedEntry?.cvAnalysis?.summary && (
                              <p className="text-[11px] text-zinc-300 italic bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-500/20 line-clamp-2">
                                "{appliedEntry.cvAnalysis.summary}"
                              </p>
                            )}

                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className="text-[11px] font-medium text-zinc-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{isPriority ? '⭐ Priority Shortlisted' : 'Live in Queue • Waiting for recruiter'}</span>
                              </span>
                              <button
                                onClick={() => handleLeaveQueue(room.roomCode)}
                                disabled={leavingId === room.roomCode}
                                className="px-3 py-1.5 text-[11px] font-semibold bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-300 rounded-lg transition-all shrink-0"
                              >
                                {leavingId === room.roomCode ? 'Leaving...' : 'Leave Queue'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
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
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative overflow-hidden shadow-2xl">
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
                Submit your CV to get scored with AI and placed into the priority walk-in queue.
              </p>
            </div>

            {/* Room Criteria & Requirements Box */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-2.5 text-xs">
              {selectedRoom.minExperience && (
                <div>
                  <span className="text-zinc-400 font-semibold">Min Experience: </span>
                  <span className="text-white font-medium">{selectedRoom.minExperience}</span>
                </div>
              )}

              {selectedRoom.evaluationCriteria && (
                <div>
                  <span className="text-zinc-400 font-semibold">Evaluation Focus: </span>
                  <span className="text-zinc-300">{selectedRoom.evaluationCriteria}</span>
                </div>
              )}

              {selectedRoom.requiredSkills.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Required Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.requiredSkills.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
