'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowUpRight, Play, User, AlertCircle, Check, X, ChevronDown } from 'lucide-react';
import api from '@/app/lib/axios';

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
  application: {
    jobSeekerProfile: {
      fullName: string;
      email: string;
    };
    jobPosting: {
      title: string;
    };
  };
}

export default function InterviewsListPage() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

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

  const handleStartInterview = (interviewId: string) => {
    window.open(`/meet/${interviewId}`, '_blank', 'noopener,noreferrer');
  };

  const handleRescheduleAction = async (interviewId: string, action: 'approve' | 'decline') => {
    try {
      setProcessingId(interviewId);
      const response = await api.post(`/company/interviews/${interviewId}/respond-reschedule`, { action });
      if (response.data.success) {
        await fetchInterviews();
      }
    } catch (err) {
      console.error(`Failed executing reschedule ${action}:`, err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusUpdate = async (interviewId: string, targetStatus: string) => {
    try {
      setProcessingId(interviewId);
      setActiveDropdownId(null);
      const response = await api.post(`/company/interviews/${interviewId}/update-status`, { status: targetStatus });
      if (response.data.success) {
        await fetchInterviews();
      }
    } catch (err) {
      console.error("Failed updating pipeline state status:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: InterviewRecord['status']) => {
    const colorMatrix = {
      scheduled: 'bg-blue-950/40 border-blue-900 text-blue-400',
      confirmed: 'bg-emerald-950/40 border-emerald-900 text-emerald-400',
      reschedule_requested: 'bg-amber-950/50 border-amber-800 text-amber-400 animate-pulse',
      in_progress: 'bg-purple-950/40 border-purple-900 text-purple-400 border',
      completed: 'bg-zinc-900 border-zinc-800 text-zinc-400',
      cancelled: 'bg-red-950/40 border-red-900 text-red-400'
    };
    return colorMatrix[status] || 'bg-zinc-900 border-zinc-800 text-zinc-400';
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-[#0a0a0a]">
        <p className="text-sm text-zinc-500 animate-pulse font-medium">Loading session matrices...</p>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-[#0a0a0a] text-white space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Live Interview Pipeline</h1>
        <p className="text-xs text-zinc-400 mt-1">Manage scheduled candidate validations, monitor real-time status indices, and resolve reschedule tasks cleanly.</p>
      </div>

      {interviews.length === 0 ? (
        <div className="border border-dashed border-zinc-900 bg-zinc-950 p-12 rounded-xl text-center">
          <p className="text-xs text-zinc-500">No live interviews currently scheduled in this company pipeline block.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {interviews.map((item) => {
            const activeRequest = item.rescheduleRequests?.[0];
            const isPendingReschedule = item.status === 'reschedule_requested' && activeRequest?.status === 'pending';

            return (
              <div key={item.id} className={`border rounded-xl bg-zinc-950 p-5 transition-all space-y-4 ${isPendingReschedule ? 'border-amber-900/60 shadow-md shadow-amber-950/10' : 'border-zinc-900 hover:border-zinc-800'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-[280px]">
                    <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.application.jobSeekerProfile.fullName}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Targeting: <span className="text-zinc-300">{item.application.jobPosting.title}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 font-mono text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                      {new Date(item.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="h-3.5 w-3.5 text-zinc-600" />
                      {new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.durationMinutes}m)
                    </div>
                    <div className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded uppercase text-[10px] text-zinc-400">
                      {item.format.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end lg:self-auto">
                    <div className="relative">
                      <button
                        disabled={processingId === item.id}
                        onClick={() => setActiveDropdownId(activeDropdownId === item.id ? null : item.id)}
                        className={`px-2.5 py-1 border text-[10px] uppercase tracking-wider font-mono font-medium rounded-md flex items-center gap-1.5 transition-colors ${getStatusColor(item.status)}`}
                      >
                        {item.status.replace('_', ' ')}
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </button>

                      {activeDropdownId === item.id && (
                        <div className="absolute right-0 mt-1.5 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 overflow-hidden font-mono text-[11px]">
                          {['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((st) => (
                            <button
                              key={st} type="button" onClick={() => handleStatusUpdate(item.id, st)}
                              className="w-full text-left px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors capitalize"
                            >
                              {st.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      disabled={processingId === item.id} onClick={() => handleStartInterview(item.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-all"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> Start <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {isPendingReschedule && (
                  <div className="p-4 bg-amber-950/10 border border-amber-900/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-amber-400 font-semibold">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span>Candidate requested scheduling modifications</span>
                      </div>
                      <p className="text-zinc-400 text-[11px]">
                        Proposed: <span className="text-white font-medium">{new Date(activeRequest.proposedTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                      {activeRequest.candidateNote && (
                        <p className="text-zinc-500 text-[11px] italic mt-1 bg-zinc-950/60 p-2 rounded border border-zinc-900">
                          "{activeRequest.candidateNote}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                      <button
                        disabled={processingId !== null} onClick={() => handleRescheduleAction(item.id, 'decline')}
                        className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-red-900/60 hover:text-red-400 text-zinc-400 text-[11px] rounded-lg transition-all flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" /> Decline
                      </button>
                      <button
                        disabled={processingId !== null} onClick={() => handleRescheduleAction(item.id, 'approve')}
                        className="px-3 py-1.5 bg-zinc-100 text-black hover:bg-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" /> Accept Proposal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}