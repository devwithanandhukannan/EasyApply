'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const CloudflareMeetingRoom = dynamic(
  () => import('@/app/components/CloudflareMeetingRoom'),
  { ssr: false }
);

function UnifiedMeetContent() {
  const { id: interviewId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const roleType = searchParams.get('role') === 'candidate' ? 'candidate' : 'company';
  const [roomName, setRoomName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.split('/meet/')[1]?.split('?')[0]?.split('/')[0];
      if (match && match !== 'default') return decodeURIComponent(match);
    }
    return (Array.isArray(interviewId) ? interviewId[0] : interviewId) || 'walkin-room';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.split('/meet/')[1]?.split('?')[0]?.split('/')[0];
      if (match && match !== 'default') {
        setRoomName(decodeURIComponent(match));
        return;
      }
    }
    if (interviewId && interviewId !== 'default') {
      setRoomName(Array.isArray(interviewId) ? interviewId[0] : interviewId);
    }
  }, [interviewId]);

  const handleDisconnected = () => {
    if (
      roomName.startsWith('walkin-') ||
      roomName.startsWith('room_') ||
      roomName === 'default' ||
      searchParams.get('token')?.startsWith('meet-')
    ) {
      router.replace('/dashboard/walkin');
      return;
    }

    if (roleType === 'company' && roomName && roomName !== 'default' && !roomName.startsWith('room_')) {
      router.replace(`/dashboard/interviews/${roomName}/review`);
    } else {
      router.replace('/dashboard/interviews');
    }
  };

  return (
    <CloudflareMeetingRoom
      roomName={roomName}
      role={roleType}
      userName={roleType === 'company' ? 'Interviewer' : 'Candidate'}
      onDisconnected={handleDisconnected}
    />
  );
}

export default function UnifiedMeetPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 font-mono text-xs gap-3 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin text-white" />
        <p>Configuring secure Cloudflare Calls WebRTC pipes...</p>
      </div>
    }>
      <UnifiedMeetContent />
    </Suspense>
  );
}
