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
  reviewed:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  shortlisted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  interview:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  offer:       'bg-orange-500/10 text-orange-400 border-orange-500/20',
  hired:       'bg-green-500/10 text-green-400 border-green-500/20',
  rejected:    'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function JobDetailsPage() {
  const params  = useParams();
  const router  = useRouter();

  const [job,           setJob]           = useState<any>(null);
  const [applications,  setApplications]  = useState<any[]>([]);
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [activeTab,     setActiveTab]     = useState<'details' | 'applicants'>('details');
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

  useEffect(() => { if (params.id) fetchJob(); }, [params.id]);
  useEffect(() => {
    if (activeTab === 'applicants' && params.id) fetchApplications();
  }, [activeTab, statusFilter, params.id]);
  
  const fetchJob = async () => {
    try {
      setIsLoading(true);
      const r = await api.get(`/company/jobs/${params.id}`);
      setJob(r.data.job);
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
      setSelectedApplicationIds([]); // Reset select queue on filter change
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

  // Process pipeline matching layers on the client side
  const displayedApplications = applications.filter((app: any) => {
    const matchesAts = (app.resume?.atsScore ?? 0) >= minAtsScore;
    const matchesSearch = !searchQuery ? true : (
      app.candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate?.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchesAts && matchesSearch;
  });

  const toggleSelectCandidate = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details navigation route on card container
    setSelectedApplicationIds(prev => 
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const toggleSelectAllVisible = () => {
    if (selectedApplicationIds.length === displayedApplications.length) {
      setSelectedApplicationIds([]);
    } else {
      setSelectedApplicationIds(displayedApplications.map((app: any) => app.applicationId));
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

      {/* Tabs */}
      <div className="border-b border-zinc-900 flex gap-6">
        {(['details', 'applicants'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            {tab === 'applicants' ? `Applicants (${totalApps})` : 'Job Details'}
          </button>
        ))}
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
              {['all','applied','reviewed','shortlisted','interview','offer','hired','rejected'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    statusFilter === s ? 'bg-white text-black font-semibold' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-900'
                  }`}>
                  {s === 'all' ? 'All Stages' : s}
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

          {/* Batch Selector Master Utility Bar Header Component */}
          {displayedApplications.length > 0 && (
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-zinc-400">
                <button 
                  onClick={toggleSelectAllVisible}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  {selectedApplicationIds.length === displayedApplications.length ? (
                    <CheckSquare className="h-4 w-4 text-white" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <span>
                  Showing {displayedApplications.length} of {totalApps} profiles filtered 
                  {selectedApplicationIds.length > 0 && ` (${selectedApplicationIds.length} checked)`}
                </span>
              </div>
              {selectedApplicationIds.length > 0 && (
                <button 
                  onClick={() => setSelectedApplicationIds([])}
                  className="text-zinc-500 hover:text-red-400 text-[11px] transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          )}

          {/* List Content Area */}
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
          ) : (
            <div className="space-y-2">
              {displayedApplications.map((app: any) => {
                const isSelected = selectedApplicationIds.includes(app.applicationId);
                return (
                  <div key={app.applicationId}
                    onClick={() => router.push(`/dashboard/jobs/${params.id}/applicants/${app.applicationId}`)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all group flex items-center gap-4 ${
                      isSelected 
                        ? 'bg-zinc-900/60 border-zinc-700' 
                        : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    {/* Multi-Selection Checkbox Area Column */}
                    <div 
                      onClick={(e) => toggleSelectCandidate(app.applicationId, e)}
                      className="p-1 text-zinc-600 hover:text-white transition-colors"
                    >
                      {isSelected ? (
                        <div className="h-4 w-4 rounded bg-white flex items-center justify-center">
                          <Check className="h-3 w-3 text-black stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded border border-zinc-700 group-hover:border-zinc-500" />
                      )}
                    </div>

                    {/* Candidate Initials Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {app.candidate.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>

                    {/* Candidate Context Info Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-0.5">
                        <p className="font-semibold text-white text-sm">{app.candidate.fullName}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[app.status] ?? ''}`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-xs">{app.candidate.email}
                        {app.candidate.location && <span className="ml-2">· {app.candidate.location}</span>}
                      </p>
                      {app.candidate.skills?.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {app.candidate.skills.slice(0, 5).map((sk: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-zinc-900 text-zinc-400 text-[10px] rounded border border-zinc-800/40">{sk}</span>
                          ))}
                          {app.candidate.skills.length > 5 && (
                            <span className="px-2 py-0.5 bg-zinc-900 text-zinc-500 text-[10px] rounded">+{app.candidate.skills.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ATS Score evaluation analytics metrics framework */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {app.resume?.atsScore != null && (
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">ATS Score</p>
                          <p className={`text-sm font-bold ${app.resume.atsScore >= 70 ? 'text-emerald-400' : app.resume.atsScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {app.resume.atsScore}%
                          </p>
                        </div>
                      )}
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Applied On</p>
                        <p className="text-zinc-400 text-xs mt-0.5">{new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mounting Overlay Modal Elements */}
      <JobPostingModal 
        isOpen={editOpen} 
        onClose={() => setEditOpen(false)} 
        onSuccess={() => { fetchJob(); setEditOpen(false); }} 
        editJob={job} 
      />
      
      <AIFilterModal 
        isOpen={aiFilterOpen} 
        onClose={() => setAiFilterOpen(false)} 
        jobId={params.id as string} 
        jobTitle={job.title} 
      />

      <ScheduleInterviewsModal 
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        jobId={params.id as string}
        selectedApplicationIds={selectedApplicationIds}
        onSuccess={handleBulkSchedulingSuccess}
      />
    </div>
  );
}