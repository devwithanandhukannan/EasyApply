'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, ArrowRight, ShieldCheck, CheckCircle2, 
  Layers, Briefcase, Calendar, FileText, ChevronRight, 
  MapPin, Clock, BarChart3, TrendingUp, Award, Building2,
  ExternalLink, CheckSquare, XCircle, AlertCircle, Info, Video
} from 'lucide-react';
import api from '@/app/lib/axios';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [activeView, setActiveView] = useState<'pipeline' | 'insights'>('pipeline');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardPayload = async () => {
      try {
        const [dashRes, insightRes] = await Promise.all([
          api.get('/jobseeker/dashboard'),
          api.get('/jobseeker/insights')
        ]);
        if (dashRes.data?.success) setDashboardData(dashRes.data.data);
        if (insightRes.data?.success) setInsightsData(insightRes.data.data);
      } catch (error) {
        console.error('Failed to resolve system telemetry:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardPayload();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border border-zinc-800 border-t-white"></div>
      </div>
    );
  }

  const profile = dashboardData?.profile;
  const summary = dashboardData?.applicationSummary;
  const recentApps = dashboardData?.recentApplications || [];
  const interviews = dashboardData?.upcomingInterviews || [];
  const offers = dashboardData?.pendingOffers || [];
  const resume = dashboardData?.resume;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 bg-black text-zinc-300 min-h-screen animate-fade-in">
      
      {/* Top Telemetry Header Block */}
      <div className="border-b border-zinc-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">
            Welcome back, {profile?.fullName || 'Candidate'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
            Monitor active matching pipeline evaluations and technical system protocols.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button 
              onClick={() => setActiveView('pipeline')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                activeView === 'pipeline' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Pipeline
            </button>
            <button 
              onClick={() => setActiveView('insights')}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                activeView === 'insights' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Insights
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-medium text-zinc-400 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{profile?.availabilityStatus || 'Available'}</span>
          </div>
        </div>
      </div>

      {activeView === 'pipeline' ? (
        <>
          {/* Section: Profile Configuration Metric */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Sparkles className="w-24 h-24 text-white" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Profile Completion Index</h3>
                <p className="text-xs text-zinc-500 max-w-md">Complete your structural identity indexes to optimize automated technical match pipelines.</p>
              </div>
              <div className="shrink-0">
                <div className="flex items-baseline gap-0.5 font-mono">
                  <span className="text-3xl font-bold text-white tracking-tight">{profile?.completionScore ?? 0}</span>
                  <span className="text-xs text-zinc-600 font-medium">/100</span>
                </div>
              </div>
            </div>
            
            {/* Completion Bar Track */}
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-5">
              <div 
                className="bg-white h-full transition-all duration-500 ease-out"
                style={{ width: `${profile?.completionScore ?? 0}%` }}
              />
            </div>

            {/* Profile Action Items Checklist */}
            {profile?.completionTips && profile.completionTips.length > 0 && (
              <div className="pt-4 border-t border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.completionTips.map((tip: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-zinc-400">
                    <Info size={12} className="text-zinc-600 shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Pipeline Status Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4">
              <div className="flex justify-between items-start text-zinc-500 mb-2">
                <span className="text-xs font-medium">Applications Filed</span>
                <Briefcase size={14} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{summary?.total ?? 0}</p>
              <p className="text-[10px] text-zinc-500 mt-1">{summary?.active ?? 0} active in parsing pipeline</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4">
              <div className="flex justify-between items-start text-zinc-500 mb-2">
                <span className="text-xs font-medium">Evaluation Panels</span>
                <Calendar size={14} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{summary?.inInterview ?? 0}</p>
              <p className="text-[10px] text-zinc-400 mt-1 text-purple-400">Technical or HR loops scheduled</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4">
              <div className="flex justify-between items-start text-zinc-500 mb-2">
                <span className="text-xs font-medium">Offers Appended</span>
                <Award size={14} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{summary?.offerStage ?? 0}</p>
              <p className="text-[10px] text-emerald-400 mt-1 font-medium">Pending structural response</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4">
              <div className="flex justify-between items-start text-zinc-500 mb-2">
                <span className="text-xs font-medium">Primary Asset Index</span>
                <FileText size={14} />
              </div>
              <p className="text-2xl font-bold text-white font-mono">{resume?.atsScore ? `${resume.atsScore}%` : 'N/A'}</p>
              <p className="text-[10px] text-zinc-500 mt-1 truncate">{resume?.name || 'No master asset'}</p>
            </div>
          </div>

          {/* Core Interactive Center Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Middle Column Stack */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Active / Actionable Offers Panel */}
              {offers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Action Required: Offers</h3>
                  <div className="space-y-2">
                    {offers.map((offer: any) => (
                      <div key={offer.offerId} className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            <Building2 size={16} className="text-zinc-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{offer.position}</h4>
                            <p className="text-xs text-zinc-400">{offer.company.name}</p>
                            <p className="text-[11px] font-mono text-emerald-400 mt-1">
                              {offer.currency} {parseFloat(offer.salary).toLocaleString()} / year
                            </p>
                          </div>
                        </div>
                        <Link 
                          href={`/dashboard/offers/${offer.offerId}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-medium hover:bg-zinc-200 transition-colors shrink-0"
                        >
                          Review Contract <ArrowRight size={12} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Evaluation Panels Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Upcoming Technical Panels (7 Days)</h3>
                {interviews.length === 0 ? (
                  <div className="border border-zinc-900 rounded-xl p-6 text-center bg-zinc-950">
                    <p className="text-xs text-zinc-500">No examination loops scheduled inside this time block threshold.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {interviews.map((i: any) => (
                      <div key={i.interviewId} className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{i.job}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">
                              {i.format}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">{i.company.name}</p>
                          <p className="text-[11px] text-zinc-500 font-mono">
                            {new Date(i.scheduledTime).toLocaleString()} ({i.durationMinutes} min)
                          </p>
                        </div>
                        {i.status === 'confirmed' || i.status === 'scheduled' ? (
                          <a 
                            href={i.joinLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-500/20 transition-colors shrink-0"
                          >
                            <Video size={12} /> Enter Room
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-500 italic uppercase tracking-wider font-mono">{i.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Job Tracker Sequence */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pipeline Activity Ledger</h3>
                {recentApps.length === 0 ? (
                  <div className="border border-zinc-900 rounded-xl p-8 text-center bg-zinc-950">
                    <p className="text-xs text-zinc-500">No active operational application tracks detected.</p>
                  </div>
                ) : (
                  <div className="border border-zinc-900 rounded-xl divide-y divide-zinc-900 bg-zinc-950 overflow-hidden">
                    {recentApps.map((app: any) => (
                      <Link 
                        key={app.applicationId} 
                        href={`/dashboard/applications/${app.applicationId}`}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {app.company.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-white truncate group-hover:text-zinc-200 transition-colors">
                              {app.job.title}
                            </h4>
                            <p className="text-[11px] text-zinc-500 truncate">{app.company.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                            app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            app.status === 'hired' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-zinc-900 text-zinc-400 border-zinc-800'
                          }`}>
                            {app.status.replace('_', ' ')}
                          </span>
                          <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Asset Parameters */}
            <div className="space-y-6">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">System Asset Metadata</h3>
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white">Active System Index</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Total Assets: {resume?.totalResumes ?? 0}</p>
                  </div>
                  {resume ? (
                    <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-400 rounded">
                      Operational
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-red-400 rounded">
                      Missing
                    </span>
                  )}
                </div>

                {resume ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-zinc-400 truncate">{resume.name}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        Synced: {new Date(resume.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Automated ATS Score</span>
                        <span className="text-xs font-mono font-bold text-white">{resume.atsScore}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-zinc-400 h-full" style={{ width: `${resume.atsScore}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs text-zinc-500">No parsing baseline artifact assigned.</p>
                    <Link href="/dashboard/resumes" className="inline-flex text-xs text-white underline font-medium hover:text-zinc-300">
                      Upload Asset Baseline
                    </Link>
                  </div>
                )}
              </div>

              {/* Core Skill Vector Tags */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-3">
                <p className="text-xs font-semibold text-white">Configured Technical Vectors</p>
                {profile?.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 italic">No structural skills loaded.</p>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        /* Analytics View Container */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-zinc-500">Pipeline Response Velocity</span>
                <TrendingUp size={14} className="text-zinc-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-white">
                {insightsData?.responseRate ? `${insightsData.responseRate}%` : '0%'}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">Conversions past foundational stage</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-zinc-500">Mean System Response Threshold</span>
                <Clock size={14} className="text-zinc-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-white">
                {insightsData?.avgResponseTimeDays ? `${insightsData.avgResponseTimeDays}d` : 'N/A'}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">From generation tracking to conversion</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-zinc-500">Cumulative Performance Baseline</span>
                <BarChart3 size={14} className="text-zinc-500" />
              </div>
              <p className="text-2xl font-bold font-mono text-white">
                {insightsData?.avgAtsScore ? `${insightsData.avgAtsScore}%` : 'N/A'}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">Global average parsing scorecard</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Target Industry Vectors Chart Vector */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-white">Target Domain Clusters</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Telemetry matrix distribution of targets categorized by market field.</p>
              </div>
              {insightsData?.industryBreakdown && insightsData.industryBreakdown.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {insightsData.industryBreakdown.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-400 truncate max-w-[200px]">{item.industry}</span>
                        <span className="text-zinc-500">{item.count} loops</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-zinc-500 h-full" 
                          style={{ 
                            width: `${(item.count / (insightsData.totalApplications || 1)) * 100}%` 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 italic py-4">No data metrics processed.</p>
              )}
            </div>

            {/* Pipeline Velocity Tracker Map */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-white">Monthly Tracking Velocity</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Volumetric evaluation arrays calculated across trailing six-month window parameters.</p>
              </div>
              {insightsData?.monthlyTrend && insightsData.monthlyTrend.length > 0 ? (
                <div className="flex items-end justify-between gap-2 pt-8 h-32">
                  {insightsData.monthlyTrend.map((trend: any, idx: number) => {
                    const maxVal = Math.max(...insightsData.monthlyTrend.map((t: any) => t.count), 1);
                    const percentHeight = (trend.count / maxVal) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-2 group">
                        <span className="text-[9px] font-mono text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {trend.count}
                        </span>
                        <div 
                          className="w-full bg-zinc-800 group-hover:bg-zinc-400 transition-all rounded-t"
                          style={{ height: `${percentHeight}%` }}
                        />
                        <span className="text-[9px] font-mono text-zinc-600 truncate w-full text-center">
                          {trend.month.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 italic py-4">No historical metrics mapped to baseline.</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}