'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, Play, User, AlertCircle, Check, X,
  ChevronDown, ChevronRight, Star, Edit3, Filter, Search,
  Briefcase, SlidersHorizontal, Users, CheckSquare, Trash2, FolderPlus
} from 'lucide-react';
import api from '@/app/lib/axios';
import FeedbackModal from '@/app/components/FeedbackModal';
import AddToTalentPoolModal from '@/app/components/AddToTalentPoolModal'; // NEW

interface FeedbackRecord {
  id: string;
  technicalRating: number;
  communicationRating: number;
  problemSolvingRating: number;
  verdict: 'shortlist' | 'reject' | 'on_hold' | 'next_round';
  notes: string | null;
}

interface RescheduleRequest {
  id: string;
  proposedTime: string;
  candidateNote: string | null;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

interface InterviewRecord {
  id: string;
  livekitRoomName: string;
  scheduledTime: string;
  durationMinutes: number;
  format: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'reschedule_requested' | 'confirmed';
  rescheduleRequests: RescheduleRequest[];
  feedbacks?: FeedbackRecord[];
  application: {
    id: string;
    isStarred: boolean;
    priority: number | null;
    jobSeekerProfileId: string; // Ensure we map the target foreign key directly
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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-950/40 text-blue-400 border-blue-900' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-950/40 text-emerald-400 border-emerald-900' },
  reschedule_requested: { label: 'Reschedule Req.', color: 'bg-amber-950/50 text-amber-400 border-amber-800' },
  in_progress: { label: 'In Progress', color: 'bg-purple-950/40 text-purple-400 border-purple-900 animate-pulse' },
  completed: { label: 'Completed', color: 'bg-zinc-900 text-zinc-500 border-zinc-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-950/40 text-red-400 border-red-900' }
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'P1', color: 'bg-red-950/40 text-red-400 border-red-900' },
  2: { label: 'P2', color: 'bg-amber-950/40 text-amber-400 border-amber-900' },
  3: { label: 'P3', color: 'bg-blue-950/40 text-blue-400 border-blue-900' }
};

const STATUS_OPTIONS = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];

