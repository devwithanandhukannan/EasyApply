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
  TrackReference,
  useDataChannel,
} from '@livekit/components-react';

import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { useState, useEffect, useCallback, useRef } from 'react';
import AttentionMonitor, { ENABLE_ATTENTION_MONITORING } from './AttentionMonitor';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { MessageSquare, X, Send, Monitor } from 'lucide-react';

interface LiveKitMeetingRoomProps {
  token: string;
  serverUrl: string;
  onDisconnected: () => void;
  screenShareActive: boolean;
  debugMode?: boolean;
  iceServers?: any[];
}

export default function LiveKitMeetingRoom({
  token,
  serverUrl,
  onDisconnected,
  screenShareActive,
  debugMode = false,
  iceServers,
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
        const now = Date.now();
        if (!toastCooldown.current[type] || now - toastCooldown.current[type] > 5000) {
          toastCooldown.current[type] = now;
          const messages: Record<string, string> = {
            noFace: 'No face detected. Please stay in frame.',
            multipleFaces: 'Multiple faces detected.',
            lookingAway: 'Please look at the screen.',
          };
          showToast('Attention', messages[type], 'danger');
        }
      } else {
        setAlertType((prev) => (prev === type ? null : prev));
        setAlertActive(false);
      }
    },
    [showToast]
  );

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
        connectOptions={{
          autoSubscribe: true,
          rtcConfig: { iceServers: iceServers }
        }}
        className="flex flex-col h-full relative"
      >
        {connectionError && (
          <div className="px-4 py-2.5 text-xs text-red-400 bg-red-950/30 border-b border-red-900/40 flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
            {connectionError.message}
          </div>
        )}

        {debugMode && ENABLE_ATTENTION_MONITORING && (
          <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 text-[10px] font-mono text-zinc-400 flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{
                background:
                  attentionScore > 60 ? '#22c55e' : attentionScore > 30 ? '#f59e0b' : '#ef4444',
              }}
            />
            Attention {attentionScore}
          </div>
        )}

        <ScreenShareSync active={screenShareActive} />

        {ENABLE_ATTENTION_MONITORING && isConnected && (
          <AttentionMonitor
            debug={debugMode}
            onScoreChange={handleScoreChange}
            onWarning={handleWarning}
          />
        )}

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

        {/* Main content: video + chat side by side */}
        <div className="flex-1 min-h-0 flex relative">
          <div className="flex-1 min-h-0 relative p-2.5">
            <AdaptiveMeetingGrid alertActive={alertActive} />
          </div>
          <ChatPanel />
        </div>

        <RoomAudioRenderer />

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

// ─── Chat Message Type ────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel() {
  const room = useRoomContext();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const { send } = useDataChannel('chat', (msg) => {
    try {
      const parsed = JSON.parse(decoder.decode(msg.payload));
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: parsed.sender,
          text: parsed.text,
          timestamp: parsed.timestamp,
          isSelf: false,
        },
      ]);
      if (!chatOpen) setUnread((n) => n + 1);
    } catch {}
  });

  useEffect(() => {
    if (chatOpen) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [chatOpen, messages]);

  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (!text || !send) return;

    const payload = {
      sender: room?.localParticipant?.identity ?? 'You',
      text,
      timestamp: Date.now(),
    };

    try {
      send(encoder.encode(JSON.stringify(payload)), { reliable: true });
    } catch {}

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: 'You',
        text,
        timestamp: payload.timestamp,
        isSelf: true,
      },
    ]);
    setInputText('');
  }, [inputText, send, room, encoder]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle button — shown when panel is closed */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute bottom-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full transition-colors"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
          title="Open chat"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-zinc-300" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <div
          className="w-72 shrink-0 flex flex-col"
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Chat
              </span>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <p className="text-[11px] text-zinc-600 text-center mt-10">No messages yet</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.isSelf ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-zinc-500 mb-0.5 px-1">
                  {m.isSelf ? 'You' : m.sender}
                </span>
                <div
                  className={`max-w-[90%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed break-words ${
                    m.isSelf
                      ? 'rounded-br-sm text-white'
                      : 'rounded-bl-sm text-zinc-200'
                  }`}
                  style={
                    m.isSelf
                      ? { background: 'rgba(59,130,246,0.7)' }
                      : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }
                  }
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-zinc-600 mt-0.5 px-1">
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-3 flex gap-2 items-end shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 resize-none rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none max-h-24 overflow-y-auto"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'rgba(59,130,246,0.7)' }}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Screen Share Sync ────────────────────────────────────────────────────────

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

// ─── Adaptive Grid ────────────────────────────────────────────────────────────

function AdaptiveMeetingGrid({ alertActive }: { alertActive: boolean }) {
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const screenShareTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);

  const tileStyle = alertActive
    ? { outline: '1.5px solid rgba(239,68,68,0.35)', outlineOffset: '-1px' }
    : {};

  if (screenShareTracks.length > 0) {
    const primary = screenShareTracks[0];
    const isLocalScreenShare = primary.participant.isLocal;

    return (
      <div className="flex flex-col lg:flex-row h-full w-full gap-2.5">
        <div
          className="flex-1 rounded-2xl overflow-hidden relative min-w-0 min-h-0 flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: alertActive
              ? '1px solid rgba(239,68,68,0.3)'
              : '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {isLocalScreenShare ? (
            <div className="flex flex-col items-center justify-center text-white/50 h-full w-full">
              <Monitor className="w-12 h-12 mb-3 opacity-50 text-blue-400" />
              <p className="text-sm font-medium">You are sharing your screen</p>
              <p className="text-[10px] mt-1 text-white/30 uppercase tracking-widest">Preview disabled for performance</p>
            </div>
          ) : (
            <ParticipantTile trackRef={primary} className="h-full w-full object-contain" />
          )}
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-semibold"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              color: 'rgba(134,239,172,0.9)',
              border: '1px solid rgba(134,239,172,0.15)',
            }}
          >
            Presenting
          </div>
        </div>

        <div className="w-full lg:w-44 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-[110px] lg:max-h-full min-h-0">
          {cameraTracks.map((track: any) => (
            <div
              key={`${track.participant.identity}-${track.source}`}
              className="w-36 lg:w-full h-24 lg:h-28 shrink-0 rounded-xl overflow-hidden relative group"
              style={{
                background: '#0a0a0a',
                border: alertActive
                  ? '1px solid rgba(239,68,68,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
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