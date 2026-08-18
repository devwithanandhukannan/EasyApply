'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Users,
  Video,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  FileText,
  BadgeCheck,
  LogOut,
  Upload,
  Copy,
  Check,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import Link from 'next/link';
import { uploadResume } from '@/app/lib/resumeApi';

interface RoomInfo {
  id: string;
  title: string;
  description: string | null;
  requiredSkills: string[];
  roomCode: string;
  livekitRoom: string;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  maxQueue: number;
  company: {
    name: string;
    logoUrl: string | null;
    industry: string;
    isVerified?: boolean;
  };
  _count: {
    queue: number;
  };
}

interface QueueEntry {
  id: string;
  status: 'waiting' | 'priority' | 'interviewing' | 'accepted' | 'done' | 'skipped' | 'rejected' | string;
  skillScore: number;
  priorityScore: number;
  agingBonus?: number;
  livekitToken?: string | null;
}

interface ResumeItem {
  id: string;
  name: string;
  isPrimary: boolean;
}

export default function WalkInRoomJoinPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useGlassToast();

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [queuePos, setQueuePos] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchRoomInfo();
    checkMyPosition();
    if (isAuthenticated) {
      fetchResumes();
    }
  }, [code, isAuthenticated]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast('Code Copied', `Room code ${code} copied to clipboard`, 'success');
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleCopyLink = () => {
    const link = typeof window !== 'undefined' ? window.location.href : `/walkin/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    showToast('Link Copied', 'Direct interview room link copied to clipboard', 'success');
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Poll position every 5s if in queue
  useEffect(() => {
    if (!entry || entry.status === 'done' || entry.status === 'skipped') return;
    const interval = setInterval(() => {
      checkMyPosition();
    }, 5000);
    return () => clearInterval(interval);
  }, [entry?.status, code]);

  const fetchResumes = async () => {
    try {
      const res = await api.get('/jobseeker/resumes');
      if (res.data?.success) {
        setResumes(res.data.data || []);
        const primary = res.data.data?.find((r: ResumeItem) => r.isPrimary);
        if (primary) setSelectedResumeId(primary.id);
      }
    } catch {
      // ignore
    }
  };

  const fetchRoomInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/walkin/rooms/${code}/info`);
      if (res.data?.success) {
        setRoom(res.data.room);
        if (res.data.myEntry) {
          setEntry(res.data.myEntry);
          if (res.data.queuePosition) {
            setQueuePos(res.data.queuePosition);
          }
        }
      } else {
        setError(res.data?.message || 'Room not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load walk-in room');
    } finally {
      setLoading(false);
    }
  };

  const checkMyPosition = async () => {
    try {
      const res = await api.get(`/walkin/rooms/${code}/position`);
      if (res.data?.success) {
        setEntry(res.data.entry);
        setQueuePos(res.data.queuePosition);
      }
    } catch {
      // Not in queue
    }
  };

  const handleJoinQueue = async () => {
    if (!isAuthenticated) {
      showToast('Sign In Required', 'Please sign in to your job seeker account to join the queue.', 'info');
      router.push(`/login?redirect=/walkin/${code}`);
      return;
    }

    try {
      setJoining(true);
      const res = await api.post(`/walkin/rooms/${code}/join`, {
        resumeId: selectedResumeId || undefined,
      });
      if (res.data?.success) {
        setEntry(res.data.entry);
        setQueuePos(res.data.queuePosition);
        showToast('Joined Queue', res.data.message || 'You are now waiting in the walk-in queue!', 'success');
      } else {
        if (res.data?.entry) {
          setEntry(res.data.entry);
          setQueuePos(res.data.queuePosition || 1);
        }
        showToast('Already Applied', res.data?.message || 'You have already applied to this room.', 'info');
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        showToast('Sign In Required', 'Please sign in to join the queue.', 'info');
        router.push(`/login?redirect=/walkin/${code}`);
      } else if (err.response?.data?.alreadyApplied && err.response?.data?.entry) {
        setEntry(err.response.data.entry);
        setQueuePos(err.response.data.queuePosition || 1);
        showToast('Already Applied', err.response.data.message || 'You have already applied to this room.', 'info');
      } else {
        showToast('Error', err.response?.data?.message || 'Failed to join queue.', 'danger');
      }
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveQueue = async () => {
    setLeaving(true);
    try {
      const res = await api.post(`/walkin/rooms/${code}/leave`);
      if (res.data?.success) {
        showToast('Left Queue', 'You have left the walk-in queue.', 'info');
        setEntry(null);
        setQueuePos(null);
        fetchRoomInfo();
      } else {
        showToast('Error', res.data?.message || 'Failed to leave queue', 'danger');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to leave queue', 'danger');
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-sm text-zinc-500">Connecting to Walk-In Room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-100">Walk-In Room Unavailable</h2>
          <p className="text-xs text-zinc-500">{error || 'This interview room does not exist or has ended.'}</p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/companies"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
            >
              Browse Active Walk-In Rooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full space-y-6">
        {/* Navigation & Code Bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Explore All Rooms</span>
          </Link>

          {/* Copy Code & Share Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
                copiedCode
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-indigo-400 hover:bg-zinc-800'
              }`}
              title="Copy Room Code"
            >
              <span>Code: {room.roomCode}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleCopyLink}
              className={`p-1.5 rounded-lg border text-xs transition ${
                copiedLink
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
              title="Copy Room Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Company & Room Header Card */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full uppercase tracking-wider">
                  Instant Walk-In
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    room.status === 'OPEN'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {room.status}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight pt-2">{room.title}</h1>
              <p className="text-sm font-medium text-zinc-400">
                {room.company.name} • {room.company.industry || 'General'}
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
              {room.company.logoUrl ? (
                <img src={room.company.logoUrl} alt={room.company.name} className="w-full h-full object-contain rounded-2xl" />
              ) : (
                <Building2 className="w-7 h-7 text-indigo-400" />
              )}
            </div>
          </div>

          {room.description && (
            <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50">
              {room.description}
            </p>
          )}

          {/* Required Skills */}
          {room.requiredSkills && room.requiredSkills.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Required Skills</div>
              <div className="flex flex-wrap gap-2">
                {room.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Real-time Room Details */}
          <div className="pt-4 border-t border-zinc-900 grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-zinc-500 text-[10px]">Queue Capacity</div>
                <div className="font-semibold text-zinc-200">
                  {room._count?.queue ?? 0} / {room.maxQueue} Waiting
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-zinc-500 text-[10px]">Queue Algorithm</div>
                <div className="font-semibold text-zinc-200">Skill + Aging Priority</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Queue Status Card / Action Card */}
        {entry ? (
          <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-950 to-zinc-950 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
                  {entry.status === 'accepted' || entry.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : entry.status === 'rejected' || entry.status === 'skipped' ? (
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Clock className="w-5 h-5 animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {entry.status === 'interviewing'
                      ? 'You Are Being Called'
                      : entry.status === 'accepted' || entry.status === 'done'
                      ? 'Application Shortlisted'
                      : entry.status === 'rejected' || entry.status === 'skipped'
                      ? 'Application Status Updated'
                      : 'You Have Applied (In Queue)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {entry.status === 'interviewing'
                      ? 'The recruiter is waiting for you in the video room.'
                      : entry.status === 'accepted' || entry.status === 'done'
                      ? 'Congratulations! The recruiter has marked your interview as accepted/shortlisted.'
                      : entry.status === 'rejected' || entry.status === 'skipped'
                      ? 'The recruiter has completed review for this walk-in session.'
                      : 'Your application is registered in the live queue.'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                  entry.status === 'interviewing'
                    ? 'bg-emerald-500 text-black animate-bounce font-extrabold'
                    : entry.status === 'accepted' || entry.status === 'done'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : entry.status === 'rejected' || entry.status === 'skipped'
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                    : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-300'
                }`}
              >
                {entry.status}
              </span>
            </div>

            {/* Score & Position Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-center space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Queue Position</div>
                <div className="text-2xl font-black text-white">
                  {entry.status === 'waiting' || entry.status === 'priority' ? `#${queuePos ?? 1}` : '—'}
                </div>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-center space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Skill Match</div>
                <div className="text-2xl font-black text-indigo-400">{Math.round(entry.skillScore)}%</div>
              </div>
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-center space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">Priority Score</div>
                <div className="text-2xl font-black text-emerald-400">{Math.round(entry.priorityScore)}</div>
              </div>
            </div>

            {/* Action when called */}
            {entry.status === 'interviewing' ? (
              <button
                onClick={() =>
                  router.push(`/meet/${room.livekitRoom}?token=${encodeURIComponent(entry.livekitToken || '')}`)
                }
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all scale-[1.02] animate-pulse cursor-pointer"
              >
                <Video className="w-5 h-5" />
                <span>Join Video Interview Room Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : entry.status === 'waiting' || entry.status === 'priority' ? (
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  onClick={checkMyPosition}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Refresh Position
                </button>
                <button
                  onClick={handleLeaveQueue}
                  disabled={leaving}
                  className="px-4 py-2.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-400 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{leaving ? 'Leaving...' : 'Leave Queue'}</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <Link
                  href="/companies"
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <span>Browse Other Walk-In Rooms</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : !isAuthenticated ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Walk-In Queue</span>
              </div>
              <h3 className="text-lg font-bold text-white">Join {room.company.name}&apos;s Walk-In Queue</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sign in to your EasyApply account to upload or select your CV, compute your real-time skill score match, and join the live video evaluation room queue.
              </p>
            </div>

            <button
              onClick={() => router.push(`/login?redirect=/walkin/${code}`)}
              disabled={room.status !== 'OPEN'}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-98 cursor-pointer"
            >
              <span>Sign In to Join Walk-In Queue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Ready for Instant Evaluation?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Join the room directly. Candidates with matching skills get prioritized, with anti-starvation aging bonus added continuously.
              </p>
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
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {resumes.map((r) => (
                    <label
                      key={r.id}
                      onClick={() => setSelectedResumeId(r.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        selectedResumeId === r.id
                          ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className={`w-3.5 h-3.5 shrink-0 ${selectedResumeId === r.id ? 'text-indigo-400' : 'text-zinc-500'}`} />
                        <span className="text-xs font-medium truncate">{r.name}</span>
                        {r.isPrimary && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-zinc-800 text-zinc-300 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <input
                        type="radio"
                        name="resumePicker"
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

            <button
              onClick={handleJoinQueue}
              disabled={joining || room.status !== 'OPEN'}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-98 cursor-pointer"
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Skill Match & Joining...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Join Walk-In Queue Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
