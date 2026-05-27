'use client';

import { useState } from 'react';
import { X, Star, ShieldAlert, CheckSquare } from 'lucide-react';
import api from '@/app/lib/axios';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  onSuccess?: () => void;
}

type VerdictType = 'shortlist' | 'reject' | 'on_hold' | 'next_round';

export default function FeedbackModal({ isOpen, onClose, interviewId, onSuccess }: FeedbackModalProps) {
  const [technicalRating, setTechnicalRating] = useState(3);
  const [communicationRating, setCommunicationRating] = useState(3);
  const [problemSolvingRating, setProblemSolvingRating] = useState(3);
  const [verdict, setVerdict] = useState<VerdictType>('shortlist');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await api.post(`/interviews/${interviewId}/feedback`, {
        technicalRating,
        communicationRating,
        problemSolvingRating,
        verdict,
        notes,
      });

      if (response.data.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Feedback synchronization failure:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to submit evaluation payload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (label: string, value: number, setValue: (v: number) => void) => (
    <div className="space-y-1.5">
      <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">{label}</label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => setValue(star)}
            className="focus:outline-none transition-transform active:scale-95"
          >
            <Star
              className={`w-4 h-4 ${
                star <= value ? 'text-white fill-white' : 'text-zinc-800 fill-transparent hover:text-zinc-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-mono p-4">
      {/* Backdrop Glass Mask */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Frame Container */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col">
        <div className="border-b border-zinc-900 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">Evaluation Protocol Entry</h2>
            <p className="text-[10px] text-zinc-500 uppercase mt-0.5">Commit performance vectors to repository</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-950/30 border border-red-900 rounded-lg flex items-start gap-2 text-[11px] text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Core Metrics Array */}
          <div className="grid grid-cols-1 gap-3.5 bg-zinc-900/30 border border-zinc-900/60 p-3.5 rounded-lg">
            {renderStarRating('Technical Competency Matrix', technicalRating, setTechnicalRating)}
            {renderStarRating('Communication / Architecture Delivery', communicationRating, setCommunicationRating)}
            {renderStarRating('Algorithmic Problem Solving', problemSolvingRating, setProblemSolvingRating)}
          </div>

          {/* Verdict Dispatch Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Pipeline Status Verdict</label>
            <select
              value={verdict}
              onChange={(e) => setVerdict(e.target.value as VerdictType)}
              className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-xs uppercase text-zinc-300 focus:border-zinc-700 outline-none transition-colors font-mono appearance-none cursor-pointer"
            >
              <option value="shortlist">Advance // Shortlist</option>
              <option value="next_round">Schedule Next Round</option>
              <option value="on_hold">Retain On Hold</option>
              <option value="reject">Terminate Pipeline // Reject</option>
            </select>
          </div>

          {/* Structural Notes Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Operational Review Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide technical evaluations, architectural observations, or optimization insights..."
              rows={4}
              className="w-full bg-black border border-zinc-900 rounded-lg p-3 text-xs text-zinc-300 placeholder-zinc-700 focus:border-zinc-700 outline-none transition-colors resize-none font-mono"
            />
          </div>

          {/* Submit Action Block */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 text-black disabled:text-zinc-600 font-bold text-xs uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {isSubmitting ? 'Synchronizing Vector...' : 'Commit Evaluation Payload'}
          </button>
        </form>
      </div>
    </div>
  );
}