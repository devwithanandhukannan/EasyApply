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
    };
    _count: {
      queue: number;
    };
  };
}

interface ResumeOption {
  id: string;
  name: string;
  isPrimary: boolean;
  atsScore?: number;
}

export default function JobSeekerWalkInDirectoryPage() {
  const router = useRouter();
  const { showToast } = useGlassToast();

  const [rooms, setRooms] = useState<WalkInRoom[]>([]);
  const [myQueues, setMyQueues] = useState<MyQueueEntry[]>([]);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'applied'>('all');

  // Direct room code joining
  const [directCode, setDirectCode] = useState('');
  const [lookingUpCode, setLookingUpCode] = useState(false);

  // Join confirmation modal state
  const [selectedRoom, setSelectedRoom] = useState<WalkInRoom | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);

  // Leaving queue state
  const [leavingId, setLeavingId] = useState<string | null>(null);

  // Polling ref for live updates
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/walkin/active-rooms', {
        params: { search: search.trim() || undefined },
      });
      if (res.data?.success) {
        setRooms(res.data.rooms || []);
      }
    } catch {
      // ignore
    }
  };

  const fetchMyQueues = async () => {
    try {
      const res = await api.get('/walkin/my-queues');
      if (res.data?.success) {
        setMyQueues(res.data.queues || []);
      }
    } catch {
      // ignore
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await api.get('/jobseeker/resumes');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapped: ResumeOption[] = res.data.data.map((r: any) => ({
          id: r.id,
          name: r.name || 'Untitled Resume',
          isPrimary: r.isPrimary || false,
          atsScore: r.aiSuggestions?.scores?.ats || undefined,
        }));
        setResumes(mapped);
        const prim = mapped.find((r) => r.isPrimary) || mapped[0];
        if (prim) setSelectedResumeId(prim.id);
      }
    } catch {
      // ignore
    }
  };

  const fetchData = async () => {
    await Promise.all([fetchRooms(), fetchMyQueues()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchResumes();

    // Setup 5-second polling interval for live queue updates
    pollingRef.current = setInterval(() => {
      fetchDataSilent();
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchDataSilent = async () => {
    try {
      const [roomsRes, queuesRes] = await Promise.all([
        api.get('/walkin/active-rooms', { params: { search: search.trim() || undefined } }),
        api.get('/walkin/my-queues'),
      ]);
      if (roomsRes.data?.success) setRooms(roomsRes.data.rooms || []);
      if (queuesRes.data?.success) setMyQueues(queuesRes.data.queues || []);
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

  // Tab Filtering counts
  const appliedRoomsCount = useMemo(() => {
    return rooms.filter((r) => Boolean(r.hasApplied || r.myEntry)).length;
  }, [rooms]);

  const newRoomsCount = useMemo(() => {
    return rooms.filter((r) => !r.hasApplied && !r.myEntry).length;
  }, [rooms]);

  const displayedRooms = useMemo(() => {
    if (activeTab === 'applied') {
      return rooms.filter((r) => Boolean(r.hasApplied || r.myEntry));
    }
    if (activeTab === 'new') {
      return rooms.filter((r) => !r.hasApplied && !r.myEntry);
    }
    return rooms;
  }, [rooms, activeTab]);

  return (
    <div className="space-y-8 w-full max-w-full text-[#1d1d1f] dark:text-[#f5f5f7] font-sans">
      {/* ─── HEADER / HERO SECTION (APPLE MINIMALIST) ───────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-8 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Walk-In Interview Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              Queue Live, Interview Fast
            </h1>
            <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed font-medium">
              Skip traditional scheduling delays. Join live walk-in queues, get prioritized by your skills, and connect directly with hiring managers in 1-on-1 video rooms.
            </p>
          </div>

          {/* Quick Room Code Input */}
          <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 w-full lg:w-80 space-y-3 shrink-0 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1d1d1f] dark:text-white">
              <KeyRound className="w-4 h-4 text-[#0071e3]" />
              <span>Have a Private Room Code?</span>
            </div>
            <form onSubmit={handleDirectCodeLookup} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. F4WAKG"
                maxLength={6}
                value={directCode}
                onChange={(e) => setDirectCode(e.target.value.toUpperCase())}
                className="w-full bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3] rounded-xl px-3 py-2 text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] font-mono font-bold tracking-wider uppercase outline-none transition-all"
              />
              <button
                type="submit"
                disabled={lookingUpCode || !directCode.trim()}
                className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
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
              <Radio className="w-4 h-4 text-[#34c759] animate-pulse" />
              <h2 className="text-xs font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">
                Your Active Queue Tracker ({myQueues.length})
              </h2>
            </div>
            <span className="text-[11px] text-[#86868b] font-medium">Live 5s Polling Active</span>
          </div>

          <div className="grid grid-cols-1 gap-3 w-full">
            {myQueues.map((q) => {
              const isInterviewing = q.status === 'interviewing';

              return (
                <div
                  key={q.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all w-full ${
                    isInterviewing
                      ? 'bg-[#34c759]/10 border-[#34c759]/40 shadow-md'
                      : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08] shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isInterviewing
                            ? 'bg-[#34c759] text-white'
                            : 'bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20'
                        }`}
                      >
                        {isInterviewing ? <Video className="w-5 h-5" /> : `#${q.queuePosition}`}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#1d1d1f] dark:text-white text-sm">{q.room.title}</span>
                          <span className="text-xs text-[#86868b] font-medium">({q.room.company.name})</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              isInterviewing
                                ? 'bg-[#34c759] text-white font-extrabold animate-bounce'
                                : 'bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20'
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#86868b] flex-wrap">
                          <span>
                            Skill Match: <strong className="text-[#0071e3] font-semibold">{Math.round(q.skillScore)}%</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Priority: <strong className="text-[#34c759] font-semibold">{Math.round(q.priorityScore)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Waiting: <strong className="text-[#1d1d1f] dark:text-white">{q.room._count.queue}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isInterviewing ? (
                        <button
                          onClick={() => router.push(`/meet/${q.room.livekitRoom}?token=${encodeURIComponent(q.livekitToken || '')}`)}
                          className="px-6 py-2.5 bg-[#34c759] hover:bg-[#2db84d] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all animate-pulse cursor-pointer"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Video Interview Now</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLeaveQueue(q.room.roomCode)}
                          disabled={leavingId === q.room.roomCode}
                          className="px-3.5 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#ff3b30]/10 border border-black/[0.04] dark:border-white/[0.06] text-[#86868b] hover:text-[#ff3b30] rounded-xl text-xs font-semibold transition-all cursor-pointer"
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

      {/* ─── ACTIVE WALK-IN ROOMS DIRECTORY ──────────────── */}
      <div className="space-y-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              Walk-In Rooms Directory
            </h2>
            <p className="text-xs text-[#86868b] font-medium mt-0.5">
              Browse rooms for immediate evaluation or monitor your live queue progress
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter Tabs Toggle Buttons */}
            <div className="flex items-center p-1 bg-[#e5e5ea] dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.08] rounded-2xl shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                All Rooms ({rooms.length})
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'new'
                    ? 'bg-white dark:bg-[#2c2c2e] text-[#0071e3] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#0071e3]" />
                <span>Available ({newRoomsCount})</span>
              </button>
              <button
                onClick={() => setActiveTab('applied')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'applied'
                    ? 'bg-white dark:bg-[#2c2c2e] text-[#34c759] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-[#34c759]" />
                <span>Applied ({appliedRoomsCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search rooms or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3] rounded-2xl pl-10 pr-4 py-2 text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] outline-none transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3 w-full">
            <Loader2 className="w-8 h-8 animate-spin text-[#0071e3] mx-auto" />
            <p className="text-xs text-[#86868b] font-medium">Loading walk-in rooms...</p>
          </div>
        ) : displayedRooms.length === 0 ? (
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-16 text-center space-y-4 w-full shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center mx-auto text-[#86868b]">
              <Video className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white">
                {activeTab === 'applied'
                  ? 'No Applied Walk-In Rooms'
                  : activeTab === 'new'
                  ? 'No New Rooms Available'
                  : 'No Walk-In Rooms Found'}
              </h3>
              <p className="text-xs text-[#86868b]">
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

              return (
                <div
                  key={room.id}
                  className={`bg-white dark:bg-[#1c1c1e] border rounded-3xl p-6 space-y-5 transition-all relative flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg ${
                    isInterviewing
                      ? 'border-[#34c759]/60 ring-2 ring-[#34c759]/20'
                      : isAccepted
                      ? 'border-[#34c759]/40'
                      : isSkipped
                      ? 'border-[#ff3b30]/40'
                      : isPriority
                      ? 'border-[#af52de]/40'
                      : isWaiting
                      ? 'border-[#0071e3]/40'
                      : 'border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden font-bold text-[#86868b]">
                          {room.company.logoUrl ? (
                            <img src={room.company.logoUrl} alt={room.company.name} className="w-full h-full object-contain" />
                          ) : (
                            <Building2 className="w-5 h-5 text-[#0071e3]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">{room.company.name}</span>
                            {room.company.isVerified && (
                              <span title="Verified Company">
                                <BadgeCheck className="w-3.5 h-3.5 text-[#34c759]" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#86868b] font-medium">{room.company.industry || 'Technology'}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isInterviewing ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#34c759] text-white rounded-full uppercase tracking-wider animate-bounce flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            <span>Live Interview</span>
                          </span>
                        ) : isAccepted ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#34c759]/10 border border-[#34c759]/20 text-[#34c759] rounded-full uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Accepted</span>
                          </span>
                        ) : isSkipped ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#ff3b30] rounded-full uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : isPriority ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#af52de]/10 border border-[#af52de]/20 text-[#af52de] rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Priority Queue</span>
                          </span>
                        ) : isWaiting ? (
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>In Queue</span>
                          </span>
                        ) : null}

                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            room.status === 'OPEN'
                              ? 'bg-[#34c759]/10 border border-[#34c759]/20 text-[#34c759]'
                              : 'bg-[#ff9500]/10 border border-[#ff9500]/20 text-[#ff9500]'
                          }`}
                        >
                          {room.status}
                        </span>
                      </div>
                    </div>

                    {/* Room Title & Description */}
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white">
                        {room.title}
                      </h3>
                      {room.description && (
                        <p className="text-xs text-[#86868b] line-clamp-2 leading-relaxed">
                          {room.description}
                        </p>
                      )}
                    </div>

                    {/* Required Skills & Match */}
                    {room.requiredSkills.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#86868b] font-semibold uppercase tracking-wider">Required Skills</span>
                          {room.mySkillMatch !== null && room.mySkillMatch !== undefined && (
                            <span className="text-[#0071e3] font-bold">
                              {Math.round(room.mySkillMatch)}% Profile Match
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {room.requiredSkills.map((s, idx) => (
                            <span key={idx} className="px-2.5 py-1 text-[11px] bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-lg font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── IN-CARD ACTION FOOTER ─────────────────── */}
                  <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#86868b]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          Queue: <strong className="text-[#1d1d1f] dark:text-white">{room._count.queue}</strong> / {room.maxQueue}
                        </span>
                      </div>
                      <span className="text-[11px]">
                        Code: <code className="text-[#0071e3] font-semibold">{room.roomCode}</code>
                      </span>
                    </div>

                    {isApplied ? (
                      <div>
                        {isInterviewing ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#34c759]">
                              <span className="w-2 h-2 rounded-full bg-[#34c759] animate-ping inline-block" />
                              <span>Recruiter is waiting in video room!</span>
                            </div>
                            <button
                              onClick={() => router.push(`/meet/${room.livekitRoom}?token=${encodeURIComponent(appliedEntry?.livekitToken || '')}`)}
                              className="w-full py-3 bg-[#34c759] hover:bg-[#2db84d] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all animate-pulse cursor-pointer"
                            >
                              <Video className="w-4 h-4" />
                              <span>Join Video Call Now</span>
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        ) : isAccepted ? (
                          <div className="flex items-center justify-between text-xs text-[#34c759] font-bold pt-1">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Application Accepted &amp; Qualified</span>
                            </span>
                          </div>
                        ) : isSkipped ? (
                          <div className="flex items-center justify-between text-xs text-[#ff3b30] font-semibold pt-1">
                            <span className="flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4" />
                              <span>Application Status: Rejected / Skipped</span>
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-center text-xs">
                              <div className="p-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                                <div className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">AI Match Score</div>
                                <div className="font-bold text-[#0071e3] text-base">
                                  {Math.round(appliedEntry?.cvAnalysis?.overallScore ?? appliedEntry?.skillScore ?? room.mySkillMatch ?? 0)}%
                                </div>
                              </div>
                              <div className="p-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                                <div className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">Queue Priority</div>
                                <div className="font-bold text-[#34c759] text-base">
                                  {Math.round(appliedEntry?.effectivePriority ?? appliedEntry?.priorityScore ?? 0)}
                                </div>
                              </div>
                            </div>

                            {/* Aging Boost Pill */}
                            <div className="px-3 py-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs text-[#1d1d1f] dark:text-[#f5f5f7]">
                              <span className="flex items-center gap-1.5 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-[#ff9500]" />
                                <span>Waited {appliedEntry?.minutesWaiting ?? 0}m</span>
                              </span>
                              <span className="text-[11px] font-bold text-[#ff9500]">
                                +{Math.round(appliedEntry?.agingBonus ?? 0)} aging pts boost
                              </span>
                            </div>

                            {appliedEntry?.cvAnalysis?.summary && (
                              <p className="text-[11px] text-[#86868b] italic bg-[#0071e3]/5 p-2.5 rounded-xl border border-[#0071e3]/10 line-clamp-2">
                                &ldquo;{appliedEntry.cvAnalysis.summary}&rdquo;
                              </p>
                            )}

                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className="text-[11px] font-medium text-[#86868b] flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse" />
                                <span>{isPriority ? 'Priority Shortlisted' : 'Waiting in Queue'}</span>
                              </span>
                              <button
                                onClick={() => handleLeaveQueue(room.roomCode)}
                                disabled={leavingId === room.roomCode}
                                className="px-3 py-1 text-[11px] font-semibold bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 border border-[#ff3b30]/20 text-[#ff3b30] rounded-xl transition-all shrink-0 cursor-pointer"
                              >
                                {leavingId === room.roomCode ? 'Leaving...' : 'Leave'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => openJoinModal(room)}
                        disabled={isPaused || isFull}
                        className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 disabled:bg-[#f2f2f7] dark:disabled:bg-[#2c2c2e] disabled:text-[#86868b] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,113,227,0.2)] transition cursor-pointer"
                      >
                        {isPaused ? (
                          <span className="flex items-center gap-1.5 text-[#ff9500]">
                            <Clock className="w-3.5 h-3.5" /> Room Temporarily Paused by Recruiter
                          </span>
                        ) : isFull ? (
                          <span>Queue Capacity Full</span>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative overflow-hidden shadow-2xl">
            <button
              onClick={() => setJoinModalOpen(false)}
              className="absolute top-5 right-5 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white p-1 rounded-full hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] text-[10px] font-bold uppercase">
                {selectedRoom.company.name}
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">{selectedRoom.title}</h2>
              <p className="text-xs text-[#86868b]">
                Submit your CV to get scored with AI and placed into the priority walk-in queue.
              </p>
            </div>

            {/* Room Criteria & Requirements Box */}
            <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-4 space-y-2 text-xs">
              {selectedRoom.minExperience && (
                <div>
                  <span className="text-[#86868b] font-semibold">Min Experience: </span>
                  <span className="text-[#1d1d1f] dark:text-white font-medium">{selectedRoom.minExperience}</span>
                </div>
              )}

              {selectedRoom.evaluationCriteria && (
                <div>
                  <span className="text-[#86868b] font-semibold">Evaluation Focus: </span>
                  <span className="text-[#1d1d1f] dark:text-white">{selectedRoom.evaluationCriteria}</span>
                </div>
              )}

              {selectedRoom.requiredSkills.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Required Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.requiredSkills.map((s, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 text-xs bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-lg font-medium">
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
                <label className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">
                  Select or Upload Resume / CV
                </label>
                <label className="cursor-pointer text-xs font-semibold text-[#0071e3] hover:underline flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
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
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        selectedResumeId === r.id
                          ? 'bg-[#0071e3]/10 border-[#0071e3] text-[#1d1d1f] dark:text-white'
                          : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] border-black/[0.04] dark:border-white/[0.06] text-[#86868b] hover:border-black/[0.1]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className={`w-4 h-4 shrink-0 ${selectedResumeId === r.id ? 'text-[#0071e3]' : 'text-[#86868b]'}`} />
                        <span className="text-xs font-medium truncate">{r.name}</span>
                        {r.isPrimary && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#f2f2f7] text-[#1d1d1f] rounded-md">
                            Primary
                          </span>
                        )}
                        {r.atsScore && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#34c759]/10 text-[#34c759] rounded-md">
                            ATS: {r.atsScore}
                          </span>
                        )}
                      </div>
                      <input
                        type="radio"
                        name="resumeChoice"
                        checked={selectedResumeId === r.id}
                        onChange={() => setSelectedResumeId(r.id)}
                        className="accent-[#0071e3]"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.12] text-center space-y-2 bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50">
                  <p className="text-xs text-[#86868b]">No resumes found in your profile.</p>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition-all">
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
                className="px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-2xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJoin}
                disabled={joining}
                className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition cursor-pointer"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scoring &amp; Joining...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm &amp; Enter Queue</span>
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
