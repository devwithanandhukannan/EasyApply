'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Mail, Lock, ArrowRight, ShieldAlert, CheckCircle2, Building2, Users } from 'lucide-react';
import { AxiosError } from 'axios';
import Link from 'next/link';
import api from '@/app/lib/axios';
import EasyApplyLogo from '@/app/components/EasyApplyLogo';

// Define explicit operational login configurations 
type LoginType = 'admin' | 'team';

export default function LoginPage() {
  const { login } = useAuth();
  const [loginType, setLoginType] = useState<LoginType>('admin');
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

    // 🎯 Switch target endpoint based on active portal state context
    const targetEndpoint = loginType === 'admin' 
      ? '/company/auth/login' 
      : '/company/team/login';

    try {
      const res = await api.post(targetEndpoint, { email, password });
      
      if (res.data?.success) {
        login(res.data);
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
          'Invalid credentials or unverified account status.'
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

  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || !email.trim()) return;
    setIsVerifyingOtp(true);
    try {
      const res = await api.post('/company/auth/verify-email-otp', {
        email: email.trim(),
        otp: otpInput.trim()
      });
      if (res.data?.success) {
        setEmailSuccessMessage(res.data.message || 'Corporate email verified successfully! You may now sign in.');
        setErrorMessage(null);
        setIsUnverified(false);
        setOtpInput('');
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setErrorMessage(error.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f5f7] dark:bg-[#000000] transition-colors duration-200">
      <div className="w-full max-w-md">
        
        {/* Header Icon & Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <EasyApplyLogo size="xl" badge="Business" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] mb-1.5">Welcome Back</h1>
          <p className="text-[#86868b] text-sm">Sign in to manage your company dashboard</p>
        </div>

        {/* ─── APPLE SEGMENTED CONTROL ─── */}
        <div className="bg-[#e5e5ea] dark:bg-[#1c1c1e] p-1 rounded-xl flex items-center mb-6 border border-black/[0.04] dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              setLoginType('admin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              loginType === 'admin' 
                ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            <Building2 size={14} />
            <span>Company Admin</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType('team');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              loginType === 'team' 
                ? 'bg-white dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
            }`}
          >
            <Users size={14} />
            <span>Team Member</span>
          </button>
        </div>

        {/* Informational Verification Success Block */}
        {emailSuccessMessage && (
          <div className="mb-6 bg-[#34c759]/10 border border-[#34c759]/30 rounded-2xl p-4 text-sm text-[#248a3d] dark:text-[#30d158] flex items-start space-x-3 font-medium">
            <CheckCircle2 className="flex-shrink-0 mt-0.5 text-[#34c759]" size={18} />
            <span>{emailSuccessMessage}</span>
          </div>
        )}

        {/* Error Handling Layout block */}
        {errorMessage && (
          <div className="mb-6 bg-[#ff3b30]/10 border border-[#ff3b30]/30 rounded-2xl p-4 text-sm text-[#d70015] dark:text-[#ff453a] flex flex-col space-y-3 font-medium">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="flex-shrink-0 mt-0.5 text-[#ff3b30]" size={18} />
              <span className="flex-1">{errorMessage}</span>
            </div>
            
            {/* Conditional Action Link & OTP Verification Form */}
            {isUnverified && (
              <div className="pt-2 border-t border-[#ff3b30]/20 space-y-3">
                <p className="text-xs font-semibold text-[#1d1d1f] dark:text-white">
                  Enter 6-digit verification code sent to <strong className="text-[#0071e3]">{email}</strong>:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="e.g. 000000"
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#2c2c2e] border border-black/[0.1] dark:border-white/[0.1] rounded-xl text-xs font-mono tracking-widest text-[#1d1d1f] dark:text-white focus:outline-none focus:border-[#0071e3]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpInput.trim().length !== 6}
                    className="px-4 py-2 bg-[#34c759] hover:bg-[#30d158] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify Email'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={cooldown > 0 || isSendingEmail}
                    className="text-[#0071e3] hover:underline disabled:text-[#86868b] disabled:no-underline font-semibold"
                  >
                    {isSendingEmail && 'Sending...'}
                    {!isSendingEmail && cooldown > 0 && `Resend in ${cooldown}s`}
                    {!isSendingEmail && cooldown === 0 && 'Resend code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Apple Elevated Card */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                {loginType === 'admin' ? 'Official Email Address' : 'Invited Email Address'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
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
                  className="w-full pl-12 pr-4 py-3.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-[#0071e3] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
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
                  className="w-full pl-12 pr-4 py-3.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium"
                  required
                />
              </div>
            </div>

            {/* Apple Blue Pill Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.99] text-white py-3.5 rounded-2xl font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.3)] disabled:opacity-50 transition-all flex items-center justify-center space-x-2 text-sm mt-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : `Sign In as ${loginType === 'admin' ? 'Admin' : 'Member'}`}</span>
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
            
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#86868b]">
            Don&apos;t have a company profile account?{' '}
            <Link href="/register" className="text-[#0071e3] hover:underline font-semibold">
              Register now
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}