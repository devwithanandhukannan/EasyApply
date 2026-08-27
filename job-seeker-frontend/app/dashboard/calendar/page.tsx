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
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';
import { useAuth } from '@/app/contexts/AuthContext';

interface InterviewItem {
  id: string;
  scheduledTime: string;
  durationMinutes: number;
  format: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'reschedule_requested' | 'confirmed';
  application?: {
    jobPosting?: {
      title: string;
      company?: {
        name: string;
        logoUrl?: string | null;
      };
    };
  };
}

interface ApplicationItem {
  id: string;
  status: string;
  appliedAt: string;
  jobPosting?: {
    title: string;
    company?: {
      name: string;
      logoUrl?: string | null;
    };
  };
}

interface CustomNote {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm in 24h format e.g. "10:00", "14:30"
  durationMinutes: number; // e.g. 30, 45, 60, 90, 120
  isAllDay?: boolean;
  category: 'interview_prep' | 'follow_up' | 'deadline' | 'reminder' | 'personal';
  companyName?: string;
  content: string;
  color: 'purple' | 'blue' | 'green' | 'amber' | 'rose' | 'cyan';
  isCompleted?: boolean;
  createdAt: string;
}

type ViewMode = 'week' | '3day' | 'day' | 'month' | 'agenda';

const HOUR_HEIGHT = 64; // Height in px for each hour slot
const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);

