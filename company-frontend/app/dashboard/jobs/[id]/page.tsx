'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Clock, DollarSign, Users, Calendar,
  Edit, Trash2, Building2, Target, ChevronRight,
  Sparkles, UserCheck, UserX, Eye, BarChart3,
  CheckSquare, Square, Check, Filter, X, MoveHorizontal
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
  const params = useParams();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'details' | 'applicants'>('details');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [aiFilterOpen, setAiFilterOpen] = useState(false);
  
  // Filter state
  const [minAtsScore, setMinAtsScore] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection & batch
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

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

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, appId: string, sourceStatus: string) => {
    e.dataTransfer.setData('applicationId', appId);
    e.dataTransfer.setData('sourceStatus', sourceStatus);
  };

  const handleDrop = async (e: React.DragEvent, destinationStatus: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('applicationId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    if (!appId || sourceStatus === destinationStatus) return;

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
      console.error('Failed to move card', err);
      fetchApplications();
    }
  };

  // Filter applicants
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
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
    </div>
  );
  if (!job) return null;

  const totalApps = applications.length;
  const kanbanData = getKanbanColumnsData();

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 py-6 bg-black min-h-screen text-zinc-300">
      
      {/* Back button */}
      <button onClick={() => router.push('/dashboard/jobs')}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Jobs
      </button>

      {/* Job header card */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              {job.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} /> {job.department}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[job.status] || STATUS_STYLES.active}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            <button onClick={() => setEditOpen(true)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors">
              <Edit size={16} />
            </button>
            <button onClick={handleDelete} disabled={isDeleting}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors disabled:opacity-50">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg"><Clock size={16} className="text-zinc-400" /></div>
            <div><p className="text-xs text-zinc-500">Job Type</p><p className="text-sm font-medium text-white">{job.jobType}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg"><MapPin size={16} className="text-zinc-400" /></div>
            <div><p className="text-xs text-zinc-500">Location</p><p className="text-sm font-medium text-white">{job.locationType}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg"><Users size={16} className="text-zinc-400" /></div>
            <div><p className="text-xs text-zinc-500">Openings</p><p className="text-sm font-medium text-white">{job.openings} open</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg"><BarChart3 size={16} className="text-zinc-400" /></div>
            <div><p className="text-xs text-zinc-500">Applicants</p><p className="text-sm font-medium text-white">{totalApps} total</p></div>
          </div>
        </div>
      </div>

      {/* Tabs with blinking alert on top of the layout option */}
      <div className="border-b border-zinc-800 flex justify-between items-center">
        <div className="flex gap-6">
          <button onClick={() => setActiveTab('details')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === 'details' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            Job Details
          </button>
          
          <button onClick={() => setActiveTab('applicants')}
            className={`pb-3 text-sm font-medium border-b-2 transition-all capitalize flex items-center gap-1.5 relative ${
              activeTab === 'applicants' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            <span>Applicants ({totalApps})</span>
            
            {/* High-fidelity glowing notification alert pill layer above the element */}
            {totalApps > 0 && (
              <span className="absolute -top-1.5 -right-3.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]"></span>
              </span>
            )}
          </button>
        </div>
        
        {activeTab === 'applicants' && (
          <div className="flex bg-zinc-800 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}>
              List
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}>
              Kanban
            </button>
          </div>
        )}
      </div>

      {/* Details Tab View */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          { (job.location || job.experienceRequired || job.salaryRange) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {job.location && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">City</p>
                  <p className="text-white">{job.location}</p>
                </div>
              )}
              {job.experienceRequired && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Experience</p>
                  <p className="text-white">{job.experienceRequired}</p>
                </div>
              )}
              {job.salaryRange && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Salary Range</p>
                  <p className="text-white">{job.salaryRange}</p>
                </div>
              )}
            </div>
          )}

          {job.requiredSkills?.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-zinc-400" />
                <h3 className="font-semibold text-white text-sm">Required Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="font-semibold text-white mb-4">Job Description</h3>
            <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }} />
          </div>
        </div>
      )}

      {/* Applicants Tab View */}
      {activeTab === 'applicants' && (
        <div className="space-y-5">
          
          {/* Stage filter pills */}
          <div className="flex flex-wrap gap-2">
            {['all','applied','screened','technical_round','hr_round','offer_sent','hired','rejected'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}>
                {s === 'all' ? 'All Stages' : s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Filter bar toggle & AI button */}
          <div className="flex justify-between items-center">
            <button onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors">
              <Filter size={14} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button onClick={() => setAiFilterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-xs font-medium text-white hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm">
              <Sparkles size={14} />
              AI Match
            </button>
          </div>

          {/* Advanced filters (collapsible) */}
          {showFilters && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Search by name, email or skill</label>
                <input type="text" placeholder="e.g., John, frontend, react..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-xs font-medium text-zinc-400">Minimum ATS Score</label>
                  <span className="text-xs font-bold text-indigo-400">{minAtsScore}%</span>
                </div>
                <input type="range" min="0" max="100" value={minAtsScore}
                  onChange={(e) => setMinAtsScore(Number(e.target.value))}
                  className="w-full accent-white bg-zinc-800 h-1.5 rounded-lg cursor-pointer" />
              </div>
            </div>
          )}

          {/* Batch actions bar (only when selected) */}
          {selectedApplicationIds.length > 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-3 flex items-center justify-between border border-zinc-700">
              <span className="text-sm text-white">{selectedApplicationIds.length} candidate(s) selected</span>
              <button onClick={() => setScheduleModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors">
                <Calendar size={14} />
                Schedule Batch Call
              </button>
            </div>
          )}

          {/* Loading / Empty states */}
          {appsLoading ? (
            <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" /></div>
          ) : displayedApplications.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900 rounded-xl border border-zinc-800">
              <Users size={40} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">No candidates match current criteria</p>
              <p className="text-zinc-600 text-xs mt-1">Adjust filters or search query</p>
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="space-y-3">
              {displayedApplications.length > 1 && (
                <div className="bg-zinc-900/50 rounded-lg px-4 py-2 flex justify-between items-center text-xs border border-zinc-800">
                  <button onClick={toggleSelectAllVisible} className="flex items-center gap-2 text-zinc-400 hover:text-white">
                    {selectedApplicationIds.length === displayedApplications.length ? (
                      <CheckSquare size={14} />
                    ) : (
                      <Square size={14} />
                    )}
                    {selectedApplicationIds.length === displayedApplications.length ? 'Deselect all' : 'Select all'}
                  </button>
                  <span className="text-zinc-500">{displayedApplications.length} of {totalApps} shown</span>
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
                      className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all group flex items-center gap-4 ${
                        isSelected ? 'border-zinc-600 bg-zinc-800/60' : 'border-zinc-800 hover:border-zinc-700'
                      }`}>
                      <div onClick={(e) => toggleSelectCandidate(targetId, e)} className="flex-shrink-0">
                        {isSelected ? (
                          <div className="w-4 h-4 rounded bg-white flex items-center justify-center">
                            <Check size={12} className="text-black" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded border border-zinc-600 group-hover:border-zinc-400" />
                        )}
                      </div>
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {profile.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-semibold text-white text-sm">{profile.fullName}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[app.status] || ''}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-xs truncate">{profile.email}</p>
                      </div>
                      {app.resume?.atsScore != null && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-[10px] text-zinc-500">ATS Score</p>
                          <p className={`text-sm font-bold ${
                            app.resume.atsScore >= 70 ? 'text-emerald-400' :
                            app.resume.atsScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                          }`}>{app.resume.atsScore}%</p>
                        </div>
                      )}
                      <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Kanban Board */
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
              {STAGE_COLUMNS.map(col => {
                const columnCards = kanbanData[col.key] || [];
                return (
                  <div key={col.key}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, col.key)}
                    className="w-80 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col flex-shrink-0 max-h-[70vh]">
                    <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center rounded-t-xl">
                      <span className="font-medium text-sm text-white">{col.label}</span>
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs font-bold text-zinc-400">{columnCards.length}</span>
                    </div>
                    <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[200px]">
                      {columnCards.length === 0 ? (
                        <div className="py-8 text-center text-zinc-600 text-xs border border-dashed border-zinc-800 rounded-lg">
                          Drop candidates here
                        </div>
                      ) : (
                        columnCards.map(card => {
                          const cardId = card.applicationId || card.id;
                          const profile = card.jobSeekerProfile || card.candidate || {};
                          return (
                            <div key={cardId}
                              draggable
                              onDragStart={(e) => handleDragStart(e, cardId, col.key)}
                              onClick={() => router.push(`/dashboard/jobs/${params.id}/applicants/${cardId}`)}
                              className="p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg cursor-grab active:cursor-grabbing transition-colors group">
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-medium text-white text-sm truncate">{profile.fullName || 'Anonymous'}</p>
                                {card.resume?.atsScore != null && (
                                  <span className={`text-[10px] font-bold ${
                                    card.resume.atsScore >= 70 ? 'text-emerald-400' :
                                    card.resume.atsScore >= 40 ? 'text-yellow-400' : 'text-red-400'
                                  }`}>{card.resume.atsScore}%</span>
                                )}
                              </div>
                              <p className="text-zinc-400 text-xs truncate mt-0.5">{profile.email}</p>
                              {profile.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {profile.skills.slice(0, 2).map((sk: string, i: number) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-black border border-zinc-700 text-zinc-400 text-[9px] rounded">
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

      {/* Modals Container */}
      <JobPostingModal isOpen={editOpen} onClose={() => setEditOpen(false)} onSuccess={() => { initPageData(); setEditOpen(false); }} editJob={job} />
      <AIFilterModal isOpen={aiFilterOpen} onClose={() => setAiFilterOpen(false)} jobId={params.id as string} jobTitle={job.title} />
      <ScheduleInterviewsModal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} jobId={params.id as string} selectedApplicationIds={selectedApplicationIds} onSuccess={handleBulkSchedulingSuccess} />
    </div>
  );
}