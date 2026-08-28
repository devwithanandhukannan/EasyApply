'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Search, 
  SlidersHorizontal, 
  Users, 
  ChevronRight, 
  Loader2, 
  ArrowLeft,
  Mail,
  Phone,
  Sparkles,
  Award,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { useAuth } from '@/app/contexts/AuthContext';
import LockedFeaturePaywall from '@/app/components/LockedFeaturePaywall';

interface JobSummary {
  id: string;
  title: string;
  department?: string;
  status: string;
}

interface ApplicationRecord {
  id: string;
  applicationId?: string;
  status: string;
  createdAt: string;
  pipelineIndex?: number;
  matchScore?: number;
  jobPosting?: {
    id: string;
    title: string;
  };
  jobSeekerProfile?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    profilePhotoUrl?: string;
    location?: string;
  };
  candidate?: {
    fullName: string;
    email: string;
    phone?: string;
    profilePhotoUrl?: string;
  };
  resume?: {
    atsScore?: number;
  };
}

const STAGES: { key: string; label: string; color: string; badgeClass: string }[] = [
  { key: 'applied', label: 'Applied', color: '#0071e3', badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { key: 'screened', label: 'Screened', color: '#bf5af2', badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { key: 'technical_round', label: 'Interview', color: '#ff9f0a', badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { key: 'offer_sent', label: 'Offer Sent', color: '#30d158', badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { key: 'hired', label: 'Hired', color: '#34c759', badgeClass: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { key: 'rejected', label: 'Rejected', color: '#ff453a', badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
];

export default function KanbanBoardPage() {
  const { showToast } = useGlassToast();
  const { hasFeature } = useAuth();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const hasAccess = hasFeature('kanban');

  const fetchJobsAndApplications = useCallback(async () => {
    try {
      setLoading(true);
      const jobsRes = await api.get('/company/jobs');
      const jobsList = jobsRes.data?.data || jobsRes.data?.jobs || [];
      setJobs(jobsList);

      let allApps: ApplicationRecord[] = [];
      if (jobsList.length > 0) {
        const appsPromises = jobsList.slice(0, 10).map((j: JobSummary) =>
          api.get(`/company/jobs/${j.id}/applications`).then(r => r.data?.data || []).catch(() => [])
        );
        const results = await Promise.all(appsPromises);
        allApps = results.flat();
      }

      setApplications(allApps);
    } catch (err: any) {
      console.error('Failed to load kanban data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchJobsAndApplications();
    }
  }, [fetchJobsAndApplications, hasAccess]);

  if (!hasAccess) {
    return (
      <LockedFeaturePaywall
        featureKey="kanban"
        featureTitle="Visual Kanban Hiring Pipeline"
        featureDescription="Organize candidate lifecycles across customizable recruitment stages with drag-and-drop agility."
      />
    );
  }

  const handleDragStart = (e: React.DragEvent, appId: string, sourceStatus: string) => {
    setDraggingId(appId);
    e.dataTransfer.setData('applicationId', appId);
    e.dataTransfer.setData('sourceStatus', sourceStatus);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('applicationId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    setDraggingId(null);

    if (!appId || sourceStatus === targetStatus) return;

    setApplications(prev => prev.map(app => (app.id === appId || app.applicationId === appId) ? { ...app, status: targetStatus } : app));

    try {
      await api.patch('/kanban/move-card', {
        applicationId: appId,
        destinationStatus: targetStatus,
        sourceStatus,
        newIndex: 0
      });
      showToast('success', `Candidate moved to ${targetStatus}`, 'success');
    } catch {
      showToast('failed', 'Failed to update stage on server', 'danger');
      fetchJobsAndApplications();
    }
  };

  const filteredApps = applications.filter(app => {
    const jobMatch = selectedJobId === 'all' || (app.jobPosting?.id === selectedJobId) || ((app as any).jobPostingId === selectedJobId);
    const profile: any = app.candidate || app.jobSeekerProfile || { fullName: (app as any).fullName, email: (app as any).email };
    const fullName = profile.fullName || (app as any).fullName || '';
    const email = profile.email || (app as any).email || '';
    const nameMatch = !searchQuery ? true : (
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return jobMatch && nameMatch;
  });

  const columnsData: Record<string, ApplicationRecord[]> = {
    applied: [],
    screened: [],
    technical_round: [],
    offer_sent: [],
    hired: [],
    rejected: []
  };

  filteredApps.forEach(app => {
    const st = app.status?.toLowerCase() || 'applied';
    if (columnsData[st]) {
      columnsData[st].push(app);
    } else if (st === 'pending' || st === 'new') {
      columnsData['applied'].push(app);
    } else if (st === 'interview' || st === 'in_progress') {
      columnsData['technical_round'].push(app);
    } else if (st === 'offered') {
      columnsData['offer_sent'].push(app);
    } else {
      columnsData['applied'].push(app);
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1d1d1f] dark:text-[#f5f5f7]">
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-xs text-[#86868b] hover:text-[#0071e3] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            Visual Candidate Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-0.5">
            Drag and drop candidates across pipeline stages to trigger automatic workflows.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
            <input
              type="text"
              placeholder="Filter candidate..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 w-48 sm:w-60"
            />
          </div>

          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
          >
            <option value="all">All Job Postings ({jobs.length})</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── KANBAN BOARD VIEW ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 text-[#0071e3] animate-spin" />
          <p className="text-xs text-[#86868b]">Loading candidate pipeline...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-6">
          {STAGES.map(stage => {
            const cards = columnsData[stage.key] || [];
            return (
              <div
                key={stage.key}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, stage.key)}
                className="flex flex-col bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-3.5 min-h-[500px] transition-all"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.06] mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-[#86868b]">
                    {cards.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-[#86868b] space-y-1">
                      <p className="text-[11px] italic">Drop candidate here</p>
                    </div>
                  ) : (
                    cards.map(app => {
                      const profile: any = app.candidate || app.jobSeekerProfile || {};
                      const candidateName = profile.fullName || 'Unnamed Candidate';
                      const ats = app.resume?.atsScore || app.matchScore || null;

                      return (
                        <div
                          key={app.id || app.applicationId}
                          draggable
                          onDragStart={e => handleDragStart(e, app.id || app.applicationId || '', stage.key)}
                          className={`p-3 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-[#0071e3]/40 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-2.5 ${
                            draggingId === (app.id || app.applicationId) ? 'opacity-50 scale-95' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                                {candidateName}
                              </h4>
                              {profile.email && (
                                <p className="text-[10px] text-[#86868b] truncate">{profile.email}</p>
                              )}
                            </div>
                            {ats !== null && (
                              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#0071e3]/10 text-[#0071e3]">
                                {ats}% ATS
                              </span>
                            )}
                          </div>

                          {app.jobPosting?.title && (
                            <div className="flex items-center gap-1 text-[10px] text-[#86868b] bg-black/[0.02] dark:bg-white/[0.04] px-2 py-1 rounded-lg">
                              <Briefcase className="w-3 h-3 shrink-0" />
                              <span className="truncate">{app.jobPosting.title}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[9px] text-[#86868b] pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(app.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                            <Link
                              href={`/dashboard/applications/${app.id || app.applicationId}`}
                              className="text-[#0071e3] hover:underline font-semibold flex items-center gap-0.5"
                            >
                              <span>View</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </Link>
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
      )}
    </div>
  );
}