export default function JobSeekerCalendarPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [customNotes, setCustomNotes] = useState<CustomNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar Navigation States
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal & Note Creation States
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CustomNote | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<any | null>(null);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('10:00');
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formIsAllDay, setFormIsAllDay] = useState(false);
  const [formCategory, setFormCategory] = useState<CustomNote['category']>('interview_prep');
  const [formCompany, setFormCompany] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState<CustomNote['color']>('purple');

  const timeGridScrollRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `easyapply_calendar_notes_${user?.id || 'guest'}`;

  // Helper date key YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load custom notes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean out any legacy sample- notes
        const userNotes = Array.isArray(parsed)
          ? parsed.filter((n: CustomNote) => !n.id?.startsWith('sample-'))
          : [];
        setCustomNotes(userNotes);
        localStorage.setItem(storageKey, JSON.stringify(userNotes));
      } else {
        setCustomNotes([]);
        localStorage.setItem(storageKey, JSON.stringify([]));
      }
    } catch {
      setCustomNotes([]);
    }
  }, [storageKey]);

  // Save notes helper
  const saveCustomNotes = (notes: CustomNote[]) => {
    setCustomNotes(notes);
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch interviews & applications from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [intRes, appRes] = await Promise.allSettled([
          api.get('/jobseeker/interviews'),
          api.get('/jobseeker/applications'),
        ]);

        if (intRes.status === 'fulfilled' && intRes.value.data.success) {
          setInterviews(intRes.value.data.data || []);
        }
        if (appRes.status === 'fulfilled' && appRes.value.data.success) {
          setApplications(appRes.value.data.data?.applications || appRes.value.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching calendar data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-scroll to 8:00 AM on initial load
  useEffect(() => {
    if (timeGridScrollRef.current) {
      const scrollPos = 8 * HOUR_HEIGHT; // scroll to 08:00
      timeGridScrollRef.current.scrollTop = scrollPos;
    }
  }, [viewMode]);

  // Unified Event List with Exact Time & Duration
  const allEvents = useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      date: string; // YYYY-MM-DD
      startTime: string; // HH:mm in 24h
      endTime: string; // HH:mm in 24h
      durationMinutes: number;
      isAllDay: boolean;
      type: 'interview' | 'application' | 'note';
      category: string;
      companyName: string;
      status?: string;
      color: string;
      rawData: any;
    }> = [];

    // 1. Interviews
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

      const compName = interview.application?.jobPosting?.company?.name || 'Company Interview';
      const roleTitle = interview.application?.jobPosting?.title || 'Technical Session';

      let color = 'purple';
      if (interview.status === 'confirmed') color = 'green';
      if (interview.status === 'reschedule_requested') color = 'amber';
      if (interview.status === 'in_progress') color = 'rose';

      events.push({
        id: `interview-${interview.id}`,
        title: roleTitle,
        date: dateKey,
        startTime,
        endTime,
        durationMinutes: duration,
        isAllDay: false,
        type: 'interview',
        category: `Interview (${interview.format || 'Video'})`,
        companyName: compName,
        status: interview.status,
        color,
        rawData: interview,
      });
    });

    // 2. Application Milestones
    applications.forEach((app) => {
      if (app.appliedAt) {
        const d = new Date(app.appliedAt);
        const dateKey = formatDateKey(d);
        const startH = String(d.getHours()).padStart(2, '0');
        const startM = String(d.getMinutes()).padStart(2, '0');
        const compName = app.jobPosting?.company?.name || 'Company';
        const roleTitle = app.jobPosting?.title || 'Applied Position';

        events.push({
          id: `app-${app.id}`,
          title: `Applied: ${roleTitle}`,
          date: dateKey,
          startTime: `${startH}:${startM}`,
          endTime: `${startH}:${startM}`,
          durationMinutes: 30,
          isAllDay: true,
          type: 'application',
          category: 'Milestone',
          companyName: compName,
          status: app.status,
          color: 'blue',
          rawData: app,
        });
      }
    });

    // 3. Custom Notes
    customNotes.forEach((note) => {
      const [h, m] = (note.startTime || '10:00').split(':').map(Number);
      const duration = note.durationMinutes || 60;
      const endMinuteTotal = h * 60 + (m || 0) + duration;
      const endH = String(Math.floor(endMinuteTotal / 60) % 24).padStart(2, '0');
      const endM = String(endMinuteTotal % 60).padStart(2, '0');

      events.push({
        id: `note-${note.id}`,
        title: note.title,
        date: note.date,
        startTime: note.startTime || '10:00',
        endTime: `${endH}:${endM}`,
        durationMinutes: duration,
        isAllDay: !!note.isAllDay,
        type: 'note',
        category: note.category.replace('_', ' ').toUpperCase(),
        companyName: note.companyName || 'Personal',
        status: note.isCompleted ? 'Completed' : 'Pending',
        color: note.color,
        rawData: note,
      });
    });

    return events;
  }, [interviews, applications, customNotes]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (selectedCategory === 'interviews' && ev.type !== 'interview') return false;
      if (selectedCategory === 'notes' && ev.type !== 'note') return false;
      if (selectedCategory === 'applications' && ev.type !== 'application') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchComp = ev.companyName.toLowerCase().includes(q);
        const matchCategory = ev.category.toLowerCase().includes(q);
        return matchTitle || matchComp || matchCategory;
      }
      return true;
    });
  }, [allEvents, selectedCategory, searchQuery]);

  // Column Days Generator based on viewMode
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

    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDay.getDate();

    const days = [];

    // Preceding empty days
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

    // Current month days
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

    // Trailing days
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

  // Next Upcoming Interview Banner
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

  // Open modal with prefilled date & 24h time
  const handleOpenNewNote = (dateKey?: string, defaultHour?: number) => {
    setEditingNote(null);
    setFormTitle('');
    setFormDate(dateKey || formatDateKey(new Date()));
    const hourStr = defaultHour !== undefined ? String(defaultHour).padStart(2, '0') + ':00' : '10:00';
    setFormStartTime(hourStr);
    setFormDuration(60);
    setFormIsAllDay(false);
    setFormCategory('interview_prep');
    setFormCompany('');
    setFormContent('');
    setFormColor('purple');
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: CustomNote) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormDate(note.date);
    setFormStartTime(note.startTime || '10:00');
    setFormDuration(note.durationMinutes || 60);
    setFormIsAllDay(!!note.isAllDay);
    setFormCategory(note.category);
    setFormCompany(note.companyName || '');
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
              companyName: formCompany.trim(),
              content: formContent.trim(),
              color: formColor,
            }
          : n
      );
      saveCustomNotes(updated);
    } else {
      const newNote: CustomNote = {
        id: `note-${Date.now()}`,
        title: formTitle.trim(),
        date: formDate,
        startTime: formStartTime,
        durationMinutes: Number(formDuration) || 60,
        isAllDay: formIsAllDay,
        category: formCategory,
        companyName: formCompany.trim(),
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

  // Color & Card Style Generator (Matching reference design)
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
      {/* ── HEADER TITLE & CONTROLS ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <CalendarDays className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
              Schedule &amp; Activities Calendar
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#86868b] dark:text-slate-400 mt-1 font-medium">
            Track scheduled live interviews, application timelines, and custom time-blocked notes with 24-hour precision.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Switcher Tabs */}
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

          {/* Add Custom Note Button */}
          <button
            onClick={() => handleOpenNewNote()}
            className="px-4 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] hover:from-[#0062c4] hover:to-[#1d4ed8] text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Note</span>
          </button>
        </div>
      </div>

      {/* ── NEXT UP BANNER (IF UPCOMING INTERVIEW EXISTS) ───────────── */}
      {nextInterview && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-[#0071e3] border border-blue-500/20">
                  Next Scheduled Interview
                </span>
                <span className="text-xs text-[#86868b] font-medium">
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
                {nextInterview.application?.jobPosting?.title || 'Technical Session'} &bull;{' '}
                <span className="text-[#0071e3]">
                  {nextInterview.application?.jobPosting?.company?.name || 'Hiring Team'}
                </span>
              </h3>
            </div>
          </div>

          <Link
            href={`/meet/${nextInterview.id}?role=candidate`}
            className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Video className="w-4 h-4" />
            <span>Join Live Room</span>
          </Link>
        </div>
      )}

      {/* ── FILTER & DATE NAVIGATION BAR ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1c1c1e] p-3.5 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            aria-label="Previous time frame"
            className="p-2 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next time frame"
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

        {/* Category Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'interviews', label: 'Interviews' },
              { key: 'notes', label: 'Notes' },
              { key: 'applications', label: 'Milestones' },
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
              placeholder="Search events & notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-xl text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] w-36 sm:w-48 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ── 24-HOUR VERTICAL TIME GRID VIEW (WEEK / 3-DAY / DAY) ────── */}
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

          {/* All-Day / Milestones Bar (If Any) */}
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
                        className="px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-500/25 text-[#0071e3] dark:text-blue-300 text-[10px] font-bold truncate cursor-pointer hover:opacity-90"
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable 24-Hour Time Grid Body */}
          <div
            ref={timeGridScrollRef}
            className="overflow-y-auto max-h-[640px] custom-scrollbar relative flex"
          >
            {/* 24-Hour Time Gutter (00:00 to 23:00) */}
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
                    {/* Half-hour dashed line */}
                    <div
                      style={{ top: `${HOUR_HEIGHT / 2}px` }}
                      className="absolute left-0 right-0 border-b border-dashed border-black/[0.02] dark:border-white/[0.03]"
                    />
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {visibleDays.map((day) => {
                // Filter events that belong strictly to this date & not all-day
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
                    {/* Clickable Hour Slots to directly create notes at that time */}
                    {HOURS_24.map((hour) => (
                      <div
                        key={hour}
                        onClick={() => handleOpenNewNote(day.dateKey, hour)}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="cursor-pointer hover:bg-[#0071e3]/5 transition-colors"
                        title={`Click to add note on ${day.dateKey} at ${String(hour).padStart(2, '0')}:00`}
                      />
                    ))}

                    {/* Today's Current Time Horizontal Indicator Line */}
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

                    {/* Timed Event Cards (Placed strictly within this column & expanded based on duration) */}
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
                          {/* Left Accent Color Strip */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 ${cardTheme.leftBar}`}
                          />

                          {/* Card Content */}
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

                            {/* 24-Hour Time & Company Tag */}
                            <div className="flex items-center gap-1.5 text-[10px] opacity-85 mt-0.5 truncate font-mono">
                              <Clock size={10} className="shrink-0" />
                              <span>
                                {ev.startTime} - {ev.endTime}
                              </span>
                              {ev.companyName && (
                                <span className="opacity-75 font-sans truncate">
                                  &bull; {ev.companyName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Action Footer if height is large enough */}
                          {heightPx >= 58 && (
                            <div className="pl-2 flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.06] text-[10px]">
                              {ev.type === 'interview' ? (
                                <Link
                                  href={`/meet/${ev.rawData.id}?role=candidate`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-2 py-0.5 bg-[#0071e3] text-white font-bold rounded text-[9px] hover:bg-[#0077ed] flex items-center gap-1 shadow-2xs"
                                >
                                  <Video size={10} />
                                  <span>Join</span>
                                </Link>
                              ) : ev.type === 'note' ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleNoteComplete(ev.rawData.id);
                                  }}
                                  className="text-[9px] font-bold hover:underline"
                                >
                                  {ev.rawData.isCompleted ? '✓ Completed' : 'Mark Done'}
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
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#18181a] text-center text-[11px] font-bold text-[#86868b] py-3">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-blue-600 dark:text-blue-400">Sat</div>
            <div className="text-blue-600 dark:text-blue-400">Sun</div>
          </div>

          {/* Month Days Grid */}
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
                            : ev.type === 'note'
                            ? 'bg-blue-500 text-white'
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
                Add custom reminders or schedule new interviews to populate this view.
              </p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isInterview = ev.type === 'interview';
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
                          : isNote
                          ? 'bg-gradient-to-tr from-[#0071e3] to-[#2563eb]'
                          : 'bg-gradient-to-tr from-[#059669] to-[#10b981]'
                      }`}
                    >
                      {isInterview ? (
                        <Video size={18} />
                      ) : isNote ? (
                        <StickyNote size={18} />
                      ) : (
                        <Briefcase size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                          {ev.title}
                        </h3>
                        <span className="text-xs text-[#86868b] font-medium">
                          &bull; {ev.companyName}
                        </span>
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
                        href={`/meet/${ev.rawData.id}?role=candidate`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-2xl shadow-xs flex items-center gap-1.5"
                      >
                        <Video size={14} />
                        <span>Join Room</span>
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

      {/* ── CREATE / EDIT CUSTOM NOTE MODAL ────────────────────────── */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-xs">
                  <StickyNote size={15} />
                </div>
                <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-white">
                  {editingNote ? 'Edit Custom Note' : 'Add Custom Note / Time Block'}
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
                  Title / Task Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Design Mock, Portfolio Review..."
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
                    <option value="interview_prep">Interview Prep</option>
                    <option value="follow_up">Recruiter Follow-up</option>
                    <option value="deadline">Application Deadline</option>
                    <option value="reminder">Reminder</option>
                    <option value="personal">Personal Goal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google, Stripe, Self..."
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
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
                  Details / Checklist
                </label>
                <textarea
                  rows={3}
                  placeholder="Key topics to practice, questions to ask, documents to bring..."
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
                  {editingNote ? 'Update Note' : 'Save to Schedule'}
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
                <p className="text-xs text-[#86868b] font-medium mt-0.5">
                  {selectedEventDetail.companyName}
                </p>
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
                    Edit Note
                  </button>
                </>
              ) : selectedEventDetail.type === 'interview' ? (
                <Link
                  href={`/meet/${selectedEventDetail.rawData.id}?role=candidate`}
                  className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-2xl shadow-md text-center flex items-center justify-center gap-1.5"
                >
                  <Video size={14} />
                  <span>Enter Video Room</span>
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
