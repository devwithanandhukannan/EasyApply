// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  FileText, 
  Plus, 
  Video, 
  DoorOpen, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Filter,
  Layers,
  Send
} from 'lucide-react';
import api from '@/app/lib/axios';

interface Job {
  id: string;
  title: string;
  department?: string;
  jobType: string;
  locationType: string;
  location?: string;
  status: string;
  deadline?: string;
  openings: number;
  createdAt: string;
  totalApplications: number;
  applicationBreakdown: Record<string, number>;
}

interface DashboardSummary {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  interviewsScheduled: number;
  pendingOffers: number;
}

interface PipelineStages {
  applied: number;
  shortlisted: number;
  interviewing: number;
  offered: number;
  hired: number;
  rejected: number;
}

interface ApplicationTrend {
  date: string;
  day: string;
  count: number;
}

interface UpcomingInterview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  scheduledTime: string;
  format: string;
  livekitRoomName: string;
  status: string;
}

interface ActiveWalkInRoom {
  id: string;
  roomCode: string;
  title: string;
  status: string;
  waitingCount: number;
  livekitRoom: string;
}

export default function DashboardPage() {
  const { company } = useAuth();

  const [summary, setSummary] = useState<DashboardSummary>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    interviewsScheduled: 0,
    pendingOffers: 0,
  });

  const [pipelineStages, setPipelineStages] = useState<PipelineStages>({
    applied: 0,
    shortlisted: 0,
    interviewing: 0,
    offered: 0,
    hired: 0,
    rejected: 0,
  });

  const [trends, setTrends] = useState<ApplicationTrend[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
  const [walkInRooms, setWalkInRooms] = useState<ActiveWalkInRoom[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/company/dashboard');
      if (res.data?.success) {
        setSummary(res.data.summary || {
          totalJobs: 0,
          activeJobs: 0,
          totalApplications: 0,
          interviewsScheduled: 0,
          pendingOffers: 0,
        });
        setPipelineStages(res.data.pipelineStages || {
          applied: 0,
          shortlisted: 0,
          interviewing: 0,
          offered: 0,
          hired: 0,
          rejected: 0,
        });
        setTrends(res.data.applicationTrends || []);
        setUpcomingInterviews(res.data.upcomingInterviews || []);
        setWalkInRooms(res.data.activeWalkInRooms || []);
        setJobs(res.data.jobs || []);
      }
    } catch (err: any) {
      console.error('Failed to load company dashboard:', err);
      setError('Unable to load latest hiring metrics. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Funnel calculations
  const totalPipeline = 
    pipelineStages.applied + 
    pipelineStages.shortlisted + 
    pipelineStages.interviewing + 
    pipelineStages.offered + 
    pipelineStages.hired || 1;

  const maxTrendCount = Math.max(...trends.map((t) => t.count), 5);

  const metrics = [
    {
      title: 'Active Jobs',
      value: loading ? '...' : summary.activeJobs,
      subtitle: `${summary.totalJobs} total postings created`,
      icon: Briefcase,
      color: 'from-blue-500/20 to-blue-600/5 text-blue-500 border-blue-500/20',
      badgeColor: 'bg-blue-500/10 text-blue-400',
    },
    {
      title: 'Total Candidates',
      value: loading ? '...' : summary.totalApplications,
      subtitle: 'Applications received to date',
      icon: Users,
      color: 'from-indigo-500/20 to-indigo-600/5 text-indigo-500 border-indigo-500/20',
      badgeColor: 'bg-indigo-500/10 text-indigo-400',
    },
    {
      title: 'Interviews Scheduled',
      value: loading ? '...' : summary.interviewsScheduled,
      subtitle: 'Upcoming candidate sessions',
      icon: Calendar,
      color: 'from-amber-500/20 to-amber-600/5 text-amber-500 border-amber-500/20',
      badgeColor: 'bg-amber-500/10 text-amber-400',
    },
    {
      title: 'Pending Offers',
      value: loading ? '...' : summary.pendingOffers,
      subtitle: 'Awaiting candidate acceptance',
      icon: FileText,
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-500 border-emerald-500/20',
      badgeColor: 'bg-emerald-500/10 text-emerald-400',
    },
  ];

  return (
    <div className="space-y-8 font-sans antialiased pb-12">
      
      {/* ── 1. HEADER & GREETING ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Welcome back, {company?.name || 'Recruiter'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-[#86868b] font-medium">
            Here is a clear summary of your hiring pipeline, candidate volume, and upcoming interviews.
          </p>
        </div>

        {/* Quick Post Job Primary Button */}
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] hover:from-[#0062c4] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Post a New Job</span>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-500 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 2. QUICK ACTION LAUNCHPAD ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/dashboard/jobs"
          className="p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-[#18181b]/70 hover:bg-zinc-200/60 dark:hover:bg-[#27272a]/70 border border-zinc-200/80 dark:border-white/[0.08] transition-all flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-white">Create Job</div>
            <div className="text-[10px] text-zinc-500 dark:text-[#86868b]">AI Job Postings</div>
          </div>
        </Link>

        <Link
          href="/dashboard/walkin"
          className="p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-[#18181b]/70 hover:bg-zinc-200/60 dark:hover:bg-[#27272a]/70 border border-zinc-200/80 dark:border-white/[0.08] transition-all flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <DoorOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-white">Walk-In Room</div>
            <div className="text-[10px] text-zinc-500 dark:text-[#86868b]">Instant Queue</div>
          </div>
        </Link>

        <Link
          href="/dashboard/calendar"
          className="p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-[#18181b]/70 hover:bg-zinc-200/60 dark:hover:bg-[#27272a]/70 border border-zinc-200/80 dark:border-white/[0.08] transition-all flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-white">Interview Schedule</div>
            <div className="text-[10px] text-zinc-500 dark:text-[#86868b]">24h Timeline</div>
          </div>
        </Link>

        <Link
          href="/dashboard/offers"
          className="p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-[#18181b]/70 hover:bg-zinc-200/60 dark:hover:bg-[#27272a]/70 border border-zinc-200/80 dark:border-white/[0.08] transition-all flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-white">Offer Letters</div>
            <div className="text-[10px] text-zinc-500 dark:text-[#86868b]">Digital Signatures</div>
          </div>
        </Link>
      </div>

      {/* ── 3. FOUR CORE STAT CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white dark:bg-[#18181b]/80 border border-zinc-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-none relative overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-white/[0.15]"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-500 dark:text-[#86868b] uppercase tracking-wider">
                  {m.title}
                </span>
                <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${m.color} border flex items-center justify-center shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  {m.value}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-[#86868b] font-medium">
                  {m.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. TWO CHARTS: PIPELINE FUNNEL & 7-DAY APPLICANT TREND ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Hiring Pipeline Funnel (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-[#18181b]/80 border border-zinc-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-none space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Candidate Hiring Pipeline
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-[#86868b]">
                Real-time breakdown of where candidates stand in your hiring stages.
              </p>
            </div>
            <Link
              href="/dashboard/kanban"
              className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1"
            >
              <span>Kanban Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Visual Step Progress Bar */}
          <div className="space-y-4">
            
            {/* Multi-segment Progress Bar */}
            <div className="h-3.5 w-full rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden flex p-0.5 gap-0.5">
              <div 
                style={{ width: `${Math.max(4, (pipelineStages.applied / totalPipeline) * 100)}%` }} 
                className="h-full bg-blue-500 rounded-l-full transition-all"
                title={`Applied: ${pipelineStages.applied}`}
              />
              <div 
                style={{ width: `${Math.max(4, (pipelineStages.shortlisted / totalPipeline) * 100)}%` }} 
                className="h-full bg-purple-500 transition-all"
                title={`Shortlisted: ${pipelineStages.shortlisted}`}
              />
              <div 
                style={{ width: `${Math.max(4, (pipelineStages.interviewing / totalPipeline) * 100)}%` }} 
                className="h-full bg-amber-500 transition-all"
                title={`Interviewing: ${pipelineStages.interviewing}`}
              />
              <div 
                style={{ width: `${Math.max(4, (pipelineStages.offered / totalPipeline) * 100)}%` }} 
                className="h-full bg-teal-500 transition-all"
                title={`Offered: ${pipelineStages.offered}`}
              />
              <div 
                style={{ width: `${Math.max(4, (pipelineStages.hired / totalPipeline) * 100)}%` }} 
                className="h-full bg-emerald-500 rounded-r-full transition-all"
                title={`Hired: ${pipelineStages.hired}`}
              />
            </div>

            {/* Stage Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200/60 dark:border-white/[0.06] text-center space-y-1">
                <div className="text-[10px] font-bold text-blue-500 uppercase">1. Applied</div>
                <div className="text-lg font-black text-zinc-900 dark:text-white">{pipelineStages.applied}</div>
                <div className="text-[9px] text-zinc-400">Resumes in</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200/60 dark:border-white/[0.06] text-center space-y-1">
                <div className="text-[10px] font-bold text-purple-500 uppercase">2. Shortlisted</div>
                <div className="text-lg font-black text-zinc-900 dark:text-white">{pipelineStages.shortlisted}</div>
                <div className="text-[9px] text-zinc-400">Screened</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200/60 dark:border-white/[0.06] text-center space-y-1">
                <div className="text-[10px] font-bold text-amber-500 uppercase">3. Interview</div>
                <div className="text-lg font-black text-zinc-900 dark:text-white">{pipelineStages.interviewing}</div>
                <div className="text-[9px] text-zinc-400">Live calls</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200/60 dark:border-white/[0.06] text-center space-y-1">
                <div className="text-[10px] font-bold text-teal-500 uppercase">4. Offered</div>
                <div className="text-lg font-black text-zinc-900 dark:text-white">{pipelineStages.offered}</div>
                <div className="text-[9px] text-zinc-400">Salary sent</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200/60 dark:border-white/[0.06] text-center space-y-1 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-emerald-500 uppercase">5. Hired</div>
                <div className="text-lg font-black text-zinc-900 dark:text-white">{pipelineStages.hired}</div>
                <div className="text-[9px] text-zinc-400">Accepted</div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: 7-Day Application Trends Bar Graph (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-[#18181b]/80 border border-zinc-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-none space-y-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Application Trends
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-[#86868b]">
                New candidates over the past 7 days.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">
              Last 7 Days
            </span>
          </div>

          {/* Simple Interactive SVG Bar Chart */}
          <div className="pt-2">
            <div className="h-36 flex items-end justify-between gap-2 px-2 pb-2 border-b border-zinc-200/80 dark:border-white/[0.08]">
              {trends.map((t, idx) => {
                const barHeight = maxTrendCount > 0 ? (t.count / maxTrendCount) * 100 : 0;
                const isToday = idx === trends.length - 1;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md whitespace-nowrap z-10">
                      {t.count} candidate{t.count === 1 ? '' : 's'}
                    </div>

                    {/* Bar */}
                    <div className="w-full flex items-end justify-center h-28">
                      <div
                        style={{ height: `${Math.max(6, barHeight)}%` }}
                        className={`w-full max-w-[24px] rounded-t-lg transition-all duration-300 ${
                          isToday 
                            ? 'bg-gradient-to-t from-[#0071e3] to-[#38bdf8]' 
                            : 'bg-zinc-200 dark:bg-white/[0.12] hover:bg-[#0071e3]/80'
                        }`}
                      />
                    </div>

                    {/* Day label */}
                    <span className={`text-[10px] font-bold ${
                      isToday ? 'text-[#0071e3]' : 'text-zinc-500 dark:text-[#86868b]'
                    }`}>
                      {t.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-[#86868b] pt-1">
            <span>Peak Day: {Math.max(...trends.map((t) => t.count), 0)} applicants</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Total 7d: {trends.reduce((s, t) => s + t.count, 0)}
            </span>
          </div>
        </div>

      </div>

      {/* ── 5. TWO WIDGETS: UPCOMING INTERVIEWS & LIVE WALK-IN ROOMS ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left Widget: Upcoming Live Interviews */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#18181b]/80 border border-zinc-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Upcoming Interviews
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-[#86868b]">
                  Scheduled 1-on-1 video interviews
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/calendar"
              className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1"
            >
              <span>Full Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-[#86868b] space-y-1.5">
              <Calendar className="w-7 h-7 mx-auto opacity-30 text-[#0071e3]" />
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No Interviews Scheduled Today</p>
              <p className="text-[11px]">Select candidates from job applications to schedule a video call.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingInterviews.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {item.candidateName}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-[#86868b] truncate">
                      {item.jobTitle}
                    </p>
                    <div className="text-[10px] text-[#0071e3] font-semibold flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} hrs</span>
                      <span>&bull;</span>
                      <span>{new Date(item.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  <Link
                    href={`/meet/${item.livekitRoomName || item.id}?role=company`}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Room</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Widget: Active Walk-In Rooms & Quick Access */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#18181b]/80 border border-zinc-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
                <DoorOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Live Walk-In Rooms
                </h3>
                <p className="text-[10px] text-zinc-500 dark:text-[#86868b]">
                  Instant queue &amp; candidate speed-interviews
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/walkin"
              className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1"
            >
              <span>Manage Rooms</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {walkInRooms.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 dark:text-[#86868b] space-y-2">
              <DoorOpen className="w-7 h-7 mx-auto opacity-30 text-purple-500" />
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No Active Walk-In Rooms</p>
              <p className="text-[11px]">Open an instant walk-in room to conduct live speed interviews.</p>
              <Link
                href="/dashboard/walkin"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 font-bold text-xs hover:bg-purple-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Walk-In Room</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {walkInRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200/70 dark:border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {room.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[#86868b]">
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">Code: {room.roomCode}</span>
                      <span>&bull;</span>
                      <span className="font-bold text-purple-400">
                        {room.waitingCount} in Queue
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/meet/${room.livekitRoom}?role=company`}
                    className="px-3.5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0062c4] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>Enter Call</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── 6. ACTIVE JOB OPENINGS TABLE ───────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#18181b]/80 border border-zinc-200/90 dark:border-white/[0.08] shadow-xs dark:shadow-none space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Active Job Postings
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-[#86868b]">
              Overview of roles currently open for applicant submissions.
            </p>
          </div>

          <Link
            href="/dashboard/jobs"
            className="text-xs font-bold text-[#0071e3] hover:underline flex items-center gap-1"
          >
            <span>View All Jobs ({jobs.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 dark:text-[#86868b] space-y-2">
            <Briefcase className="w-8 h-8 mx-auto opacity-30 text-[#0071e3]" />
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No Job Postings Yet</p>
            <p className="text-[11px]">Create your first job posting to start receiving applicants.</p>
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#0071e3] text-white text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Job</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121214] border border-zinc-200/60 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.15] transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                      {job.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      job.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {job.status}
                    </span>
                    {job.department && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                        {job.department}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-500 dark:text-[#86868b] flex items-center gap-2 flex-wrap">
                    <span>{job.jobType || 'Full-Time'}</span>
                    <span>&bull;</span>
                    <span>{job.location || job.locationType || 'Remote'}</span>
                    <span>&bull;</span>
                    <span>{job.openings} Openings</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-white/[0.04]">
                  <div className="text-right sm:pr-2">
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-white">
                      {job.totalApplications}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-[#86868b]">
                      Candidates
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/jobs`}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-200/80 dark:bg-white/[0.08] hover:bg-zinc-300 dark:hover:bg-white/[0.15] text-xs font-bold text-zinc-900 dark:text-white transition-colors flex items-center gap-1"
                  >
                    <span>View Candidates</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}