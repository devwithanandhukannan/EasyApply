// app/components/LiveKitMeetingRoom.tsx
'use client';

import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomName,
  useTracks,
  RoomAudioRenderer,
  useRoomContext,
  useDataChannel,
} from '@livekit/components-react';

import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, X, Send } from 'lucide-react';

interface LiveKitMeetingRoomProps {
  token: string;
  serverUrl: string;
  interviewId: string;
  onDisconnected?: () => void;
}

export default function LiveKitMeetingRoom({
  token,
  serverUrl,
  interviewId,
  onDisconnected,
}: LiveKitMeetingRoomProps) {
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const router = useRouter();

  return (
    <div
      className="h-screen w-screen bg-zinc-950 text-white flex flex-col overflow-hidden select-none"
      data-lk-theme="default"
    >
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={() => {
          if (onDisconnected) onDisconnected();
          router.push(`/dashboard/interviews/${interviewId}/review`);
        }}
        onConnected={() => console.log('✅ LiveKit connected')}
        onError={(error) => {
          console.error('❌ LiveKit error:', error);
          setConnectionError(error);
        }}
        connectOptions={{ autoSubscribe: true }}
        className="flex flex-col h-full"
      >
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

        <MeetingBody />

        <RoomAudioRenderer />

        <div className="border-t border-zinc-900 bg-zinc-950 p-4 flex justify-center">
          <ControlBar variation="minimal" controls={{ leave: true, screenShare: true }} />
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

// ─── Meeting Body (Video + Chat) ─────────────────────────────────────────────

function MeetingBody() {
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
    <div className="flex-1 min-h-0 flex relative">
      {/* Video area */}
      <div className="flex-1 min-h-0 bg-black relative p-4">
        <MeetingVideoGrid />
        
        {/* 🟢 FIXED: Only render the chat trigger button when the chat panel is CLOSED */}
        {/* This completely eliminates button collision or duplicate close icons */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="absolute bottom-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 shadow-xl transition-all duration-200"
            title="Open chat"
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-zinc-300" />
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold flex items-center justify-center text-black">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div className="w-80 shrink-0 flex flex-col border-l border-zinc-900 bg-zinc-950 z-10">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-zinc-900 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Chat</span>
            <button 
              onClick={() => setChatOpen(false)} 
              className="p-1 rounded hover:bg-zinc-900 transition-colors"
              title="Close chat"
            >
              <X className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
            {messages.length === 0 && (
              <p className="text-[11px] text-zinc-600 text-center mt-8">No messages yet</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.isSelf ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-zinc-500 mb-1 px-1 max-w-[200px] truncate">
                  {m.isSelf ? 'You' : m.sender}
                </span>
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-[12px] leading-relaxed break-words shadow-sm ${
                    m.isSelf
                      ? 'bg-emerald-600 text-white rounded-tr-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-zinc-600 mt-1 px-1">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-4 border-t border-zinc-900 bg-zinc-950 flex gap-2 items-end">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 resize-none bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 max-h-24 overflow-y-auto"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0 shadow-md"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Video Grid ───────────────────────────────────────────────────────────────

function MeetingVideoGrid() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  return (
    <GridLayout tracks={tracks} className="h-full w-full gap-4">
      <ParticipantTile />
    </GridLayout>
  );
}