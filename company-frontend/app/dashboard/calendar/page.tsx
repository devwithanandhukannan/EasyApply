'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  Video,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Briefcase,
  StickyNote,
  Trash2,
  Edit3,
  X,
  Grid,
  List,
  Columns3,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  Building2,
  DoorOpen,
  User,
  Star,
  FileText,
  Zap,
  Users,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';
import { useAuth } from '@/app/contexts/AuthContext';

interface InterviewRecord {
  id: string;
  livekitRoomName: string;
  scheduledTime: string;
  durationMinutes: number;
  format: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'reschedule_requested' | 'confirmed';
  feedbacks?: Array<{
    id: string;
    technicalRating: number;
    communicationRating: number;
    problemSolvingRating: number;
    verdict: string;
    notes: string | null;
  }>;
  application: {
    id: string;
    jobSeekerProfile: {
      id: string;
      fullName: string;
      email: string;
      profilePhotoUrl: string | null;
    };
    jobPosting: {
      title: string;
    };
  };
}

interface WalkInRoom {
  id: string;
  roomCode: string;
  title: string;
  status: 'open' | 'paused' | 'closed';
  allowedQueueSize: number;
  createdAt: string;
}

interface OfferRecord {
  id: string;
  candidateName: string;
  candidateEmail: string;
  positionTitle: string;
  status: string;
  expiryDate?: string;
  createdAt: string;
}

interface CompanyNote {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm in 24h
  durationMinutes: number;
  isAllDay?: boolean;
  category: 'interview_debrief' | 'team_sync' | 'candidate_review' | 'offer_decision' | 'reminder';
  candidateName?: string;
  roleTitle?: string;
  content: string;
  color: 'purple' | 'blue' | 'green' | 'amber' | 'rose' | 'cyan';
  isCompleted?: boolean;
  createdAt: string;
}

type ViewMode = 'week' | '3day' | 'day' | 'month' | 'agenda';

const HOUR_HEIGHT = 64; // Height in px for each hour slot
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);

