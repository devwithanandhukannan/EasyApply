// app/verify-email/page.tsx
'use client'; // Fix: Marked as a Client Component for hooks compatibility

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '@/app/lib/axios';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your domain credentials...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Activation parameters are missing. Check your link parameters.');
      return;
    }

    const verifyToken = async () => {
      try {
        // Call the API endpoint on your backend
        const response = await axiosInstance.get(`/company/auth/verify-email?token=${token}`);
        
        if (response.data.success) {
          setStatus('success');
          setMessage('Email confirmed successfully! Channeling you to your corporate dashboard...');
          
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }

          // Instantly send them directly to the dashboard layout framework
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Verification failed.');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Token has altered or expired. Please register again.');
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="text-center border border-zinc-800 p-10 rounded-2xl bg-zinc-950 max-w-md w-full shadow-2xl tracking-tight">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <h1 className="font-medium text-lg mt-2">Verifying Account</h1>
            <p className="text-sm text-zinc-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
              ✓
            </div>
            <h1 className="font-semibold text-xl text-emerald-400 mt-2">Email Verified!</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-xl">
              ✕
            </div>
            <h1 className="font-semibold text-xl text-rose-400 mt-2">Verification Failed</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">{message}</p>
            <button
              onClick={() => router.push('/register')}
              className="mt-6 px-5 py-2.5 bg-white text-black font-medium text-sm rounded-lg hover:bg-zinc-200 transition-all duration-150"
            >
              Back to Registration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}