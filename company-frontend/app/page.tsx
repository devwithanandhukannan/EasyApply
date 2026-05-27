'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import api from '@/app/lib/axios';
import dynamic from 'next/dynamic';

// 🔌 Dynamic import with SSR disabled ensures LiveKit only evaluates safely on the client
const LiveKitMeetingRoom = dynamic(
  () => import('@/app/components/LiveKitMeetingRoom'),
  { ssr: false, loading: () => <MeetingLoadingOverlay message="Initializing video layout runtime..." /> }
);

function MeetingLoadingOverlay({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 font-mono text-xs gap-3 text-zinc-500">
      <Loader2 className="h-5 w-5 animate-spin text-white" />
      <p>{message}</p>
    </div>
  );
}

export default function UnifiedLiveKitMeetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Use a fallback string format to ensure properties remain structurally identical during checks
  const interviewId = typeof params?.id === 'string' ? params.id : '';
  const initialRole = searchParams.get('role') === 'candidate' ? 'jobseeker' : 'company';

  const [credentials, setCredentials] = useState<{ token: string; serverUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!interviewId) return;

    let isSubscribed = true;

    const fetchRoomCredentials = async () => {
      try {
        console.log('🔐 Initiating secure handshake signature route...', { interviewId, initialRole });
        
        const endpoint = initialRole === 'jobseeker'
          ? `/interviews/${interviewId}/token/jobseeker`
          : `/interviews/${interviewId}/token/company`;

        const response = await api.post(endpoint);
        
        if (!isSubscribed) return;

        if (response.data?.success && response.data?.token) {
          setCredentials({
            token: response.data.token,
            serverUrl: 'http://localhost:7880'
          });
        } else {
          setError(response.data?.message || 'Verification payload corrupted.');
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        console.error('❌ Token exchange failed:', err);
        setError(err.response?.data?.message || 'Handshake failed.');
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchRoomCredentials();

    return () => {
      isSubscribed = false;
    };
    // 💡 Intentionally locking dependencies strictly to the base ID
    // This stops React from tearing down the call during search parameter changes
  }, [interviewId]);

  const handleDisconnected = () => {
    console.log('🚪 Gracefully leaving room layout context.');
    router.replace('/dashboard/interviews');
  };

  if (loading) {
    return <MeetingLoadingOverlay message="Configuring secure WebRTC media pipes..." />;
  }

  if (error || !credentials) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-white font-mono p-6 text-center space-y-4">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h2 className="text-sm font-semibold">Verification Intercepted</h2>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">{error}</p>
        <button 
          onClick={handleDisconnected} 
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
