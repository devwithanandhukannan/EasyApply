'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Play, User, AlertCircle, Check, X, ChevronDown, CheckSquare, Search, SlidersHorizontal, Star, Flag } from 'lucide-react';
import api from '@/app/lib/axios';
import FeedbackModal from '@/app/components/FeedbackModal';

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
    jobSeekerProfile: {
      fullName: string;
      email: string;
      profilePhotoUrl: string | null;
    };
    jobPosting: {
      title: string;
    };
  };
}

export default function CompanyInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [starredOnly, setStarredOnly] = useState(false);
  
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInterviews = async () => {
    try {
      const response = await api.get('/company/interviews/list');
      if (response.data.success) {
        setInterviews(response.data.interviews);
      }
    } catch (err) {
      console.error("Failed fetching upcoming allocations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleRescheduleAction = async (interviewId: string, action: 'approve' | 'decline') => {
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

  const handleStatusUpdate = async (interviewId: string, targetStatus: string) => {
    try {
      setProcessingId(interviewId);
      setActiveDropdownId(null);
      const response = await api.post(`/company/interviews/${interviewId}/update-status`, { status: targetStatus });
      if (response.data.success) await fetchInterviews();
    } catch (err) {
      console.error("Failed updating pipeline status:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStar = async (applicationId: string, currentStarred: boolean) => {
    try {
      await api.post('/company/selection/bulk/star', {
        applicationIds: [applicationId],
        starred: !currentStarred
      });
      fetchInterviews();
    } catch (error) {
      console.error('Toggle star error:', error);
    }
  };

  const openFeedbackMatrix = (interviewId: string) => {
    setSelectedInterviewId(interviewId);
    setIsModalOpen(true);
  };

  const getStatusLabel = (status: InterviewRecord['status']) => {
    const labels: Record<InterviewRecord['status'], string> = {
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      reschedule_requested: 'Reschedule Req.',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: InterviewRecord['status']) => {
    const colorMatrix = {
      scheduled: 'bg-blue-950/40 border-blue-900 text-blue-400',
      confirmed: 'bg-emerald-950/40 border-emerald-900 text-emerald-400',
      reschedule_requested: 'bg-amber-950/50 border-amber-800 text-amber-400',
      in_progress: 'bg-purple-950/40 border-purple-900 text-purple-400 animate-pulse',
      completed: 'bg-zinc-900 border-zinc-800 text-zinc-500',
      cancelled: 'bg-red-950/40 border-red-900 text-red-400'
    };
    return colorMatrix[status] || 'bg-zinc-900 border-zinc-800 text-zinc-400';
  };

  const getPriorityBadge = (priority: number | null) => {
    if (!priority) return null;
    const badges: Record<number, { label: string; color: string }> = {
      1: { label: 'P1', color: 'bg-red-950/40 border-red-900 text-red-400' },
      2: { label: 'P2', color: 'bg-amber-950/40 border-amber-900 text-amber-400' },
      3: { label: 'P3', color: 'bg-blue-950/40 border-blue-900 text-blue-400' }
    };
    const badge = badges[priority];
    return (
      <span className={`px-1.5 py-0.5 border rounded text-[10px] font-bold ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const statusOptions = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];

  const processedInterviews = interviews
    .filter((item) => {
      const matchSearch = 
        item.application?.jobSeekerProfile?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.application?.jobPosting?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.includes(searchQuery);
      
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchStarred = !starredOnly || item.application?.isStarred;
      
      return matchSearch && matchStatus && matchStarred;
    })
    .sort((a, b) => {
      const aHasFeedback = a.feedbacks && a.feedbacks.length > 0 ? 1 : 0;
      const bHasFeedback = b.feedbacks && b.feedbacks.length > 0 ? 1 : 0;
      
      if (aHasFeedback !== bHasFeedback) {
        return aHasFeedback - bHasFeedback;
      }
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <p className="text-xs text-zinc-500 animate-pulse font-mono">Loading active interview profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white font-mono max-w-5xl mx-auto w-full p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white uppercase">Live Interview Pipeline</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage scheduled candidate tokens and host WebRTC rooms seamlessly.</p>
        </div>
      </div>

      {/* Search & Filter with Starred Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-zinc-950 p-3 border border-zinc-900 rounded-xl">
        <div className="sm:col-span-2 relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-600" />
          <input 
            type="text"
            placeholder="Search via candidate profile identifier, token string, or job vector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-zinc-900 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 outline-none transition-colors"
          />
        </div>
        <div className="relative flex items-center">
          <SlidersHorizontal className="absolute left-3 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-black border border-zinc-900 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-400 uppercase focus:border-zinc-700 outline-none appearance-none cursor-pointer"
          >
            <option value="all">Display All Stages</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-3 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
        </div>
        
        {/* Starred Filter */}
        <button
          onClick={() => setStarredOnly(!starredOnly)}
          className={`px-3 py-2 border rounded-lg text-xs font-semibold uppercase flex items-center justify-center gap-2 transition-colors ${
            starredOnly 
              ? 'bg-amber-950/20 border-amber-900 text-amber-400' 
              : 'bg-black border-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400' : ''}`} />
          Starred
        </button>
      </div>

      {processedInterviews.length === 0 ? (
        <div className="border border-dashed border-zinc-900 bg-zinc-950 p-12 rounded-xl text-center text-xs text-zinc-500">
          No pipeline matches found inside search criteria configurations.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {processedInterviews.map((interview) => {
            const hasFeedback = interview.feedbacks && interview.feedbacks.length > 0;
            const existingFeedbackInstance = hasFeedback ? interview.feedbacks![0] : null;

            const latestPendingReschedule = interview.status === 'reschedule_requested' 
              ? interview.rescheduleRequests?.find(r => r.status === 'pending')
              : null;

            return (
              <div 
                key={interview.id} 
                className={`border transition-all duration-200 p-5 rounded-xl flex flex-col space-y-4 ${
                  hasFeedback ? 'border-zinc-900/40 bg-zinc-950/40 opacity-75' : 'border-zinc-900 bg-zinc-950'
                }`}
              >
                
                {/* Upper Core Row Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Star Button */}
                      <button
                        onClick={() => handleToggleStar(interview.application.id, interview.application.isStarred)}
                        className="text-zinc-600 hover:text-amber-400 transition-colors"
                      >
                        <Star className={`w-3.5 h-3.5 ${interview.application.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>

                      {/* Priority Badge */}
                      {getPriorityBadge(interview.application.priority)}

                      <h3 className="text-xs font-semibold text-zinc-200 uppercase">
                        {interview.application?.jobPosting?.title || 'Technical Context'}
                      </h3>
                      <span className="text-zinc-700 text-[10px]">•</span>
                      <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                        {interview.application.jobSeekerProfile.profilePhotoUrl ? (
                          <img 
                            src={interview.application.jobSeekerProfile.profilePhotoUrl}
                            alt={interview.application.jobSeekerProfile.fullName}
                            className="w-5 h-5 rounded-full border border-zinc-800 object-cover"
                          />
                        ) : (
                          <User className="w-3 h-3 text-zinc-600" />
                        )}
                        <span>{interview.application?.jobSeekerProfile?.fullName}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-600 font-mono">
                      RefID: {interview.id.substring(0, 8)}... — {interview.application?.jobSeekerProfile?.email}
                    </p>
                  </div>

                  {/* Core Timing Elements */}
                  <div className="flex flex-col text-[11px] text-zinc-500 md:text-right gap-0.5">
                    <div className="flex items-center md:justify-end gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                      <span>{new Date(interview.scheduledTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center md:justify-end gap-2">
                      <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      <span>{interview.durationMinutes} Min Block ({interview.format})</span>
                    </div>
                  </div>
                </div>

                {/* Reschedule Proposal Area */}
                {latestPendingReschedule && (
                  <div className="bg-amber-950/20 border border-amber-900/50 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-500">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-bold uppercase tracking-wider text-amber-400 text-[10px]">Candidate Reschedule Petitioned:</span>
                      </div>
                      <p className="text-[11px]">Proposed Window: <span className="text-zinc-300 font-bold">{new Date(latestPendingReschedule.proposedTime).toLocaleString()}</span></p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRescheduleAction(interview.id, 'decline')}
                        disabled={processingId !== null}
                        className="p-1.5 border border-zinc-800 hover:border-red-900 bg-zinc-900 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRescheduleAction(interview.id, 'approve')}
                        disabled={processingId !== null}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Accept Window
                      </button>
                    </div>
                  </div>
                )}

                {/* Feedback Preview */}
                {existingFeedbackInstance && (
                  <div className="bg-zinc-900/30 border border-zinc-900/80 p-3 rounded-lg text-[11px] text-zinc-400 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900/60 pb-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Logged Ledger Score Summary:</span>
                      <span className="text-white uppercase px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-bold text-[9px]">
                        Verdict // {existingFeedbackInstance.verdict.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex gap-4 flex-wrap text-zinc-500">
                      <div>TECH: <span className="text-zinc-300 font-bold">{existingFeedbackInstance.technicalRating}/5</span></div>
                      <div>COMM: <span className="text-zinc-300 font-bold">{existingFeedbackInstance.communicationRating}/5</span></div>
                      <div>LOGIC: <span className="text-zinc-300 font-bold">{existingFeedbackInstance.problemSolvingRating}/5</span></div>
                    </div>
                    {existingFeedbackInstance.notes && (
                      <p className="italic text-zinc-500 line-clamp-2">Observations: "{existingFeedbackInstance.notes}"</p>
                    )}
                  </div>
                )}

                {/* Lower Control Actions Bar */}
                <div className="border-t border-zinc-900/60 pt-3 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Pipeline Status Dropdown */}
                  <div className="relative font-mono">
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === interview.id ? null : interview.id)}
                      disabled={processingId === interview.id}
                      className={`px-3 py-1.5 border rounded-lg text-xs uppercase font-semibold flex items-center gap-2 transition-all min-w-[150px] justify-between ${getStatusColor(interview.status)}`}
                    >
                      <span>{getStatusLabel(interview.status)}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdownId === interview.id ? 'rotate-180' : ''}`} />
                    </button>

                    {activeDropdownId === interview.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                        <div className="absolute left-0 bottom-full mb-1 z-20 w-44 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-1 space-y-0.5">
                          <div className="text-[9px] text-zinc-600 px-2 py-1 uppercase tracking-wider font-bold">Override Stage</div>
                          {statusOptions.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleStatusUpdate(interview.id, opt)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs uppercase font-mono transition-colors block ${
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

                  {/* Room Access & Feedback */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openFeedbackMatrix(interview.id)}
                      className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      {hasFeedback ? 'Edit Assessment' : 'Log Feedback'}
                    </button>

                    <a
                      href={`/meet/${interview.id}?role=company`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                        hasFeedback 
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800' 
                          : 'bg-white text-black hover:bg-zinc-200'
                      }`}
                    >
                      <Play className={`w-3.5 h-3.5 ${hasFeedback ? 'fill-zinc-500' : 'fill-black'}`} />
                      Launch Room
                    </a>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      {selectedInterviewId && (
        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInterviewId(null);
          }}
          interviewId={selectedInterviewId}
          onSuccess={fetchInterviews}
        />
      )}
    </div>
  );
}