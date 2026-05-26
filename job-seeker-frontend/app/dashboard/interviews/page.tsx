'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, RefreshCw, AlertCircle, Building, Video, ExternalLink } from 'lucide-react';
import api from '@/app/lib/axios';

interface Interview {
  id: string;
  scheduledTime: string;
  durationMinutes: number;
  format: 'video' | 'coding_test' | 'mixed';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'reschedule_requested' | 'confirmed';
  joinLink: string;
  application: {
    jobPosting: {
      title: string;
      company: {
        name: string;
        logoUrl: string | null;
      };
    };
  };
  rescheduleRequests: Array<{
    proposedTime: string;
    candidateNote: string | null;
    status: 'pending' | 'approved' | 'declined';
  }>;
}

export default function JobSeekerInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Reschedule form state
  const [activeRescheduleId, setActiveRescheduleId] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [candidateNote, setCandidateNote] = useState('');

  const loadInterviews = async () => {
    try {
      setErrorMsg(null);
      const response = await api.get('/jobseeker/interviews');
      if (response.data.success) {
        setInterviews(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setErrorMsg('Could not fetch active interview schedules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleConfirmAttendance = async (id: string) => {
    try {
      setSubmittingId(id);
      const response = await api.post(`/jobseeker/interviews/${id}/confirm`);
      if (response.data.success) {
        loadInterviews();
      }
    } catch (err) {
      console.error('Confirmation error:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!proposedDate || !proposedTime) return;

    try {
      setSubmittingId(id);
      const combinedDateTime = new Date(`${proposedDate}T${proposedTime}`);
      const response = await api.post(`/jobseeker/interviews/${id}/reschedule`, {
        proposedTime: combinedDateTime.toISOString(),
        candidateNote,
      });
      if (response.data.success) {
        setActiveRescheduleId(null);
        setProposedDate('');
        setProposedTime('');
        setCandidateNote('');
        loadInterviews();
      }
    } catch (err) {
      console.error('Reschedule error:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusClasses = (status: Interview['status']) => {
    const map = {
      scheduled: 'bg-blue-950/40 border-blue-900 text-blue-400',
      confirmed: 'bg-emerald-950/40 border-emerald-900 text-emerald-400',
      reschedule_requested: 'bg-amber-950/40 border-amber-900 text-amber-400',
      in_progress: 'bg-purple-950/40 border-purple-900 text-purple-400 animate-pulse',
      completed: 'bg-zinc-900 border-zinc-800 text-zinc-500',
      cancelled: 'bg-red-950/40 border-red-900 text-red-400',
    };
    return map[status] || 'bg-zinc-900 border-zinc-800 text-zinc-400';
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-[#0a0a0a]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full text-white p-4">
      <style jsx global>{`
        ::-webkit-calendar-picker-indicator,
        ::-webkit-time-picker-indicator {
          filter: invert(1);
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.15s ease;
        }
        ::-webkit-calendar-picker-indicator:hover,
        ::-webkit-time-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Interview Hub</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review your upcoming evaluations, confirm slots, or submit reschedule requests.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center gap-2.5 text-xs text-red-400 font-mono">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {interviews.length === 0 ? (
        <div className="border border-dashed border-zinc-800 bg-zinc-950/20 p-12 rounded-2xl text-center">
          <p className="text-xs text-zinc-500 font-mono">No interview slots found or assigned to your profile yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((item) => (
            <div
              key={item.id}
              className="border border-zinc-900 bg-zinc-950/40 rounded-2xl p-5 hover:border-zinc-800/80 transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
                    <Building className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.application.jobPosting.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{item.application.jobPosting.company.name}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`px-2 py-0.5 border text-[10px] uppercase tracking-wider font-mono font-medium rounded-md ${getStatusClasses(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] uppercase font-mono text-zinc-400">
                    {item.format.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 border-y border-zinc-900/60 font-mono text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                  <span>Date: {new Date(item.scheduledTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-zinc-600" />
                  <span>Time: {new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.durationMinutes} min)</span>
                </div>
              </div>

              {/* Reschedule pending banner */}
              {item.status === 'reschedule_requested' && item.rescheduleRequests?.[0] && (
                <div className="p-3 bg-amber-950/10 border border-amber-900/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-400 font-mono">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Reschedule Proposal Pending Review</p>
                    <p className="text-[11px] text-amber-500/80 mt-0.5">
                      Requested: {new Date(item.rescheduleRequests[0].proposedTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.rescheduleRequests[0].candidateNote && (
                      <p className="text-[11px] text-zinc-500 mt-1 italic">"{item.rescheduleRequests[0].candidateNote}"</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {item.status !== 'completed' && item.status !== 'cancelled' && item.status !== 'reschedule_requested' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRescheduleId(activeRescheduleId === item.id ? null : item.id);
                      setProposedDate('');
                      setProposedTime('');
                      setCandidateNote('');
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" /> Change / Reschedule
                  </button>
                )}
                <div className="hidden md:block flex-1" />

                {item.status === 'scheduled' && (
                  <button
                    disabled={submittingId !== null}
                    onClick={() => handleConfirmAttendance(item.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Confirm Slot
                  </button>
                )}

                {(item.status === 'confirmed' || item.status === 'in_progress') && (
                  <a
                    href={item.joinLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-xl transition-all"
                  >
                    <Video className="h-3.5 w-3.5" /> Launch Room <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                )}
              </div>

              {/* Reschedule Form – FIXED NATIVE DATE/TIME PICKERS */}
              {activeRescheduleId === item.id && (
                <form
                  onSubmit={(e) => handleRescheduleSubmit(e, item.id)}
                  className="p-4 border border-zinc-800/60 bg-zinc-900/20 rounded-xl space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date Picker - Native */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                        Proposed Date
                      </label>
                      <input
                        type="date"
                        required
                        value={proposedDate}
                        onChange={(e) => setProposedDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-0 font-mono cursor-pointer"
                      />
                    </div>

                    {/* Time Picker - Native */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                        Proposed Time
                      </label>
                      <input
                        type="time"
                        required
                        value={proposedTime}
                        onChange={(e) => setProposedTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-0 font-mono cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                      Note / Message Context
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Optional: share your reason or preferred time range..."
                      value={candidateNote}
                      onChange={(e) => setCandidateNote(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none resize-none focus:ring-0"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveRescheduleId(null)}
                      className="px-2.5 py-1.5 font-medium text-zinc-500 hover:text-zinc-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingId !== null || !proposedDate || !proposedTime}
                      className="px-3.5 py-1.5 bg-zinc-200 text-black hover:bg-white disabled:opacity-40 text-xs font-bold rounded-lg transition-all"
                    >
                      {submittingId === item.id ? 'Sending...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}