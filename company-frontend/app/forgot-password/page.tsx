'use client';

import { useState } from 'react';
import { Mail, ArrowRight, ShieldAlert, CheckCircle2, Building2, Users, ArrowLeft } from 'lucide-react';
import { AxiosError } from 'axios';
import Link from 'next/link';
import api from '@/app/lib/axios';

type PortalType = 'admin' | 'team';

export default function ForgotPasswordPage() {
  const [portalType, setPortalType] = useState<PortalType>('admin');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await api.post('/company/auth/forgot-password', {
        email,
        type: portalType,
      });

      if (res.data?.success) {
        setSuccessMessage(res.data.message || 'Verification link sent successfully.');
        setEmail('');
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setErrorMessage(
        error.response?.data?.message || 'An error occurred. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header Icon & Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-4">
            <span className="text-black font-semibold text-xl">J</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Forgot Password</h1>
          <p className="text-gray-500 text-sm">Retrieve access to your company account</p>
        </div>

        {/* ─── ROLE SELECTOR SWITCH ─── */}
        <div className="bg-[#1c1c1e] p-1.5 rounded-xl border border-[#2c2c2e] flex items-center mb-6">
          <button
            type="button"
            onClick={() => {
              setPortalType('admin');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              portalType === 'admin' 
                ? 'bg-[#2c2c2e] text-white shadow-sm border border-[#3c3c3e]' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Building2 size={14} />
            <span>Company Admin</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPortalType('team');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              portalType === 'team' 
                ? 'bg-[#2c2c2e] text-white shadow-sm border border-[#3c3c3e]' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Users size={14} />
            <span>Team Member</span>
          </button>
        </div>

        {/* Informational Success Block */}
        {successMessage && (
          <div className="mb-6 bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-4 text-sm text-emerald-400 flex items-start space-x-3 font-medium">
            <CheckCircle2 className="flex-shrink-0 mt-0.5 text-emerald-500" size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Handling Layout block */}
        {errorMessage && (
          <div className="mb-6 bg-red-950/40 border border-red-900/60 rounded-xl p-4 text-sm text-red-400 flex items-start space-x-3 font-medium">
            <ShieldAlert className="flex-shrink-0 mt-0.5 text-red-500" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Panel Frame */}
        <div className="bg-[#1c1c1e] rounded-2xl p-8 border border-[#2c2c2e]">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            
            {/* Email Field Wrapper Context */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                    if (successMessage) setSuccessMessage(null);
                  }}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                  required
                />
              </div>
            </div>

            {/* Submitting Status Bound Controls */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black py-3.5 rounded-xl font-medium hover:bg-gray-100 disabled:bg-[#2c2c2e] disabled:text-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm mt-2"
            >
              <span>{isSubmitting ? 'Sending link...' : 'Send Reset Link'}</span>
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
            
          </form>
        </div>

        {/* Navigation Footer */}
        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-white transition-colors font-medium">
            <ArrowLeft size={16} />
            <span>Back to sign in</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
