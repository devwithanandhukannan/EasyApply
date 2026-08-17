'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import {
  DoorOpen,
  Plus,
  Users,
  Video,
  Play,
  Pause,
  StopCircle,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  FileText,
  ExternalLink,
  Sliders,
  Star,
  ChevronRight,
  Clock,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  X,
  LayoutGrid,
  List,
  Eye,
  Settings,
  Flame,
  ArrowRight,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';

interface ResumeData {
  id: string;
  name: string;
  filePath: string | null;
  atsScore: number | null;
  content: any;
  aiSuggestions: any;
  createdAt: string;
}

interface SeekerProfile {
  id: string;
  fullName: string;
  email: string;
  profilePhotoUrl: string | null;
  location: string | null;
  phone?: string | null;
  linkedin?: string | null;
  github?: string | null;
  bio?: string | null;
  skills: { name: string }[];
  education?: {
    institution: string;
    degree: string;
    field: string;
    startYear: string | null;
    endYear: string | null;
  }[];
  experience?: {
    company: string;
    role: string;
    startYear: string | null;
    endYear: string | null;
    current: boolean;
  }[];
}

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

interface QueueEntry {
  id: string;
  status: 'waiting' | 'priority' | 'interviewing' | 'accepted' | 'done' | 'skipped' | 'rejected';
  skillScore: number;
  priorityScore: number;
  agingBonus: number;
  minutesWaiting?: number;
  effectivePriority?: number;
  waitingSince: string;
  livekitToken?: string | null;
  notes?: string | null;
  resumeId?: string | null;
  cvFileUrl?: string | null;
  cvAnalysis?: CvScoreMatrix | null;
  resume?: ResumeData | null;
  jobSeekerProfile: SeekerProfile;
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
  _count: {
    queue: number;
  };
}

type KanbanColumnId = 'waiting' | 'priority' | 'interviewing' | 'accepted' | 'skipped';

const KANBAN_COLUMNS: {
  id: KanbanColumnId;
  title: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
  icon: any;
}[] = [
  {
    id: 'waiting',
    title: 'Applied / Queue',
    description: 'Candidates waiting in queue',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-950/20',
    icon: Clock,
  },
  {
    id: 'priority',
    title: 'Priority Shortlist',
    description: 'Fast-tracked by recruiter',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-950/20',
    icon: Star,
  },
  {
    id: 'interviewing',
    title: 'Live Interview',
    description: 'Active in LiveKit Video Call',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-950/20',
    icon: Video,
  },
  {
    id: 'accepted',
    title: 'Accepted / OK',
    description: 'Qualified & short-listed',
    color: 'text-teal-400',
    borderColor: 'border-teal-500/30',
    bgColor: 'bg-teal-950/20',
    icon: CheckCircle2,
  },
  {
    id: 'skipped',
    title: 'Rejected / Skipped',
    description: 'Disqualified or passed over',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-950/20',
    icon: XCircle,
  },
];