export default function CompanyInterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [feedbackStatus, setFeedbackStatus] = useState<'all' | 'has' | 'none'>('all');
  const [priorityFilter, setPriorityFilter] = useState<number | 'all'>('all');
  const [starredOnly, setStarredOnly] = useState(false);

  // Group collapse state
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // Modal states
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // NEW: Talent Pool Modal Local States
  const [poolModalOpen, setPoolModalOpen] = useState(false);
  const [targetPoolProfile, setTargetPoolProfile] = useState<{ id: string; name: string } | null>(null);

  const fetchInterviews = async () => {
    try {
      const response = await api.get('/company/interviews/list');
      if (response.data.success) {
        setInterviews(response.data.interviews);
        const jobTitles = new Set(response.data.interviews.map((i: InterviewRecord) => i.application.jobPosting.title));
        setExpandedJobs(new Set(jobTitles as Set<string>));
      }
    } catch (err) {
      console.error("Failed fetching interviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleRescheduleAction = async (interviewId: string, action: 'approve' | 'decline', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setProcessingId(interviewId);
      const response = await api.post(`/company/interviews/${interviewId}/respond-reschedule`, { action });
      if (response.data.success) await fetchInterviews();
    } catch (err) {
      console.error(`Reschedule ${action} failed:`, err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusUpdate = async (interviewId: string, targetStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setProcessingId(interviewId);
      setActiveDropdownId(null);
      await api.post(`/company/interviews/${interviewId}/update-status`, { status: targetStatus });
      await fetchInterviews();
    } catch (err) {
      console.error("Failed updating status:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStar = async (applicationId: string, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post('/company/selection/bulk/star', {
        applicationIds: [applicationId],
        starred: !currentStarred
      });
      await fetchInterviews();
    } catch (error) {
      console.error('Toggle star error:', error);
    }
  };

  const openFeedbackModal = (interviewId: string, feedback: FeedbackRecord | null, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInterviewId(interviewId);
    setSelectedFeedback(feedback);
    setIsModalOpen(true);
  };

  // NEW: Trigger handling mapping variables securely to the modal layout
  const openTalentPoolModal = (seekerId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetPoolProfile({ id: seekerId, name });
    setPoolModalOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedJobTitle('all');
    setDateRange({ start: '', end: '' });
    setFeedbackStatus('all');
    setPriorityFilter('all');
    setStarredOnly(false);
  };

  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      const candidate = interview.application.jobSeekerProfile;
      const job = interview.application.jobPosting;
      const matchesSearch = searchQuery === '' ||
        candidate.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interview.id.includes(searchQuery);
      
      const matchesJob = selectedJobTitle === 'all' || job.title === selectedJobTitle;
      
      const matchesDateRange = (() => {
        if (!dateRange.start && !dateRange.end) return true;
        const interviewDate = new Date(interview.scheduledTime);
        if (dateRange.start && interviewDate < new Date(dateRange.start)) return false;
        if (dateRange.end && interviewDate > new Date(dateRange.end)) return false;
        return true;
      })();
      
      const hasFeedback = !!(interview.feedbacks && interview.feedbacks.length > 0);
      const matchesFeedback = 
        feedbackStatus === 'all' ||
        (feedbackStatus === 'has' && hasFeedback) ||
        (feedbackStatus === 'none' && !hasFeedback);
      
      const matchesPriority = priorityFilter === 'all' || interview.application.priority === priorityFilter;
      const matchesStarred = !starredOnly || interview.application.isStarred;
      
      return matchesSearch && matchesJob && matchesDateRange && matchesFeedback && matchesPriority && matchesStarred;
    });
  }, [interviews, searchQuery, selectedJobTitle, dateRange, feedbackStatus, priorityFilter, starredOnly]);

  const groupedInterviews = useMemo(() => {
    const groups: Record<string, InterviewRecord[]> = {};
    filteredInterviews.forEach(interview => {
      const title = interview.application.jobPosting.title;
      if (!groups[title]) groups[title] = [];
      groups[title].push(interview);
    });
    return groups;
  }, [filteredInterviews]);

  const uniqueJobTitles = useMemo(() => {
    return Array.from(new Set(interviews.map(i => i.application.jobPosting.title)));
  }, [interviews]);

  const toggleJobExpand = (jobTitle: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobTitle)) newSet.delete(jobTitle);
      else newSet.add(jobTitle);
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <p className="text-xs text-zinc-500 animate-pulse font-mono">Loading active interview pipelines...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 bg-black min-h-screen text-zinc-300 font-mono">
      {/* Header */}
      <div className="mb-6 border-b border-zinc-900 pb-5">
        <h1 className="text-lg font-semibold tracking-tight text-white uppercase">Live Interview Pipeline</h1>
        <p className="text-xs text-zinc-500 mt-1">Manage scheduled candidate tokens and host WebRTC rooms seamlessly.</p>
      </div>

      {/* Filters Section */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-900 p-4 mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-600" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Advanced Controls</span>
          </div>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors uppercase font-bold"
          >
            <Trash2 size={12} />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
            <input
              type="text"
              placeholder="Candidate vector token, email, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-900 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          {/* Job Title Filter */}
          <div className="relative flex items-center">
            <select
              value={selectedJobTitle}
              onChange={(e) => setSelectedJobTitle(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-black border border-zinc-900 rounded-lg text-xs text-zinc-400 appearance-none outline-none cursor-pointer focus:border-zinc-700"
            >
              <option value="all">ALL JOB TARGETS</option>
              {uniqueJobTitles.map(title => (
                <option key={title} value={title}>{title.toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-2 py-1 bg-black border border-zinc-900 rounded-lg text-xs text-zinc-400 outline-none focus:border-zinc-700 uppercase"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-2 py-1 bg-black border border-zinc-900 rounded-lg text-xs text-zinc-400 outline-none focus:border-zinc-700 uppercase"
            />
          </div>

          {/* Status + Priority + Starred Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center">
              <select
                value={feedbackStatus}
                onChange={(e) => setFeedbackStatus(e.target.value as any)}
                className="w-full pl-2 pr-6 py-2 bg-black border border-zinc-900 rounded-lg text-xs text-zinc-400 appearance-none outline-none cursor-pointer focus:border-zinc-700"
              >
                <option value="all">ALL LEDGERS</option>
                <option value="has">HAS FEEDBACK</option>
                <option value="none">NO FEEDBACK</option>
              </select>
              <ChevronDown className="absolute right-2 w-3 h-3 text-zinc-600 pointer-events-none" />
            </div>

            <div className="relative flex-1 flex items-center">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full pl-2 pr-6 py-2 bg-black border border-zinc-900 rounded-lg text-xs text-zinc-400 appearance-none outline-none cursor-pointer focus:border-zinc-700"
              >
                <option value="all">PRIORITY</option>
                <option value="1">P1 MATRIX</option>
                <option value="2">P2 MATRIX</option>
                <option value="3">P3 MATRIX</option>
              </select>
              <ChevronDown className="absolute right-2 w-3 h-3 text-zinc-600 pointer-events-none" />
            </div>

            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold uppercase flex items-center gap-1.5 transition-colors ${
                starredOnly
                  ? 'bg-amber-950/20 border-amber-900 text-amber-400'
                  : 'bg-black border-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Star size={13} className={starredOnly ? 'fill-amber-400 text-amber-400' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Interviews */}
      {Object.keys(groupedInterviews).length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-900 bg-zinc-950 rounded-xl text-xs text-zinc-500">
          No pipeline records matched current filter arrays.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedInterviews).map(([jobTitle, jobInterviews]) => {
            const isExpanded = expandedJobs.has(jobTitle);
            const hasPendingReschedule = jobInterviews.some(i => i.status === 'reschedule_requested');
            const pendingFeedbacks = jobInterviews.filter(i => !i.feedbacks?.length).length;

            return (
              <div key={jobTitle} className="bg-zinc-950 rounded-xl border border-zinc-900 overflow-hidden">
                {/* Job Group Header */}
                <button
                  onClick={() => toggleJobExpand(jobTitle)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-950 hover:bg-zinc-900/40 transition-colors text-left border-b border-zinc-900/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <Briefcase size={14} className="text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wide">{jobTitle}</h3>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {jobInterviews.length} Tracked Tokens
                        </span>
                        {pendingFeedbacks > 0 && (
                          <span className="text-amber-500 flex items-center gap-1 font-bold">
                            • {pendingFeedbacks} PENDING EVALS
                          </span>
                        )}
                        {hasPendingReschedule && (
                          <span className="text-amber-400 flex items-center gap-1 font-bold animate-pulse">
                            • RESCHEDULE REQ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-zinc-600">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>

                {/* Interview Cards */}
                {isExpanded && (
                  <div className="p-4 space-y-4 bg-zinc-950/30 pl-3 border-l border-zinc-900">
                    {jobInterviews.map((interview) => {
                      const hasFeedback = interview.feedbacks && interview.feedbacks.length > 0;
                      const existingFeedback = hasFeedback ? interview.feedbacks![0] : null;
                      const pendingReschedule = interview.status === 'reschedule_requested'
                        ? interview.rescheduleRequests?.find(r => r.status === 'pending')
                        : null;
                      const statusConfig = STATUS_CONFIG[interview.status] || STATUS_CONFIG.scheduled;
                      const priorityConfig = interview.application.priority ? PRIORITY_CONFIG[interview.application.priority] : null;
                      const candidateProfile = interview.application.jobSeekerProfile || {};

                      return (
                        <div
                          key={interview.id}
                          onClick={() => router.push(`/dashboard/applications/${interview.application.id}`)}
                          className={`border transition-all duration-200 p-5 rounded-xl flex flex-col space-y-4 cursor-pointer hover:border-zinc-700 hover:shadow-lg ${
                            hasFeedback ? 'border-zinc-900/60 bg-zinc-950/40' : 'border-zinc-900 bg-zinc-950'
                          }`}
                        >
                          {/* Top row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                onClick={(e) => handleToggleStar(interview.application.id, interview.application.isStarred, e)}
                                className="flex-shrink-0 text-zinc-600 hover:text-amber-400 transition-colors"
                              >
                                <Star size={14} className={interview.application.isStarred ? 'fill-amber-400 text-amber-400' : ''} />
                              </button>
                              <div className="flex items-center gap-2">
                                {candidateProfile.profilePhotoUrl ? (
                                  <img
                                    src={candidateProfile.profilePhotoUrl}
                                    alt=""
                                    className="w-6 h-6 rounded-full border border-zinc-800 object-cover"
                                  />
                                ) : (
                                  <User size={12} className="text-zinc-600" />
                                )}
                                <div className="text-xs flex flex-wrap items-center gap-x-2">
                                  <span className="font-semibold text-zinc-200 uppercase">{candidateProfile.fullName}</span>
                                  <span className="text-zinc-600 font-normal text-[11px] font-mono hidden md:inline">// {candidateProfile.email}</span>
                                  
                                  {/* NEW: Direct Link to Pool Modal */}
                                  <button
                                    onClick={(e) => openTalentPoolModal(interview.application.jobSeekerProfileId || candidateProfile.id, candidateProfile.fullName, e)}
                                    className="p-1 text-zinc-500 hover:text-blue-400 rounded hover:bg-zinc-900/60 transition-colors ml-1"
                                    title="Add to Talent Pool"
                                  >
                                    <FolderPlus size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              {priorityConfig && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${priorityConfig.color}`}>
                                  {priorityConfig.label}
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>

                          {/* Details Row */}
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-zinc-600" />
                              <span>{new Date(interview.scheduledTime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-zinc-600" />
                              <span>{new Date(interview.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-zinc-600" />
                              <span>{interview.durationMinutes} MIN BLOCK</span>
                            </div>
                            <span className="text-[10px] text-zinc-600 border border-zinc-900 px-1.5 py-0.5 rounded uppercase bg-black">{interview.format}</span>
                          </div>

                          {/* Reschedule alert banner */}
                          {pendingReschedule && (
                            <div className="p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-500">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={14} className="shrink-0" />
                                  <span className="font-bold uppercase tracking-wider text-amber-400 text-[10px]">Candidate Reschedule Petitioned:</span>
                                </div>
                                <p className="text-[11px]">Proposed Window: <span className="text-zinc-300 font-bold">{new Date(pendingReschedule.proposedTime).toLocaleString()}</span></p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={(e) => handleRescheduleAction(interview.id, 'decline', e)}
                                  disabled={processingId !== null}
                                  className="p-1.5 border border-zinc-800 hover:border-red-900 bg-zinc-900 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                                >
                                  <X size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleRescheduleAction(interview.id, 'approve', e)}
                                  disabled={processingId !== null}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                                >
                                  <Check size={13} className="stroke-[3]" />
                                  Accept Window
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Feedback evaluation ledger */}
                          {existingFeedback && (
                            <div className="p-3 bg-zinc-900/30 border border-zinc-900/80 rounded-lg text-[11px] text-zinc-400 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900/60 pb-1.5">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Logged Ledger Score Summary:</span>
                                <span className="text-white uppercase px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-bold text-[9px]">
                                  Verdict // {existingFeedback.verdict.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex gap-4 flex-wrap text-zinc-500">
                                <div>TECH: <span className="text-zinc-300 font-bold">{existingFeedback.technicalRating}/5</span></div>
                                <div>COMM: <span className="text-zinc-300 font-bold">{existingFeedback.communicationRating}/5</span></div>
                                <div>LOGIC: <span className="text-zinc-300 font-bold">{existingFeedback.problemSolvingRating}/5</span></div>
                              </div>
                              {existingFeedback.notes && (
                                <p className="italic text-zinc-500 line-clamp-2">Observations: "{existingFeedback.notes}"</p>
                              )}
                            </div>
                          )}

                          {/* Lower Action bar */}
                          <div className="border-t border-zinc-900/60 pt-3 flex flex-wrap items-center justify-between gap-3">
                            {/* Override Dropdown Engine */}
                            <div className="relative font-mono" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(activeDropdownId === interview.id ? null : interview.id);
                                }}
                                disabled={processingId === interview.id}
                                className={`px-3 py-1.5 border rounded-lg text-[11px] uppercase font-semibold flex items-center gap-2 transition-all min-w-[140px] justify-between ${statusConfig.color}`}
                              >
                                <span>{statusConfig.label}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdownId === interview.id ? 'rotate-180' : ''}`} />
                              </button>

                              {activeDropdownId === interview.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); }} />
                                  <div className="absolute left-0 bottom-full mb-1 z-20 w-44 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-1 space-y-0.5">
                                    <div className="text-[9px] text-zinc-600 px-2 py-1 uppercase tracking-wider font-bold">Override Stage</div>
                                    {STATUS_OPTIONS.map((opt) => (
                                      <button
                                        key={opt}
                                        onClick={(e) => handleStatusUpdate(interview.id, opt, e)}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] uppercase font-mono transition-colors block ${
                                          interview.status === opt
                                            ? 'bg-zinc-900 text-white font-bold'
                                            : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                                        }`}
                                      >
                                        {opt.replace('_', ' ')}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => openFeedbackModal(interview.id, existingFeedback, e)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border ${
                                  hasFeedback
                                    ? 'bg-amber-950/20 border-amber-900/60 text-amber-400 hover:bg-amber-950/40 hover:text-amber-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                                }`}
                              >
                                {hasFeedback ? <Edit3 size={13} /> : <CheckSquare size={13} />}
                                {hasFeedback ? 'Update Feedback' : 'Log Feedback'}
                              </button>

                              <a
                                href={`/meet/${interview.id}?role=company`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                                  hasFeedback
                                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                    : 'bg-white text-black hover:bg-zinc-200'
                                }`}
                              >
                                <Play size={13} className={hasFeedback ? 'fill-zinc-500' : 'fill-black'} />
                                Launch Room
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      {selectedInterviewId && (
        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedInterviewId(null); setSelectedFeedback(null); }}
          interviewId={selectedInterviewId}
          existingFeedback={selectedFeedback}
          onSuccess={fetchInterviews}
        />
      )}

      {/* NEW: Talent Pool Sync Management Modal Insertion */}
      {poolModalOpen && targetPoolProfile && (
        <AddToTalentPoolModal
          open={poolModalOpen}
          onClose={() => { setPoolModalOpen(false); setTargetPoolProfile(null); }}
          jobSeekerProfileId={targetPoolProfile.id}
          candidateName={targetPoolProfile.name}
        />
      )}
    </div>
  );
}