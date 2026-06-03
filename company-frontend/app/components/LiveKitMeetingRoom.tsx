'use client';

import { 
  ControlBar, 
  GridLayout, 
  LiveKitRoom, 
  ParticipantTile, 
  RoomName,
  useTracks,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; 

interface LiveKitMeetingRoomProps {
  token: string;
  serverUrl: string;
  interviewId: string; 
  onDisconnected?: () => void;
}

export default function LiveKitMeetingRoom({ token, serverUrl, interviewId, onDisconnected }: LiveKitMeetingRoomProps) {
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const router = useRouter(); 
  return (
    <div className="h-screen w-screen bg-zinc-950 text-white flex flex-col overflow-hidden select-none" data-lk-theme="default">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={() => {
          console.log('🔌 LiveKit onDisconnected callback triggered');
          if (onDisconnected) onDisconnected();
          
          router.push(`/dashboard/interviews/${interviewId}/review`);
        }}
        onConnected={() => {
          console.log('✅ LiveKit successfully connected!');
        }}
        onError={(error) => {
          console.error('❌ LiveKit Room Error:', error);
          setConnectionError(error);
        }}
        connectOptions={{
          autoSubscribe: true,
        }}
        className="flex flex-col h-full"
      >
        {/* Everything else inside your standard meeting room component rendering engine remains intact */}
        {connectionError && (
          <div className="bg-red-900/20 border-b border-red-800 px-6 py-2 text-xs text-red-400">
            ⚠️ Connection Error: {connectionError.message}
          </div>
        )}

        <div className="border-b border-zinc-900 bg-zinc-950/80 px-6 py-3 flex items-center justify-between font-mono text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-500">ROOM:</span> 
            <RoomName className="text-zinc-200 uppercase tracking-wider font-semibold" />
          </div>
          <div className="text-[10px] text-zinc-600 uppercase">Secure WebRTC Session</div>
        </div>

        <div className="flex-1 min-h-0 bg-black relative p-4">
          <MeetingVideoGrid />
        </div>

        <RoomAudioRenderer />

        <div className="border-t border-zinc-900 bg-zinc-950 p-4 flex justify-center">
          <ControlBar variation="minimal" controls={{ leave: true, screenShare: true }} />
        </div>
      </LiveKitRoom>
    </div>
  );
}

function MeetingVideoGrid() {
  const tracks = useTracks([
    { source: Track.Source.Camera },
    { source: Track.Source.ScreenShare },
  ]);
  return (
    <GridLayout tracks={tracks} className="h-full w-full gap-4">
      <ParticipantTile />
    </GridLayout>
  );
}