'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Calendar, Clock, Terminal, ChevronRight, CheckCircle } from 'lucide-react';
import api from '@/app/lib/axios';
import FeedbackModal from '@/app/components/FeedbackModal';

interface SimpleInterviewContext {
  id: string;
  scheduledTime: string;
  durationMinutes: number;
  format: string;
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

export default function PostInterviewReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [interview, setInterview] = useState<SimpleInterviewContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackCommitted, setFeedbackCommitted] = useState(false);

  useEffect(() => {
    const fetchTargetContext = async () => {
      try {
        setIsLoading(true);
        // Uses your existing matching list endpoint to extract target sub-attributes securely
        const response = await api.get('/company/interviews/list');
        if (response.data.success) {
          const match = response.data.interviews.find((item: any) => item.id === id);
          if (match) setInterview(match);
        }
      } catch (err) {
        console.error('Failed querying terminal context metadata:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchTargetContext();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-black font-mono">
        <p className="text-xs text-zinc-500 animate-pulse uppercase tracking-wider">Parsing Channel Context Block...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] font-mono text-center p-4">
        <Terminal className="w-6 h-6 text-zinc-700 mb-2" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Session Frame Inaccessible</h3>
        <p className="text-zinc-600 text-[11px] mt-1 mb-4">Target operational reference index record was not resolved.</p>
        <button onClick={() => router.push('/dashboard/interviews')} className="text-xs text-white underline uppercase tracking-wide">
          Return to Registry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full p-4 py-12 font-mono text-zinc-300 space-y-6">
      <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-xl space-y-6">
        
        {/* Terminal Header */}
        <div className="border-b border-zinc-900 pb-4">
          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest block mb-0.5">Session Execution Terminated</span>
          <h1 className="text-base font-bold text-white uppercase tracking-tight">Post-Call Processing Hub</h1>
        </div>

        {/* Dynamic Context Container */}
        <div className="space-y-3 bg-black/40 border border-zinc-900 p-4 rounded-lg text-xs">
          <div>
            <span className="text-[10px] text-zinc-600 block uppercase font-bold">Evaluated Target Stream</span>
            <span className="text-white font-bold uppercase text-sm">{interview.application.jobPosting.title}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-900/60">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-zinc-600" />
              <div>
                <span className="text-[9px] text-zinc-600 block uppercase">Candidate Node</span>
                <span className="text-zinc-300 font-medium">{interview.application.jobSeekerProfile.fullName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-600" />
              <div>
                <span className="text-[9px] text-zinc-600 block uppercase">Execution Window Timestamp</span>
                <span className="text-zinc-300 font-medium">{new Date(interview.scheduledTime).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Matrix */}
        <div className="pt-2 flex flex-col gap-2.5">
          {feedbackCommitted ? (
            <div className="p-4 bg-emerald-950/20 border border-emerald-900 rounded-xl text-xs text-emerald-400 flex items-start gap-3">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider block text-[10px] text-emerald-300">Synchronization Confirmed</span>
                <p className="text-zinc-400 mt-1">Evaluations integrated cleanly. Candidate pipeline tags shifted automatically.</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Initialize Evaluation Feedback Matrix</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => router.push('/dashboard/interviews')}
            className="w-full py-2.5 border border-zinc-900 hover:border-zinc-800 bg-zinc-950 hover:bg-zinc-900/50 text-zinc-400 hover:text-white font-medium text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            Bypass Evaluation & Return to Pipeline
          </button>
        </div>
      </div>

      {/* Modal Trigger Component Frame */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        interviewId={interview.id}
        onSuccess={() => setFeedbackCommitted(true)}
      />
    </div>
  );
}