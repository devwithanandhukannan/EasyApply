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
    case 'hired':        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'rejected':     return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'offer_sent':   return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'technical_round':
    case 'hr_round':     return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    default:             return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
}

function atsColor(score: number) {
  if (score >= 75) return 'bg-emerald-400';
  if (score >= 50) return 'bg-yellow-400';
  return 'bg-red-400';
}

// ─── Stat Card ──────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor = 'text-zinc-500', icon: Icon }: {
  label: string; value: string | number; sub: string;
  subColor?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
      <div className="flex justify-between items-start text-zinc-500 mb-3">
        <span className="text-xs font-medium">{label}</span>
        <Icon size={15} />
      </div>
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
      <p className={`text-[11px] mt-1 ${subColor}`}>{sub}</p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [insightsData, setInsightsData]   = useState<any>(null);
  const [activeView, setActiveView]       = useState<'overview' | 'insights'>('overview');
  const [isLoading, setIsLoading]         = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dashRes, insightRes] = await Promise.all([
          api.get('/jobseeker/dashboard'),
          api.get('/jobseeker/insights'),
        ]);
        if (dashRes.data?.success)    setDashboardData(dashRes.data.data);
        if (insightRes.data?.success) setInsightsData(insightRes.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border border-zinc-800 border-t-white" />
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
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 bg-black text-zinc-300 min-h-screen">

      {/* ── Header ── */}
      <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Welcome back, {profile?.fullName || 'there'} 
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Here's a summary of your job search activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            {(['overview', 'insights'] as const).map(v => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium capitalize transition-all ${
                  activeView === v ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-medium text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{profile?.availabilityStatus?.replace('_', ' ') || 'Available'}</span>
          </div>
        </div>
      </div>

      {activeView === 'overview' ? (
        <>
          {/* ── Profile Completion ── */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Sparkles className="w-24 h-24 text-white" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Profile Completion</h3>
                <p className="text-xs text-zinc-500 mt-0.5 max-w-md">
                  A complete profile helps employers find you and increases your chances of getting shortlisted.
                </p>
              </div>
              <div className="font-mono shrink-0">
                <span className="text-3xl font-bold text-white">{profile?.completionScore ?? 0}</span>
                <span className="text-xs text-zinc-600">/ 100</span>
              </div>
            </div>

            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mb-5">
              <div
                className="bg-white h-full transition-all duration-500"
                style={{ width: `${profile?.completionScore ?? 0}%` }}
              />
            </div>

            {profile?.completionTips?.length > 0 && (
              <div className="border-t border-zinc-900 pt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {profile.completionTips.map((tip: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                    <Info size={12} className="text-zinc-600 shrink-0" />
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
              sub={`${summary?.active ?? 0} still in progress`}
              icon={Briefcase}
            />
            <StatCard
              label="Interviews Scheduled"
              value={summary?.inInterview ?? 0}
              sub="Technical or HR rounds"
              subColor="text-purple-400"
              icon={Calendar}
            />
            <StatCard
              label="Offers Received"
              value={summary?.offerStage ?? 0}
              sub="Waiting for your response"
              subColor={summary?.offerStage > 0 ? 'text-emerald-400 font-medium' : 'text-zinc-500'}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left / Centre */}
            <div className="lg:col-span-2 space-y-6">

              {/* Pending Offers — action required */}
              {offers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Offers Awaiting Your Response</h3>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                      Action needed
                    </span>
                  </div>
                  <div className="space-y-2">
                    {offers.map((offer: any) => (
                      <div
                        key={offer.offerId}
                        className="bg-zinc-950 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            <Building2 size={16} className="text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{offer.position}</p>
                            <p className="text-xs text-zinc-400">{offer.company.name}</p>
                            <p className="text-xs text-emerald-400 font-mono mt-1">
                              {offer.currency} {parseFloat(offer.salary).toLocaleString()} / year
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/offers/${offer.offerId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors shrink-0"
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
                <h3 className="text-sm font-semibold text-white">Upcoming Interviews (Next 7 Days)</h3>
                {interviews.length === 0 ? (
                  <div className="border border-zinc-900 rounded-xl p-8 text-center bg-zinc-950">
                    <Calendar size={24} className="text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">No interviews scheduled in the next 7 days.</p>
                    <p className="text-xs text-zinc-600 mt-1">Keep applying — interviews will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interviews.map((i: any) => (
                      <div
                        key={i.interviewId}
                        className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white">{i.job}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">
                              {i.format === 'video' ? '🎥 Video' : i.format === 'coding_test' ? '💻 Coding' : i.format}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">{i.company.name}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(i.scheduledTime).toLocaleString([], {
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                            {' '}· {i.durationMinutes} min
                          </p>
                        </div>
                        
                        <a
                          href={i.joinLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors shrink-0"
                        >
                          <Video size={12} /> Join Interview
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Applications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Recent Applications</h3>
                  <Link href="/dashboard/applications" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                    View all <ChevronRight size={12} />
                  </Link>
                </div>
                {recentApps.length === 0 ? (
                  <div className="border border-zinc-900 rounded-xl p-8 text-center bg-zinc-950">
                    <Briefcase size={24} className="text-zinc-700 mx-auto mb-2" />
                    <p className="text-sm text-zinc-500">You haven't applied to any jobs yet.</p>
                    <Link href="/dashboard/jobs" className="text-xs text-white underline mt-2 inline-block hover:text-zinc-300">
                      Browse open positions
                    </Link>
                  </div>
                ) : (
                  <div className="border border-zinc-900 rounded-xl divide-y divide-zinc-900 bg-zinc-950 overflow-hidden">
                    {recentApps.map((app: any) => (
                      <Link
                        key={app.applicationId}
                        href="/dashboard/applications"
                        className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {app.company.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{app.job.title}</p>
                            <p className="text-xs text-zinc-500 truncate">{app.company.name}</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">
                              Applied {new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border capitalize ${statusColors(app.status)}`}>
                            {statusLabel(app.status)}
                          </span>
                          <ChevronRight size={13} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
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
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">My Resume</h3>
                  <Link href="/dashboard/resumes" className="text-xs text-zinc-400 hover:text-white transition-colors">
                    Manage →
                  </Link>
                </div>

                {resume ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-300 truncate">{resume.name}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">
                          Updated {new Date(resume.lastUpdated).toLocaleDateString()}
                          {resume.totalResumes > 1 && ` · ${resume.totalResumes} total`}
                        </p>
                      </div>
                      <FileText size={15} className="text-zinc-500 shrink-0 mt-0.5" />
                    </div>

                    {resume.atsScore !== null && (
                      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-zinc-400">ATS Compatibility Score</span>
                          <span className="text-xs font-bold font-mono text-white">{resume.atsScore}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${atsColor(resume.atsScore)}`}
                            style={{ width: `${resume.atsScore}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-600">
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
                    <FileText size={28} className="text-zinc-700 mx-auto" />
                    <p className="text-xs text-zinc-500">No resume uploaded yet.</p>
                    <Link
                      href="/dashboard/resumes"
                      className="inline-flex items-center gap-1 text-xs text-white font-medium underline hover:text-zinc-300"
                    >
                      Upload Resume <ArrowRight size={11} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">My Skills</h3>
                  <Link href="/dashboard/profile" className="text-xs text-zinc-400 hover:text-white transition-colors">
                    Edit →
                  </Link>
                </div>
                {profile?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-xs text-zinc-600">No skills added yet.</p>
                    <Link href="/dashboard/profile" className="text-xs text-white underline mt-1 inline-block">
                      Add skills
                    </Link>
                  </div>
                )}
              </div>

              {/* This month summary */}
              {summary && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-white">This Month</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Rejections</span>
                      <span className={`font-mono font-semibold ${summary.rejectedThisMonth > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                        {summary.rejectedThisMonth}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">In Interview Stage</span>
                      <span className="font-mono font-semibold text-purple-400">{summary.inInterview}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-zinc-400">Successfully Hired</span>
                      <span className={`font-mono font-semibold ${summary.hired > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
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
            <h2 className="text-base font-semibold text-white">Application Insights</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Track how your job search is performing over time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Response Rate"
              value={insightsData?.responseRate ? `${insightsData.responseRate}%` : '0%'}
              sub="Companies that moved you forward"
              subColor={insightsData?.responseRate > 30 ? 'text-emerald-400' : 'text-zinc-500'}
              icon={TrendingUp}
            />
            <StatCard
              label="Avg. Time to First Response"
              value={insightsData?.avgResponseTimeDays ? `${insightsData.avgResponseTimeDays} days` : 'N/A'}
              sub="From application to first reply"
              icon={Clock}
            />
            <StatCard
              label="Avg. Resume Score"
              value={insightsData?.avgAtsScore ? `${insightsData.avgAtsScore}%` : 'N/A'}
              sub="Across all submitted resumes"
              icon={BarChart3}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Industry Breakdown */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Industries You've Applied To</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Breakdown of your applications by industry.</p>
              </div>
              {insightsData?.industryBreakdown?.length > 0 ? (
                <div className="space-y-3">
                  {insightsData.industryBreakdown.map((item: any, idx: number) => {
                    const pct = Math.round((item.count / (insightsData.totalApplications || 1)) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-300 truncate max-w-[200px]">{item.industry}</span>
                          <span className="text-zinc-500 shrink-0">{item.count} job{item.count !== 1 ? 's' : ''} · {pct}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-zinc-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-600 py-4 text-center">Apply to jobs to see your industry breakdown.</p>
              )}
            </div>

            {/* Monthly Trend */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Applications Per Month</h3>
                <p className="text-xs text-zinc-500 mt-0.5">How many jobs you applied to over the last 6 months.</p>
              </div>
              {insightsData?.monthlyTrend?.length > 0 ? (
                <div className="flex items-end justify-between gap-2 h-36 pt-4">
                  {insightsData.monthlyTrend.map((trend: any, idx: number) => {
                    const maxVal = Math.max(...insightsData.monthlyTrend.map((t: any) => t.count), 1);
                    const pct    = (trend.count / maxVal) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-1.5 group">
                        <span className="text-[10px] text-zinc-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          {trend.count}
                        </span>
                        <div
                          className="w-full bg-zinc-800 group-hover:bg-zinc-400 transition-colors rounded-t min-h-[4px]"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                        <span className="text-[10px] text-zinc-600 font-mono">
                          {trend.month.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-600 py-4 text-center">No application history to display yet.</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}