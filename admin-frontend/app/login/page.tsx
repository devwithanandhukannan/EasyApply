'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import EasyApplyLogo from '@/app/components/EasyApplyLogo';
import { ToastProvider, useGlassToast } from '@/app/components/GlassToastContainer';

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useGlassToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('admin_token', res.data.token);
        localStorage.setItem('admin_user', JSON.stringify(res.data.admin));
        showToast('Authenticated', 'Welcome back to DearResume Admin Console', 'success');
        router.push('/dashboard');
      }
    } catch (err: any) {
      showToast('Authentication Failed', err.response?.data?.message || 'Invalid administrator credentials', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f4fc] dark:bg-[#090a10] relative overflow-hidden transition-colors duration-300">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#0071e3]/20 to-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <EasyApplyLogo size="xl" badge="Admin" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#111827] dark:text-white mb-1">
            Platform Command Console
          </h1>
          <p className="text-xs text-[#6b7280] dark:text-zinc-400 font-medium">
            Authorized personnel system access &amp; security oversight
          </p>
        </div>

        {/* Elevated Glass Card */}
        <div className="bg-white/95 dark:bg-[#121422]/95 backdrop-blur-2xl rounded-3xl p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label text-xs">
                Administrator Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  className="input input-with-icon !pl-11"
                  style={{ paddingLeft: '2.75rem' }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@easyapply.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label text-xs">
                Secure Master Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  className="input input-with-icon !pl-11"
                  style={{ paddingLeft: '2.75rem' }}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-3 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Hardware &amp; Session Encrypted • 256-Bit SSL</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ToastProvider>
      <LoginForm />
    </ToastProvider>
  );
}
