'use client';

import { useState, useEffect } from 'react';
import { X, Star, AlertTriangle, Check, Edit3, Award, MessageSquare, ShieldAlert } from 'lucide-react';
import api from '@/app/lib/axios';

interface ExistingFeedback {
  technicalRating: number;
  communicationRating: number;
  problemSolvingRating: number;
  verdict: 'shortlist' | 'reject' | 'on_hold' | 'next_round';
  notes: string | null;
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  onSuccess?: () => void;
  existingFeedback?: ExistingFeedback | null;
}

type VerdictType = 'shortlist' | 'reject' | 'on_hold' | 'next_round';

const VERDICT_DISPLAY = {
  shortlist: { 
    label: 'Advance Candidate', 
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10',
    activeBg: 'bg-emerald-500/20 border-emerald-400 text-emerald-400',
    description: 'Passes assessment criteria.'
  },
  next_round: { 
    label: 'Next Round', 
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10',
    activeBg: 'bg-blue-500/20 border-blue-400 text-blue-400',
    description: 'Requires additional loop.'
  },
  on_hold: { 
    label: 'Place On Hold', 
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10',
    activeBg: 'bg-amber-500/20 border-amber-400 text-amber-400',
    description: 'Pending cohort comparison.'
  },
  reject: { 
    label: 'Reject Application', 
    color: 'text-red-400 border-red-500/30 bg-red-500/5 hover:bg-red-500/10',
    activeBg: 'bg-red-500/20 border-red-400 text-red-400',
    description: 'Does not meet requirements.'
  },
};

export default function FeedbackModal({ isOpen, onClose, interviewId, onSuccess, existingFeedback }: FeedbackModalProps) {
  const [technicalRating, setTechnicalRating] = useState(existingFeedback?.technicalRating ?? 3);
  const [communicationRating, setCommunicationRating] = useState(existingFeedback?.communicationRating ?? 3);
  const [problemSolvingRating, setProblemSolvingRating] = useState(existingFeedback?.problemSolvingRating ?? 3);
  const [verdict, setVerdict] = useState<VerdictType>(existingFeedback?.verdict ?? 'shortlist');
  const [notes, setNotes] = useState(existingFeedback?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTechnicalRating(existingFeedback?.technicalRating ?? 3);
      setCommunicationRating(existingFeedback?.communicationRating ?? 3);
      setProblemSolvingRating(existingFeedback?.problemSolvingRating ?? 3);
      setVerdict(existingFeedback?.verdict ?? 'shortlist');
      setNotes(existingFeedback?.notes ?? '');
      setErrorMessage(null);
    }
  }, [isOpen, existingFeedback]);

  const isUpdate = !!existingFeedback;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = { technicalRating, communicationRating, problemSolvingRating, verdict, notes };
      const response = await api.put(`/interviews/${interviewId}/feedback`, payload);

      if (response.data.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(response.data.message || 'Submission failed.');
      }
    } catch (err: any) {
      console.error('Feedback sync error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to submit evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (label: string, value: number, setValue: (v: number) => void, description: string) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-zinc-900 last:border-0 last:pb-0">
      <div className="space-y-0.5 max-w-[60%]">
        <label className="text-xs font-semibold text-zinc-200">{label}</label>
        <p className="text-[11px] text-zinc-500 leading-normal">{description}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setValue(star)}
              className="focus:outline-none transition-transform active:scale-95 text-zinc-700 hover:text-zinc-500 group"
            >
              <Star className={`w-4 h-4 transition-colors ${
                star <= value 
                  ? 'text-amber-400 fill-amber-400' 
                  : 'text-zinc-800 fill-transparent group-hover:text-amber-500/40'
              }`} />
            </button>
          ))}
          <span className="text-xs font-mono font-medium text-zinc-400 ml-2 min-w-[24px] text-right">
            {value}<span className="text-zinc-600">/5</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans p-4 antialiased">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        
        {/* Modern Header Layout */}
        <div className="border-b border-zinc-900 p-5 flex items-center justify-between bg-zinc-900/20">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              isUpdate ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-300'
            }`}>
              {isUpdate ? <Edit3 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">
                {isUpdate ? 'Update Candidate Evaluation' : 'Submit Candidate Evaluation'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isUpdate ? 'Modify metrics or refine specific interview logs.' : 'Log scores and system actions for the applicant pipeline.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
          {errorMessage && (
            <div className="p-3.5 bg-red-500/5 border border-red-500/20 rounded-lg flex items-start gap-2.5 text-xs text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-normal">{errorMessage}</span>
            </div>
          )}

          {isUpdate && (
            <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-center gap-2.5 text-xs text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="leading-normal">Updating feedback recalculates pipeline positions dynamically.</span>
            </div>
          )}

          {/* Clean Unified Performance Metrics Container */}
          <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl space-y-1">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Evaluation Metrics</h3>
            {renderStarRating('Technical Competency', technicalRating, setTechnicalRating, 'Domain expertise, design understanding, and execution accuracy.')}
            {renderStarRating('Communication Skills', communicationRating, setCommunicationRating, 'Clarity of complex reasoning and active technical articulation.')}
            {renderStarRating('Problem Solving', problemSolvingRating, setProblemSolvingRating, 'Analytical discovery patterns, system debugging logic, and scale edge checks.')}
          </div>

          {/* Compact 2x2 Grid Verdict Selection */}
          <div className="space-y-2">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Final Execution Verdict</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(VERDICT_DISPLAY) as VerdictType[]).map((key) => {
                const opt = VERDICT_DISPLAY[key];
                const isSelected = verdict === key;
                
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setVerdict(key)}
                    className={`p-3 border rounded-xl text-left transition-all relative flex flex-col justify-between ${
                      isSelected ? opt.activeBg : `${opt.color} border-zinc-900 bg-zinc-900/20 hover:border-zinc-800`
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-0.5">
                      <span className="text-xs font-semibold tracking-wide">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 line-clamp-1 group-hover:text-zinc-400">{opt.description}</p>
                  </button>
                );
              })}
            </div>

            {verdict === 'reject' && (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400/90 mt-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">
                  <strong>Warning:</strong> Core exclusions automatically move candidate profiles to the pipeline drop pool.
                </span>
              </div>
            )}
          </div>

          {/* Core Text Assessment Area */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider block">Detailed Assessment Logs</label>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Log context points, distinct architectural trade-offs discussed, or general team alignment values noticed during assessment..."
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 outline-none transition-all resize-none leading-relaxed"
            />
          </div>
        </form>

        {/* Action Panel Sticky Footer */}
        <div className="border-t border-zinc-900 p-4 bg-zinc-950 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-800 bg-transparent font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-5 py-2 bg-white hover:bg-zinc-200 disabled:bg-zinc-900 text-black disabled:text-zinc-600 font-medium text-xs rounded-lg transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Processing...' : isUpdate ? 'Update Entry' : 'Post Evaluation'}
          </button>
        </div>

      </div>
    </div>
  );
}