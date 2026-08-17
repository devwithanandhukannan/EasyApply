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
import { useAuth } from '@/app/contexts/AuthContext';

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
  scheduled: { label: 'Scheduled', color: 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20' },
  confirmed: { label: 'Confirmed', color: 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border-[#34c759]/20' },
  reschedule_requested: { label: 'Reschedule Req.', color: 'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20' },
  in_progress: { label: 'In Progress', color: 'bg-[#af52de]/10 text-[#af52de] border-[#af52de]/20 animate-pulse' },
  completed: { label: 'Completed', color: 'bg-[#8e8e93]/10 text-[#6e6e73] dark:text-[#aeaeb2] border-[#8e8e93]/20' },
  cancelled: { label: 'Cancelled', color: 'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20' }
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'P1', color: 'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20' },
  2: { label: 'P2', color: 'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20' },
  3: { label: 'P3', color: 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20' }
};

const STATUS_OPTIONS = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];

import LockedFeaturePaywall from '@/app/components/LockedFeaturePaywall';

export default function CompanyInterviewsPage() {
  const { isAdmin, isHR, isViewer, hasFeature } = useAuth();
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const hasAccess = hasFeature('interviewScheduling');

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

  if (!hasAccess) {
    return (
      <LockedFeaturePaywall
        featureKey="interviewScheduling"
        featureTitle="Live Technical Interviews & Video Scheduling"
        featureDescription="Conduct live multi-language video interviews with built-in code editors, real-time rubric scorecards, and scheduling workflows."
      />
    );
  }
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
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-xs text-[#86868b] animate-pulse">Loading active interview pipelines...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1d1d1f] dark:text-[#f5f5f7]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Live Interview Pipeline</h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-0.5">Manage scheduled candidate tokens and host WebRTC rooms seamlessly.</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[#0071e3]" />
            <span className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Pipeline Filters</span>
          </div>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-[#86868b] hover:text-[#0071e3] transition-colors font-semibold cursor-pointer"
          >
            <Trash2 size={13} />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" size={14} />
            <input
              type="text"
              placeholder="Search candidate name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition-all font-medium"
            />
          </div>

          {/* Job Title Filter */}
          <div className="relative flex items-center">
            <select
              value={selectedJobTitle}
              onChange={(e) => setSelectedJobTitle(e.target.value)}
              className="w-full pl-3.5 pr-8 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] appearance-none outline-none cursor-pointer focus:border-[#0071e3] font-medium"
            >
              <option value="all">All Job Targets</option>
              {uniqueJobTitles.map(title => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 w-3.5 h-3.5 text-[#86868b] pointer-events-none" />
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] outline-none focus:border-[#0071e3] font-medium"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] outline-none focus:border-[#0071e3] font-medium"
            />
          </div>

          {/* Status + Priority + Starred Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1 flex items-center">
              <select
                value={feedbackStatus}
                onChange={(e) => setFeedbackStatus(e.target.value as any)}
                className="w-full pl-3 pr-6 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] appearance-none outline-none cursor-pointer focus:border-[#0071e3] font-medium"
              >
                <option value="all">All Feedback</option>
                <option value="has">Has Feedback</option>
                <option value="none">No Feedback</option>
              </select>
              <ChevronDown className="absolute right-2 w-3 h-3 text-[#86868b] pointer-events-none" />
            </div>

            <div className="relative flex-1 flex items-center">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full pl-3 pr-6 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] appearance-none outline-none cursor-pointer focus:border-[#0071e3] font-medium"
              >
                <option value="all">Priority</option>
                <option value="1">P1 High</option>
                <option value="2">P2 Medium</option>
                <option value="3">P3 Normal</option>
              </select>
              <ChevronDown className="absolute right-2 w-3 h-3 text-[#86868b] pointer-events-none" />
            </div>

            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                starredOnly
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] border-black/[0.06] dark:border-white/[0.08] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Star size={14} className={starredOnly ? 'fill-amber-400 text-amber-400' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Interviews */}
      {Object.keys(groupedInterviews).length === 0 ? (
        <div className="text-center py-16 border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] rounded-3xl text-xs text-[#86868b] shadow-sm">
          No pipeline records matched current filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedInterviews).map(([jobTitle, jobInterviews]) => {
            const isExpanded = expandedJobs.has(jobTitle);
            const hasPendingReschedule = jobInterviews.some(i => i.status === 'reschedule_requested');
            const pendingFeedbacks = jobInterviews.filter(i => !i.feedbacks?.length).length;

            return (
              <div key={jobTitle} className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                {/* Job Group Header */}
                <button
                  onClick={() => toggleJobExpand(jobTitle)}
                  className="w-full flex items-center justify-between p-5 hover:bg-[#f2f2f7]/50 dark:hover:bg-[#2c2c2e]/50 transition-colors text-left border-b border-black/[0.04] dark:border-white/[0.06] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl">
                      <Briefcase size={16} className="text-[#0071e3]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">{jobTitle}</h3>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[#86868b]">
                        <span className="flex items-center gap-1 font-medium">
                          <Users size={13} /> {jobInterviews.length} Candidate{jobInterviews.length === 1 ? '' : 's'}
                        </span>
                        {pendingFeedbacks > 0 && (
                          <span className="text-amber-500 font-bold flex items-center gap-1">
                            • {pendingFeedbacks} Pending Feedback
                          </span>
                        )}
                        {hasPendingReschedule && (
                          <span className="text-amber-500 font-bold flex items-center gap-1 animate-pulse">
                            • Reschedule Requested
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-[#86868b]">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {/* Interview Cards */}
                {isExpanded && (
                  <div className="p-5 space-y-3.5 bg-[#f2f2f7]/30 dark:bg-[#2c2c2e]/20">
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
                          className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all p-5 rounded-2xl flex flex-col space-y-4 cursor-pointer shadow-sm hover:shadow-md"
                        >
                          {/* Top row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              {(isAdmin || isHR) && (
                                <button
                                  onClick={(e) => handleToggleStar(interview.application.id, interview.application.isStarred, e)}
                                  className="flex-shrink-0 text-[#86868b] hover:text-amber-500 transition-colors"
                                >
                                  <Star size={15} className={interview.application.isStarred ? 'fill-amber-400 text-amber-400' : ''} />
                                </button>
                              )}
                              <div className="flex items-center gap-3">
                                {candidateProfile.profilePhotoUrl ? (
                                  <img
                                    src={candidateProfile.profilePhotoUrl}
                                    alt=""
                                    className="w-8 h-8 rounded-full border border-black/[0.08] dark:border-white/[0.1] object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center font-bold text-xs text-[#0071e3]">
                                    {candidateProfile.fullName?.charAt(0) || 'U'}
                                  </div>
                                )}
                                <div className="text-xs flex flex-wrap items-center gap-x-2">
                                  <span className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">{candidateProfile.fullName}</span>
                                  <span className="text-[#86868b] font-normal text-xs hidden md:inline">({candidateProfile.email})</span>
                                  
                                  {/* Direct Link to Pool Modal */}
                                  {(isAdmin || isHR) && (
                                    <button
                                      onClick={(e) => openTalentPoolModal(interview.application.jobSeekerProfileId || candidateProfile.id, candidateProfile.fullName, e)}
                                      className="p-1 text-[#86868b] hover:text-[#0071e3] rounded-lg hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors ml-1"
                                      title="Add to Talent Pool"
                                    >
                                      <FolderPlus size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              {priorityConfig && (
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${priorityConfig.color}`}>
                                  {priorityConfig.label}
                                </span>
                              )}
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>

                          {/* Details Row */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-[#86868b]">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-[#0071e3]" />
                              <span>{new Date(interview.scheduledTime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-[#0071e3]" />
                              <span>{new Date(interview.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-[#0071e3]" />
                              <span>{interview.durationMinutes} Min Duration</span>
                            </div>
                            <span className="text-[10px] text-[#6e6e73] dark:text-[#aeaeb2] border border-black/[0.06] dark:border-white/[0.08] px-2 py-0.5 rounded-full uppercase bg-[#f2f2f7] dark:bg-[#2c2c2e] font-semibold">{interview.format}</span>
                          </div>

                          {/* Reschedule alert banner */}
                          {pendingReschedule && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-400">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={15} className="shrink-0 text-amber-500" />
                                  <span className="font-bold uppercase tracking-wider text-[11px]">Candidate Reschedule Requested:</span>
                                </div>
                                <p className="text-xs">Proposed Window: <span className="font-bold">{new Date(pendingReschedule.proposedTime).toLocaleString()}</span></p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {(isAdmin || isHR) ? (
                                  <>
                                    <button
                                      onClick={(e) => handleRescheduleAction(interview.id, 'decline', e)}
                                      disabled={processingId !== null}
                                      className="p-2 border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1c1c1e] text-[#ff3b30] rounded-xl hover:bg-red-500/10 transition-all cursor-pointer"
                                    >
                                      <X size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => handleRescheduleAction(interview.id, 'approve', e)}
                                      disabled={processingId !== null}
                                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                                    >
                                      <Check size={14} className="stroke-[3]" />
                                      Accept Window
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-[#86868b] font-semibold">Contact HR/Admin</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Feedback evaluation ledger */}
                          {existingFeedback && (
                            <div className="p-4 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl text-xs text-[#6e6e73] dark:text-[#aeaeb2] space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] dark:border-white/[0.06] pb-2">
                                <span className="text-xs text-[#86868b] font-semibold uppercase tracking-wider">Evaluation Score Summary:</span>
                                <span className="text-[#0071e3] uppercase px-2.5 py-0.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-full font-bold text-[10px]">
                                  Verdict: {existingFeedback.verdict.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex gap-4 flex-wrap text-xs font-medium">
                                <div>Technical: <span className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold">{existingFeedback.technicalRating}/5</span></div>
                                <div>Communication: <span className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold">{existingFeedback.communicationRating}/5</span></div>
                                <div>Problem Solving: <span className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold">{existingFeedback.problemSolvingRating}/5</span></div>
                              </div>
                              {existingFeedback.notes && (
                                <p className="italic text-[#86868b] line-clamp-2 mt-1">"{existingFeedback.notes}"</p>
                              )}
                            </div>
                          )}

                          {/* Lower Action bar */}
                          <div className="border-t border-black/[0.04] dark:border-white/[0.06] pt-3.5 flex flex-wrap items-center justify-between gap-3">
                            {/* Override Dropdown Engine or Static Badge */}
                            {(isAdmin || isHR) ? (
                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownId(activeDropdownId === interview.id ? null : interview.id);
                                  }}
                                  disabled={processingId === interview.id}
                                  className={`px-3.5 py-2 border rounded-xl text-xs uppercase font-bold flex items-center gap-2 transition-all min-w-[150px] justify-between cursor-pointer ${statusConfig.color}`}
                                >
                                  <span>{statusConfig.label}</span>
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdownId === interview.id ? 'rotate-180' : ''}`} />
                                </button>

                                {activeDropdownId === interview.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); }} />
                                    <div className="absolute left-0 bottom-full mb-1.5 z-20 w-48 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl p-1.5 space-y-0.5">
                                      <div className="text-[10px] text-[#86868b] px-2.5 py-1 uppercase tracking-wider font-bold">Update Status</div>
                                      {STATUS_OPTIONS.map((opt) => (
                                        <button
                                          key={opt}
                                          onClick={(e) => handleStatusUpdate(interview.id, opt, e)}
                                          className={`w-full text-left px-3 py-2 rounded-xl text-xs uppercase font-medium transition-colors block cursor-pointer ${
                                            interview.status === opt
                                              ? 'bg-[#0071e3] text-white font-bold'
                                              : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e]'
                                          }`}
                                        >
                                          {opt.replace('_', ' ')}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className={`px-3.5 py-1.5 border rounded-xl text-xs uppercase font-bold select-none ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            )}

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {!isViewer && (
                                <button
                                  onClick={(e) => openFeedbackModal(interview.id, existingFeedback, e)}
                                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 border cursor-pointer ${
                                    hasFeedback
                                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                      : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c]'
                                  }`}
                                >
                                  {hasFeedback ? <Edit3 size={14} /> : <CheckSquare size={14} />}
                                  {hasFeedback ? 'Update Feedback' : 'Log Feedback'}
                                </button>
                              )}

                              <a
                                href={`/meet/${interview.id}?role=company`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`px-5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-sm ${
                                  hasFeedback
                                    ? 'bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                                    : 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-[0_4px_14px_rgba(0,113,227,0.3)]'
                                }`}
                              >
                                <Play size={13} className={hasFeedback ? 'fill-current' : 'fill-white'} />
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