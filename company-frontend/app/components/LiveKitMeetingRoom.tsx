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
import { 
  MessageSquare, 
  X, 
  Send, 
  Users, 
  UserCheck, 
  SkipForward, 
  PhoneCall, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  DoorOpen,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from './GlassToastContainer';

interface LiveKitMeetingRoomProps {
  token: string;
  serverUrl: string;
  interviewId: string;
  onDisconnected?: () => void;
  iceServers?: any[];
}

export default function LiveKitMeetingRoom({
  token,
  serverUrl,
  interviewId,
  onDisconnected,
  iceServers,
}: LiveKitMeetingRoomProps) {
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const router = useRouter();

  const isWalkIn =
    typeof interviewId === 'string' &&
    (interviewId.startsWith('walkin-') ||
      interviewId.startsWith('room_') ||
      interviewId === 'default');
  const roomCode = isWalkIn ? interviewId.replace(/^walkin-/, '').split('-')[0] : null;

  return (
    <div
      className="h-screen w-screen bg-[#09090b] text-[#f5f5f7] flex flex-col overflow-hidden select-none font-sans antialiased"
      data-lk-theme="default"
    >
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={() => {
          if (onDisconnected) {
            onDisconnected();
          } else if (isWalkIn) {
            router.push('/dashboard/walkin');
          } else if (interviewId && interviewId !== 'default') {
            router.push(`/dashboard/interviews/${interviewId}/review`);
          } else {
            router.push('/dashboard/interviews');
          }
        }}
        onConnected={() => console.log('✅ LiveKit connected to room:', interviewId)}
        onError={(error) => {
          console.error('❌ LiveKit error:', error);
          setConnectionError(error);
        }}
        connectOptions={{
          autoSubscribe: true,
          ...(Array.isArray(iceServers) && iceServers.length > 0 ? { rtcConfig: { iceServers } } : {}),
        }}
        className="flex flex-col h-full"
      >
        {connectionError && (
          <div className="bg-red-500/20 border-b border-red-500/30 px-6 py-2.5 text-xs text-red-300 flex items-center justify-between">
            <span>Connection Error: {connectionError.message}</span>
            <button onClick={() => setConnectionError(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Top Header */}
        <div className="border-b border-white/[0.08] bg-[#121214]/90 backdrop-blur-md px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <span className="text-[#86868b] font-bold text-[11px] uppercase tracking-wider">
                {isWalkIn ? 'Walk-In Active Room' : 'Live Interview'}
              </span>
            </div>
            <div className="h-3.5 w-px bg-white/[0.1]" />
            <div className="flex items-center gap-1.5">
              <RoomName className="text-white font-bold text-xs" />
              {roomCode && (
                <span className="px-2 py-0.5 rounded-md bg-[#0071e3]/20 border border-[#0071e3]/30 text-[#0071e3] font-bold text-[10px] uppercase">
                  Code: {roomCode}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#86868b] font-medium hidden sm:inline">
              Encrypted WebRTC Channel
            </span>
          </div>
        </div>

        {/* Meeting Body with Integrated Walk-In Queue Manager */}
        <MeetingBody isWalkIn={isWalkIn} roomCode={roomCode} interviewId={interviewId} />

        <RoomAudioRenderer />

        {/* Bottom Meeting Controls */}
        <div className="border-t border-white/[0.08] bg-[#121214]/95 p-3 flex justify-center items-center">
          <ControlBar variation="minimal" controls={{ microphone: true, camera: true, screenShare: true, leave: true, chat: false, settings: false }} />
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

// ─── Meeting Body (Video + Live Queue Panel + Chat) ──────────────────────────

function MeetingBody({ 
  isWalkIn, 
  roomCode,
  interviewId 
}: { 
  isWalkIn: boolean; 
  roomCode: string | null;
  interviewId: string;
}) {
  const room = useRoomContext();
  const { showToast } = useGlassToast();

  // Panels
  const [chatOpen, setChatOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(true); // Default open in walkin mode
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [unread, setUnread] = useState(0);

  // Walk-In Queue State
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [roomDetails, setRoomDetails] = useState<any>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // ─── FETCH & POLL QUEUE ───────────────────────────────────────────────────
  const fetchQueueData = useCallback(async () => {
    if (!isWalkIn || !roomCode) return;
    try {
      const res = await api.get(`/walkin/rooms/${roomCode}/queue`);
      if (res.data?.success) {
        setQueue(res.data.queue || []);
        setRoomDetails(res.data.room || null);
      }
    } catch (err) {
      console.warn('Queue polling error:', err);
    }
  }, [isWalkIn, roomCode]);

  useEffect(() => {
    if (!isWalkIn || !roomCode) return;
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 3500);
    return () => clearInterval(interval);
  }, [isWalkIn, roomCode, fetchQueueData]);

  // Derived Candidate Groups
  const currentCandidate = queue.find((e) => e.status === 'interviewing');
  const waitingCandidates = queue.filter((e) => e.status === 'priority' || e.status === 'waiting');
  const priorityCount = queue.filter((e) => e.status === 'priority').length;
  const waitingCount = waitingCandidates.length;

  // ─── ACTION: CALL NEXT CANDIDATE (OR SPECIFIC CANDIDATE) ─────────────────
  const handleCallCandidate = async (targetEntryId?: string, prevStatus: string = 'done') => {
    if (!roomCode) return;
    setActionInProgress(true);
    try {
      // Send data channel broadcast so current candidate knows their session finished
      if (send) {
        try {
          const disconnectNotice = {
            type: 'walkin_transition',
            action: 'candidate_finished',
            nextCandidateId: targetEntryId,
            timestamp: Date.now()
          };
          send(encoder.encode(JSON.stringify(disconnectNotice)), { reliable: true });
        } catch (e) {
          console.warn('Data channel broadcast notice failed:', e);
        }
      }

      const res = await api.post(`/walkin/rooms/${roomCode}/call-next`, {
        entryId: targetEntryId,
        previousStatus: prevStatus,
      });

      if (res.data?.success) {
        showToast(
          'Candidate Called', 
          `Now admitting ${res.data.entry?.jobSeekerProfile?.fullName || 'next candidate'} into the room.`, 
          'success'
        );
        fetchQueueData();
      }
    } catch (err: any) {
      showToast('Action Failed', err.response?.data?.message || 'Failed to call candidate', 'danger');
    } finally {
      setActionInProgress(false);
    }
  };

  // ─── ACTION: SKIP CURRENT CANDIDATE ───────────────────────────────────────
  const handleSkipCurrent = async () => {
    if (!currentCandidate) {
      handleCallCandidate(undefined, 'skipped');
      return;
    }
    await handleCallCandidate(undefined, 'skipped');
  };

  // ─── ACTION: UPDATE STATUS (ACCEPT / REJECT / DONE) ───────────────────────
  const handleUpdateEntryStatus = async (entryId: string, status: string) => {
    setActionInProgress(true);
    try {
      const res = await api.put(`/walkin/queue/${entryId}/status`, { status });
      if (res.data?.success) {
        showToast('Status Updated', `Candidate marked as ${status}.`, 'success');
        fetchQueueData();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update status', 'danger');
    } finally {
      setActionInProgress(false);
    }
  };

  // ─── CHAT DATA CHANNEL ────────────────────────────────────────────────────
  const { send } = useDataChannel('chat', (msg) => {
    try {
      const parsed = JSON.parse(decoder.decode(msg.payload));
      if (parsed.type === 'walkin_transition') return; // Ignore control messages

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
      sender: room?.localParticipant?.identity ?? 'Interviewer',
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
    <div className="flex-1 min-h-0 flex relative overflow-hidden">
      
      {/* Video Meeting Canvas */}
      <div className="flex-1 min-h-0 bg-[#000000] relative flex flex-col">
        
        {/* Walk-In Live Queue In-Call Control Strip */}
        {isWalkIn && (
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none flex-wrap">
            
            {/* Active Candidate Status Capsule */}
            <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#18181b]/90 backdrop-blur-md border border-white/[0.1] shadow-xl text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              {currentCandidate ? (
                <div className="flex items-center gap-2">
                  <span className="text-[#86868b] font-medium">In Interview:</span>
                  <span className="font-bold text-white">
                    {currentCandidate.jobSeekerProfile?.fullName || 'Active Candidate'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    {Math.round(currentCandidate.skillScore || currentCandidate.priorityScore || 80)}% Match
                  </span>
                </div>
              ) : (
                <span className="text-[#86868b] font-medium">Room ready &bull; No candidate currently in call</span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={handleSkipCurrent}
                disabled={actionInProgress}
                className="px-3.5 py-2 rounded-2xl bg-[#27272a]/90 hover:bg-[#3f3f46] text-white border border-white/[0.1] shadow-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                title="Skip current candidate and admit next in queue"
              >
                <SkipForward className="w-3.5 h-3.5 text-amber-400" />
                <span>Skip &amp; Next</span>
              </button>

              <button
                onClick={() => handleCallCandidate()}
                disabled={actionInProgress || waitingCount === 0}
                className="px-4 py-2 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] hover:from-[#0062c4] hover:to-[#1d4ed8] text-white shadow-xl shadow-blue-500/25 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                title="Admit the next top candidate from the queue"
              >
                {actionInProgress ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                <span>Call Next ({waitingCount})</span>
              </button>

              <button
                onClick={() => {
                  setQueueOpen(!queueOpen);
                  if (chatOpen) setChatOpen(false);
                }}
                className={`px-3.5 py-2 rounded-2xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  queueOpen 
                    ? 'bg-[#0071e3] text-white border-[#0071e3] shadow-md shadow-blue-500/20' 
                    : 'bg-[#18181b]/90 hover:bg-[#27272a] text-white border-white/[0.1] shadow-xl'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Live Queue</span>
                {waitingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold flex items-center justify-center">
                    {waitingCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        )}

        {/* Video Grid */}
        <div className="flex-1 min-h-0 p-4">
          <MeetingVideoGrid />
        </div>

        {/* Bottom Floating Trigger Bar (when panels are closed) */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          {!chatOpen && (
            <button
              onClick={() => {
                setChatOpen(true);
                if (queueOpen) setQueueOpen(false);
              }}
              className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#18181b]/90 hover:bg-[#27272a] border border-white/[0.1] shadow-2xl transition-all cursor-pointer"
              title="Open Chat"
            >
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-white" />
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold flex items-center justify-center text-black">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ── WALK-IN LIVE QUEUE SIDE PANEL ──────────────────────────────── */}
      {isWalkIn && queueOpen && (
        <div className="w-88 shrink-0 flex flex-col border-l border-white/[0.08] bg-[#121214] z-30 animate-in slide-in-from-right duration-200">
          
          {/* Queue Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#0071e3]/15 text-[#0071e3] flex items-center justify-center">
                <DoorOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Live Candidate Queue</h3>
                <p className="text-[10px] text-[#86868b]">
                  {waitingCount} waiting &bull; {priorityCount} priority
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setQueueOpen(false)}
              className="w-7 h-7 rounded-full bg-white/[0.06] text-[#86868b] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Currently Interviewing Candidate Card */}
          {currentCandidate && (
            <div className="p-3.5 border-b border-white/[0.08] bg-gradient-to-b from-emerald-500/10 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active In Call
                </span>
                <span className="text-[10px] font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  {Math.round(currentCandidate.skillScore || 85)}% Match
                </span>
              </div>
              
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-white">
                  {currentCandidate.jobSeekerProfile?.fullName}
                </h4>
                <p className="text-[11px] text-[#86868b] truncate">
                  {currentCandidate.jobSeekerProfile?.email}
                </p>
              </div>

              {/* In-Call Verdict Controls */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
                <button
                  onClick={() => handleUpdateEntryStatus(currentCandidate.id, 'accepted')}
                  disabled={actionInProgress}
                  className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Pass / Accept</span>
                </button>
                <button
                  onClick={() => handleUpdateEntryStatus(currentCandidate.id, 'rejected')}
                  disabled={actionInProgress}
                  className="flex-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}

          {/* Waiting List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-0">
            {waitingCandidates.length === 0 ? (
              <div className="text-center py-10 px-4 text-[#86868b] space-y-2">
                <Users className="w-8 h-8 mx-auto opacity-40 text-[#0071e3]" />
                <p className="text-xs font-bold text-white">Queue Is Clear</p>
                <p className="text-[11px]">No other job seekers waiting right now.</p>
              </div>
            ) : (
              waitingCandidates.map((entry, idx) => {
                const isPriority = entry.status === 'priority';
                const score = Math.round(entry.skillScore || entry.priorityScore || 50);

                return (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                      isPriority 
                        ? 'bg-[#1c1c1e] border-blue-500/30 hover:border-blue-500/60' 
                        : 'bg-[#18181b] border-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#27272a] text-[#0071e3] font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white leading-tight">
                            {entry.jobSeekerProfile?.fullName || 'Candidate'}
                          </h4>
                          <p className="text-[10px] text-[#86868b] truncate max-w-[150px]">
                            {entry.jobSeekerProfile?.email}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isPriority ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.08] text-[#86868b]'
                      }`}>
                        {score}% Match
                      </span>
                    </div>

                    {/* Matched Skills Preview */}
                    {entry.cvAnalysis?.matchedSkills && entry.cvAnalysis.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.cvAnalysis.matchedSkills.slice(0, 3).map((skill: string, sIdx: number) => (
                          <span key={sIdx} className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[9px] text-zinc-300">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1 gap-2 border-t border-white/[0.04]">
                      <div className="text-[10px] text-[#86868b] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {entry.waitingSince 
                            ? Math.max(1, Math.round((Date.now() - new Date(entry.waitingSince).getTime()) / 60000)) + 'm wait'
                            : 'Just joined'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateEntryStatus(entry.id, 'skipped')}
                          disabled={actionInProgress}
                          className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[10px] font-semibold text-[#86868b] hover:text-white transition-colors cursor-pointer"
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => handleCallCandidate(entry.id)}
                          disabled={actionInProgress}
                          className="px-3 py-1 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white text-[11px] font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Admit Now</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Queue Footer Action */}
          <div className="p-3 border-t border-white/[0.08] bg-[#18181b]">
            <button
              onClick={() => handleCallCandidate()}
              disabled={actionInProgress || waitingCount === 0}
              className="w-full py-2.5 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] hover:from-[#0062c4] hover:to-[#1d4ed8] text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {actionInProgress ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              <span>Admit Next Candidate in Queue</span>
            </button>
          </div>

        </div>
      )}

      {/* ── IN-MEETING TEXT CHAT PANEL ─────────────────────────────────── */}
      {chatOpen && (
        <div className="w-80 shrink-0 flex flex-col border-l border-white/[0.08] bg-[#121214] z-30 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Session Chat</span>
            <button 
              onClick={() => setChatOpen(false)} 
              className="p-1 rounded-full hover:bg-white/[0.06] text-[#86868b] hover:text-white transition-colors cursor-pointer"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0 custom-scrollbar">
            {messages.length === 0 && (
              <p className="text-[11px] text-[#86868b] text-center mt-8 font-medium">No messages yet</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.isSelf ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-[#86868b] mb-1 px-1 max-w-[200px] truncate">
                  {m.isSelf ? 'You' : m.sender}
                </span>
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-[12px] leading-relaxed break-words shadow-xs ${
                    m.isSelf
                      ? 'bg-[#0071e3] text-white rounded-tr-xs'
                      : 'bg-[#1c1c1e] border border-white/[0.08] text-[#f5f5f7] rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-[#86868b] mt-1 px-1">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-4 border-t border-white/[0.08] bg-[#121214] flex gap-2 items-end">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 resize-none bg-[#1c1c1e] border border-white/[0.08] rounded-2xl px-3.5 py-2 text-xs text-white placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] max-h-24 overflow-y-auto"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#0071e3] hover:bg-[#0062c4] disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0 shadow-md cursor-pointer"
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
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const gridCols =
    tracks.length <= 1
      ? 'grid-cols-1'
      : tracks.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : tracks.length <= 4
      ? 'grid-cols-2'
      : 'grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridCols} h-full w-full gap-3 items-center justify-center p-1`}>
      {tracks.map((track) => {
        const trackKey = `${track.participant.identity}_${track.source}_${track.publication?.trackSid || 'placeholder'}`;
        return (
          <div
            key={trackKey}
            className="w-full h-full min-h-0 min-w-0 rounded-2xl overflow-hidden relative bg-[#121214] border border-white/[0.08] shadow-lg flex items-center justify-center"
          >
            <ParticipantTile trackRef={track} className="w-full h-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}