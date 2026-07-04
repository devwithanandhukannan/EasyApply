'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Calendar, Terminal, ChevronRight, CheckCircle, Eye, Clock, XCircle, Star, UserPlus } from 'lucide-react';
import api from '@/app/lib/axios';
import FeedbackModal from '@/app/components/FeedbackModal';
import AddToTalentPoolModal from '@/app/components/AddToTalentPoolModal'; // NEW

interface FeedbackEntry {
  id: string;
  interviewerId: string;
  technicalRating: number;
  communicationRating: number;
  problemSolvingRating: number;
  verdict: 'shortlist' | 'reject' | 'on_hold' | 'next_round';
  notes: string;
  interviewer: {
    id: string;
    jobSeekerProfile: { fullName: string } | null;
  };
}

interface InterviewContext {
  id: string;
  scheduledTime: string;
  durationMinutes: number;
  format: string;
  status: string;
  application: {
    id: string;
    status: string;
    jobSeekerProfile: { id: string; fullName: string; email: string };
    jobPosting: { title: string };
  };
  batch?: {
    interviewers: Array<{
      teamMemberId: string;
      teamMember: {
        id: string;
        user: { jobSeekerProfile: { fullName: string } | null };
      };
    }>;
  };
}

interface SessionInfo {
  companyRoles: number;
  userId: string;
}

const ROLES = {
  COMPANY_ADMIN: 1 << 1,
  COMPANY_HR: 1 << 2,
  COMPANY_INTERVIEWER: 1 << 3,
  COMPANY_VIEWER: 1 << 4,
} as const;

const hasRole = (userRoles: number, role: number) => (userRoles & role) === role;
const isViewerOnly = (roles: number) =>
  hasRole(roles, ROLES.COMPANY_VIEWER) &&
  !hasRole(roles, ROLES.COMPANY_ADMIN) &&
  !hasRole(roles, ROLES.COMPANY_HR) &&
  !hasRole(roles, ROLES.COMPANY_INTERVIEWER);

