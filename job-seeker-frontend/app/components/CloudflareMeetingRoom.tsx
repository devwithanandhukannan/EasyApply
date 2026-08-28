'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  ScreenShare, StopCircle, Users, CheckCircle,
} from 'lucide-react';
import api from '@/app/lib/axios';

interface CloudflareMeetingRoomProps {
  roomName: string;
  role: 'company' | 'candidate';
  userName?: string;
  onDisconnected?: () => void;
  onAdmittedStatusChange?: (isAdmitted: boolean) => void;
  onLocalStream?: (stream: MediaStream) => void;
}

interface RemoteParticipant {
  sessionId: string;
  name: string;
  role: string;
}

const STUN: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export default function CloudflareMeetingRoom({
  roomName,
  role,
  userName = role === 'company' ? 'Interviewer' : 'Candidate',
  onDisconnected,
  onAdmittedStatusChange,
  onLocalStream,
}: CloudflareMeetingRoomProps) {
  const router = useRouter();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const publishPcRef = useRef<RTCPeerConnection | null>(null);
  const hasPublishedRef = useRef(false);
  const subPcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const heartbeatTimerRef = useRef<any>(null);
  const isCleaningUpRef = useRef(false);

  useEffect(() => {
    onAdmittedStatusChange?.(true);
  }, [onAdmittedStatusChange]);

  const releaseAllMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => { t.stop(); t.enabled = false; });
    localStreamRef.current = null;
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  // ── 1. PUBLISH TRACKS FUNCTION ──────────────────────────────────
  const publishTracks = useCallback(async (sid: string) => {
    if (hasPublishedRef.current || isCleaningUpRef.current) return;
    const stream = localStreamRef.current || localStream;
    if (!stream) return;
    hasPublishedRef.current = true;

    try {
      console.log('[WebRTC] Publishing local media tracks to Cloudflare Calls...');
      const pc = new RTCPeerConnection(STUN);
      publishPcRef.current = pc;

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((res) => {
        if (pc.iceGatheringState === 'complete') return res();
        const cb = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', cb); res(); } };
        pc.addEventListener('icegatheringstatechange', cb);
        setTimeout(res, 800);
      });

      const tracksToPublish = pc.getTransceivers().map((t, idx) => ({
        location: 'local',
        mid: t.mid || String(idx),
        trackName: t.sender.track?.kind || (idx === 0 ? 'audio' : 'video'),
      }));

      const r = await api.post(`/calls/session/${sid}/tracks/new`, {
        sessionDescription: { type: pc.localDescription?.type || 'offer', sdp: pc.localDescription?.sdp },
        tracks: tracksToPublish,
      });

      if (!r.data?.sessionDescription) {
        throw new Error(r.data?.message || 'Publish failed: missing sessionDescription');
      }

      await pc.setRemoteDescription(new RTCSessionDescription(r.data.sessionDescription));
      console.log('✅ [WebRTC] Published tracks successfully to Cloudflare.');
    } catch (err) {
      console.error('❌ [WebRTC] Publish error:', err);
      hasPublishedRef.current = false;
      publishPcRef.current?.close();
      publishPcRef.current = null;
    }
  }, [localStream]);

  // ── 2. SUBSCRIBE TO A REMOTE PARTICIPANT ───────────────────────
  const subscribeTo = useCallback(async (remoteSid: string, mySid: string) => {
    if (subPcsRef.current[remoteSid] || isCleaningUpRef.current) return;
    try {
      console.log('[WebRTC] Subscribing to participant:', remoteSid);
      const pc = new RTCPeerConnection(STUN);
      subPcsRef.current[remoteSid] = pc;

      const inboundStream = new MediaStream();
      pc.ontrack = (e) => {
        console.log('🎥 [WebRTC] Received track:', e.track.kind, 'from', remoteSid);
        if (e.track) {
          inboundStream.addTrack(e.track);
          setRemoteStreams((prev) => ({
            ...prev,
            [remoteSid]: new MediaStream(inboundStream.getTracks()),
          }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE connection state with ${remoteSid}:`, pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          subPcsRef.current[remoteSid]?.close();
          delete subPcsRef.current[remoteSid];
        }
      };

      const audio = pc.addTransceiver('audio', { direction: 'recvonly' });
      const video = pc.addTransceiver('video', { direction: 'recvonly' });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((res) => {
        if (pc.iceGatheringState === 'complete') return res();
        const cb = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', cb); res(); } };
        pc.addEventListener('icegatheringstatechange', cb);
        setTimeout(res, 800);
      });

      const r = await api.post(`/calls/session/${mySid}/tracks/new`, {
        sessionDescription: { type: pc.localDescription?.type || 'offer', sdp: pc.localDescription?.sdp },
        tracks: [
          { location: 'remote', sessionId: remoteSid, trackName: 'audio', mid: audio.mid || '0' },
          { location: 'remote', sessionId: remoteSid, trackName: 'video', mid: video.mid || '1' },
        ],
      });

      if (!r.data?.sessionDescription) {
        throw new Error(r.data?.message || 'Subscribe failed: missing sessionDescription');
      }

      await pc.setRemoteDescription(new RTCSessionDescription(r.data.sessionDescription));
      console.log('✅ [WebRTC] Subscribed to remote participant:', remoteSid);
    } catch (err) {
      console.error('❌ [WebRTC] Subscribe error for', remoteSid, err);
      subPcsRef.current[remoteSid]?.close();
      delete subPcsRef.current[remoteSid];
      if (!isCleaningUpRef.current) {
        setTimeout(() => {
          const s = sessionIdRef.current;
          if (s && !isCleaningUpRef.current && !subPcsRef.current[remoteSid]) {
            subscribeTo(remoteSid, s);
          }
        }, 1500);
      }
    }
  }, []);

  // ── 3. ACQUIRE CAMERA + MIC ─────────────────────────────────────
  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    }).then((stream) => {
      if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
      localStreamRef.current = stream;
      setLocalStream(stream);
      onLocalStream?.(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      if (sessionIdRef.current) {
        publishTracks(sessionIdRef.current);
      }
    }).catch((err) => console.warn('Camera/mic error:', err));

    return () => { active = false; releaseAllMedia(); };
  }, [releaseAllMedia, onLocalStream, publishTracks]);

  // Keep local video attached after camera re-enables
  useEffect(() => {
    const stream = localStreamRef.current || localStream;
    if (stream && localVideoRef.current && !isVideoMuted) {
      if (localVideoRef.current.srcObject !== stream) localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isVideoMuted]);

  // ── 4. JOIN + HEARTBEAT LOOP ────────────────────────────────────
  useEffect(() => {
    let alive = true;
    let timer: any;

    const init = async () => {
      try {
        const sessionRes = await api.post('/calls/session/new');
        if (!sessionRes.data?.sessionId) throw new Error('No sessionId');
        const sid = sessionRes.data.sessionId;
        sessionIdRef.current = sid;

        await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/join`, {
          sessionId: sid, name: userName, role, tracks: ['audio', 'video'],
        });

        if (localStreamRef.current) {
          publishTracks(sid);
        }

        const beat = async () => {
          if (!alive || isCleaningUpRef.current) return;
          const curSid = sessionIdRef.current;
          if (!curSid) return;
          try {
            const r = await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/heartbeat`, {
              sessionId: curSid, role, name: userName,
            });
            if (!alive) return;
            if (r.data?.isEnded) { setIsSessionEnded(true); releaseAllMedia(); return; }

            publishTracks(curSid);

            const others: RemoteParticipant[] = (r.data?.participants || []).filter((p: any) => p.sessionId !== curSid);
            setRemoteParticipants(others);

            others.forEach((p) => {
              if (!subPcsRef.current[p.sessionId]) {
                subscribeTo(p.sessionId, curSid);
              }
            });

            const activeIds = new Set(others.map((p) => p.sessionId));
            Object.keys(subPcsRef.current).forEach((id) => {
              if (!activeIds.has(id)) {
                subPcsRef.current[id]?.close();
                delete subPcsRef.current[id];
                setRemoteStreams((prev) => { const n = { ...prev }; delete n[id]; return n; });
              }
            });
          } catch {}
        };

        beat();
        timer = setInterval(beat, 2000);
        heartbeatTimerRef.current = timer;
      } catch (err) {
        console.error('Init error:', err);
      }
    };

    init();

    const handleBeforeUnload = () => {
      const sid = sessionIdRef.current;
      if (sid) {
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL || ''}/api/calls/rooms/${encodeURIComponent(roomName)}/leave`,
          JSON.stringify({ sessionId: sid, role })
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomName, userName, role, publishTracks, subscribeTo, releaseAllMedia]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCleaningUpRef.current = true;
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      releaseAllMedia();
      publishPcRef.current?.close();
      Object.values(subPcsRef.current).forEach((pc) => pc.close());
      const sid = sessionIdRef.current;
      if (sid) api.post(`/calls/rooms/${encodeURIComponent(roomName)}/leave`, { sessionId: sid, role }).catch(() => {});
    };
  }, [roomName, role, releaseAllMedia]);

  // ── MEDIA CONTROLS ──────────────────────────────────────────────
  const toggleAudio = () => {
    const track = (localStreamRef.current || localStream)?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsAudioMuted(!track.enabled);
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current || localStream;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoMuted(!track.enabled);
    if (track.enabled && localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }
  };

  const toggleScreenShare = async () => {
    const pc = publishPcRef.current;
    const stream = localStreamRef.current || localStream;
    if (!pc || !stream) return;
    if (isScreenSharing) {
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      const camTrack = stream.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && camTrack) await sender.replaceTrack(camTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const t = screen.getVideoTracks()[0];
        screenTrackRef.current = t;
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(t);
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
        t.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch {}
    }
  };

  const handleLeave = () => {
    releaseAllMedia();
    onDisconnected ? onDisconnected() : router.replace('/dashboard/applications');
  };

  if (isSessionEnded) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Session Ended</h2>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-6">
          The interviewer has concluded this session.
        </p>
        <button onClick={handleLeave} className="px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all cursor-pointer">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#09090b] text-[#f5f5f7] flex flex-col overflow-hidden select-none antialiased">
      {/* Top Bar */}
      <div className="h-12 px-4 bg-black/60 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-tight">{roomName}</span>
          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Live
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <Users className="w-3.5 h-3.5 text-[#0071e3]" />
          <span>{remoteParticipants.length + 1} Connected</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-3 grid grid-cols-1 gap-3 relative overflow-hidden">
        {remoteParticipants.length > 0 ? (
          remoteParticipants.map((p) => {
            const stream = remoteStreams[p.sessionId];
            const hasTracks = stream && stream.getTracks().length > 0;
            return (
              <div key={p.sessionId} className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] flex items-center justify-center shadow-2xl">
                {hasTracks ? (
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el && el.srcObject !== stream) {
                        el.srcObject = stream;
                        el.play().catch(() => {});
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center font-bold text-xl text-white">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs text-zinc-400">Connecting video stream...</p>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.1] text-[11px] font-semibold text-white">
                  <span>{p.name}</span>
                  <span className="text-[9px] text-[#0071e3] font-bold uppercase">• {p.role === 'company' ? 'Host' : 'Candidate'}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.08] flex flex-col items-center justify-center text-center p-6 bg-zinc-900/30">
            <Users className="w-8 h-8 text-zinc-600 animate-pulse mb-2" />
            <p className="text-xs text-zinc-400 font-medium">Waiting for others to join...</p>
          </div>
        )}

        {/* Self PiP */}
        <div className="absolute bottom-4 right-4 w-40 h-28 rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.15] shadow-2xl z-30">
          <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`} />
          {isVideoMuted && (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs text-zinc-500 font-medium">Camera Off</div>
          )}
          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[9px] font-semibold text-white">You</div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-16 px-4 bg-black/80 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-center gap-2.5 z-20 shrink-0">
        <button onClick={toggleAudio} className={`p-3 rounded-2xl font-semibold transition-all cursor-pointer ${isAudioMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'}`}>
          {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button onClick={toggleVideo} className={`p-3 rounded-2xl font-semibold transition-all cursor-pointer ${isVideoMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'}`}>
          {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
        </button>
        <button onClick={toggleScreenShare} className={`p-3 rounded-2xl font-semibold transition-all cursor-pointer ${isScreenSharing ? 'bg-[#0071e3] text-white' : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'}`}>
          {isScreenSharing ? <StopCircle className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
        </button>
        <button onClick={handleLeave} className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-2">
          <PhoneOff className="w-3.5 h-3.5" /><span>Leave</span>
        </button>
      </div>
    </div>
  );
}
