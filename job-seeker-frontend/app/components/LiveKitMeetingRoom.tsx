'use client';

import { 
  ControlBar, 
  GridLayout, 
  LiveKitRoom, 
  ParticipantTile, 
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
  TrackRef
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { useState, useEffect } from 'react';

interface LiveKitMeetingRoomProps {
  token: string;
  serverUrl: string;
  onDisconnected: () => void;
  screenShareActive: boolean; 
}

export default function LiveKitMeetingRoom({ 
  token, 
  serverUrl, 
  onDisconnected, 
  screenShareActive 
}: LiveKitMeetingRoomProps) {
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  return (
    <div className="h-full w-full bg-zinc-950 text-white flex flex-col overflow-hidden select-none" data-lk-theme="default">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={() => {
          console.log('🔌 LiveKit onDisconnected callback triggered');
          onDisconnected();
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
        {connectionError && (
          <div className="bg-red-900/20 border-b border-red-800 px-4 py-2 text-xs text-red-400 font-mono">
            ⚠️ Connection Error: {connectionError.message}
          </div>
        )}

        {/* Syncs parent state down to the active WebRTC room connection */}
        <ScreenShareSync active={screenShareActive} />

        {/* Dynamic Layout Engine based on track sources */}
        <div className="flex-1 min-h-0 bg-black relative p-3">
          <AdaptiveMeetingGrid />
        </div>

        <RoomAudioRenderer />

        {/* Minimal localized camera/mic toggles */}
        <div className="border-t border-zinc-900 bg-zinc-950/60 p-3 flex justify-center shrink-0">
          <ControlBar variation="minimal" controls={{ leave: false, screenShare: false }} />
        </div>
      </LiveKitRoom>
    </div>
  );
}

/**
 * Communicates external toggle flags down to LiveKit's core internal media tracks
 */
function ScreenShareSync({ active }: { active: boolean }) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room || !room.localParticipant) return;

    const handleScreenShareToggle = async () => {
      try {
        const isCurrentlySharing = room.localParticipant.isScreenShareEnabled;
        if (active !== isCurrentlySharing) {
          await room.localParticipant.setScreenShareEnabled(active);
          console.log(`🖥️ Screen share state set to: ${active}`);
        }
      } catch (err) {
        console.error('Failed to change screen capture track status:', err);
      }
    };

    handleScreenShareToggle();
  }, [active, room]);

  return null;
}

/**
 * Intelligent Grid Component that rearranges presentation contexts 
 * depending on whether a Screen Share track is alive inside the room pipeline.
 */
function AdaptiveMeetingGrid() {
  // Query both standard cameras and active screen shares
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const screenShareTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);

  // If someone is sharing their screen, drop into presentation mode layout
  if (screenShareTracks.length > 0) {
    const primaryScreenTrack = screenShareTracks[0];

    return (
      <div className="flex flex-col lg:flex-row h-full w-full gap-3">
        
        {/* Theater Main Frame View for Screen Share content */}
        <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden relative min-w-0 min-h-0">
          <ParticipantTile trackRef={primaryScreenTrack} className="h-full w-full object-contain" />
          <div className="absolute top-3 left-3 bg-black/75 border border-zinc-800 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider text-emerald-400 z-10">
            Active Presentation Stream
          </div>
        </div>

        {/* Floating Vertical Sidebar for Participant Camera Feeds */}
        <div className="w-full lg:w-48 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-[120px] lg:max-h-full min-h-0">
          {cameraTracks.map((track: TrackRef) => (
            <div key={`${track.participant.identity}-${track.source}`} className="w-36 lg:w-full h-24 lg:h-32 shrink-0 rounded-lg border border-zinc-900 overflow-hidden bg-zinc-950">
              <ParticipantTile trackRef={track} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Baseline standard layout grid when no presentation track is requested
  return (
    <GridLayout tracks={cameraTracks} className="h-full w-full gap-3">
      <ParticipantTile />
    </GridLayout>
  );
}