'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from '@/app/lib/axios';
import { useAuth } from '@/app/contexts/AuthContext';
import { ShieldAlert, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = searchParams.get('token');

  // Core component views lifecycle state
  const [status, setStatus] = useState<'loading' | 'setPassword' | 'success' | 'error'>('loading');
  const [globalErrorMessage, setGlobalErrorMessage] = useState('');
  const [email, setEmail] = useState('');

  // Form handling isolated parameters states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formValidationError, setFormValidationError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setGlobalErrorMessage('Invalid or missing invitation link authorization token.');
      return;
    }

    const verifyAndAcceptInvite = async () => {
      try {
        const res = await axios.get(`/company/team/accept-invite?token=${token}`);
        
        if (res.data.success) {
          // Fix: Handle the case where they are already added to this workspace mapping context
          if (res.data.alreadyMember) {
            router.push('/login?alreadyMember=true');
            return;
          }

          if (res.data.isNewUser) {
            setEmail(res.data.email || '');
            setStatus('setPassword');
          } else {
            setStatus('success');
            window.location.href = '/dashboard';
          }
        }
      } catch (error: any) {
        setStatus('error');
        setGlobalErrorMessage(error.response?.data?.message || 'Failed to authorize your invitation parameters.');
      }
    };

    verifyAndAcceptInvite();
  }, [token]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError('');

    if (password.length < 8) {
      setFormValidationError('Password security baseline requires at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setFormValidationError('Credential mismatch: Input values do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post('/company/team/set-password', {
        token,
        password
      });

      if (res.data.success) {
        setStatus('success');
        login({ user: res.data.user, company: res.data.company });
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setFormValidationError(err.response?.data?.message || 'Failed to save account password configurations.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── VIEW RENDER PIPELINES ───

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-3 justify-center items-center h-screen bg-[#0a0a0a] text-zinc-400 font-mono text-xs">
        <div className="h-5 w-5 animate-spin rounded-full border border-zinc-800 border-t-white"></div>
        <span>Validating workspace invitation criteria streams...</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-3 justify-center items-center h-screen bg-[#0a0a0a] text-emerald-400 font-mono text-xs">
        <CheckCircle2 className="h-5 w-5" />
        <span>Verification approved. Forwarding to dashboard...</span>
      </div>
    );
  }

  if (status === 'setPassword') {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0a0a] text-white p-4">
        <div className="w-full max-w-sm border border-zinc-900 bg-zinc-950/40 p-8 rounded-2xl shadow-2xl">
          <div className="space-y-1.5 text-center mb-6">
            <h1 className="text-sm font-semibold tracking-tight text-white uppercase font-mono">Secure Profile Setup</h1>
            <p className="text-[11px] text-zinc-500 font-mono tracking-tight">
              PROVISION PASSWORD ASSIGNMENT FOR: <span className="text-zinc-300 font-bold block mt-0.5">{email || 'YOUR WORKSPACE'}</span>
            </p>
          </div>

          {/* Form specific error block stays inside the container without tearing down the form */}
          {formValidationError && (
            <div className="mb-4 p-3 bg-red-950/20 border border-red-950/60 rounded-xl flex items-start gap-2.5 text-red-400 font-mono text-[11px] leading-normal">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formValidationError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Choose Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  className="w-full h-9 bg-zinc-900 border border-zinc-800/80 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-700 rounded-lg pl-9 pr-10 text-xs focus:outline-none font-mono transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-600 hover:text-zinc-400 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  className="w-full h-9 bg-zinc-900 border border-zinc-800/80 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-700 rounded-lg pl-9 pr-3 text-xs focus:outline-none font-mono transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-zinc-100 text-black hover:bg-white text-xs font-bold rounded-xl h-9 transition-all mt-2 disabled:opacity-50"
            >
              {submitting ? 'Updating Core Records...' : 'Complete Account Registration'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // True critical pipeline exceptions display card
  return (
    <div className="flex justify-center items-center h-screen bg-[#0a0a0a] text-white p-4">
      <div className="text-center max-w-sm border border-zinc-900 bg-zinc-950/40 p-8 rounded-2xl shadow-xl">
        <div className="flex justify-center mb-3">
          <ShieldAlert className="h-6 w-6 text-red-500" />
        </div>
        <h1 className="text-sm font-semibold tracking-tight text-red-400 font-mono uppercase">Invitation Core Error</h1>
        <p className="mt-2 text-xs text-zinc-500 leading-normal font-mono">{globalErrorMessage}</p>
        <button 
          onClick={() => router.push('/login')} 
          className="mt-6 w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl h-9 text-xs font-medium transition-colors font-mono focus:outline-none"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}