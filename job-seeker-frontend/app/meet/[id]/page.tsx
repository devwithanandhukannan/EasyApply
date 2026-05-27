'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import api from '@/app/lib/axios';
import dynamic from 'next/dynamic';

const LiveKitMeetingRoom = dynamic(
  () => import('@/app/components/LiveKitMeetingRoom'),
  { ssr: false }
);

export default function UnifiedLiveKitMeetPage() {
  const { id: interviewId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const roleType = searchParams.get('role') === 'candidate' ? 'jobseeker' : 'company';

  const [credentials, setCredentials] = useState<{
    token: string;
    serverUrl: string;
  } | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!interviewId) return;

    let cancelled = false;

    const fetchRoomCredentials = async () => {
      try {
        console.log('🔐 Fetching credentials for:', { interviewId, roleType });
        
        const endpoint = roleType === 'jobseeker'
          ? `/interviews/${interviewId}/token/jobseeker`
          : `/interviews/${interviewId}/token/company`;

        const response = await api.post(endpoint);
        
        if (cancelled) {
          console.log('⚠️ Request cancelled (component unmounted)');
          return;
        }

        if (response.data?.success && response.data?.token) {
          console.log('✅ Credentials received:', {
            token: response.data.token.substring(0, 20) + '...',
            serverUrl: 'http://localhost:7880'
          });

          setCredentials({
            token: response.data.token,
            serverUrl: 'http://localhost:7880' // Keep matching your LiveKit server deployment address
          });
        } else {
          setError(response.data?.message || 'Failed to extract verification token signatures.');
        }
      } catch (err: any) {
        if (cancelled) return;
        
        console.error('❌ Meeting token handshake failure:', err);
        const backendErrorMessage = err.response?.data?.message || err.message;
        setError(backendErrorMessage || 'Failed to authenticate secure session layer.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRoomCredentials();

    return () => {
      cancelled = true;
    };
  }, [interviewId, roleType]);

  const handleDisconnected = () => {
    console.log('🚪 Gracefully leaving room layout context.');
    router.replace('/dashboard/interviews');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 font-mono text-xs gap-3 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
        <p>Configuring secure WebRTC media pipes...</p>
      </div>
    );
  }

  if (error || !credentials) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-white font-mono p-6 text-center space-y-4">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h2 className="text-sm font-semibold">Verification Intercepted</h2>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">{error}</p>
        <button 
          onClick={() => handleDisconnected()} 
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <LiveKitMeetingRoom 
      token={credentials.token} 
      serverUrl={credentials.serverUrl} 
      onDisconnected={handleDisconnected} 
    />
  );
}