export default function CompanyCalendarPage() {
  const { user, company, isAdmin, isHR, isInterviewer } = useAuth();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [walkinRooms, setWalkinRooms] = useState<WalkInRoom[]>([]);
  const [offers, setOffers] = useState<OfferRecord[]>([]);
  const [customNotes, setCustomNotes] = useState<CompanyNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar Navigation States
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal & Note Creation States
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CompanyNote | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<any | null>(null);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('10:00');
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formCategory, setFormCategory] = useState<CompanyNote['category']>('interview_debrief');
  const [formCandidate, setFormCandidate] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState<CompanyNote['color']>('purple');

  const timeGridScrollRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `easyapply_company_calendar_notes_${company?.id || 'company'}`;

  // Helper date key YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load custom company notes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCustomNotes(JSON.parse(saved));
      } else {
        const todayStr = formatDateKey(new Date());
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDateKey(tomorrow);

        const initialNotes: CompanyNote[] = [
          {
            id: 'comp-note-1',
            title: 'Candidate Technical Debrief (L5 Frontend)',
            date: todayStr,
            startTime: '11:00',
            durationMinutes: 45,
            isAllDay: false,
            category: 'interview_debrief',
            candidateName: 'Alex Rivers',
            roleTitle: 'Senior Frontend Engineer',
            content: 'Align on system design scores, code readability, and LiveKit audio sync test feedback.',
            color: 'purple',
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'comp-note-2',
            title: 'Hiring Committee Decision & Offer Alignment',
            date: todayStr,
            startTime: '15:30',
            durationMinutes: 60,
            isAllDay: false,
            category: 'offer_decision',
            candidateName: 'Sarah Chen',
            roleTitle: 'Staff Backend Architect',
            content: 'Review salary benchmark, equity tier, and finalize offer package approval.',
            color: 'green',
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'comp-note-3',
            title: 'Weekly Walk-In Fast-Track Sifting Sync',
            date: tomorrowStr,
            startTime: '10:00',
            durationMinutes: 60,
            isAllDay: false,
            category: 'team_sync',
            candidateName: 'HR & Engineering Leads',
            roleTitle: 'Walk-In Pipeline',
            content: 'Review queue velocity and assign interviewers for incoming walk-in candidates.',
            color: 'blue',
            isCompleted: false,
            createdAt: new Date().toISOString(),
          },
        ];
        setCustomNotes(initialNotes);
        localStorage.setItem(storageKey, JSON.stringify(initialNotes));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const saveCustomNotes = (notes: CompanyNote[]) => {
    setCustomNotes(notes);
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch interviews, walkin rooms, and offers from backend
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setIsLoading(true);
        const [intRes, walkinRes, offerRes] = await Promise.allSettled([
          api.get('/company/interviews/list'),
          api.get('/walkin/rooms'),
          api.get('/company/offers'),
        ]);

        if (intRes.status === 'fulfilled' && intRes.value.data.success) {
          setInterviews(intRes.value.data.data || []);
        }
        if (walkinRes.status === 'fulfilled' && walkinRes.value.data.success) {
          setWalkinRooms(walkinRes.value.data.rooms || walkinRes.value.data.data || []);
        }
        if (offerRes.status === 'fulfilled' && offerRes.value.data.success) {
          setOffers(offerRes.value.data.data || []);
        }
      } catch (err) {
        console.error('Error loading company schedule data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  // Auto-scroll to 8:00 AM on initial load
  useEffect(() => {
    if (timeGridScrollRef.current) {
      const scrollPos = 8 * HOUR_HEIGHT;
      timeGridScrollRef.current.scrollTop = scrollPos;
    }
  }, [viewMode]);

  // Aggregate All Company Events with Exact Time & Duration
  const allEvents = useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      subtitle: string;
      date: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      isAllDay: boolean;
      type: 'interview' | 'walkin' | 'offer' | 'note';
      category: string;
      status?: string;
      color: string;
      rawData: any;
    }> = [];

    // 1. Live Interviews
    interviews.forEach((interview) => {
      const d = new Date(interview.scheduledTime);
      const dateKey = formatDateKey(d);
      const startH = String(d.getHours()).padStart(2, '0');
      const startM = String(d.getMinutes()).padStart(2, '0');
      const startTime = `${startH}:${startM}`;
      const duration = interview.durationMinutes || 45;

      const endD = new Date(d.getTime() + duration * 60000);
      const endH = String(endD.getHours()).padStart(2, '0');
      const endM = String(endD.getMinutes()).padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      const candidateName = interview.application?.jobSeekerProfile?.fullName || 'Candidate';
      const roleTitle = interview.application?.jobPosting?.title || 'Technical Round';

      let color = 'purple';
      if (interview.status === 'confirmed') color = 'green';
      if (interview.status === 'reschedule_requested') color = 'amber';
      if (interview.status === 'in_progress') color = 'rose';
      if (interview.status === 'completed') color = 'blue';

      events.push({
        id: `interview-${interview.id}`,
        title: candidateName,
        subtitle: `${roleTitle} (${interview.format || 'Video'})`,
        date: dateKey,
        startTime,
        endTime,
        durationMinutes: duration,
        isAllDay: false,
        type: 'interview',
        category: 'Live Interview',
        status: interview.status,
        color,
        rawData: interview,
      });
    });

    // 2. Walk-In Rooms
    walkinRooms.forEach((room) => {
      const d = new Date(room.createdAt || Date.now());
      const dateKey = formatDateKey(d);

      events.push({
        id: `walkin-${room.id}`,
        title: `Walk-In: ${room.title}`,
        subtitle: `Room #${room.roomCode} • Max ${room.allowedQueueSize}`,
        date: dateKey,
        startTime: '09:00',
        endTime: '17:00',
        durationMinutes: 480,
        isAllDay: true,
        type: 'walkin',
        category: 'Walk-In Room',
        status: room.status,
        color: room.status === 'open' ? 'cyan' : 'amber',
        rawData: room,
      });
    });

    // 3. Offers
    offers.forEach((offer) => {
      const d = new Date(offer.createdAt || Date.now());
      const dateKey = formatDateKey(d);

      events.push({
        id: `offer-${offer.id}`,
        title: `Offer: ${offer.candidateName}`,
        subtitle: offer.positionTitle,
        date: dateKey,
        startTime: '10:00',
        endTime: '10:30',
        durationMinutes: 30,
        isAllDay: true,
        type: 'offer',
        category: 'Offer Letter',
        status: offer.status,
        color: 'green',
        rawData: offer,
      });
    });

    // 4. Custom Company Notes
    customNotes.forEach((note) => {
      const [h, m] = (note.startTime || '10:00').split(':').map(Number);
      const duration = note.durationMinutes || 60;
      const endMinuteTotal = h * 60 + (m || 0) + duration;
      const endH = String(Math.floor(endMinuteTotal / 60) % 24).padStart(2, '0');
      const endM = String(endMinuteTotal % 60).padStart(2, '0');

      events.push({
        id: `note-${note.id}`,
        title: note.title,
        subtitle: [note.candidateName, note.roleTitle].filter(Boolean).join(' • ') || 'Team Task',
        date: note.date,
        startTime: note.startTime || '10:00',
        endTime: `${endH}:${endM}`,
        durationMinutes: duration,
        isAllDay: !!note.isAllDay,
        type: 'note',
        category: note.category.replace('_', ' ').toUpperCase(),
        status: note.isCompleted ? 'Completed' : 'Pending',
        color: note.color,
        rawData: note,
      });
    });

    return events;
  }, [interviews, walkinRooms, offers, customNotes]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (selectedCategory === 'interviews' && ev.type !== 'interview') return false;
      if (selectedCategory === 'walkin' && ev.type !== 'walkin') return false;
      if (selectedCategory === 'notes' && ev.type !== 'note') return false;
      if (selectedCategory === 'offers' && ev.type !== 'offer') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchSub = ev.subtitle.toLowerCase().includes(q);
        const matchCategory = ev.category.toLowerCase().includes(q);
        return matchTitle || matchSub || matchCategory;
      }
      return true;
    });
  }, [allEvents, selectedCategory, searchQuery]);

  // Column Days Generator
  const visibleDays = useMemo(() => {
    const days = [];
    const base = new Date(currentDate);

    let count = 7;
    let offset = 0;

    if (viewMode === 'week') {
      count = 7;
      const dayOfWeek = (base.getDay() + 6) % 7; // Monday = 0
      base.setDate(base.getDate() - dayOfWeek);
    } else if (viewMode === '3day') {
      count = 3;
    } else if (viewMode === 'day') {
      count = 1;
    }

    for (let i = 0; i < count; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i + offset);
      const isToday = formatDateKey(d) === formatDateKey(new Date());
      const isCurrentActive = formatDateKey(d) === formatDateKey(currentDate);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      days.push({
        date: d,
        dateKey: formatDateKey(d),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday,
        isCurrentActive,
        isWeekend,
      });
    }
    return days;
  }, [currentDate, viewMode]);

  // Month Grid Days Generator
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: formatDateKey(d) === formatDateKey(new Date()),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        dayNumber: i,
        isCurrentMonth: true,
        isToday: formatDateKey(d) === formatDateKey(new Date()),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: formatDateKey(d) === formatDateKey(new Date()),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }

    return days;
  }, [currentDate]);

  // Next Upcoming Interview Banner for Company
  const nextInterview = useMemo(() => {
    const now = new Date().getTime();
    const upcoming = interviews
      .filter((i) => ['scheduled', 'confirmed'].includes(i.status) && new Date(i.scheduledTime).getTime() >= now)
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
    return upcoming[0] || null;
  }, [interviews]);

  // Current Live Minute Indicator for Today
  const currentMinutePosition = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const totalMinutes = h * 60 + m;
    return (totalMinutes / 60) * HOUR_HEIGHT;
  }, []);

  const currentTimeLabel = useMemo(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, []);

  // Navigation Handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === '3day') {
      d.setDate(d.getDate() - 3);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === '3day') {
      d.setDate(d.getDate() + 3);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open note modal
  const handleOpenNewNote = (dateKey?: string, defaultHour?: number) => {
    setEditingNote(null);
    setFormTitle('');
    setFormDate(dateKey || formatDateKey(new Date()));
    const hourStr = defaultHour !== undefined ? String(defaultHour).padStart(2, '0') + ':00' : '10:00';
    setFormStartTime(hourStr);
    setFormDuration(60);
    setFormIsAllDay(false);
    setFormCategory('interview_debrief');
    setFormCandidate('');
    setFormRole('');
    setFormContent('');
    setFormColor('purple');
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: CompanyNote) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormDate(note.date);
    setFormStartTime(note.startTime || '10:00');
    setFormDuration(note.durationMinutes || 60);
    setFormIsAllDay(!!note.isAllDay);
    setFormCategory(note.category);
    setFormCandidate(note.candidateName || '');
    setFormRole(note.roleTitle || '');
    setFormContent(note.content);
    setFormColor(note.color);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    if (editingNote) {
      const updated = customNotes.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              title: formTitle.trim(),
              date: formDate,
              startTime: formStartTime,
              durationMinutes: Number(formDuration) || 60,
              isAllDay: formIsAllDay,
              category: formCategory,
              candidateName: formCandidate.trim(),
              roleTitle: formRole.trim(),
              content: formContent.trim(),
              color: formColor,
            }
          : n
      );
      saveCustomNotes(updated);
    } else {
      const newNote: CompanyNote = {
        id: `comp-note-${Date.now()}`,
        title: formTitle.trim(),
        date: formDate,
        startTime: formStartTime,
        durationMinutes: Number(formDuration) || 60,
        isAllDay: formIsAllDay,
        category: formCategory,
        candidateName: formCandidate.trim(),
        roleTitle: formRole.trim(),
        content: formContent.trim(),
        color: formColor,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      saveCustomNotes([newNote, ...customNotes]);
    }

    setIsNoteModalOpen(false);
  };

  const handleDeleteNote = (id: string) => {
    const updated = customNotes.filter((n) => n.id !== id);
    saveCustomNotes(updated);
    if (selectedEventDetail?.rawData?.id === id) {
      setSelectedEventDetail(null);
    }
  };

  const handleToggleNoteComplete = (id: string) => {
    const updated = customNotes.map((n) =>
      n.id === id ? { ...n, isCompleted: !n.isCompleted } : n
    );
    saveCustomNotes(updated);
  };

  const getCardTheme = (color: string) => {
    switch (color) {
      case 'purple':
        return {
          bg: 'bg-purple-500/12 dark:bg-purple-500/20 text-[#6b21a8] dark:text-purple-200 border-purple-500/30',
          leftBar: 'bg-[#7c3aed]',
          badge: 'bg-purple-500/20 text-[#7c3aed] dark:text-purple-300',
        };
      case 'blue':
        return {
          bg: 'bg-blue-500/12 dark:bg-blue-500/20 text-[#1e40af] dark:text-blue-200 border-blue-500/30',
          leftBar: 'bg-[#0071e3]',
          badge: 'bg-blue-500/20 text-[#0071e3] dark:text-blue-300',
        };
      case 'green':
        return {
          bg: 'bg-emerald-500/12 dark:bg-emerald-500/20 text-[#065f46] dark:text-emerald-200 border-emerald-500/30',
          leftBar: 'bg-[#10b981]',
          badge: 'bg-emerald-500/20 text-[#10b981] dark:text-emerald-300',
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/15 dark:bg-amber-500/20 text-[#92400e] dark:text-amber-200 border-amber-500/30',
          leftBar: 'bg-[#f59e0b]',
          badge: 'bg-amber-500/20 text-[#f59e0b] dark:text-amber-300',
        };
      case 'rose':
        return {
          bg: 'bg-rose-500/12 dark:bg-rose-500/20 text-[#9f1239] dark:text-rose-200 border-rose-500/30',
          leftBar: 'bg-[#f43f5e]',
          badge: 'bg-rose-500/20 text-[#f43f5e] dark:text-rose-300',
        };
      case 'cyan':
      default:
        return {
          bg: 'bg-cyan-500/12 dark:bg-cyan-500/20 text-[#155e75] dark:text-cyan-200 border-cyan-500/30',
          leftBar: 'bg-[#06b6d4]',
          badge: 'bg-cyan-500/20 text-[#06b6d4] dark:text-cyan-300',
        };
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased p-1">
      {/* ── HEADER TITLE & ACTION BAR ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
              Company Hiring Calendar &amp; Schedule
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#86868b] dark:text-slate-400 mt-1 font-medium">
            Manage live technical evaluations, active walk-in rooms, candidate offer deadlines, and team debrief sessions.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Switchers */}
          <div className="bg-[#f2f2f7] dark:bg-[#1c1c1e] p-1 rounded-2xl flex items-center border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#0071e3] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Columns3 size={14} />
              <span>Week</span>
            </button>
            <button
              onClick={() => setViewMode('3day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === '3day'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#0071e3] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <span>3-Day</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#0071e3] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <span>Day</span>
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#0071e3] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Grid size={14} />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-[#2c2c2e] text-[#0071e3] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <List size={14} />
              <span>Agenda</span>
            </button>
          </div>

          {/* Quick Shortcuts */}
          <Link
            href="/dashboard/walkin"
            className="px-3.5 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <DoorOpen className="w-4 h-4 text-[#0071e3]" />
            <span>Walk-In Rooms</span>
          </Link>

          {/* Add Company Note */}
          <button
            onClick={() => handleOpenNewNote()}
            className="px-4 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] hover:from-[#0062c4] hover:to-[#1d4ed8] text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event / Note</span>
          </button>
        </div>
      </div>

      {/* ── NEXT UP LIVE INTERVIEW BANNER ───────────────────────────── */}
      {nextInterview && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-[#7c3aed] border border-purple-500/20">
                  Next Scheduled Candidate Interview
                </span>
                <span className="text-xs text-[#86868b] font-mono font-semibold">
                  {new Date(nextInterview.scheduledTime).toLocaleString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white mt-0.5">
                Candidate:{' '}
                <span className="text-[#7c3aed]">
                  {nextInterview.application?.jobSeekerProfile?.fullName || 'Candidate'}
                </span>{' '}
                &bull; Role:{' '}
                <span>{nextInterview.application?.jobPosting?.title || 'Technical Evaluation'}</span>
              </h3>
            </div>
          </div>

          <Link
            href={`/meet/${nextInterview.id}?role=company`}
            className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-2xl shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Video className="w-4 h-4" />
            <span>Launch Interview Room</span>
          </Link>
        </div>
      )}

      {/* ── FILTER & DATE NAVIGATION BAR ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1c1c1e] p-3.5 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            aria-label="Previous date range"
            className="p-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next date range"
            className="p-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white transition-colors cursor-pointer"
          >
            Today
          </button>
          <span className="text-sm font-bold text-[#1d1d1f] dark:text-white ml-2">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'interviews', label: 'Interviews' },
              { key: 'walkin', label: 'Walk-In Rooms' },
              { key: 'offers', label: 'Offers' },
              { key: 'notes', label: 'Notes & Syncs' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-[#0071e3] text-white shadow-xs'
                    : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-[#86868b] pointer-events-none" />
            <input
              type="text"
              placeholder="Search candidates, rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-xl text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] w-36 sm:w-48 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── 24-HOUR VERTICAL TIME GRID VIEW ─────────────────────────── */}
      {(viewMode === 'week' || viewMode === '3day' || viewMode === 'day') && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs overflow-hidden flex flex-col">
          {/* Header Row of Days */}
          <div className="flex border-b border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#18181a] select-none sticky top-0 z-20">
            {/* 24-Hour Time Gutter Corner */}
            <div className="w-16 sm:w-20 shrink-0 border-r border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center p-3 text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
              <span>24h Time</span>
            </div>

            {/* Day Columns Header */}
            <div
              className={`flex-1 grid ${
                viewMode === 'week'
                  ? 'grid-cols-7'
                  : viewMode === '3day'
                  ? 'grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {visibleDays.map((day) => {
                return (
                  <div
                    key={day.dateKey}
                    onClick={() => setCurrentDate(day.date)}
                    className={`py-3 px-2 text-center border-r border-black/[0.04] dark:border-white/[0.04] last:border-r-0 cursor-pointer transition-colors ${
                      day.isWeekend ? 'bg-black/[0.015] dark:bg-white/[0.015]' : ''
                    } hover:bg-[#0071e3]/5`}
                  >
                    <span className="block text-[11px] font-bold text-[#86868b] uppercase">
                      {day.dayName}
                    </span>
                    {day.isToday ? (
                      <div className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white text-xs font-black shadow-md shadow-blue-500/25">
                        {day.dayNumber}
                      </div>
                    ) : (
                      <span
                        className={`mt-1 inline-block text-xs font-black ${
                          day.isCurrentActive
                            ? 'text-[#0071e3]'
                            : 'text-[#1d1d1f] dark:text-white'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* All-Day / Rooms / Offers Banner */}
          <div className="flex border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f7f7f9] dark:bg-[#141416]">
            <div className="w-16 sm:w-20 shrink-0 border-r border-black/[0.06] dark:border-white/[0.08] p-2 text-[10px] font-bold text-[#86868b] flex items-center justify-center">
              All Day
            </div>
            <div
              className={`flex-1 grid ${
                viewMode === 'week'
                  ? 'grid-cols-7'
                  : viewMode === '3day'
                  ? 'grid-cols-3'
                  : 'grid-cols-1'
              } p-1.5 gap-1`}
            >
              {visibleDays.map((day) => {
                const allDayItems = filteredEvents.filter(
                  (ev) => ev.date === day.dateKey && ev.isAllDay
                );

                return (
                  <div key={day.dateKey} className="min-h-[28px] space-y-1">
                    {allDayItems.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEventDetail(ev)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate cursor-pointer hover:opacity-90 border ${
                          ev.type === 'walkin'
                            ? 'bg-cyan-500/15 border-cyan-500/25 text-cyan-600 dark:text-cyan-300'
                            : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-600 dark:text-emerald-300'
                        }`}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable 24-Hour Time Grid */}
          <div
            ref={timeGridScrollRef}
            className="overflow-y-auto max-h-[640px] custom-scrollbar relative flex"
          >
            {/* 24-Hour Time Gutter */}
            <div className="w-16 sm:w-20 shrink-0 border-r border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#18181a] select-none sticky left-0 z-10">
              {HOURS_24.map((hour) => {
                const hourStr = `${String(hour).padStart(2, '0')}:00`;
                return (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-black/[0.04] dark:border-white/[0.04] px-2 pt-1 text-right text-[11px] font-bold font-mono text-[#86868b]"
                  >
                    {hourStr}
                  </div>
                );
              })}
            </div>

            {/* Columns Container */}
            <div
              className={`flex-1 grid relative ${
                viewMode === 'week'
                  ? 'grid-cols-7'
                  : viewMode === '3day'
                  ? 'grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {/* Horizontal Hour Lines Background */}
              <div className="absolute inset-0 pointer-events-none">
                {HOURS_24.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-black/[0.04] dark:border-white/[0.04] relative"
                  >
                    <div
                      style={{ top: `${HOUR_HEIGHT / 2}px` }}
                      className="absolute left-0 right-0 border-b border-dashed border-black/[0.02] dark:border-white/[0.03]"
                    />
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {visibleDays.map((day) => {
                const dayEvents = filteredEvents.filter(
                  (ev) => ev.date === day.dateKey && !ev.isAllDay
                );

                return (
                  <div
                    key={day.dateKey}
                    className={`relative border-r border-black/[0.04] dark:border-white/[0.04] last:border-r-0 ${
                      day.isWeekend
                        ? 'bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.015),rgba(0,0,0,0.015)_8px,transparent_8px,transparent_16px)] dark:bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.015),rgba(255,255,255,0.015)_8px,transparent_8px,transparent_16px)]'
                        : ''
                    }`}
                    style={{ height: `${24 * HOUR_HEIGHT}px` }}
                  >
                    {/* Clickable Hour Slots */}
                    {HOURS_24.map((hour) => (
                      <div
                        key={hour}
                        onClick={() => handleOpenNewNote(day.dateKey, hour)}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="cursor-pointer hover:bg-[#0071e3]/5 transition-colors"
                        title={`Add interview or note on ${day.dateKey} at ${String(hour).padStart(2, '0')}:00`}
                      />
                    ))}

                    {/* Today Live Indicator */}
                    {day.isToday && (
                      <div
                        style={{ top: `${currentMinutePosition}px` }}
                        className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm -ml-1 shrink-0" />
                        <div className="flex-1 border-t-2 border-red-500 shadow-sm" />
                        <span className="text-[9px] font-bold font-mono bg-red-500 text-white px-1 py-0.5 rounded shadow-sm">
                          {currentTimeLabel}
                        </span>
                      </div>
                    )}

                    {/* Event Cards */}
                    {dayEvents.map((ev) => {
                      const [h, m] = (ev.startTime || '10:00').split(':').map(Number);
                      const startMinute = h * 60 + (m || 0);
                      const topPx = (startMinute / 60) * HOUR_HEIGHT;
                      const heightPx = Math.max(34, (ev.durationMinutes / 60) * HOUR_HEIGHT);
                      const cardTheme = getCardTheme(ev.color);

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventDetail(ev);
                          }}
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx - 4}px`,
                            left: '4px',
                            right: '4px',
                          }}
                          className={`absolute z-10 rounded-xl border ${cardTheme.bg} backdrop-blur-md p-2 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer overflow-hidden flex flex-col justify-between group hover:scale-[1.01]`}
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${cardTheme.leftBar}`}
                          />

                          <div className="pl-2">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-[11px] truncate leading-tight">
                                {ev.title}
                              </span>
                              {ev.status && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${cardTheme.badge} shrink-0 hidden sm:inline`}
                                >
                                  {ev.status}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] opacity-85 mt-0.5 truncate font-mono">
                              <Clock size={10} className="shrink-0" />
                              <span>
                                {ev.startTime} - {ev.endTime}
                              </span>
                              {ev.subtitle && (
                                <span className="opacity-75 font-sans truncate">
                                  &bull; {ev.subtitle}
                                </span>
                              )}
                            </div>
                          </div>

                          {heightPx >= 58 && (
                            <div className="pl-2 flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.06] text-[10px]">
                              {ev.type === 'interview' ? (
                                <Link
                                  href={`/meet/${ev.rawData.id}?role=company`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-2 py-0.5 bg-[#7c3aed] text-white font-bold rounded text-[9px] hover:bg-[#6d28d9] flex items-center gap-1 shadow-2xs"
                                >
                                  <Video size={10} />
                                  <span>Start Live</span>
                                </Link>
                              ) : ev.type === 'note' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleNoteComplete(ev.rawData.id);
                                  }}
                                  className="text-[9px] font-bold hover:underline"
                                >
                                  {ev.rawData.isCompleted ? '✓ Done' : 'Mark Done'}
                                </button>
                              ) : (
                                <span className="text-[9px] opacity-75 font-bold uppercase">
                                  {ev.category}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MONTH GRID VIEW ────────────────────────────────────────── */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs overflow-hidden">
          <div className="grid grid-cols-7 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#18181a] text-center text-[11px] font-bold text-[#86868b] py-3">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-blue-600 dark:text-blue-400">Sat</div>
            <div className="text-blue-600 dark:text-blue-400">Sun</div>
          </div>

          <div className="grid grid-cols-7 auto-rows-fr">
            {monthGridDays.map((day, idx) => {
              const dayEvents = filteredEvents.filter((ev) => ev.date === day.dateKey);

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenNewNote(day.dateKey)}
                  className={`min-h-[100px] sm:min-h-[120px] p-2 border-b border-r border-black/[0.04] dark:border-white/[0.04] flex flex-col justify-between transition-colors cursor-pointer hover:bg-[#0071e3]/5 ${
                    !day.isCurrentMonth ? 'opacity-35 bg-black/[0.01] dark:bg-white/[0.01]' : ''
                  } ${day.isWeekend ? 'bg-black/[0.015] dark:bg-white/[0.015]' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                        day.isToday
                          ? 'bg-[#0071e3] text-white shadow-xs'
                          : 'text-[#1d1d1f] dark:text-white'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-1.5 py-0.5 rounded-full">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventDetail(ev);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md truncate font-mono ${
                          ev.type === 'interview'
                            ? 'bg-purple-500 text-white'
                            : ev.type === 'walkin'
                            ? 'bg-cyan-500 text-white'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {ev.startTime} {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] font-bold text-[#86868b] block pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AGENDA / ACTIVITY LIST VIEW ────────────────────────────── */}
      {viewMode === 'agenda' && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="border border-dashed border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#1c1c1e] p-12 rounded-3xl text-center text-xs text-[#86868b] shadow-xs max-w-md mx-auto">
              <CalendarIcon className="mx-auto mb-3 text-[#86868b]" size={36} />
              <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white mb-1">
                No Calendar Items Found
              </h3>
              <p className="text-xs text-[#86868b]">
                Add custom hiring syncs, schedule interviews, or create walk-in rooms to populate this view.
              </p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isInterview = ev.type === 'interview';
              const isWalkin = ev.type === 'walkin';
              const isNote = ev.type === 'note';

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventDetail(ev)}
                  className="p-5 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                        isInterview
                          ? 'bg-gradient-to-tr from-[#7c3aed] to-[#9333ea]'
                          : isWalkin
                          ? 'bg-gradient-to-tr from-[#0284c7] to-[#06b6d4]'
                          : isNote
                          ? 'bg-gradient-to-tr from-[#0071e3] to-[#2563eb]'
                          : 'bg-gradient-to-tr from-[#059669] to-[#10b981]'
                      }`}
                    >
                      {isInterview ? (
                        <Video size={18} />
                      ) : isWalkin ? (
                        <DoorOpen size={18} />
                      ) : isNote ? (
                        <StickyNote size={18} />
                      ) : (
                        <FileText size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                          {ev.title}
                        </h3>
                        {ev.subtitle && (
                          <span className="text-xs text-[#86868b] font-medium">
                            &bull; {ev.subtitle}
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                          {ev.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#86868b] font-medium mt-1 font-mono">
                        <div className="flex items-center gap-1 font-sans">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#0071e3]" />
                          <span>{ev.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {ev.startTime} - {ev.endTime} ({ev.durationMinutes}m)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isInterview && (
                      <Link
                        href={`/meet/${ev.rawData.id}?role=company`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-2xl shadow-xs flex items-center gap-1.5"
                      >
                        <Video size={14} />
                        <span>Launch Room</span>
                      </Link>
                    )}
                    {isWalkin && (
                      <Link
                        href="/dashboard/walkin"
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-2xl shadow-xs flex items-center gap-1.5"
                      >
                        <DoorOpen size={14} />
                        <span>Queue Manager</span>
                      </Link>
                    )}
                    {isNote && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleNoteComplete(ev.rawData.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            ev.rawData.isCompleted
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white'
                          }`}
                        >
                          {ev.rawData.isCompleted ? '✓ Completed' : 'Mark Done'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditNote(ev.rawData);
                          }}
                          className="p-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] hover:text-[#0071e3] transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(ev.rawData.id);
                          }}
                          className="p-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── CREATE / EDIT COMPANY EVENT MODAL ───────────────────────── */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-xs">
                  <CalendarDays size={15} />
                </div>
                <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-white">
                  {editingNote ? 'Edit Company Event / Note' : 'Schedule Company Event / Note'}
                </h3>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                  Title / Event Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Candidate Debrief, Offer Alignment, Technical Interview..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              {/* Date & 24h Start Time & Duration */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                    Start Time (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-mono font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                    Duration
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                  >
                    <option value="interview_debrief">Candidate Debrief</option>
                    <option value="team_sync">Team Hiring Sync</option>
                    <option value="candidate_review">Candidate Review</option>
                    <option value="offer_decision">Offer Decision</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                    Candidate Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Rivers"
                    value={formCandidate}
                    onChange={(e) => setFormCandidate(e.target.value)}
                    className="w-full px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-3">
                  {[
                    { key: 'purple', bg: 'bg-purple-500' },
                    { key: 'blue', bg: 'bg-blue-500' },
                    { key: 'green', bg: 'bg-emerald-500' },
                    { key: 'amber', bg: 'bg-amber-500' },
                    { key: 'rose', bg: 'bg-rose-500' },
                    { key: 'cyan', bg: 'bg-cyan-500' },
                  ].map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setFormColor(c.key as any)}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform cursor-pointer ${
                        formColor === c.key ? 'scale-125 ring-2 ring-offset-2 ring-[#0071e3]' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {formColor === c.key && <Check size={12} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                  Notes &amp; Agenda Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Hiring criteria, evaluation points, interview link..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-2xl text-xs font-semibold hover:bg-[#e5e5ea] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer hover:opacity-95"
                >
                  {editingNote ? 'Update Event' : 'Save to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EVENT DETAILS MODAL ─────────────────────────────────────── */}
      {selectedEventDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                  {selectedEventDetail.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedEventDetail(null)}
                className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white">
                  {selectedEventDetail.title}
                </h3>
                {selectedEventDetail.subtitle && (
                  <p className="text-xs text-[#86868b] font-medium mt-0.5">
                    {selectedEventDetail.subtitle}
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#86868b]">Date:</span>
                  <span className="font-semibold text-[#1d1d1f] dark:text-white">
                    {selectedEventDetail.date}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#86868b] font-sans">24h Time:</span>
                  <span className="font-semibold text-[#1d1d1f] dark:text-white">
                    {selectedEventDetail.startTime} - {selectedEventDetail.endTime} ({selectedEventDetail.durationMinutes}m)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#86868b]">Status:</span>
                  <span className="font-bold text-[#0071e3]">
                    {selectedEventDetail.status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Feedbacks if available on interview */}
              {selectedEventDetail.type === 'interview' && selectedEventDetail.rawData.feedbacks?.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/10 space-y-1.5">
                  <span className="text-xs font-bold text-[#7c3aed] block">Evaluation Summary:</span>
                  {selectedEventDetail.rawData.feedbacks.map((fb: any) => (
                    <div key={fb.id} className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#86868b]">Verdict:</span>
                        <span className="font-bold uppercase text-[#7c3aed]">{fb.verdict}</span>
                      </div>
                      {fb.notes && <p className="text-[#86868b] italic">&ldquo;{fb.notes}&rdquo;</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Note Content if note */}
              {selectedEventDetail.type === 'note' && selectedEventDetail.rawData.content && (
                <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs leading-relaxed text-[#1d1d1f] dark:text-white">
                  <span className="block font-bold text-[#0071e3] mb-1">Details:</span>
                  {selectedEventDetail.rawData.content}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
              {selectedEventDetail.type === 'note' ? (
                <>
                  <button
                    onClick={() => {
                      handleDeleteNote(selectedEventDetail.rawData.id);
                    }}
                    className="text-xs text-red-500 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={() => {
                      const n = selectedEventDetail.rawData;
                      setSelectedEventDetail(null);
                      handleEditNote(n);
                    }}
                    className="px-4 py-2 bg-[#0071e3] text-white text-xs font-bold rounded-2xl cursor-pointer shadow-xs"
                  >
                    Edit Event
                  </button>
                </>
              ) : selectedEventDetail.type === 'interview' ? (
                <Link
                  href={`/meet/${selectedEventDetail.rawData.id}?role=company`}
                  className="w-full py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold rounded-2xl shadow-md text-center flex items-center justify-center gap-1.5"
                >
                  <Video size={14} />
                  <span>Start Live Interview</span>
                </Link>
              ) : selectedEventDetail.type === 'walkin' ? (
                <Link
                  href="/dashboard/walkin"
                  className="w-full py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-2xl shadow-md text-center flex items-center justify-center gap-1.5"
                >
                  <DoorOpen size={14} />
                  <span>Manage Walk-In Room</span>
                </Link>
              ) : (
                <button
                  onClick={() => setSelectedEventDetail(null)}
                  className="w-full py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-xs font-bold rounded-2xl"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
