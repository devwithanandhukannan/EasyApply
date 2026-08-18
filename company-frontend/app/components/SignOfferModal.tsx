'use client';

import { useState, useRef } from 'react';
import { X, FileSignature, Check, Upload, Trash2, Loader2, Sparkles } from 'lucide-react';
import api from '@/app/lib/axios';
import SignatureCanvas from 'react-signature-canvas';
import { useGlassToast } from './GlassToastContainer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  onSuccess: () => void;
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
  const { showToast } = useGlassToast();

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Validation Error', 'Please upload a valid PNG or JPG image file', 'danger');
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
        showToast('Validation Error', 'Please draw your authorized signature on the canvas', 'danger');
        return;
      }
      signatureData = signatureRef.current?.getTrimmedCanvas().toDataURL('image/png');
    } else {
      if (!uploadedSignature) {
        showToast('Validation Error', 'Please upload an authorized signature image asset', 'danger');
        return;
      }
      signatureData = uploadedSignature;
    }

    if (!signatureData) {
      showToast('Validation Error', 'Authorized signature image asset required', 'danger');
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (action) {
        response = await api.post(`/company/offers/${offerId}/respond-negotiation`, {
          action,
          updatedSalary: action === 'accept_negotiation' ? updatedSalary : undefined,
          updatedStartDate: action === 'accept_negotiation' ? updatedStartDate : undefined,
          responseNote,
          signature: signatureData
        });
      } else {
        response = await api.post(`/company/offers/${offerId}/sign`, {
          signature: signatureData
        });
      }

      if (response.data.success) {
        showToast('Success', response.data.message || 'Offer successfully signed & verified.', 'success');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Sign offer error:', error);
      showToast('Signing Failed', error.response?.data?.message || 'Failed to submit signature payload', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-lg w-full shadow-2xl text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1d1d1f] dark:text-white tracking-tight">Sign Offer Letter</h2>
              <p className="text-xs text-[#86868b] font-medium">Affix your corporate digital e-signature</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Signature Method Toggle */}
          <div className="flex items-center gap-2 p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setSignatureMethod('draw')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                signatureMethod === 'draw'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#0071e3] shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5" />
              Draw Signature
            </button>
            <button
              type="button"
              onClick={() => setSignatureMethod('upload')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                signatureMethod === 'upload'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#0071e3] shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
          </div>

          {/* Draw Signature Canvas */}
          {signatureMethod === 'draw' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                  Draw Signature Here
                </label>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-bold text-[#0071e3] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-black/[0.1] dark:border-white/[0.15] rounded-2xl bg-white overflow-hidden shadow-inner">
                <SignatureCanvas
                  ref={signatureRef}
                  penColor="#000000"
                  canvasProps={{
                    className: 'w-full h-36 cursor-crosshair'
                  }}
                />
              </div>
            </div>
          )}

          {/* Upload Signature Image */}
          {signatureMethod === 'upload' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                Upload Signature Image (PNG/JPG)
              </label>

              <div className="border-2 border-dashed border-black/[0.1] dark:border-white/[0.15] rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] p-6 text-center">
                {uploadedSignature ? (
                  <div className="space-y-2.5">
                    <img 
                      src={uploadedSignature} 
                      alt="Uploaded signature"
                      className="w-full h-28 object-contain bg-white rounded-xl border border-black/[0.06] p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedSignature(null)}
                      className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Remove &amp; upload different image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-[#0071e3] mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Click to select signature file</p>
                    <p className="text-[11px] text-[#86868b] mt-0.5">PNG or JPG up to 2MB</p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Legal Notice */}
          <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-3.5">
            <p className="text-[11px] text-[#86868b] leading-relaxed font-medium">
              By applying your digital signature, you confirm authority on behalf of the company to issue formal offer terms and execute legal document dispatch.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-2xl text-xs font-semibold hover:bg-[#e5e5ea] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer hover:opacity-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Sign &amp; Finalize</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}