const VERDICT_CONFIG = {
  shortlist: { label: 'Shortlisted', color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900', icon: CheckCircle },
  next_round: { label: 'Next Round', color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-900', icon: ChevronRight },
  on_hold: { label: 'On Hold', color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-900', icon: Clock },
  reject: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-950/30 border-red-900', icon: XCircle },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  scheduled:            { label: 'Scheduled',           color: 'text-zinc-400',    dot: 'bg-zinc-500' },
  confirmed:            { label: 'Confirmed',            color: 'text-blue-400',    dot: 'bg-blue-500' },
  in_progress:          { label: 'In Progress',          color: 'text-amber-400',   dot: 'bg-amber-500' },
  completed:            { label: 'Completed',            color: 'text-emerald-400', dot: 'bg-emerald-500' },
  cancelled:            { label: 'Cancelled / Rejected', color: 'text-red-400',     dot: 'bg-red-500' },
  reschedule_requested: { label: 'Reschedule Requested', color: 'text-purple-400',  dot: 'bg-purple-500' },
};

export default function PostInterviewReviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const [interview, setInterview] = useState<InterviewContext | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [poolModalOpen, setPoolModalOpen] = useState(false); // NEW

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [sessionRes, listRes, fbRes] = await Promise.all([
        api.get('/company/auth/session'),
        api.get('/company/interviews/list'),
        api.get(`/interviews/${id}/feedback`),
      ]);

      if (sessionRes.data.success) {
        setSession({
          companyRoles: sessionRes.data.companyRoles ?? 0,
          userId: sessionRes.data.userId ?? '',
        });
      }

      if (listRes.data.success) {
        const match = listRes.data.interviews.find((item: any) => item.id === id);
        if (match) setInterview(match);
      }

      if (fbRes.data.success) {
        setFeedbacks(fbRes.data.data ?? []);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleFeedbackSuccess = async () => {
    try {
      const fbRes = await api.get(`/interviews/${id}/feedback`);
      if (fbRes.data.success) setFeedbacks(fbRes.data.data ?? []);
      // Also refresh interview status
      const listRes = await api.get('/company/interviews/list');
      if (listRes.data.success) {
        const match = listRes.data.interviews.find((item: any) => item.id === id);
        if (match) setInterview(match);
      }
    } catch (e) {}
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-black font-mono">
        <p className="text-xs text-zinc-500 animate-pulse uppercase tracking-wider">Loading Interview Context...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] font-mono text-center p-4">
        <Terminal className="w-6 h-6 text-zinc-700 mb-2" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Interview Not Found</h3>
        <button onClick={() => router.push('/dashboard/interviews')} className="mt-4 text-xs text-white underline uppercase tracking-wide">
          Return to Interviews
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[interview.status] ?? STATUS_CONFIG.scheduled;
  const viewerOnly = session ? isViewerOnly(session.companyRoles) : true;
  const isCompleted = interview.status === 'completed';
  const isCancelled = interview.status === 'cancelled';
  const totalAssigned = interview.batch?.interviewers?.length ?? 0;
  const submittedCount = feedbacks.length;

  // Current user's own feedback (for pre-populating modal on edit)
  const myFeedback = session
    ? feedbacks.find(f => f.interviewerId === session.userId) ?? null
    : null;
  const myFeedbackSubmitted = !!myFeedback;

  return (
    <div className="max-w-2xl mx-auto w-full p-4 py-12 font-mono text-zinc-300 space-y-5">

      {/* ── HEADER ── */}
      <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-xl space-y-5">
        <div className="border-b border-zinc-900 pb-4 flex items-start justify-between">
          <div>
            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest block mb-0.5">Post-Interview Hub</span>
            <h1 className="text-base font-bold text-white uppercase tracking-tight">{interview.application.jobPosting.title}</h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900">
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} animate-pulse`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${statusCfg.color}`}>{statusCfg.label}</span>
          </div>
        </div>

        {/* Candidate info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/40 border border-zinc-900 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <div>
              <span className="text-[9px] text-zinc-600 block uppercase">Candidate</span>
              <span className="text-zinc-200 font-semibold">{interview.application.jobSeekerProfile.fullName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <div>
              <span className="text-[9px] text-zinc-600 block uppercase">Scheduled</span>
              <span className="text-zinc-200">{new Date(interview.scheduledTime).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <div>
              <span className="text-[9px] text-zinc-600 block uppercase">Panel Responses</span>
              <span className="text-zinc-200">{submittedCount} / {totalAssigned} submitted</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
              <span className="text-zinc-600 text-[10px]">APP</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-600 block uppercase">Application Stage</span>
              <span className="text-zinc-200 uppercase text-[10px] font-bold">{interview.application.status.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* Outcome banners */}
        {isCompleted && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900 rounded-lg flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>All panel members accepted. Candidate advanced in pipeline. Eligible for offer letter.</span>
          </div>
        )}
        {isCancelled && (
          <div className="p-3 bg-red-950/20 border border-red-900 rounded-lg flex items-center gap-2 text-xs text-red-400">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Candidate rejected by panel. Application closed.</span>
          </div>
        )}
        {!isCompleted && !isCancelled && submittedCount > 0 && submittedCount < totalAssigned && (
          <div className="p-3 bg-amber-950/20 border border-amber-900 rounded-lg flex items-center gap-2 text-xs text-amber-400">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Awaiting {totalAssigned - submittedCount} more panel response(s) to finalize decision.</span>
          </div>
        )}
      </div>

      {/* ── PANEL FEEDBACK LIST ── */}
    {/* ── ENHANCED PANEL FEEDBACK LIST ── */}
{feedbacks.length > 0 && (
  <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-4">
    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
      <div>
        <h2 className="text-xs font-bold text-white uppercase tracking-widest">Panel Evaluations</h2>
        <p className="text-[10px] text-zinc-600 mt-0.5">
          {submittedCount} of {totalAssigned} interviewers have submitted feedback
        </p>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
        <span className={`w-2 h-2 rounded-full ${
          submittedCount >= totalAssigned ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
        }`} />
        <span className="text-[10px] text-zinc-400 uppercase font-bold">
          {submittedCount >= totalAssigned ? 'Complete' : 'Pending'}
        </span>
      </div>
    </div>

    <div className="space-y-3">
      {feedbacks.map(fb => {
        const vcfg = VERDICT_CONFIG[fb.verdict] ?? VERDICT_CONFIG.on_hold;
        const Icon = vcfg.icon;
        const isOwnFeedback = session?.userId === fb.interviewerId;
        
        const avgRating = (
          (fb.technicalRating + fb.communicationRating + fb.problemSolvingRating) / 3
        ).toFixed(1);

        return (
          <div 
            key={fb.id} 
            className={`border rounded-lg overflow-hidden transition-all ${vcfg.bg} ${
              isOwnFeedback ? 'ring-2 ring-zinc-700 shadow-lg' : ''
            }`}
          >
            {/* Header Row */}
            <div className="p-4 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                  {fb.interviewer?.jobSeekerProfile?.fullName?.charAt(0) ?? 'I'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-200">
                      {fb.interviewer?.jobSeekerProfile?.fullName ?? 'Interviewer'}
                    </span>
                    {isOwnFeedback && (
                      <span className="text-[9px] text-white bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full uppercase font-bold">
                        Your Feedback
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-600">Overall:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-white">{avgRating}</span>
                      <span className="text-[10px] text-zinc-600">/5.0</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${vcfg.bg} ${vcfg.color}`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">{vcfg.label}</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/50">
              {[
                { label: 'Technical', val: fb.technicalRating, icon: '⚙️' },
                { label: 'Communication', val: fb.communicationRating, icon: '💬' },
                { label: 'Problem Solving', val: fb.problemSolvingRating, icon: '🧩' },
              ].map(m => (
                <div key={m.label} className="bg-black/40 p-3 text-center">
                  <div className="text-xs mb-1">{m.icon}</div>
                  <div className="text-lg font-bold text-white">{m.val}</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wide">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Notes Section */}
            {fb.notes && (
              <div className="p-4 bg-black/30 border-t border-zinc-900/50">
                <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider mb-1.5">
                  Detailed Notes
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{fb.notes}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
      {/* ── ASSIGNED PANEL STATUS ── */}
      {interview.batch?.interviewers && interview.batch.interviewers.length > 0 && (
        <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-3">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Assigned Panel</h2>
          {interview.batch.interviewers.map(iv => {
            const name = iv.teamMember?.user?.jobSeekerProfile?.fullName ?? iv.teamMemberId;
            const submitted = feedbacks.some(
              f => f.interviewerId === iv.teamMember?.id || f.interviewerId === iv.teamMemberId
            );
            return (
              <div key={iv.teamMemberId} className="flex items-center justify-between text-xs border border-zinc-900 rounded-lg px-3 py-2">
                <span className="text-zinc-300">{name}</span>
                {submitted
                  ? <span className="text-[9px] text-emerald-400 font-bold uppercase">✓ Submitted</span>
                  : <span className="text-[9px] text-zinc-600 uppercase">Pending</span>
                }
              </div>
            );
          })}
        </div>
      )}

      {/* ── ACTION PANEL ── */}
      <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-3">

        {viewerOnly && (
          <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center gap-2 text-xs text-zinc-500">
            <Eye className="w-4 h-4 shrink-0" />
            <span>You have view-only access. Feedback submission is restricted to assigned interviewers.</span>
          </div>
        )}

        {!viewerOnly && !isCancelled && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <span>{myFeedbackSubmitted ? 'Update Your Evaluation' : 'Submit Evaluation Feedback'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {myFeedbackSubmitted && !viewerOnly && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900 rounded-lg flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Your evaluation is submitted. You can update it anytime above.</span>
          </div>
        )}

        {/* NEW: Add to Talent Pool button */}
        <button
          onClick={() => setPoolModalOpen(true)}
          className="w-full py-2.5 border border-zinc-900 hover:border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50 text-zinc-400 hover:text-white font-medium text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add to Talent Pool
        </button>

        <button
          onClick={() => router.push('/dashboard/interviews')}
          className="w-full py-2.5 border border-zinc-900 hover:border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50 text-zinc-400 hover:text-white font-medium text-xs uppercase tracking-wider rounded-lg transition-colors"
        >
          Return to Interviews
        </button>
      </div>

      {/* Modal — passes myFeedback for pre-population on update */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        interviewId={interview.id}
        existingFeedback={myFeedback}
        onSuccess={handleFeedbackSuccess}
      />

      {/* NEW: Add to Talent Pool Modal */}
      <AddToTalentPoolModal
        open={poolModalOpen}
        onClose={() => setPoolModalOpen(false)}
        jobSeekerProfileId={interview.application.jobSeekerProfile.id}
        candidateName={interview.application.jobSeekerProfile.fullName}
      />
    </div>
  );
}