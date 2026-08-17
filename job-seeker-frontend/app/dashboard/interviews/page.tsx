'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, RefreshCw, AlertCircle, Video, X } from 'lucide-react';
import Link from 'next/link';
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
      scheduled: 'bg-[#0071e3]/10 border-[#0071e3]/20 text-[#0071e3]',
      confirmed: 'bg-[#34c759]/10 border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158]',
      reschedule_requested: 'bg-[#ff9500]/10 border-[#ff9500]/20 text-[#ff9500]',
      in_progress: 'bg-[#af52de]/10 border-[#af52de]/20 text-[#af52de] animate-pulse',
      completed: 'bg-[#f2f2f7] dark:bg-[#2c2c2e] border-black/[0.04] dark:border-white/[0.06] text-[#86868b]',
      cancelled: 'bg-[#ff3b30]/10 border-[#ff3b30]/20 text-[#ff3b30]',
    };
    return map[status] || 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b]';
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased p-1">
      <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Interview Hub</h1>
        <p className="text-xs sm:text-sm text-[#86868b] mt-0.5 font-medium">Review interview times and access scheduled video channels.</p>
      </div>

      {interviews.length === 0 ? (
        <div className="border border-dashed border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#1c1c1e] p-12 rounded-3xl text-center text-xs text-[#86868b] shadow-xs max-w-md mx-auto">
          <Calendar className="mx-auto mb-3 text-[#86868b]" size={36} />
          <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white mb-1">No Interviews Scheduled</h3>
          <p className="text-xs text-[#86868b]">No active interview sessions scheduled on your profile.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const hasPendingReschedule = interview.status === 'reschedule_requested';
            const isInactive = ['completed', 'cancelled'].includes(interview.status);

            return (
              <div key={interview.id} className="border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                      {interview.application?.jobPosting?.title || "Technical Session"}
                    </h3>
                    <span className="text-xs text-[#86868b] font-medium">
                      {interview.application?.jobPosting?.company?.name}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 border rounded-full uppercase font-bold ${getStatusClasses(interview.status)}`}>
                      {getStatusLabel(interview.status)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-[#86868b] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>{new Date(interview.scheduledTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#86868b]" />
                      <span>{interview.durationMinutes} Minutes ({interview.format})</span>
                    </div>
                  </div>

                  {/* Pending Proposal Info Banner */}
                  {hasPendingReschedule && interview.rescheduleRequests?.[0] && (
                    <div className="mt-2 bg-[#ff9500]/10 border border-[#ff9500]/20 p-3 rounded-2xl text-xs text-[#b25e00] dark:text-[#ff9f0a] flex items-start gap-2 max-w-xl">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#ff9500]" />
                      <div>
                        <span className="font-bold block">Proposed New Window:</span>
                        {new Date(interview.rescheduleRequests[0].proposedTime).toLocaleString()}
                        {interview.rescheduleRequests[0].candidateNote && (
                          <p className="text-[#86868b] mt-1 italic">&ldquo;{interview.rescheduleRequests[0].candidateNote}&rdquo;</p>
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
                      className="px-4 py-2 bg-[#34c759]/10 hover:bg-[#34c759]/20 border border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158] text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                  )}

                  {!isInactive && !hasPendingReschedule && (
                    <button
                      onClick={() => setActiveRescheduleId(interview.id)}
                      disabled={submittingId !== null}
                      className="px-4 py-2 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-white text-xs font-semibold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#ff9500]" />
                      Reschedule
                    </button>
                  )}

                  {!isInactive && (
                    <Link
                      href={`/meet/${interview.id}?role=candidate`}
                      className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-2xl shadow-[0_4px_14px_rgba(0,113,227,0.25)] transition-all flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Room
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {activeRescheduleId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-white">Request Reschedule</h3>
              <button onClick={() => setActiveRescheduleId(null)} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={(e) => handleRescheduleSubmit(e, activeRescheduleId)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Proposed Date</label>
                <input
                  type="date"
                  required
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Proposed Time</label>
                <input
                  type="time"
                  required
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">Reason / Note for Recruiter</label>
                <textarea
                  value={candidateNote}
                  onChange={(e) => setCandidateNote(e.target.value)}
                  placeholder="Explain why you need to reschedule..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRescheduleId(null)}
                  className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-2xl text-xs font-semibold hover:bg-[#e5e5ea] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingId !== null}
                  className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold shadow-[0_4px_14px_rgba(0,113,227,0.25)] transition-all cursor-pointer disabled:opacity-40"
                >
                  {submittingId ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}