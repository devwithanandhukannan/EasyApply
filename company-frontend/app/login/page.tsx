'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Mail, Lock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AxiosError } from 'axios';
import Link from 'next/link';
import api from '@/app/lib/axios';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Status feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);
  
  // Resend security cooldown mechanics
  const [cooldown, setCooldown] = useState(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Cooldown Countdown Timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsUnverified(false);
    setEmailSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await api.post('/company/auth/login', { email, password });
      
      if (res.data?.success) {
        login(res.data.user);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string; emailVerified?: boolean }>;
      
      // Catch specific 403 unverified status from your backend controller logic
      if (error.response?.status === 403 && error.response?.data?.emailVerified === false) {
        setIsUnverified(true);
        setErrorMessage(error.response?.data?.message || 'Corporate email validation pending.');
      } else {
        setErrorMessage(
          error.response?.data?.message || 
          'Invalid corporate credentials or unverified account status.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0 || isSendingEmail) return;

    setIsSendingEmail(true);
    setEmailSuccessMessage(null);

    try {
      const res = await api.post('/company/auth/resend-verification', { email });
      if (res.data?.success) {
        setEmailSuccessMessage(res.data.message || 'Verification link sent successfully.');
        setCooldown(30); // Initialize 30-second security window lock
        setErrorMessage(null); // Clear error block to shift focus onto success alert banner
        setIsUnverified(false);
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setErrorMessage(error.response?.data?.message || 'Failed to dispatch verification email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header Icon & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-4">
            <span className="text-black font-semibold text-xl">J</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to manage your company dashboard</p>
        </div>

        {/* Informational Verification Success Block */}
        {emailSuccessMessage && (
          <div className="mb-6 bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-4 text-sm text-emerald-400 flex items-start space-x-3 font-medium">
            <CheckCircle2 className="flex-shrink-0 mt-0.5 text-emerald-500" size={18} />
            <span>{emailSuccessMessage}</span>
          </div>
        )}

        {/* Error Handling Layout block */}
        {errorMessage && (
          <div className="mb-6 bg-red-950/40 border border-red-900/60 rounded-xl p-4 text-sm text-red-400 flex flex-col space-y-3 font-medium">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="flex-shrink-0 mt-0.5 text-red-500" size={18} />
              <span className="flex-1">{errorMessage}</span>
            </div>
            
            {/* Conditional Action Link for Resending Mail */}
            {isUnverified && (
              <div className="pl-8">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={cooldown > 0 || isSendingEmail}
                  className="text-xs text-white underline underline-offset-4 hover:text-gray-300 disabled:text-gray-600 disabled:no-underline font-semibold transition-colors"
                >
                  {isSendingEmail && 'Sending verification...'}
                  {!isSendingEmail && cooldown > 0 && `Resend email in ${cooldown}s`}
                  {!isSendingEmail && cooldown === 0 && 'Resend verification link now'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Panel Frame */}
        <div className="bg-[#1c1c1e] rounded-2xl p-8 border border-[#2c2c2e]">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            
            {/* Email Field Wrapper Context */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Official Email Address
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
                    if (errorMessage) {
                      setErrorMessage(null);
                      setIsUnverified(false);
                    }
                  }}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field Wrapper Context */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-400">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) {
                      setErrorMessage(null);
                      setIsUnverified(false);
                    }
                  }}
                  placeholder="Enter your security credentials"
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
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
            
          </form>
        </div>

        {/* Global Structural Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have a company profile account?{' '}
            <Link href="/register" className="text-white hover:underline font-medium">
              Register now
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}