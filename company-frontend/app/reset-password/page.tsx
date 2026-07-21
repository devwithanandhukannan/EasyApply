'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AxiosError } from 'axios';
import Link from 'next/link';
import api from '@/app/lib/axios';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get('token');
    if (!t) {
      setErrorMessage('Reset token is missing or has expired. Please request a new link.');
    } else {
      setToken(t);
    }
  }, [searchParams]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!token) {
      setErrorMessage('Reset token is invalid or missing.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/company/auth/reset-password', {
        token,
        newPassword,
      });

      if (res.data?.success) {
        setSuccessMessage('Password reset successful! Redirecting you to login...');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setErrorMessage(
        error.response?.data?.message || 'Failed to reset password. Please try again.'
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
          <h1 className="text-2xl font-semibold text-white mb-2">Reset Password</h1>
          <p className="text-gray-500 text-sm">Enter your new security credentials</p>
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
        {token && !successMessage && (
          <div className="bg-[#1c1c1e] rounded-2xl p-8 border border-[#2c2c2e]">
            <form onSubmit={handleFormSubmit} className="space-y-5">
              
              {/* New Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Min. 8 characters"
                    className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Repeat new password"
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
                <span>{isSubmitting ? 'Updating...' : 'Update Password'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
              
            </form>
          </div>
        )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
