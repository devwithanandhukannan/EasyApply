'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import api from '@/app/lib/axios';
import dynamic from 'next/dynamic';

const LiveKitMeetingRoom = dynamic(
  () => import('@/app/components/LiveKitMeetingRoom'),
  { ssr: false }
);

function UnifiedLiveKitMeetContent() {
  const { id: interviewId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const roleType = searchParams.get('role') === 'candidate' ? 'jobseeker' : 'company';

  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [iceServers, setIceServers] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 🎯 PREVENTS FAST REFRESH DOUBLE-MOUNTS FROM RETRIGGERING HANDSHAKES
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!interviewId || hasFetched.current) return;
    hasFetched.current = true;

    // Check for direct token from Walk-In Room
    const directToken = searchParams.get('token');
    if (directToken) {
      setServerUrl(process.env.NEXT_PUBLIC_LIVEKIT_URL || 'http://localhost:7880');
      setToken(directToken);
      setLoading(false);
      return;
    }

    const fetchRoomCredentials = async () => {
      try {
        const endpoint = roleType === 'jobseeker'
          ? `/interviews/${interviewId}/token/jobseeker`
          : `/interviews/${interviewId}/token/company`;

        const response = await api.post(endpoint);
        
        if (response.data?.success && response.data?.token) {
          // Commit to state variables simultaneously
          setServerUrl(response.data.livekitUrl || 'http://localhost:7880');
          setToken(response.data.token);
          setIceServers(response.data.iceServers || null);
          
          console.log('✅ Stream pipeline authorization successful.');
        } else {
          setError(response.data?.message || 'Failed to extract verification token signatures.');
        }
      } catch (err: any) {
        console.error('❌ Meeting token handshake failure:', err);
        const backendErrorMessage = err.response?.data?.message || err.message;
        setError(backendErrorMessage || 'Failed to authenticate secure session layer.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomCredentials();
  }, [interviewId, roleType, searchParams]);

  const handleDisconnected = () => {
    console.log('🚪 Gracefully leaving room layout context.');
    const idStr = Array.isArray(interviewId) ? interviewId[0] : (interviewId || '');
    
    // Walk-In rooms return directly back to walk-in dashboard
    if (
      idStr.startsWith('walkin-') ||
      idStr.startsWith('room_') ||
      idStr === 'default' ||
      searchParams.get('token')?.startsWith('meet-')
    ) {
      router.replace('/dashboard/walkin');
      return;
    }

    // Standard scheduled interviewers are routed to the feedback submission screen
    if (roleType === 'company' && idStr && idStr !== 'default' && !idStr.startsWith('room_')) {
      console.log(`Redirecting host node to evaluation matrix: /dashboard/interviews/${idStr}/review`);
      router.replace(`/dashboard/interviews/${idStr}/review`);
    } else {
      router.replace('/dashboard/interviews');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 font-mono text-xs gap-3 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
        <p>Configuring secure WebRTC media pipes...</p>
      </div>
    );
  }

  if (error || !token || !serverUrl) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-white font-mono p-6 text-center space-y-4">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h2 className="text-sm font-semibold">Verification Intercepted</h2>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">{error}</p>
        <button 
          onClick={() => router.replace('/dashboard/interviews')} 
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // 🎯 Only render the dynamic component tree when tokens are fully resolved to keep layout stable
  return (
    <LiveKitMeetingRoom 
      token={token} 
      serverUrl={serverUrl} 
      iceServers={iceServers || undefined}
      interviewId={interviewId as string} // 🎯 Passed down so the call engine can use it if needed
      onDisconnected={handleDisconnected} 
    />
  );
}

export default function UnifiedLiveKitMeetPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 font-mono text-xs gap-3 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
        <p>Configuring secure WebRTC media pipes...</p>
      </div>
    }>
      <UnifiedLiveKitMeetContent />
    </Suspense>
  );
}