export default function CompanyWalkInKanbanPage() {
  const router = useRouter();
  const { showToast } = useGlassToast();

  const [rooms, setRooms] = useState<WalkInRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<WalkInRoom | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [minSkillMatch, setMinSkillMatch] = useState<number>(0);
  const [hasCvOnly, setHasCvOnly] = useState(false);
  const [selectedStageFilter, setSelectedStageFilter] = useState<'all' | 'waiting' | 'priority' | 'interviewing' | 'accepted' | 'skipped'>('all');

  // Batch Multi-Select
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<QueueEntry | null>(null);
  const [candidateDrawerOpen, setCandidateDrawerOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<QueueEntry | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');

  // Create Room Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [priorityThreshold, setPriorityThreshold] = useState(70);
  const [evaluationCriteria, setEvaluationCriteria] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [maxQueue, setMaxQueue] = useState(25);
  const [creating, setCreating] = useState(false);

  // Settings Form
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMinExperience, setEditMinExperience] = useState('');
  const [editPriorityThreshold, setEditPriorityThreshold] = useState(70);
  const [editEvaluationCriteria, setEditEvaluationCriteria] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editSkillInput, setEditSkillInput] = useState('');
  const [editMaxQueue, setEditMaxQueue] = useState(25);
  const [savingSettings, setSavingSettings] = useState(false);

  // Drag and Drop
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchQueue(selectedRoom.roomCode);
      const interval = setInterval(() => fetchQueue(selectedRoom.roomCode), 4000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom?.roomCode]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/walkin/rooms');
      if (res.data?.success) {
        setRooms(res.data.rooms);
        if (res.data.rooms.length > 0 && !selectedRoom) {
          setSelectedRoom(res.data.rooms[0]);
        }
      }
    } catch {
      showToast('Error', 'Failed to load walk-in rooms', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async (roomCode: string) => {
    try {
      const res = await api.get(`/walkin/rooms/${roomCode}/queue`);
      if (res.data?.success) {
        setQueue(res.data.queue);
      }
    } catch {
      // silent
    }
  };

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter((entry) => {
      // Search
      const name = entry.jobSeekerProfile?.fullName?.toLowerCase() || '';
      const email = entry.jobSeekerProfile?.email?.toLowerCase() || '';
      const s = search.toLowerCase();
      const matchSearch = !s || name.includes(s) || email.includes(s);

      // Min Skill Match
      const matchScore = (entry.cvAnalysis?.overallScore ?? entry.skillScore) >= minSkillMatch;

      // Has CV Only
      const matchCv = !hasCvOnly || Boolean(entry.resume || entry.cvFileUrl || entry.cvAnalysis);

      return matchSearch && matchScore && matchCv;
    });
  }, [queue, search, minSkillMatch, hasCvOnly]);

  // Grouped by Kanban Column
  const columnsData = useMemo(() => {
    const map: Record<KanbanColumnId, QueueEntry[]> = {
      waiting: [],
      priority: [],
      interviewing: [],
      accepted: [],
      skipped: [],
    };

    filteredQueue.forEach((entry) => {
      if (entry.status === 'priority') {
        map.priority.push(entry);
      } else if (entry.status === 'interviewing') {
        map.interviewing.push(entry);
      } else if (entry.status === 'accepted' || entry.status === 'done') {
        map.accepted.push(entry);
      } else if (entry.status === 'skipped' || entry.status === 'rejected') {
        map.skipped.push(entry);
      } else {
        map.waiting.push(entry);
      }
    });

    return map;
  }, [filteredQueue]);

  // Actions
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Code Copied', `Room Code ${code} copied to clipboard`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/walkin/rooms', {
        title: title.trim(),
        description: description.trim() || null,
        requiredSkills: skills,
        minExperience: minExperience.trim() || null,
        priorityThreshold: Number(priorityThreshold) || 70,
        evaluationCriteria: evaluationCriteria.trim() || null,
        maxQueue: Number(maxQueue),
      });
      if (res.data?.success) {
        showToast('Room Created', `Room ${res.data.room.roomCode} is now live!`, 'success');
        setCreateModalOpen(false);
        setTitle('');
        setDescription('');
        setMinExperience('');
        setPriorityThreshold(70);
        setEvaluationCriteria('');
        setSkills([]);
        await fetchRooms();
        setSelectedRoom(res.data.room);
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to create room', 'danger');
    } finally {
      setCreating(false);
    }
  };

  const openSettingsModal = () => {
    if (!selectedRoom) return;
    setEditTitle(selectedRoom.title);
    setEditDescription(selectedRoom.description || '');
    setEditMinExperience(selectedRoom.minExperience || '');
    setEditPriorityThreshold(selectedRoom.priorityThreshold || 70);
    setEditEvaluationCriteria(selectedRoom.evaluationCriteria || '');
    setEditSkills(selectedRoom.requiredSkills || []);
    setEditMaxQueue(selectedRoom.maxQueue || 25);
    setSettingsModalOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setSavingSettings(true);
    try {
      const res = await api.put(`/walkin/rooms/${selectedRoom.roomCode}/settings`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        requiredSkills: editSkills,
        minExperience: editMinExperience.trim() || null,
        priorityThreshold: Number(editPriorityThreshold) || 70,
        evaluationCriteria: editEvaluationCriteria.trim() || null,
        maxQueue: Number(editMaxQueue),
      });
      if (res.data?.success) {
        showToast('Settings Saved', 'Room configuration and limits updated!', 'success');
        setSelectedRoom(res.data.room);
        setSettingsModalOpen(false);
        fetchRooms();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update room settings', 'danger');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateStatus = async (status: 'OPEN' | 'PAUSED' | 'CLOSED') => {
    if (!selectedRoom) return;
    try {
      const res = await api.put(`/walkin/rooms/${selectedRoom.roomCode}/status`, { status });
      if (res.data?.success) {
        showToast('Status Updated', `Room is now ${status}`, 'success');
        setSelectedRoom({ ...selectedRoom, status });
        setRooms(rooms.map((r) => (r.id === selectedRoom.id ? { ...r, status } : r)));
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update status', 'danger');
    }
  };

  const handleCallCandidate = async (entry?: QueueEntry) => {
    if (!selectedRoom) return;
    setCallingNext(true);
    try {
      const res = await api.post(`/walkin/rooms/${selectedRoom.roomCode}/call-next`, {
        entryId: entry?.id || undefined,
      });
      if (res.data?.success) {
        showToast(
          'Connecting...',
          `Starting interview with ${res.data.entry.jobSeekerProfile?.fullName || 'candidate'}`,
          'success'
        );
        const tokenToUse = res.data.recruiterToken || res.data.livekitToken || '';
        router.push(`/meet/${selectedRoom.livekitRoom}?token=${encodeURIComponent(tokenToUse)}&role=company`);
      } else {
        showToast('Queue Empty', res.data?.message || 'No candidates waiting', 'info');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to call candidate', 'danger');
    } finally {
      setCallingNext(false);
    }
  };

  const handleMoveCandidateStatus = async (entryId: string, status: string, notes?: string) => {
    try {
      const res = await api.put(`/walkin/queue/${entryId}/status`, { status, notes });
      if (res.data?.success) {
        showToast('Status Updated', `Candidate moved to ${status}`, 'success');
        if (selectedRoom) fetchQueue(selectedRoom.roomCode);
        if (selectedCandidate && selectedCandidate.id === entryId) {
          setSelectedCandidate({ ...selectedCandidate, status: status as any });
        }
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update candidate status', 'danger');
    }
  };

  const handleConfirmReject = async () => {
    if (!candidateToReject) return;
    await handleMoveCandidateStatus(candidateToReject.id, 'skipped', rejectionNote.trim() || 'Rejected by reviewer');
    setRejectModalOpen(false);
    setCandidateToReject(null);
    setRejectionNote('');
  };

  // Batch Multi-Select Handlers
  const toggleSelectCandidate = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    let visibleIds: string[] = [];
    if (selectedStageFilter === 'all') {
      visibleIds = filteredQueue.map((q) => q.id);
    } else {
      visibleIds = (columnsData[selectedStageFilter] || []).map((q) => q.id);
    }

    if (visibleIds.length === 0) return;

    const allSelected = visibleIds.every((id) => selectedEntryIds.includes(id));
    if (allSelected) {
      // Deselect visible
      setSelectedEntryIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      // Select all visible
      const set = new Set([...selectedEntryIds, ...visibleIds]);
      setSelectedEntryIds(Array.from(set));
    }
  };

  const handleDeselectAll = () => {
    setSelectedEntryIds([]);
  };

  const handleBatchMove = async (targetStatus: string) => {
    if (selectedEntryIds.length === 0 || !selectedRoom) return;
    setBatchUpdating(true);
    try {
      const res = await api.put('/walkin/queue/batch-status', {
        entryIds: selectedEntryIds,
        status: targetStatus,
      });
      if (res.data?.success) {
        showToast(
          'Batch Updated',
          `Successfully moved ${res.data.count} candidates to ${targetStatus}`,
          'success'
        );
        setSelectedEntryIds([]);
        fetchQueue(selectedRoom.roomCode);
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update candidates', 'danger');
    } finally {
      setBatchUpdating(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (entryId: string) => {
    setDraggingEntryId(entryId);
  };

  const handleDragOver = (e: React.DragEvent, colId: KanbanColumnId) => {
    e.preventDefault();
    setDragOverColumn(colId);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: KanbanColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggingEntryId) return;

    const entry = queue.find((q) => q.id === draggingEntryId);
    setDraggingEntryId(null);
    if (!entry || entry.status === targetColId) return;

    if (targetColId === 'interviewing') {
      handleCallCandidate(entry);
    } else {
      handleMoveCandidateStatus(entry.id, targetColId);
    }
  };

  const openCandidateDrawer = (entry: QueueEntry) => {
    setSelectedCandidate(entry);
    setCandidateDrawerOpen(true);
  };

  return (
    <div className="space-y-6 w-full max-w-full pb-16">
      {/* ─── ROOM SWITCHER / TOP BAR ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-2.5">
            <DoorOpen className="w-6 h-6 text-indigo-400" />
            <span>Walk-In Rooms & Kanban Board</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Host live walk-in rooms, inspect uploaded CVs, and drag & drop candidates across evaluation stages.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Room Selector Dropdown / Tabs */}
          {rooms.length > 0 && (
            <select
              value={selectedRoom?.id || ''}
              onChange={(e) => {
                const found = rooms.find((r) => r.id === e.target.value);
                if (found) setSelectedRoom(found);
              }}
              className="bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.roomCode}) — {r.status}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Walk-In Room</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-sm text-zinc-500">Loading Walk-In Rooms...</p>
        </div>
      ) : !selectedRoom ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto">
          <DoorOpen className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">No Walk-In Rooms Yet</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Create an instant walk-in room with required skills and capacity limits. Candidates can apply with CVs for immediate evaluation.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Room</span>
          </button>
        </div>
      ) : (
        <>
          {/* ─── ACTIVE ROOM HEADER & CAPACITY CONTROLS ───────────────── */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-5 relative overflow-hidden backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    onClick={() => handleCopyCode(selectedRoom.roomCode)}
                    className="cursor-pointer group inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-indigo-400 transition-all"
                    title="Click to copy room code"
                  >
                    <span>CODE: {selectedRoom.roomCode}</span>
                    {copiedCode === selectedRoom.roomCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                    )}
                  </span>

                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      selectedRoom.status === 'OPEN'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : selectedRoom.status === 'PAUSED'
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {selectedRoom.status}
                  </span>

                  <span className="px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg font-medium">
                    Queue: <strong className="text-white">{queue.length}</strong> / {selectedRoom.maxQueue}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedRoom.title}</h2>
                {selectedRoom.description && (
                  <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">{selectedRoom.description}</p>
                )}

                {/* Skills tags */}
                {selectedRoom.requiredSkills.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-semibold text-zinc-500 mr-1">Required Skills:</span>
                    {selectedRoom.requiredSkills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[11px] bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  onClick={() => handleCallCandidate()}
                  disabled={callingNext || selectedRoom.status === 'CLOSED'}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{callingNext ? 'Calling...' : 'Call Top Candidate'}</span>
                </button>

                {/* Status Toggle */}
                {selectedRoom.status === 'OPEN' ? (
                  <button
                    onClick={() => handleUpdateStatus('PAUSED')}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Room</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateStatus('OPEN')}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Open Room</span>
                  </button>
                )}

                <button
                  onClick={openSettingsModal}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  title="Configure Room & Capacity"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Limit & Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── SEARCH & FILTER TOOLBAR ─────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative min-w-[220px] max-w-sm flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate, email, skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
                />
              </div>

              {/* Min Skill Filter */}
              <select
                value={minSkillMatch}
                onChange={(e) => setMinSkillMatch(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-1.5 text-xs font-medium outline-none"
              >
                <option value={0}>All Skill Match %</option>
                <option value={50}>Match &ge; 50%</option>
                <option value={75}>Match &ge; 75%</option>
                <option value={90}>Match &ge; 90%</option>
              </select>

              {/* Has CV Toggle */}
              <button
                onClick={() => setHasCvOnly(!hasCvOnly)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                  hasCvOnly
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>With CV Only</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>

          {/* ─── ADVANCED STAGE FILTER TABS ───────────────────────────────── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedStageFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedStageFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-500/50'
                  : 'bg-zinc-950 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Stages ({filteredQueue.length})</span>
            </button>

            {KANBAN_COLUMNS.map((col) => {
              const count = (columnsData[col.id] || []).length;
              const isActive = selectedStageFilter === col.id;
              const ColIcon = col.icon;
              return (
                <button
                  key={col.id}
                  onClick={() => setSelectedStageFilter(isActive ? 'all' : col.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? `${col.bgColor} ${col.color} ring-1 ${col.borderColor} shadow-md`
                      : 'bg-zinc-950 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <ColIcon className={`w-3.5 h-3.5 ${col.color}`} />
                  <span>
                    {col.title} ({count})
                  </span>
                </button>
              );
            })}

            {/* Quick Select All Toggle in Current Stage Filter */}
            {filteredQueue.length > 0 && (
              <button
                onClick={handleSelectAllVisible}
                className={`ml-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                  selectedEntryIds.length > 0
                    ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-300'
                    : 'bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {selectedEntryIds.length > 0
                    ? `Deselect (${selectedEntryIds.length})`
                    : 'Select All in Filter'}
                </span>
              </button>
            )}
          </div>

          {/* ─── KANBAN BOARD VIEW ──────────────────────────────────────── */}
          {viewMode === 'kanban' ? (
            <div
              className={`grid gap-4 items-start pb-4 ${
                selectedStageFilter === 'all'
                  ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}
            >
              {(selectedStageFilter === 'all'
                ? KANBAN_COLUMNS
                : KANBAN_COLUMNS.filter((col) => col.id === selectedStageFilter)
              ).map((col) => {
                const ColumnIcon = col.icon;
                const items = columnsData[col.id] || [];
                const isDragOver = dragOverColumn === col.id;
                const isFocusedSingleStage = selectedStageFilter !== 'all';

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`rounded-2xl border transition-all flex flex-col min-h-[500px] ${
                      isFocusedSingleStage ? 'col-span-full bg-zinc-950/60 p-4' : col.bgColor
                    } ${
                      isDragOver ? `${col.borderColor} ring-2 ring-indigo-500/40 bg-zinc-900/60` : 'border-zinc-900'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="p-3.5 border-b border-zinc-900/80 flex items-center justify-between">
                      <div
                        onClick={() => setSelectedStageFilter(selectedStageFilter === col.id ? 'all' : col.id)}
                        className="flex items-center gap-2 cursor-pointer group"
                        title={selectedStageFilter === col.id ? 'Show all stages' : `Filter only ${col.title}`}
                      >
                        <ColumnIcon className={`w-4 h-4 ${col.color}`} />
                        <h3 className="text-xs font-bold text-white tracking-wide group-hover:text-indigo-400 transition-colors">
                          {col.title}
                        </h3>
                        {selectedStageFilter === col.id && (
                          <span className="text-[10px] text-zinc-500 font-normal">(Click to show all)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {items.length > 0 && (
                          <button
                            onClick={() => {
                              const itemIds = items.map((i) => i.id);
                              const allColSelected = itemIds.every((id) => selectedEntryIds.includes(id));
                              if (allColSelected) {
                                setSelectedEntryIds((prev) => prev.filter((id) => !itemIds.includes(id)));
                              } else {
                                const set = new Set([...selectedEntryIds, ...itemIds]);
                                setSelectedEntryIds(Array.from(set));
                              }
                            }}
                            className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                            title="Select all in column"
                          >
                            Select All
                          </button>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-zinc-900 border border-zinc-800 ${col.color}`}>
                          {items.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Items */}
                    <div
                      className={`p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[75vh] ${
                        isFocusedSingleStage ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 space-y-0' : ''
                      }`}
                    >
                      {items.length === 0 ? (
                        <div className="h-32 flex items-center justify-center border-2 border-dashed border-zinc-900 rounded-xl text-[11px] text-zinc-600 col-span-full">
                          Drop candidates here or change filter
                        </div>
                      ) : (
                        items.map((entry) => {
                          const isSelected = selectedEntryIds.includes(entry.id);

                          return (
                            <div
                              key={entry.id}
                              draggable
                              onDragStart={() => handleDragStart(entry.id)}
                              className={`rounded-xl p-3.5 space-y-3 cursor-grab active:cursor-grabbing transition-all shadow-md group relative select-none border ${
                                isSelected
                                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-500/10'
                                  : 'bg-zinc-950 hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                              }`}
                            >
                              {/* Candidate Header with Checkbox */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* Selection Checkbox */}
                                  <button
                                    onClick={(e) => toggleSelectCandidate(entry.id, e)}
                                    className={`p-0.5 rounded transition-colors shrink-0 ${
                                      isSelected
                                        ? 'text-indigo-400 bg-indigo-500/20'
                                        : 'text-zinc-600 hover:text-zinc-300'
                                    }`}
                                    title={isSelected ? 'Deselect candidate' : 'Select candidate'}
                                  >
                                    {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                  </button>

                                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 shrink-0 overflow-hidden">
                                    {entry.jobSeekerProfile.profilePhotoUrl ? (
                                      <img
                                        src={entry.jobSeekerProfile.profilePhotoUrl}
                                        alt={entry.jobSeekerProfile.fullName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      entry.jobSeekerProfile.fullName.charAt(0)
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                                      {entry.jobSeekerProfile.fullName}
                                    </h4>
                                    <p className="text-[10px] text-zinc-500 truncate">{entry.jobSeekerProfile.email}</p>
                                  </div>
                                </div>

                                {(() => {
                                  const displayScore = Math.round(entry.cvAnalysis?.overallScore ?? entry.skillScore);
                                  const scoreColor =
                                    displayScore >= 75
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : displayScore >= 55
                                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                      : displayScore >= 40
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

                                  return (
                                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border shrink-0 ${scoreColor}`}>
                                      {displayScore}%
                                    </span>
                                  );
                                })()}
                              </div>

                              {/* AI Recommendation Pill if present */}
                              {entry.cvAnalysis?.recommendation && (
                                <div className="flex items-center gap-1.5">
                                  {entry.cvAnalysis.recommendation === 'STRONG_MATCH' && (
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                                      <span>⭐</span> Strong Match
                                    </span>
                                  )}
                                  {entry.cvAnalysis.recommendation === 'GOOD_MATCH' && (
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full flex items-center gap-1">
                                      <span>✓</span> Good Fit
                                    </span>
                                  )}
                                  {entry.cvAnalysis.recommendation === 'MODERATE_MATCH' && (
                                    <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                                      <span>⚠</span> Moderate
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Scores & Resume Pill & Dynamic Aging */}
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-900 flex-wrap gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span>
                                    Priority: <strong className="text-emerald-400 font-semibold">{Math.round(entry.effectivePriority ?? entry.priorityScore)}</strong>
                                  </span>
                                  {(entry.agingBonus > 0 || (entry.minutesWaiting ?? 0) > 0) && (
                                    <span
                                      className="px-1.5 py-0.2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-[9px]"
                                      title="Dynamic anti-starvation boost"
                                    >
                                      ⏱ {entry.minutesWaiting ?? 0}m (+{Math.round(entry.agingBonus ?? 0)} pts)
                                    </span>
                                  )}
                                </div>

                                {entry.resume || entry.cvFileUrl || entry.cvAnalysis ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCandidateDrawer(entry);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-indigo-400 hover:text-indigo-300 rounded border border-zinc-800 transition-colors"
                                    title="View CV & AI Score Matrix"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>AI Matrix</span>
                                  </button>
                                ) : (
                                  <span className="text-zinc-600">Profile Only</span>
                                )}
                              </div>

                              {/* Actions on Card */}
                              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-1">
                                <button
                                  onClick={() => openCandidateDrawer(entry)}
                                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                                  title="View Full Profile & CV"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <div className="flex items-center gap-1">
                                  {col.id !== 'interviewing' && (
                                    <button
                                      onClick={() => handleCallCandidate(entry)}
                                      className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                      title="Call into Video Call"
                                    >
                                      <Video className="w-3 h-3" />
                                      <span>Call</span>
                                    </button>
                                  )}

                                  {col.id !== 'priority' && col.id !== 'accepted' && (
                                    <button
                                      onClick={() => handleMoveCandidateStatus(entry.id, 'priority')}
                                      className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                      title="Move to Priority"
                                    >
                                      <Star className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {col.id !== 'accepted' && (
                                    <button
                                      onClick={() => handleMoveCandidateStatus(entry.id, 'accepted')}
                                      className="p-1.5 text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                                      title="Accept / Shortlist"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {col.id !== 'skipped' && (
                                    <button
                                      onClick={() => {
                                        setCandidateToReject(entry);
                                        setRejectModalOpen(true);
                                      }}
                                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                      title="Reject / Skip"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ─── LIST VIEW ──────────────────────────────────────────────── */
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] text-zinc-500 uppercase tracking-wider bg-zinc-900/40">
                    <th className="p-4 w-12">
                      <button
                        onClick={handleSelectAllVisible}
                        className="text-zinc-500 hover:text-zinc-300"
                        title="Select All"
                      >
                        {selectedEntryIds.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4">Skill Match</th>
                    <th className="p-4">Priority Score</th>
                    <th className="p-4">Resume / CV</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-xs">
                  {filteredQueue
                    .filter((e) =>
                      selectedStageFilter === 'all' ? true : e.status === selectedStageFilter
                    )
                    .map((entry) => {
                      const isSelected = selectedEntryIds.includes(entry.id);

                      return (
                        <tr
                          key={entry.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-indigo-950/20' : 'hover:bg-zinc-900/30'
                          }`}
                        >
                          <td className="p-4">
                            <button
                              onClick={(e) => toggleSelectCandidate(entry.id, e)}
                              className={`p-0.5 rounded transition-colors ${
                                isSelected ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-400" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300 overflow-hidden">
                                {entry.jobSeekerProfile.profilePhotoUrl ? (
                                  <img
                                    src={entry.jobSeekerProfile.profilePhotoUrl}
                                    alt={entry.jobSeekerProfile.fullName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  entry.jobSeekerProfile.fullName.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-white">{entry.jobSeekerProfile.fullName}</div>
                                <div className="text-[11px] text-zinc-500">{entry.jobSeekerProfile.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300">
                              {entry.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-indigo-400">{Math.round(entry.skillScore)}%</span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-emerald-400">{Math.round(entry.priorityScore)}</span>
                          </td>
                          <td className="p-4">
                            {entry.resume ? (
                              <button
                                onClick={() => openCandidateDrawer(entry)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-indigo-400 rounded-lg border border-zinc-800 text-xs font-semibold"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{entry.resume.name || 'View CV'}</span>
                              </button>
                            ) : (
                              <span className="text-zinc-600 text-xs">No CV</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleCallCandidate(entry)}
                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Call</span>
                              </button>
                              <button
                                onClick={() => openCandidateDrawer(entry)}
                                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-xs font-semibold"
                              >
                                Inspect
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── FLOATING BATCH ACTION TOOLBAR ─────────────────────────────── */}
          {selectedEntryIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-950/95 border border-indigo-500/60 backdrop-blur-xl shadow-2xl rounded-2xl p-3 sm:px-5 flex items-center gap-3 sm:gap-4 max-w-2xl w-[92vw] sm:w-auto animate-in fade-in slide-in-from-bottom-5">
              <div className="flex items-center gap-2 shrink-0 text-xs font-bold text-white pr-3 border-r border-zinc-800">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>
                  {selectedEntryIds.length} Candidate{selectedEntryIds.length > 1 ? 's' : ''} Selected
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap flex-1 justify-center sm:justify-start">
                <span className="text-[11px] text-zinc-500 font-semibold hidden md:inline">Assign:</span>

                <button
                  onClick={() => handleBatchMove('priority')}
                  disabled={batchUpdating}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  title="Move selected to Priority Shortlist"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>Priority</span>
                </button>

                <button
                  onClick={() => handleBatchMove('waiting')}
                  disabled={batchUpdating}
                  className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  title="Move selected to Applied Queue"
                >
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Queue</span>
                </button>

                <button
                  onClick={() => handleBatchMove('accepted')}
                  disabled={batchUpdating}
                  className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  title="Mark selected as Accepted / Shortlisted"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Accept / OK</span>
                </button>

                <button
                  onClick={() => handleBatchMove('skipped')}
                  disabled={batchUpdating}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  title="Reject / Skip selected candidates"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reject</span>
                </button>
              </div>

              <button
                onClick={handleDeselectAll}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors ml-auto shrink-0"
                title="Clear Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ─── CANDIDATE PROFILE & CV DRAWER / MODAL ─────────────────────── */}
      {candidateDrawerOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              onClick={() => setCandidateDrawerOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Candidate Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-bold text-white overflow-hidden shrink-0">
                {selectedCandidate.jobSeekerProfile.profilePhotoUrl ? (
                  <img
                    src={selectedCandidate.jobSeekerProfile.profilePhotoUrl}
                    alt={selectedCandidate.jobSeekerProfile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedCandidate.jobSeekerProfile.fullName.charAt(0)
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-extrabold text-white">{selectedCandidate.jobSeekerProfile.fullName}</h2>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-full uppercase">
                    {selectedCandidate.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{selectedCandidate.jobSeekerProfile.email}</p>
                {selectedCandidate.jobSeekerProfile.location && (
                  <p className="text-[11px] text-zinc-500">{selectedCandidate.jobSeekerProfile.location}</p>
                )}
              </div>
            </div>

            {/* ─── AI SCORE MATRIX & GAUGES ───────────────────────────── */}
            {(() => {
              const matrix = selectedCandidate.cvAnalysis;
              const overall = Math.round(matrix?.overallScore ?? selectedCandidate.skillScore);
              const skillScore = Math.round(matrix?.skillScore ?? selectedCandidate.skillScore);
              const expScore = Math.round(matrix?.experienceScore ?? 65);
              const effectivePrio = Math.round(selectedCandidate.effectivePriority ?? selectedCandidate.priorityScore);
              const minutes = selectedCandidate.minutesWaiting ?? Math.round((Date.now() - new Date(selectedCandidate.waitingSince).getTime()) / 60000);
              const agingBonus = selectedCandidate.agingBonus ?? 0;

              return (
                <div className="space-y-4">
                  {/* Gauge Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 text-center space-y-1">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Overall Fit</div>
                      <div className="text-2xl font-black text-emerald-400">{overall}%</div>
                    </div>
                    <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 text-center space-y-1">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Skill Match</div>
                      <div className="text-2xl font-black text-indigo-400">{skillScore}%</div>
                    </div>
                    <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 text-center space-y-1">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Exp Match</div>
                      <div className="text-2xl font-black text-purple-400">{expScore}%</div>
                    </div>
                    <div className="bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800 text-center space-y-1">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Effective Priority</div>
                      <div className="text-2xl font-black text-amber-400">{effectivePrio}</div>
                    </div>
                  </div>

                  {/* Anti-Starvation Dynamic Aging Box */}
                  <div className="p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Dynamic Anti-Starvation Aging</span>
                      </span>
                      <span className="text-[11px] text-amber-400 font-semibold">
                        +0.75 pts / min waiting
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 grid grid-cols-3 gap-2 text-center bg-black/40 p-2.5 rounded-lg border border-zinc-800/50">
                      <div>
                        <div className="text-[10px] text-zinc-500">Base Match</div>
                        <div className="font-bold text-white">{overall} pts</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500">Waited ({minutes}m)</div>
                        <div className="font-bold text-amber-400">+{Math.round(agingBonus)} pts boost</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500">Queue Priority</div>
                        <div className="font-bold text-emerald-400">{effectivePrio} pts</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Executive Summary & Strengths/Gaps */}
                  {matrix && (
                    <div className="space-y-3 bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>AI Screening Matrix</span>
                        </span>
                        {matrix.recommendation && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-md uppercase">
                            {matrix.recommendation.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {matrix.summary && (
                        <p className="text-xs text-zinc-300 leading-relaxed italic bg-black/30 p-2.5 rounded-lg">
                          "{matrix.summary}"
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {matrix.strengths?.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Key Strengths
                            </span>
                            <ul className="space-y-1 text-xs text-zinc-300">
                              {matrix.strengths.map((st, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-400 shrink-0">•</span>
                                  <span>{st}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {matrix.missingSkills?.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Skills Gaps / Missing
                            </span>
                            <ul className="space-y-1 text-xs text-zinc-300">
                              {matrix.missingSkills.map((ms, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-amber-400 shrink-0">•</span>
                                  <span>{ms}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Resume / CV Attachment Section */}
            <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Candidate Resume / CV</span>
                </div>
                {(selectedCandidate.resume?.filePath || selectedCandidate.cvFileUrl) && (
                  <a
                    href={selectedCandidate.resume?.filePath || selectedCandidate.cvFileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                  >
                    <span>View / Open PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              {selectedCandidate.resume ? (
                <div className="text-xs text-zinc-400 space-y-1">
                  <div>Document: <strong className="text-zinc-200">{selectedCandidate.resume.name}</strong></div>
                  <div>Submitted for Walk-In Evaluation</div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Profile skills & experience used for evaluation.</p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Candidate Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.jobSeekerProfile.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg font-medium"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Evaluation Actions Footer */}
            <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMoveCandidateStatus(selectedCandidate.id, 'priority')}
                  className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Prioritize</span>
                </button>
                <button
                  onClick={() => handleMoveCandidateStatus(selectedCandidate.id, 'accepted')}
                  className="px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept / OK</span>
                </button>
                <button
                  onClick={() => {
                    setCandidateToReject(selectedCandidate);
                    setRejectModalOpen(true);
                  }}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setCandidateDrawerOpen(false);
                  handleCallCandidate(selectedCandidate);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Call to Video Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ROOM LIMIT & SETTINGS MODAL ─────────────────────────────── */}
      {settingsModalOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setSettingsModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Room Capacity & Settings</h2>
              <p className="text-xs text-zinc-400">Configure participant limits and evaluation parameters</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Room Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Participant Limit (Max Queue)</label>
                  <input
                    type="number"
                    value={editMaxQueue}
                    onChange={(e) => setEditMaxQueue(Number(e.target.value))}
                    min={1}
                    max={200}
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Priority Threshold (%)</label>
                  <input
                    type="number"
                    value={editPriorityThreshold}
                    onChange={(e) => setEditPriorityThreshold(Number(e.target.value))}
                    min={30}
                    max={100}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Minimum Experience Requirement</label>
                <input
                  type="text"
                  placeholder="e.g. 2+ years in frontend or fullstack"
                  value={editMinExperience}
                  onChange={(e) => setEditMinExperience(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Custom Evaluation Criteria (for AI)</label>
                <textarea
                  placeholder="e.g. Strong React/Next.js skills, practical experience building APIs and PostgreSQL databases..."
                  value={editEvaluationCriteria}
                  onChange={(e) => setEditEvaluationCriteria(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20"
                >
                  {savingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE ROOM MODAL ────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Create New Walk-In Room</h2>
              <p className="text-xs text-zinc-400">Launch an instant evaluation room with automated AI matching</p>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Room Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Fullstack Engineer Walk-In"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Participant Limit</label>
                  <input
                    type="number"
                    value={maxQueue}
                    onChange={(e) => setMaxQueue(Number(e.target.value))}
                    min={1}
                    max={200}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Priority Threshold (%)</label>
                  <input
                    type="number"
                    value={priorityThreshold}
                    onChange={(e) => setPriorityThreshold(Number(e.target.value))}
                    min={30}
                    max={100}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Minimum Experience Level</label>
                <input
                  type="text"
                  placeholder="e.g. 2+ years / Mid-level"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Custom Evaluation Criteria (for AI)</label>
                <textarea
                  placeholder="e.g. Strong problem solving, production Next.js experience, Docker or cloud basics..."
                  value={evaluationCriteria}
                  onChange={(e) => setEvaluationCriteria(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Required Skills for AI Scoring</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type skill & press Add"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                          setSkills([...skills, skillInput.trim()]);
                          setSkillInput('');
                        }
                      }
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                        setSkills([...skills, skillInput.trim()]);
                        setSkillInput('');
                      }
                    }}
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {skills.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => setSkills(skills.filter((sk) => sk !== s))}
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Description (Optional)</label>
                <textarea
                  placeholder="Instructions or prerequisites for candidates..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20"
                >
                  {creating ? 'Creating...' : 'Launch Walk-In Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REJECT / FEEDBACK MODAL ─────────────────────────────────── */}
      {rejectModalOpen && candidateToReject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Reject / Skip {candidateToReject.jobSeekerProfile.fullName}?
            </h3>
            <p className="text-xs text-zinc-400">
              Provide an optional evaluation note or feedback reason for this candidate.
            </p>

            <textarea
              placeholder="e.g. Skill mismatch on backend frameworks..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-rose-500 rounded-xl p-3 text-xs text-white outline-none resize-none"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
