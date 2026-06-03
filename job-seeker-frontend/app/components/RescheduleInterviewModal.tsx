'use client';

import { useState } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from './GlassToastContainer';

interface RescheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  currentTime: string;
  onSuccess: () => void;
}

export default function RescheduleInterviewModal({
  isOpen,
  onClose,
  interviewId,
  currentTime,
  onSuccess
}: RescheduleInterviewModalProps) {
  const [proposedTime, setProposedTime] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useGlassToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proposedTime) {
      showToast('failed', 'Please select a proposed time', 'danger');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post(`/jobseeker/interviews/${interviewId}/reschedule`, {
        proposedTime,
        candidateNote: note
      });

      if (res.data.success) {
        onSuccess();
        onClose();
        showToast('success', 'Reschedule request sent to the company', 'success');
      }
    } catch (error: any) {
      console.error('Reschedule error:', error);
      showToast('failed', error.response?.data?.message || 'Failed to submit reschedule request', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl max-w-md w-full">
        
        <div className="border-b border-[#2c2c2e] p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Calendar size={18} />
            Request Reschedule
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-3">
            <p className="text-xs text-zinc-500">Current Schedule:</p>
            <p className="text-sm text-white font-semibold mt-1">
              {new Date(currentTime).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Proposed New Time *
            </label>
            <input
              type="datetime-local"
              required
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              className="w-full bg-black border border-[#2c2c2e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Reason (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Briefly explain why you need to reschedule..."
              className="w-full bg-black border border-[#2c2c2e] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 text-black disabled:text-zinc-600 font-bold rounded-lg text-xs uppercase tracking-widest transition-colors"
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-[#2c2c2e] hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}