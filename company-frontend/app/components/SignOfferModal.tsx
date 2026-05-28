'use client';

import { useState, useRef } from 'react';
import { X, Signature, Check } from 'lucide-react';
import api from '@/app/lib/axios';
import SignatureCanvas from 'react-signature-canvas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  onSuccess: () => void;
}

export default function SignOfferModal({ isOpen, onClose, offerId, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signatureRef = useRef<any>(null);

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signatureRef.current?.isEmpty()) {
      alert('Please provide your signature');
      return;
    }

    setIsSubmitting(true);

    try {
      const signatureData = signatureRef.current.toDataURL();
      
      const response = await api.post(`/company/offers/${offerId}/sign`, {
        signature: signatureData
      });

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Sign offer error:', error);
      alert(error.response?.data?.message || 'Failed to sign offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl max-w-lg w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Signature className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-sm font-semibold text-white uppercase">Sign Offer Letter</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase">
                Company Authorized Signature
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            </div>

            <div className="border-2 border-dashed border-zinc-800 rounded-lg bg-black overflow-hidden">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-48 cursor-crosshair',
                  style: { touchAction: 'none' }
                }}
                backgroundColor="transparent"
                penColor="#ffffff"
              />
            </div>

            <p className="text-xs text-zinc-600 italic">
              Draw your signature above using mouse or touch input
            </p>
          </div>

          {/* Legal Notice */}
          <div className="bg-zinc-900/50 border border-zinc-900 rounded-lg p-3 space-y-2">
            <p className="text-xs text-zinc-500 leading-relaxed">
              By signing this document, you confirm that you are authorized to make employment offers 
              on behalf of your organization and that all details in this offer letter are accurate.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Signing...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Sign & Finalize
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}