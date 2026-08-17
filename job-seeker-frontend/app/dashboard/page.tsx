'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, ArrowRight, ShieldCheck, CheckCircle2,
  Briefcase, Calendar, FileText, ChevronRight,
  Clock, BarChart3, TrendingUp, Award, Building2,
  Video, Info, AlertCircle, CheckSquare
} from 'lucide-react';
import api from '@/app/lib/axios';

// ─── Helpers ────────────────────────────────────────────────────────

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function statusColors(status: string) {
  switch (status) {
    case 'hired':        return 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border-[#34c759]/20';
    case 'rejected':     return 'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20';
    case 'offer_sent':   return 'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20';
    case 'technical_round':
    case 'hr_round':     return 'bg-[#af52de]/10 text-[#af52de] border-[#af52de]/20';
    default:             return 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] border-black/[0.04] dark:border-white/[0.06]';
  }
}

function atsColor(score: number) {
  if (score >= 75) return 'bg-[#34c759]';
  if (score >= 50) return 'bg-[#ff9500]';
  return 'bg-[#ff3b30]';
}

// ─── Stat Card ──────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor = 'text-[#86868b]', icon: Icon }: {
  label: string; value: string | number; sub: string;
  subColor?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="flex justify-between items-start text-[#86868b] mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <Icon size={16} className="text-[#0071e3]" />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] dark:text-white">{value}</p>
      <p className={`text-[11px] mt-1 font-medium ${subColor}`}>{sub}</p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [insightsData, setInsightsData]   = useState<any>(null);
  const [walkInQueues, setWalkInQueues]   = useState<any[]>([]);
  const [activeRoomsCount, setActiveRoomsCount] = useState<number>(0);
  const [walkInStats, setWalkInStats]     = useState<{ openRooms: number; pausedRooms: number; availableToJoin: number } | null>(null);
  const [activeView, setActiveView]       = useState<'overview' | 'insights'>('overview');
  const [isLoading, setIsLoading]         = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, insightRes, walkInRes, roomsRes] = await Promise.all([
          api.get('/jobseeker/dashboard').catch(() => null),
          api.get('/jobseeker/insights').catch(() => null),
          api.get('/walkin/my-queues').catch(() => null),
          api.get('/walkin/active-rooms').catch(() => null),
        ]);
        if (dashRes?.data?.success)    setDashboardData(dashRes.data.data);
        if (insightRes?.data?.success) setInsightsData(insightRes.data.data);
        if (walkInRes?.data?.success)  setWalkInQueues(walkInRes.data.queues || []);
        if (roomsRes?.data?.success) {
          const stats = roomsRes.data.stats;
          const rooms = roomsRes.data.rooms || [];
          if (stats) {
            setWalkInStats(stats);
            setActiveRoomsCount(stats.availableToJoin ?? stats.openRooms ?? 0);
          } else {
            const avail = rooms.filter((r: any) => r.status === 'OPEN' && !r.hasApplied).length;
            setActiveRoomsCount(avail);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
      </div>
    );
  }

  const profile    = dashboardData?.profile;
  const summary    = dashboardData?.applicationSummary;
  const recentApps = dashboardData?.recentApplications ?? [];
  const interviews = dashboardData?.upcomingInterviews  ?? [];
  const offers     = dashboardData?.pendingOffers       ?? [];
  const resume     = dashboardData?.resume;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-1 text-[#1d1d1f] dark:text-[#f5f5f7] font-sans">

      {/* ── Header ── */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
            Welcome back, {profile?.fullName || 'there'} 
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] font-medium mt-0.5">
            Here is a summary of your job search activity and applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Segmented Switch */}
          <div className="flex bg-[#e5e5ea] dark:bg-[#1c1c1e] p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-xs">
            {(['overview', 'insights'] as const).map(v => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={`px-3.5 py-1.5 text-xs rounded-xl font-bold capitalize transition-all cursor-pointer ${
                  activeView === v
                    ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {/* Availability Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#34c759]/10 border border-[#34c759]/20 text-xs font-semibold text-[#248a3d] dark:text-[#30d158]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34c759]" />
            <span className="capitalize">{profile?.availabilityStatus?.replace('_', ' ') || 'Spot Available'}</span>
          </div>
        </div>
      </div>

      {activeView === 'overview' ? (
        <>
          {/* ── Live Walk-In Interview / Queue Banner ── */}
          {walkInQueues.length > 0 ? (
            <div className="rounded-3xl border p-5 sm:p-6 bg-white dark:bg-[#1c1c1e] border-[#0071e3]/30 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center shrink-0 text-[#0071e3]">
                    <Video className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0071e3] uppercase tracking-wider">Active Walk-In Queue</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] rounded-full">
                        #{walkInQueues[0].queuePosition} in Queue
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mt-0.5">{walkInQueues[0].room?.title}</h3>
                    <p className="text-xs text-[#86868b] font-medium">{walkInQueues[0].room?.company?.name} • Skill Match: {Math.round(walkInQueues[0].skillScore)}%</p>
                  </div>
                </div>
                <Link
                  href="/dashboard/walkin"
                  className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,113,227,0.25)] shrink-0 cursor-pointer"
                >
                  <span>{walkInQueues[0].status === 'interviewing' ? '🎉 Join Interview Room' : 'View Live Queue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (activeRoomsCount > 0 || (walkInStats?.pausedRooms || 0) > 0) ? (
            <div className="rounded-3xl border p-5 bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08] hover:border-[#0071e3]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center shrink-0 text-[#0071e3]">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeRoomsCount > 0 ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#34c759] animate-ping"></span>
                        <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">
                          {activeRoomsCount} Live Walk-In {activeRoomsCount === 1 ? 'Room' : 'Rooms'} Open
                        </span>
                        {(walkInStats?.pausedRooms || 0) > 0 && (
                          <span className="text-[11px] font-semibold text-[#ff9500] bg-[#ff9500]/10 border border-[#ff9500]/20 px-2 py-0.5 rounded-full">
                            {walkInStats?.pausedRooms} Paused
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#ff9500]"></span>
                        <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">
                          {walkInStats?.pausedRooms} Walk-In {walkInStats?.pausedRooms === 1 ? 'Room' : 'Rooms'} Currently Paused
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-[#86868b] font-medium mt-0.5">
                    {activeRoomsCount > 0
                      ? 'Companies are actively hosting instant walk-in interviews. Queue up directly with your skills.'
                      : 'Active walk-in sessions are paused by recruiters and will reopen shortly.'}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/walkin"
                className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 shadow-[0_4px_14px_rgba(0,113,227,0.25)] cursor-pointer"
              >
                <span>Browse Walk-In Rooms</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : null}

          {/* ── Profile Completion ── */}
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Profile Completion</h3>
                <p className="text-xs text-[#86868b] font-medium mt-0.5 max-w-md">
                  A complete profile helps employers find you and increases your chances of getting shortlisted.
                </p>
              </div>
              <div className="shrink-0 font-bold">
                <span className="text-3xl text-[#1d1d1f] dark:text-white">{profile?.completionScore ?? 0}</span>
                <span className="text-xs text-[#86868b]"> / 100</span>
              </div>
            </div>

            <div className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] h-2 rounded-full overflow-hidden mb-5">
              <div
                className="bg-[#0071e3] h-full rounded-full transition-all duration-500"
                style={{ width: `${profile?.completionScore ?? 0}%` }}
              />
            </div>

            {profile?.completionTips?.length > 0 && (
              <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {profile.completionTips.map((tip: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#86868b] font-medium">
                    <Info size={13} className="text-[#0071e3] shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Applications"
              value={summary?.total ?? 0}
              sub={`${summary?.active ?? 0} in progress`}
              icon={Briefcase}
            />
            <StatCard
              label="Interviews Scheduled"
              value={summary?.inInterview ?? 0}
              sub="Technical or HR rounds"
              subColor="text-[#af52de]"
              icon={Calendar}
            />
            <StatCard
              label="Offers Received"
              value={summary?.offerStage ?? 0}
              sub="Waiting for response"
              subColor={summary?.offerStage > 0 ? 'text-[#34c759] font-bold' : 'text-[#86868b]'}
              icon={Award}
            />
            <StatCard
              label="Resume Score"
              value={resume?.atsScore ? `${resume.atsScore}%` : 'N/A'}
              sub={resume?.name || 'No resume uploaded'}
              icon={FileText}
            />
          </div>

          {/* ── Main Content ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left / Centre */}
            <div className="lg:col-span-2 space-y-6">

              {/* Pending Offers */}
              {offers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Offers Awaiting Your Response</h3>
                    <span className="text-[10px] bg-[#34c759]/10 text-[#34c759] border border-[#34c759]/20 px-2 py-0.5 rounded-full font-bold">
                      Action needed
                    </span>
                  </div>
                  <div className="space-y-2">
                    {offers.map((offer: any) => (
                      <div
                        key={offer.offerId}
                        className="bg-white dark:bg-[#1c1c1e] border border-[#34c759]/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center shrink-0">
                            <Building2 size={16} className="text-[#0071e3]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">{offer.position}</p>
                            <p className="text-xs text-[#86868b]">{offer.company.name}</p>
                            <p className="text-xs text-[#34c759] font-bold mt-1">
                              {offer.currency} {parseFloat(offer.salary).toLocaleString()} / year
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/offers/${offer.offerId}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
                        >
                          View Offer <ArrowRight size={12} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Interviews */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Upcoming Interviews</h3>
                {interviews.length === 0 ? (
                  <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-8 text-center bg-white dark:bg-[#1c1c1e] shadow-xs">
                    <Calendar size={24} className="text-[#86868b] mx-auto mb-2" />
                    <p className="text-sm text-[#1d1d1f] dark:text-white font-semibold">No interviews scheduled in the next 7 days.</p>
                    <p className="text-xs text-[#86868b] mt-0.5">Keep applying — upcoming interviews will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interviews.map((i: any) => (
                      <div
                        key={i.interviewId}
                        className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#1d1d1f] dark:text-white">{i.job}</span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-full text-[#86868b]">
                              {i.format === 'video' ? '🎥 Video' : i.format === 'coding_test' ? '💻 Coding' : i.format}
                            </span>
                          </div>
                          <p className="text-xs text-[#86868b]">{i.company.name}</p>
                          <p className="text-xs text-[#86868b] font-medium">
                            {new Date(i.scheduledTime).toLocaleString([], {
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                            {' '}· {i.durationMinutes} min
                          </p>
                        </div>
                        
                        <Link
                          href={`/meet/${i.interviewId || i.id}?role=candidate`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#af52de]/10 border border-[#af52de]/20 text-[#af52de] rounded-xl text-xs font-bold hover:bg-[#af52de]/20 transition-all shrink-0 cursor-pointer"
                        >
                          <Video size={13} /> Join Interview
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Applications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Recent Applications</h3>
                  <Link href="/dashboard/applications" className="text-xs font-semibold text-[#0071e3] hover:underline flex items-center gap-1">
                    View all <ChevronRight size={13} />
                  </Link>
                </div>
                {recentApps.length === 0 ? (
                  <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-8 text-center bg-white dark:bg-[#1c1c1e] shadow-xs">
                    <Briefcase size={24} className="text-[#86868b] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#1d1d1f] dark:text-white">You haven&apos;t applied to any jobs yet.</p>
                    <Link href="/dashboard/jobs" className="text-xs text-[#0071e3] font-bold hover:underline mt-2 inline-block">
                      Browse open positions
                    </Link>
                  </div>
                ) : (
                  <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-3xl divide-y divide-black/[0.06] dark:divide-white/[0.08] bg-white dark:bg-[#1c1c1e] overflow-hidden shadow-xs">
                    {recentApps.map((app: any) => (
                      <Link
                        key={app.applicationId}
                        href="/dashboard/applications"
                        className="p-4 flex items-center justify-between gap-4 hover:bg-[#f2f2f7]/60 dark:hover:bg-[#2c2c2e]/60 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-2xl bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center text-sm font-bold text-[#0071e3] shrink-0">
                            {app.company.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#1d1d1f] dark:text-white truncate">{app.job.title}</p>
                            <p className="text-xs text-[#86868b] truncate">{app.company.name}</p>
                            <p className="text-[10px] text-[#86868b] mt-0.5 font-medium">
                              Applied {new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${statusColors(app.status)}`}>
                            {statusLabel(app.status)}
                          </span>
                          <ChevronRight size={14} className="text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">

              {/* Resume Card */}
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">My Resume</h3>
                  <Link href="/dashboard/resumes" className="text-xs font-semibold text-[#0071e3] hover:underline">
                    Manage →
                  </Link>
                </div>

                {resume ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1d1d1f] dark:text-white truncate">{resume.name}</p>
                        <p className="text-[10px] text-[#86868b] mt-0.5">
                          Updated {new Date(resume.lastUpdated).toLocaleDateString()}
                          {resume.totalResumes > 1 && ` · ${resume.totalResumes} total`}
                        </p>
                      </div>
                      <FileText size={16} className="text-[#0071e3] shrink-0 mt-0.5" />
                    </div>

                    {resume.atsScore !== null && (
                      <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-3.5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-semibold text-[#86868b]">ATS Compatibility Score</span>
                          <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">{resume.atsScore}%</span>
                        </div>
                        <div className="w-full bg-white dark:bg-[#1c1c1e] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${atsColor(resume.atsScore)}`}
                            style={{ width: `${resume.atsScore}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-medium text-[#86868b]">
                          {resume.atsScore >= 75
                            ? '✓ Your resume is well-optimised'
                            : resume.atsScore >= 50
                            ? 'Consider improving keywords'
                            : 'Resume needs improvement'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <FileText size={28} className="text-[#86868b] mx-auto" />
                    <p className="text-xs text-[#86868b] font-medium">No resume uploaded yet.</p>
                    <Link
                      href="/dashboard/resumes"
                      className="inline-flex items-center gap-1 text-xs text-[#0071e3] font-bold hover:underline"
                    >
                      Upload Resume <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">My Skills</h3>
                  <Link href="/dashboard/profile" className="text-xs font-semibold text-[#0071e3] hover:underline">
                    Edit →
                  </Link>
                </div>
                {profile?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium rounded-xl"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-xs text-[#86868b]">No skills added yet.</p>
                    <Link href="/dashboard/profile" className="text-xs text-[#0071e3] font-bold hover:underline mt-1 inline-block">
                      Add skills
                    </Link>
                  </div>
                )}
              </div>

              {/* This month summary */}
              {summary && (
                <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                  <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">This Month</h3>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex justify-between items-center py-1.5 border-b border-black/[0.06] dark:border-white/[0.08]">
                      <span className="text-[#86868b]">Rejections</span>
                      <span className={`font-bold ${summary.rejectedThisMonth > 0 ? 'text-[#ff3b30]' : 'text-[#86868b]'}`}>
                        {summary.rejectedThisMonth}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-black/[0.06] dark:border-white/[0.08]">
                      <span className="text-[#86868b]">In Interview Stage</span>
                      <span className="font-bold text-[#af52de]">{summary.inInterview}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-[#86868b]">Successfully Hired</span>
                      <span className={`font-bold ${summary.hired > 0 ? 'text-[#34c759]' : 'text-[#86868b]'}`}>
                        {summary.hired}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── Insights Tab ── */
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#1d1d1f] dark:text-white">Application Insights</h2>
            <p className="text-xs text-[#86868b] font-medium mt-0.5">Track how your job search is performing over time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Response Rate"
              value={insightsData?.responseRate ? `${insightsData.responseRate}%` : '0%'}
              sub="Companies that moved you forward"
              subColor={insightsData?.responseRate > 30 ? 'text-[#34c759]' : 'text-[#86868b]'}
              icon={TrendingUp}
            />
            <StatCard
              label="Avg. First Response"
              value={insightsData?.avgResponseTimeDays ? `${insightsData.avgResponseTimeDays} days` : 'N/A'}
              sub="From application to reply"
              icon={Clock}
            />
            <StatCard
              label="Avg. Resume Score"
              value={insightsData?.avgAtsScore ? `${insightsData.avgAtsScore}%` : 'N/A'}
              sub="Across all resumes"
              icon={BarChart3}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Industry Breakdown */}
            <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Industries You&apos;ve Applied To</h3>
                <p className="text-xs text-[#86868b] font-medium mt-0.5">Breakdown of applications by industry.</p>
              </div>
              {insightsData?.industryBreakdown?.length > 0 ? (
                <div className="space-y-3">
                  {insightsData.industryBreakdown.map((item: any, idx: number) => {
                    const pct = Math.round((item.count / (insightsData.totalApplications || 1)) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#1d1d1f] dark:text-white font-medium truncate max-w-[200px]">{item.industry}</span>
                          <span className="text-[#86868b] shrink-0 font-medium">{item.count} job{item.count !== 1 ? 's' : ''} · {pct}%</span>
                        </div>
                        <div className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] h-2 rounded-full overflow-hidden">
                          <div className="bg-[#0071e3] h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#86868b] py-4 text-center">Apply to jobs to see your industry breakdown.</p>
              )}
            </div>

            {/* Monthly Trend */}
            <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Applications Per Month</h3>
                <p className="text-xs text-[#86868b] font-medium mt-0.5">Application count over the last 6 months.</p>
              </div>
              {insightsData?.monthlyTrend?.length > 0 ? (
                <div className="flex items-end justify-between gap-2 h-36 pt-4">
                  {insightsData.monthlyTrend.map((trend: any, idx: number) => {
                    const maxVal = Math.max(...insightsData.monthlyTrend.map((t: any) => t.count), 1);
                    const pct    = (trend.count / maxVal) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-1.5 group">
                        <span className="text-[10px] text-[#86868b] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {trend.count}
                        </span>
                        <div
                          className="w-full bg-[#0071e3]/20 group-hover:bg-[#0071e3] transition-colors rounded-t-lg min-h-[4px]"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                        <span className="text-[10px] text-[#86868b] font-semibold">
                          {trend.month.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#86868b] py-4 text-center">No application history to display yet.</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}