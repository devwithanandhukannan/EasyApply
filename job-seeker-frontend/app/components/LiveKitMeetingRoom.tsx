// app/components/LiveKitMeetingRoom.tsx
'use client';

import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
  TrackRef,
} from '@livekit/components-react';

import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { useState, useEffect, useCallback, useRef } from 'react';
import AttentionMonitor, { ENABLE_ATTENTION_MONITORING } from './AttentionMonitor';
import { useGlassToast } from '@/app/components/GlassToastContainer';

interface LiveKitMeetingRoomProps {
  token: string;
  serverUrl: string;
  onDisconnected: () => void;
  screenShareActive: boolean;
  debugMode?: boolean;
}

export default function LiveKitMeetingRoom({
  token,
  serverUrl,
  onDisconnected,
  screenShareActive,
  debugMode = false,
}: LiveKitMeetingRoomProps) {
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [attentionScore, setAttentionScore] = useState(100);
  const [isConnected, setIsConnected] = useState(false);
  const [alertActive, setAlertActive] = useState(false);
  const [alertType, setAlertType] = useState<'noFace' | 'multipleFaces' | 'lookingAway' | null>(null);
  const { showToast } = useGlassToast();
  const toastCooldown = useRef<Record<string, number>>({});

  const handleScoreChange = useCallback((score: number) => {
    setAttentionScore(score);
  }, []);

  const handleWarning = useCallback(
    (type: 'noFace' | 'multipleFaces' | 'lookingAway', active: boolean) => {
      if (active) {
        setAlertActive(true);
        setAlertType(type);

        // Debounce toasts per type (5s cooldown)
        const now = Date.now();
        if (!toastCooldown.current[type] || now - toastCooldown.current[type] > 5000) {
          toastCooldown.current[type] = now;
          const messages: Record<string, string> = {
            noFace: 'No face detected. Please stay in frame.',
            multipleFaces: 'Multiple faces detected.',
            lookingAway: 'Please look at the screen.',
          };
          showToast('Attention', messages[type], 'error');
        }
      } else {
        // Only clear if no other warnings are still active
        setAlertType((prev) => (prev === type ? null : prev));
        setAlertActive((prev) => {
          // We'll let the null check on alertType handle the overlay
          return false;
        });
      }
    },
    [showToast]
  );

  // Sync alertActive with alertType
  useEffect(() => {
    setAlertActive(alertType !== null);
  }, [alertType]);

  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setConnectionError(null);
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    onDisconnected();
  }, [onDisconnected]);

  const handleError = useCallback((error: Error) => {
    setConnectionError(error);
    setIsConnected(false);
  }, []);

  return (
    <div
      className="h-full w-full text-white flex flex-col overflow-hidden select-none transition-colors duration-700"
      style={{
        background: alertActive
          ? 'linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #1a0000 100%)'
          : '#000000',
      }}
      data-lk-theme="default"
    >
      {/* Subtle red border pulse when alert is active */}
      {alertActive && (
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-none"
          style={{
            boxShadow: 'inset 0 0 0 2px rgba(239,68,68,0.6)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}

      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={handleDisconnected}
        onConnected={handleConnected}
        onError={handleError}
        connectOptions={{ autoSubscribe: true }}
        className="flex flex-col h-full relative"
      >
        {/* Connection error pill */}
        {connectionError && (
          <div className="px-4 py-2.5 text-xs text-red-400 bg-red-950/30 border-b border-red-900/40 flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
            {connectionError.message}
          </div>
        )}

        {/* Debug attention score pill */}
        {debugMode && ENABLE_ATTENTION_MONITORING && (
          <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 text-[10px] font-mono text-zinc-400 flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: attentionScore > 60 ? '#22c55e' : attentionScore > 30 ? '#f59e0b' : '#ef4444' }}
            />
            Attention {attentionScore}
          </div>
        )}

        {/* Screen Share Sync */}
        <ScreenShareSync active={screenShareActive} />

        {/* Attention Monitor — only mounts when flag is true */}
        {ENABLE_ATTENTION_MONITORING && isConnected && (
          <AttentionMonitor
            debug={debugMode}
            onScoreChange={handleScoreChange}
            onWarning={handleWarning}
          />
        )}

        {/* Alert banner — minimal, no icons */}
        {alertActive && alertType && (
          <div
            className="shrink-0 px-5 py-2.5 text-center text-[11px] font-medium tracking-wide border-b"
            style={{
              background: 'rgba(239,68,68,0.12)',
              borderColor: 'rgba(239,68,68,0.25)',
              color: 'rgba(252,165,165,0.9)',
            }}
          >
            {alertType === 'noFace' && 'No face detected — please stay in frame'}
            {alertType === 'multipleFaces' && 'Multiple faces detected'}
            {alertType === 'lookingAway' && 'Please look at the screen'}
          </div>
        )}

        {/* Main Video Grid */}
        <div className="flex-1 min-h-0 relative p-2.5">
          <AdaptiveMeetingGrid alertActive={alertActive} />
        </div>

        <RoomAudioRenderer />

        {/* Control Bar */}
        <div
          className="shrink-0 py-3 flex justify-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <ControlBar variation="minimal" controls={{ leave: false, screenShare: false }} />
        </div>
      </LiveKitRoom>
    </div>
  );
}

// ─── Screen Share Sync ───────────────────────────────────────────────────────

function ScreenShareSync({ active }: { active: boolean }) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room?.localParticipant) return;

    const toggle = async () => {
      try {
        const current = room.localParticipant.isScreenShareEnabled;
        if (active !== current) {
          await room.localParticipant.setScreenShareEnabled(active);
        }
      } catch (err) {
        console.error('Screen share toggle failed:', err);
      }
    };

    toggle();
  }, [active, room]);

  return null;
}

// ─── Adaptive Grid ───────────────────────────────────────────────────────────

function AdaptiveMeetingGrid({ alertActive }: { alertActive: boolean }) {
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const screenShareTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);

  const tileStyle = alertActive
    ? { outline: '1.5px solid rgba(239,68,68,0.35)', outlineOffset: '-1px' }
    : {};

  if (screenShareTracks.length > 0) {
    const primary = screenShareTracks[0];

    return (
      <div className="flex flex-col lg:flex-row h-full w-full gap-2.5">
        {/* Primary screen share */}
        <div
          className="flex-1 rounded-2xl overflow-hidden relative min-w-0 min-h-0"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: alertActive ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <ParticipantTile trackRef={primary} className="h-full w-full object-contain" />
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-semibold"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: 'rgba(134,239,172,0.9)', border: '1px solid rgba(134,239,172,0.15)' }}
          >
            Presenting
          </div>
        </div>

        {/* Camera thumbnails */}
        <div className="w-full lg:w-44 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-[110px] lg:max-h-full min-h-0">
          {cameraTracks.map((track: TrackRef) => (
            <div
              key={`${track.participant.identity}-${track.source}`}
              className="w-36 lg:w-full h-24 lg:h-28 shrink-0 rounded-xl overflow-hidden relative group"
              style={{
                background: '#0a0a0a',
                border: alertActive ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.06)',
                ...tileStyle,
              }}
            >
              <ParticipantTile trackRef={track} />
              <div
                className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-lg text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
              >
                {track.participant.identity}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <GridLayout tracks={cameraTracks} className="h-full w-full gap-2.5">
      <ParticipantTile />
    </GridLayout>
  );
}