'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, RefreshCw, AlertCircle, Video, X } from 'lucide-react';
import api from '@/app/lib/axios';

interface Interview {
  id: string;
  scheduledTime: string;
  durationMinutes: number;
  format: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'reschedule_requested' | 'confirmed';
  application: {
    jobPosting: {
      title: string;
      company: { name: string; };
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
  
  // Reschedule Management Tracking States
  const [activeRescheduleId, setActiveRescheduleId] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [candidateNote, setCandidateNote] = useState('');

  const loadInterviews = async () => {
    try {
      const response = await api.get('/jobseeker/interviews');
      if (response.data.success) setInterviews(response.data.data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadInterviews(); }, []);

  const handleConfirmAttendance = async (id: string) => {
    try {
      setSubmittingId(id);
      const response = await api.post(`/jobseeker/interviews/${id}/confirm`);
      if (response.data.success) loadInterviews();
    } catch (err) {
      console.error(err);
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
      console.error(err);
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusLabel = (status: Interview['status']) => {
    const labels: Record<Interview['status'], string> = {
      scheduled: 'Scheduled',
      confirmed: 'Attendance Confirmed',
      reschedule_requested: 'Reschedule Pending',
      in_progress: 'Live Session Running',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
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
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border border-zinc-800 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full text-white font-mono p-4">
      <div>
        <h1 className="text-lg font-semibold uppercase tracking-tight">Interview Hub</h1>
        <p className="text-xs text-zinc-500 mt-1">Review validation parameters and access scheduled audio/video channels.</p>
      </div>

      {interviews.length === 0 ? (
        <div className="border border-dashed border-zinc-900 bg-zinc-950/30 p-12 rounded-xl text-center text-xs text-zinc-500">
          No allocated interview configurations identified on your active profile.
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const hasPendingReschedule = interview.status === 'reschedule_requested';
            const isInactive = ['completed', 'cancelled'].includes(interview.status);

            return (
              <div key={interview.id} className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xs font-semibold uppercase text-zinc-200">
                      {interview.application?.jobPosting?.title || "Technical Session"}
                    </h3>
                    <span className="text-[10px] text-zinc-500">•</span>
                    <span className="text-[11px] text-zinc-400">
                      {interview.application?.jobPosting?.company?.name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-md uppercase font-semibold ${getStatusClasses(interview.status)}`}>
                      {getStatusLabel(interview.status)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 text-[11px] text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Time: {new Date(interview.scheduledTime).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Duration: {interview.durationMinutes} Minutes ({interview.format})</span>
                    </div>
                  </div>

                  {/* Pending Proposal Info Banner */}
                  {hasPendingReschedule && interview.rescheduleRequests?.[0] && (
                    <div className="mt-2 bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-lg text-[11px] text-amber-500/90 flex items-start gap-2 max-w-xl">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-amber-400">Proposed New Window:</span>
                        {new Date(interview.rescheduleRequests[0].proposedTime).toLocaleString()}
                        {interview.rescheduleRequests[0].candidateNote && (
                          <p className="text-zinc-500 mt-1 italic">Note: "{interview.rescheduleRequests[0].candidateNote}"</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Control Actions Panel */}
                <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                  {!isInactive && !hasPendingReschedule && interview.status !== 'confirmed' && (
                    <button
                      onClick={() => handleConfirmAttendance(interview.id)}
                      disabled={submittingId !== null}
                      className="px-3 py-1.5 border border-zinc-800 hover:border-emerald-900 hover:bg-emerald-950/20 text-zinc-400 hover:text-emerald-400 text-xs rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                  )}

                  {!isInactive && !hasPendingReschedule && (
                    <button
                      onClick={() => setActiveRescheduleId(interview.id)}
                      disabled={submittingId !== null}
                      className="px-3 py-1.5 border border-zinc-800 hover:border-amber-900 hover:bg-amber-950/20 text-zinc-400 hover:text-amber-400 text-xs rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reschedule
                    </button>
                  )}

                  {!isInactive && (
                    <a
                      href={`/meet/${interview.id}?role=candidate`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── RESCHEDULE MODAL DRAWER ─── */}
      {activeRescheduleId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl max-w-md w-full p-6 space-y-4 relative shadow-2xl">
            <button 
              onClick={() => setActiveRescheduleId(null)}
              className="absolute top-4 right-4 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">Request Schedule Modification</h2>
              <p className="text-[11px] text-zinc-500 mt-1">Propose a fresh timeline window. The operations desk will analyze availability.</p>
            </div>

            <form onSubmit={(e) => handleRescheduleSubmit(e, activeRescheduleId)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Target Date</label>
                  <input
                    type="date"
                    required
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Target Time Slot</label>
                  <input
                    type="time"
                    required
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Justification Note (Optional)</label>
                <textarea
                  placeholder="Provide context regarding changes..."
                  value={candidateNote}
                  onChange={(e) => setCandidateNote(e.target.value)}
                  rows={3}
                  className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 focus:outline-none focus:border-zinc-700 placeholder-zinc-600 font-mono resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRescheduleId(null)}
                  className="px-4 py-2 border border-zinc-900 hover:bg-zinc-900 text-zinc-400 text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingId !== null}
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {submittingId ? 'Dispatching...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}