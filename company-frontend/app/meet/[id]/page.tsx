'use client';

import { Suspense } from 'react';
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
  const idStr = Array.isArray(interviewId) ? interviewId[0] : (interviewId || 'walkin-default');

  const handleDisconnected = () => {
    if (
      idStr.startsWith('walkin-') ||
      idStr.startsWith('room_') ||
      idStr === 'default' ||
      searchParams.get('token')?.startsWith('meet-')
    ) {
      router.replace('/dashboard/walkin');
      return;
    }

    if (roleType === 'company' && idStr && idStr !== 'default' && !idStr.startsWith('room_')) {
      router.replace(`/dashboard/interviews/${idStr}/review`);
    } else {
      router.replace('/dashboard/interviews');
    }
  };

  return (
    <CloudflareMeetingRoom
      roomName={idStr}
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
