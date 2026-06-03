'use client';

import { useState } from 'react';
import { X, CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from './GlassToastContainer';

interface OfferResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  position: string;
  companyName: string;
  onSuccess: () => void;
}

export default function OfferResponseModal({ 
  isOpen, 
  onClose, 
  offerId, 
  position, 
  companyName,
  onSuccess 
}: OfferResponseModalProps) {
  const [response, setResponse] = useState<'accept' | 'decline' | 'negotiate'>('accept');
  const [negotiationNote, setNegotiationNote] = useState('');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useGlassToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (response === 'accept' && !signature) {
      showToast('failed', 'Please enter your full name as digital signature', 'danger');
      return;
    }

    if (response === 'negotiate' && !negotiationNote.trim()) {
      showToast('failed', 'Please provide negotiation details', 'danger');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = { response };
      
      if (response === 'accept') {
        payload.signature = signature;
      } else if (response === 'negotiate') {
        payload.negotiationNote = negotiationNote;
      }

      const res = await api.post(`/jobseeker/offers/${offerId}/respond`, payload);
      
      if (res.data.success) {
        onSuccess();
        onClose();
        showToast(
          'success',
          response === 'accept'
            ? 'Offer accepted! The company has been notified.'
            : response === 'decline'
            ? 'Offer declined. Thank you for your consideration.'
            : 'Negotiation request sent to the company.',
          'success'
        );
      }
    } catch (error: any) {
      console.error('Offer response error:', error);
      showToast('failed', error.response?.data?.message || 'Failed to submit response', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl max-w-lg w-full">
        
        {/* Header */}
        <div className="border-b border-[#2c2c2e] p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Respond to Offer</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {position} at {companyName}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Response Type Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Your Decision
            </label>
            
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                response === 'accept' 
                  ? 'border-emerald-500 bg-emerald-950/20' 
                  : 'border-[#2c2c2e] hover:bg-zinc-950/50'
              }`}>
                <input
                  type="radio"
                  name="response"
                  value="accept"
                  checked={response === 'accept'}
                  onChange={() => setResponse('accept')}
                  className="w-4 h-4 accent-emerald-500"
                />
                <CheckCircle size={18} className="text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Accept Offer</p>
                  <p className="text-xs text-zinc-500">I agree to the terms and conditions</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                response === 'negotiate' 
                  ? 'border-amber-500 bg-amber-950/20' 
                  : 'border-[#2c2c2e] hover:bg-zinc-950/50'
              }`}>
                <input
                  type="radio"
                  name="response"
                  value="negotiate"
                  checked={response === 'negotiate'}
                  onChange={() => setResponse('negotiate')}
                  className="w-4 h-4 accent-amber-500"
                />
                <MessageSquare size={18} className="text-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Request Negotiation</p>
                  <p className="text-xs text-zinc-500">Discuss terms with the company</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                response === 'decline' 
                  ? 'border-red-500 bg-red-950/20' 
                  : 'border-[#2c2c2e] hover:bg-zinc-950/50'
              }`}>
                <input
                  type="radio"
                  name="response"
                  value="decline"
                  checked={response === 'decline'}
                  onChange={() => setResponse('decline')}
                  className="w-4 h-4 accent-red-500"
                />
                <XCircle size={18} className="text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Decline Offer</p>
                  <p className="text-xs text-zinc-500">Politely reject this opportunity</p>
                </div>
              </label>
            </div>
          </div>

          {/* Conditional Fields */}
          {response === 'accept' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Digital Signature *
              </label>
              <input
                type="text"
                required
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
                className="w-full bg-black border border-[#2c2c2e] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-zinc-600">
                By typing your name, you agree to the terms of employment
              </p>
            </div>
          )}

          {response === 'negotiate' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Negotiation Details *
              </label>
              <textarea
                required
                value={negotiationNote}
                onChange={(e) => setNegotiationNote(e.target.value)}
                placeholder="Describe your concerns or requests (salary, start date, benefits, etc.)"
                className="w-full bg-black border border-[#2c2c2e] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                rows={4}
              />
            </div>
          )}

          {response === 'decline' && (
            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3">
              <p className="text-xs text-red-400">
                ⚠️ This action cannot be undone. The company will be notified of your decision.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 text-black disabled:text-zinc-600 font-bold rounded-lg text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                `Confirm ${response === 'accept' ? 'Acceptance' : response === 'decline' ? 'Decline' : 'Request'}`
              )}
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