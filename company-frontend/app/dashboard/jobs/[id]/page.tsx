// app/dashboard/jobs/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Clock, DollarSign, Users, Calendar,
  Edit, Trash2, Building2, Target, ChevronRight,
  Sparkles, UserCheck, UserX, Eye, BarChart3, CheckSquare, Square, Check
} from 'lucide-react';
import api from '@/app/lib/axios';
import JobPostingModal from '@/app/components/JobPostingModal';
import AIFilterModal from '@/app/components/AIFilterModal';
import ScheduleInterviewsModal from '@/app/components/ScheduleInterviewsModal';

const STATUS_STYLES: Record<string, string> = {
  active:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed:      'bg-red-500/10 text-red-400 border-red-500/20',
  draft:       'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  applied:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  screened:    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  technical_round: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  hr_round:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  offer_sent:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  hired:       'bg-green-500/10 text-green-400 border-green-500/20',
  rejected:    'bg-red-500/10 text-red-400 border-red-500/20',
};

const STAGE_COLUMNS = [
  { key: 'applied', label: 'Applied' },
  { key: 'screened', label: 'Screened' },
  { key: 'technical_round', label: 'Technical Round' },
  { key: 'hr_round', label: 'HR Round' },
  { key: 'offer_sent', label: 'Offer Sent' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' }
];

export default function JobDetailsPage() {
  const params  = useParams();
  const router  = useRouter();

  const [job,           setJob]           = useState<any>(null);
  const [applications,  setApplications]  = useState<any[]>([]);
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [activeTab,     setActiveTab]     = useState<'details' | 'applicants'>('details');
  const [viewMode,      setViewMode]      = useState<'list' | 'kanban'>('list');
  const [isLoading,     setIsLoading]     = useState(true);
  const [appsLoading,   setAppsLoading]   = useState(false);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [aiFilterOpen,  setAiFilterOpen]  = useState(false);
  
  // Advanced Filter state variables
  const [minAtsScore,   setMinAtsScore]   = useState<number>(0);
  const [searchQuery,   setSearchQuery]   = useState<string>('');
  
  // Selection and Batch Orchestration State
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Load both concurrent streams right on initialization mount
  useEffect(() => {
    if (params.id) initPageData();
  }, [params.id]);

  useEffect(() => {
    if (params.id && !isLoading) fetchApplications();
  }, [statusFilter]);
  
  const initPageData = async () => {
    try {
      setIsLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        api.get(`/company/jobs/${params.id}`),
        api.get(`/company/jobs/${params.id}/applications`)
      ]);
      setJob(jobRes.data.job);
      setApplications(appsRes.data.applications || []);
    } catch {
      router.push('/dashboard/jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setAppsLoading(true);
      const url = statusFilter === 'all'
        ? `/company/jobs/${params.id}/applications`
        : `/company/jobs/${params.id}/applications?status=${statusFilter}`;
      const r = await api.get(url);
      setApplications(r.data.applications || []);
      setSelectedApplicationIds([]); 
    } catch (e) {
      console.error(e);
    } finally {
      setAppsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      setIsDeleting(true);
      await api.delete(`/company/jobs/${params.id}`);
      router.push('/dashboard/jobs');
    } catch { alert('Failed to delete job.'); }
    finally { setIsDeleting(false); }
  };

  // Drag and Drop State Orchestration Handlers
  const handleDragStart = (e: React.DragEvent, appId: string, sourceStatus: string) => {
    e.dataTransfer.setData('applicationId', appId);
    e.dataTransfer.setData('sourceStatus', sourceStatus);
  };

  const handleDrop = async (e: React.DragEvent, destinationStatus: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('applicationId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');

    if (!appId || sourceStatus === destinationStatus) return;

    // Optimistically update frontend state vectors immediately
    setApplications(prev => prev.map(app => 
      (app.applicationId === appId || app.id === appId) ? { ...app, status: destinationStatus } : app
    ));

    try {
      await api.patch('/kanban/move-card', {
        applicationId: appId,
        jobPostingId: params.id,
        sourceStatus,
        destinationStatus,
        newIndex: 0
      });
    } catch (err) {
      console.error('Failed processing pipeline sync execution:', err);
      fetchApplications(); // Revert back to original DB state on failure
    }
  };

  // Process pipeline matching layers on the client side
  const displayedApplications = applications.filter((app: any) => {
    const matchesAts = (app.resume?.atsScore ?? 0) >= minAtsScore;
    const profile = app.candidate || app.jobSeekerProfile || {};
    const matchesSearch = !searchQuery ? true : (
      profile.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchesAts && matchesSearch;
  });

  // Split displays structurally inside columns
  const getKanbanColumnsData = () => {
    const board: Record<string, any[]> = {
      applied: [], screened: [], technical_round: [], hr_round: [], offer_sent: [], hired: [], rejected: []
    };
    displayedApplications.forEach(app => {
      if (board[app.status]) board[app.status].push(app);
    });
    return board;
  };

  const toggleSelectCandidate = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedApplicationIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const toggleSelectAllVisible = () => {
    if (selectedApplicationIds.length === displayedApplications.length) {
      setSelectedApplicationIds([]);
    } else {
      setSelectedApplicationIds(displayedApplications.map((app: any) => app.applicationId || app.id));
    }
  };

  const handleBulkSchedulingSuccess = () => {
    setScheduleModalOpen(false);
    setSelectedApplicationIds([]);
    fetchApplications();
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
    </div>
  );
  if (!job) return null;

  const totalApps = applications.length;
  const kanbanData = getKanbanColumnsData();

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Back */}
      <button onClick={() => router.push('/dashboard/jobs')}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </button>

      {/* Header card */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
            <div className="flex items-center gap-4 text-zinc-500 text-sm">
              {job.department && <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{job.department}</span>}
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[job.status] ?? STATUS_STYLES.active}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            <button onClick={() => setEditOpen(true)}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-white transition-colors">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={handleDelete} disabled={isDeleting}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-colors disabled:opacity-50">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-900">
          {[
            { icon: Clock,     label: 'Job Type',   value: job.jobType },
            { icon: MapPin,    label: 'Location',   value: job.locationType },
            { icon: Users,     label: 'Openings',   value: `${job.openings} open` },
            { icon: BarChart3, label: 'Applicants', value: `${totalApps} total` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 rounded-lg"><Icon className="h-4 w-4 text-zinc-400" /></div>
              <div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="text-sm font-medium text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Layout Row accompanied by dynamic structure mode view switches */}
      <div className="border-b border-zinc-900 flex justify-between items-center">
        <div className="flex gap-6">
          {(['details', 'applicants'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}>
              {tab === 'applicants' ? `Applicants (${totalApps})` : 'Job Details'}
            </button>
          ))}
        </div>

        {activeTab === 'applicants' && (
          <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 mb-2 text-xs">
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}>
              List View
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-white'}`}>
              Kanban Board
            </button>
          </div>
        )}
      </div>

      {/* ── DETAILS TAB ── */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {(job.location || job.experienceRequired || job.deadline) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {job.location && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
                  <p className="text-xs text-zinc-500 mb-1">City</p>
                  <p className="text-white">{job.location}</p>
                </div>
              )}
              {job.experienceRequired && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
                  <p className="text-xs text-zinc-500 mb-1">Experience</p>
                  <p className="text-white">{job.experienceRequired}</p>
                </div>
              )}
              {job.salaryRange && (
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5">
                  <p className="text-xs text-zinc-500 mb-1">Salary Range</p>
                  <p className="text-white">{job.salaryRange}</p>
                </div>
              )}
            </div>
          )}

          {job.requiredSkills?.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-zinc-400" />
                <h3 className="font-semibold text-white text-sm">Required Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Job Description</h3>
            <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }} />
          </div>
        </div>
      )}

      {/* ── APPLICANTS TAB ── */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">

          {/* Workflow Stage Toolbar Selector Rows */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
              {['all','applied','screened','technical_round','hr_round','offer_sent','hired','rejected'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === s ? 'bg-white text-black font-semibold' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-900'
                  }`}>
                  {s === 'all' ? 'All Stages' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button onClick={() => setAiFilterOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/10">
              <Sparkles className="h-3.5 w-3.5" />
              AI Matching Engine
            </button>
          </div>

          {/* Advanced Local Filtering Stack Shelf */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Candidate Search</label>
              <input 
                type="text"
                placeholder="Filter current view by name, email, or skill set..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Min ATS Score Threshold</label>
                <span className="text-xs font-bold text-indigo-400">{minAtsScore}+</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={minAtsScore}
                onChange={(e) => setMinAtsScore(Number(e.target.value))}
                className="w-full accent-white bg-zinc-900 h-1 rounded-lg cursor-pointer"
              />
            </div>
            <div className="flex items-end">
              {selectedApplicationIds.length > 0 ? (
                <button
                  onClick={() => setScheduleModalOpen(true)}
                  className="w-full py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Schedule Batch Call ({selectedApplicationIds.length})
                </button>
              ) : (
                <div className="w-full text-center py-2 bg-zinc-900/40 border border-zinc-900 border-dashed rounded-lg text-[11px] text-zinc-500">
                  Select candidates below to trigger bulk processes
                </div>
              )}
            </div>
          </div>

          {/* Core Content Layout Selector Switch Case Router */}
          {appsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
            </div>
          ) : displayedApplications.length === 0 ? (
            <div className="text-center py-16 bg-zinc-950 border border-zinc-900 rounded-xl">
              <Users className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">No candidates match current criteria</p>
              <p className="text-zinc-600 text-xs mt-1">Adjust search parameters or check alternative pipeline categories</p>
            </div>
          ) : viewMode === 'list' ? (
            /* ── VIEW MODE: STANDARD CONTAINER LIST ── */
            <div className="space-y-4">
              {displayedApplications.length > 0 && (
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <button onClick={toggleSelectAllVisible} className="text-zinc-500 hover:text-white transition-colors">
                      {selectedApplicationIds.length === displayedApplications.length ? (
                        <CheckSquare className="h-4 w-4 text-white" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <span>Showing {displayedApplications.length} of {totalApps} profiles filtered</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {displayedApplications.map((app: any) => {
                  const targetId = app.applicationId || app.id;
                  const isSelected = selectedApplicationIds.includes(targetId);
                  const profile = app.candidate || app.jobSeekerProfile || {};
                  return (
                    <div key={targetId}
                      onClick={() => router.push(`/dashboard/jobs/${params.id}/applicants/${targetId}`)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all group flex items-center gap-4 ${
                        isSelected ? 'bg-zinc-900/60 border-zinc-700' : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <div onClick={(e) => toggleSelectCandidate(targetId, e)} className="p-1 text-zinc-600 hover:text-white transition-colors">
                        {isSelected ? (
                          <div className="h-4 w-4 rounded bg-white flex items-center justify-center">
                            <Check className="h-3 w-3 text-black stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded border border-zinc-700 group-hover:border-zinc-500" />
                        )}
                      </div>

                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {profile.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-0.5">
                          <p className="font-semibold text-white text-sm">{profile.fullName}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[app.status] ?? ''}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-xs">{profile.email}</p>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        {app.resume?.atsScore != null && (
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-500 standard-case">ATS Score</p>
                            <p className={`text-sm font-bold ${app.resume.atsScore >= 70 ? 'text-emerald-400' : app.resume.atsScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {app.resume.atsScore}%
                            </p>
                          </div>
                        )}
                        <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ── VIEW MODE: COMPACT DRAG & DROP KANBAN GRID ── */
            <div className="flex gap-4 overflow-x-auto pb-4 select-none items-start custom-scrollbar">
              {STAGE_COLUMNS.map(col => {
                const columnCards = kanbanData[col.key] || [];
                return (
                  <div 
                    key={col.key}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, col.key)}
                    className="w-72 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col flex-shrink-0 max-h-[650px] transition-colors hover:border-zinc-800"
                  >
                    {/* Header */}
                    <div className="p-3.5 border-b border-zinc-900 bg-zinc-900/20 flex items-center justify-between rounded-t-xl">
                      <span className="font-semibold text-xs text-zinc-300">{col.label}</span>
                      <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-xs font-bold text-zinc-500">
                        {columnCards.length}
                      </span>
                    </div>

                    {/* Column Body List container */}
                    <div className="p-2 space-y-2 overflow-y-auto max-h-[550px] min-h-[150px] custom-scrollbar">
                      {columnCards.length === 0 ? (
                        <div className="py-8 text-center text-zinc-700 text-xs border border-dashed border-zinc-900/60 rounded-lg">
                          No candidates
                        </div>
                      ) : (
                        columnCards.map(card => {
                          const cardId = card.applicationId || card.id;
                          const profile = card.jobSeekerProfile || card.candidate || {};
                          return (
                            <div
                              key={cardId}
                              draggable
                              onDragStart={(e) => handleDragStart(e, cardId, col.key)}
                              onClick={() => router.push(`/dashboard/jobs/${params.id}/applicants/${cardId}`)}
                              className="p-3 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all cursor-grab active:cursor-grabbing space-y-2 group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold text-white text-xs truncate group-hover:text-indigo-400 transition-colors">
                                  {profile.fullName || 'Anonymous Profile'}
                                </p>
                                {card.resume?.atsScore != null && (
                                  <span className={`text-[10px] font-bold ${card.resume.atsScore >= 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                    {card.resume.atsScore}%
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-500 text-[11px] truncate">{profile.email}</p>
                              
                              {profile.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {profile.skills.slice(0, 2).map((sk: string, i: number) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-black border border-zinc-900 text-zinc-500 text-[9px] rounded">
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              )}
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
      )}

      {/* Mountable Overlays */}
      <JobPostingModal isOpen={editOpen} onClose={() => setEditOpen(false)} onSuccess={() => { initPageData(); setEditOpen(false); }} editJob={job} />
      <AIFilterModal isOpen={aiFilterOpen} onClose={() => setAiFilterOpen(false)} jobId={params.id as string} jobTitle={job.title} />
      <ScheduleInterviewsModal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} jobId={params.id as string} selectedApplicationIds={selectedApplicationIds} onSuccess={handleBulkSchedulingSuccess} />
    </div>
  );
}