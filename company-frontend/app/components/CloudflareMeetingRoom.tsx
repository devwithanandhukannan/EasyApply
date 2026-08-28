'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  ScreenShare, StopCircle, Users, CheckCircle, DoorOpen
} from 'lucide-react';
import api from '@/app/lib/axios';

interface CloudflareMeetingRoomProps {
  roomName: string;
  role: 'company' | 'candidate';
  userName?: string;
  onDisconnected?: () => void;
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
}: CloudflareMeetingRoomProps) {
  const router = useRouter();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
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

  // ── 1. ACQUIRE CAMERA + MIC ─────────────────────────────────────
  const releaseAllMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => { t.stop(); t.enabled = false; });
    localStreamRef.current = null;
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
    }).then((stream) => {
      if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
    }).catch((err) => console.warn('Camera/mic error:', err));
    return () => { active = false; releaseAllMedia(); };
  }, [releaseAllMedia]);

  // Keep local video attached after camera re-enables
  useEffect(() => {
    const stream = localStreamRef.current || localStream;
    if (stream && localVideoRef.current && !isVideoMuted) {
      if (localVideoRef.current.srcObject !== stream) localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isVideoMuted]);

  // ── 2. PUBLISH MY TRACKS ────────────────────────────────────────
  const publishTracks = useCallback(async (sid: string) => {
    if (hasPublishedRef.current || isCleaningUpRef.current) return;
    const stream = localStreamRef.current || localStream;
    if (!stream) return;
    hasPublishedRef.current = true;

    try {
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

      if (r.data?.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(r.data.sessionDescription));
      }
    } catch (err) {
      console.error('Host publish error:', err);
      hasPublishedRef.current = false;
      publishPcRef.current?.close();
      publishPcRef.current = null;
    }
  }, [localStream]);

  // ── 3. SUBSCRIBE TO A REMOTE PARTICIPANT ───────────────────────
  const subscribeTo = useCallback(async (remoteSid: string, mySid: string) => {
    if (subPcsRef.current[remoteSid] || isCleaningUpRef.current) return;
    try {
      const pc = new RTCPeerConnection(STUN);
      subPcsRef.current[remoteSid] = pc;

      pc.ontrack = (e) => {
        const stream = e.streams[0] || new MediaStream([e.track]);
        setRemoteStreams((prev) => ({ ...prev, [remoteSid]: stream }));
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

      if (r.data?.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(r.data.sessionDescription));
      }
    } catch (err) {
      console.error('Host subscribe error:', err);
      subPcsRef.current[remoteSid]?.close();
      delete subPcsRef.current[remoteSid];
      if (!isCleaningUpRef.current) {
        setTimeout(() => { const s = sessionIdRef.current; if (s) subscribeTo(remoteSid, s); }, 2000);
      }
    }
  }, []);

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
          sessionId: sid, name: userName, role: 'company', tracks: ['audio', 'video'],
        });

        publishTracks(sid);

        const beat = async () => {
          if (!alive || isCleaningUpRef.current) return;
          const curSid = sessionIdRef.current;
          if (!curSid) return;
          try {
            const r = await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/heartbeat`, {
              sessionId: curSid, role: 'company', name: userName,
            });
            if (!alive) return;

            publishTracks(curSid);

            const others: RemoteParticipant[] = (r.data?.participants || []).filter((p: any) => p.sessionId !== curSid);
            setRemoteParticipants(others);

            others.forEach((p) => {
              if (!subPcsRef.current[p.sessionId]) subscribeTo(p.sessionId, curSid);
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
        console.error('Host init error:', err);
      }
    };

    init();

    const handleBeforeUnload = () => {
      const sid = sessionIdRef.current;
      if (sid) {
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL || ''}/api/calls/rooms/${encodeURIComponent(roomName)}/leave`,
          JSON.stringify({ sessionId: sid, role: 'company' })
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomName, userName, publishTracks, subscribeTo, releaseAllMedia]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCleaningUpRef.current = true;
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      releaseAllMedia();
      publishPcRef.current?.close();
      Object.values(subPcsRef.current).forEach((pc) => pc.close());
      const sid = sessionIdRef.current;
      if (sid) api.post(`/calls/rooms/${encodeURIComponent(roomName)}/leave`, { sessionId: sid, role: 'company' }).catch(() => {});
    };
  }, [roomName, releaseAllMedia]);

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

  const handleEndInterview = async () => {
    releaseAllMedia();
    try {
      await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/end`);
    } catch {}
    if (onDisconnected) {
      onDisconnected();
    } else {
      router.replace('/dashboard/walkin');
    }
  };

  // ── MAIN VIDEO UI ───────────────────────────────────────────────
  return (
    <div className="h-screen w-screen bg-[#09090b] text-[#f5f5f7] flex flex-col overflow-hidden select-none font-sans antialiased relative">
      {/* ─── TOP HEADER ──────────────────────────────────────────────── */}
      <div className="h-14 px-6 bg-black/60 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center shadow-md shadow-[#0071e3]/20">
            <DoorOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
              <span>{roomName}</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Host Active • Cloudflare SFU
              </span>
            </h2>
            <p className="text-[10px] text-[#86868b]">
              {remoteParticipants.length > 0 ? 'Connected with Candidate' : 'Host Ready • Waiting for Candidate'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-zinc-300">
            <Users className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>{remoteParticipants.length + 1} In Room</span>
          </div>
        </div>
      </div>

      {/* ─── MAIN VIDEO GRID ─────────────────────────────────────────── */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative overflow-hidden bg-radial from-zinc-900/40 to-[#09090b]">
        {/* Local Host Tile */}
        <div className="relative rounded-3xl overflow-hidden bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center shadow-2xl group">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
          />
          {isVideoMuted && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center font-bold text-2xl text-white">
                {userName.charAt(0)}
              </div>
              <p className="text-xs text-zinc-400 font-medium">Camera is turned off</p>
            </div>
          )}

          <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.1] text-xs font-semibold text-white">
            <span>{userName} (Host)</span>
            <span className="text-[10px] text-[#0071e3] font-bold uppercase">• Company Admin</span>
          </div>

          {isAudioMuted && (
            <div className="absolute top-4 right-4 p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
              <MicOff className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Remote Candidate Tile */}
        {remoteParticipants.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center text-center p-8 bg-zinc-900/20">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.06] text-zinc-500 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Waiting for candidate to join...
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              The candidate will automatically connect into this room with live video upon entering.
            </p>
          </div>
        ) : (
          remoteParticipants.map((p) => {
            const stream = remoteStreams[p.sessionId];
            return (
              <div
                key={p.sessionId}
                className="relative rounded-3xl overflow-hidden bg-zinc-900/80 border border-white/[0.08] flex items-center justify-center shadow-2xl"
              >
                {stream ? (
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
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center font-bold text-2xl text-white">
                      {p.name.charAt(0)}
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">Connecting WebRTC video stream...</p>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.1] text-xs font-semibold text-white">
                  <span>{p.name}</span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">• Candidate</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── BOTTOM CONTROLS DOCK ────────────────────────────────────── */}
      <div className="h-20 px-6 bg-black/80 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-center gap-3 z-20 shrink-0">
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-2xl font-semibold transition-all cursor-pointer flex items-center gap-2 text-xs ${
            isAudioMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'
          }`}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl font-semibold transition-all cursor-pointer flex items-center gap-2 text-xs ${
            isVideoMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'
          }`}
          title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl font-semibold transition-all cursor-pointer flex items-center gap-2 text-xs ${
            isScreenSharing
              ? 'bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/30'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'
          }`}
          title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
        >
          {isScreenSharing ? <StopCircle className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
        </button>

        <button
          onClick={handleEndInterview}
          className="px-6 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer ml-2"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Interview</span>
        </button>
      </div>
    </div>
  );
}
