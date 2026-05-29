'use client';

import { useState, useRef } from 'react';
import { X, Signature, Check, Upload } from 'lucide-react';
import api from '@/app/lib/axios';
import SignatureCanvas from 'react-signature-canvas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  onSuccess: () => void;
  // Optional parameters to catch negotiation revision states passed from the details page
  action?: 'accept_negotiation' | 'reject_negotiation';
  updatedSalary?: string;
  updatedStartDate?: string;
  responseNote?: string;
}

export default function SignOfferModal({ 
  isOpen, 
  onClose, 
  offerId, 
  onSuccess,
  action,
  updatedSalary,
  updatedStartDate,
  responseNote 
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'upload'>('draw');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const signatureRef = useRef<any>(null);

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedSignature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let signatureData: string | null = null;

    if (signatureMethod === 'draw') {
      if (signatureRef.current?.isEmpty()) {
        alert('Please provide your signature');
        return;
      }
      signatureData = signatureRef.current.toDataURL('image/png');
    } else {
      if (!uploadedSignature) {
        alert('Please upload a signature image');
        return;
      }
      signatureData = uploadedSignature;
    }

    setIsSubmitting(true);

    try {
      let response;
      
      // If triggered contextually via the negotiation stream, forward to the verification handler
      if (action) {
        response = await api.post(`/company/offers/${offerId}/respond-negotiation`, {
          action,
          updatedSalary: action === 'accept_negotiation' ? updatedSalary : undefined,
          updatedStartDate: action === 'accept_negotiation' ? updatedStartDate : undefined,
          responseNote,
          signature: signatureData // Appends signature metadata payload directly to revisions
        });
      } else {
        // Fallback fallback mechanism if it's an unmodified standalone pending signature action
        response = await api.post(`/company/offers/${offerId}/sign`, {
          signature: signatureData
        });
      }

      if (response.data.success) {
        alert(response.data.message || 'Offer successfully processed and signed.');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Sign offer pipeline execution error:', error);
      alert(error.response?.data?.message || 'Failed to submit authorization payload');
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
          
          {/* Signature Method Toggle */}
          <div className="flex items-center gap-2 p-1 bg-zinc-900 rounded-lg">
            <button
              type="button"
              onClick={() => setSignatureMethod('draw')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                signatureMethod === 'draw'
                  ? 'bg-purple-500 text-black'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Signature className="w-3.5 h-3.5" />
              Draw Signature
            </button>
            <button
              type="button"
              onClick={() => setSignatureMethod('upload')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                signatureMethod === 'upload'
                  ? 'bg-purple-500 text-black'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload PNG
            </button>
          </div>

          {/* Draw Signature Canvas Element */}
          {signatureMethod === 'draw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Draw Your Signature
                </label>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="border-2 border-dashed border-zinc-800 rounded-lg bg-white overflow-hidden">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-48 cursor-crosshair',
                    style: { touchAction: 'none' }
                  }}
                  backgroundColor="#ffffff"
                  penColor="#000000"
                />
              </div>

              <p className="text-xs text-zinc-600 italic">
                Draw your signature above using mouse or touch input
              </p>
            </div>
          )}

          {/* Upload Signature Asset Box */}
          {signatureMethod === 'upload' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Upload Signature Image (PNG)
              </label>

              <div className="border-2 border-dashed border-zinc-800 rounded-lg bg-black p-8">
                {uploadedSignature ? (
                  <div className="space-y-3">
                    <img 
                      src={uploadedSignature} 
                      alt="Uploaded signature graphic asset"
                      className="w-full h-32 object-contain bg-white rounded border border-zinc-800"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedSignature(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Remove & upload different image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block text-center">
                    <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Click to upload PNG image</p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <p className="text-xs text-zinc-600 italic">
                Upload a PNG/JPG image of your signature (max 2MB)
              </p>
            </div>
          )}

          {/* Verification Legal Notice */}
          <div className="bg-zinc-900/50 border border-zinc-900 rounded-lg p-3 space-y-2">
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              By executing this digital document signature, you confirm authority to issue corporate deployment 
              parameters and explicitly authorize updating this configuration on your system records.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 font-mono">
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