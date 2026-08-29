'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  ScreenShare, StopCircle, Users
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

const BASE_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' },
  ],
  bundlePolicy: 'max-bundle',
};

/** Waits for ICE gathering to complete (max 3 s) before sending SDP to Cloudflare */
function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') { resolve(); return; }
    const timeout = setTimeout(resolve, 3000);
    const handler = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timeout);
        pc.removeEventListener('icegatheringstatechange', handler);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', handler);
  });
}

function RemoteVideoTile({ stream, name, role }: { stream: MediaStream | null; name: string; role: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    videoEl.srcObject = stream;
    const play = () => videoEl.play().catch(() => {});
    play();
    videoEl.addEventListener('loadedmetadata', play);
    videoEl.addEventListener('canplay', play);
    stream.addEventListener('addtrack', play);

    return () => {
      videoEl.removeEventListener('loadedmetadata', play);
      videoEl.removeEventListener('canplay', play);
      stream.removeEventListener('addtrack', play);
    };
  }, [stream]);

  return (
    <div className="relative w-full h-full min-h-[260px] rounded-3xl overflow-hidden bg-zinc-900/90 border border-white/[0.12] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] group transition-all duration-300">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      {/* Participant Info Tag */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.12] text-xs font-semibold text-white shadow-xl">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="tracking-wide">{name}</span>
        <span className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {role === 'candidate' ? 'Candidate' : 'Participant'}
        </span>
      </div>

      {/* Network / Stream Quality Indicator */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-medium text-zinc-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>HD 720p</span>
      </div>
    </div>
  );
}

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
  const [copiedLink, setCopiedLink] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const publishPcRef = useRef<RTCPeerConnection | null>(null);
  const isPublishingRef = useRef(false);
  const hasPublishedRef = useRef(false);
  const subPcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const isSubscribingRef = useRef<Record<string, boolean>>({});
  const heartbeatTimerRef = useRef<any>(null);
  const isCleaningUpRef = useRef(false);
  const rtcConfigRef = useRef<RTCConfiguration>(BASE_RTC_CONFIG);

  const releaseAllMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => { t.stop(); t.enabled = false; });
    localStreamRef.current = null;
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  // ── 1. PUBLISH TRACKS (OFFICIAL CLOUDFLARE CALLS PROTOCOL) ──────────
  const publishTracks = useCallback(async (sid: string, stream: MediaStream) => {
    if (hasPublishedRef.current || isPublishingRef.current || isCleaningUpRef.current) return;
    isPublishingRef.current = true;

    try {
      console.log('[WebRTC] Host publishing local tracks with session:', sid);
      const pc = new RTCPeerConnection(rtcConfigRef.current);
      publishPcRef.current = pc;

      const transceivers = stream.getTracks().map((track) =>
        pc.addTransceiver(track, { direction: 'sendonly' })
      );

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const tracksToPublish = transceivers.map(({ mid, sender }) => ({
        location: 'local',
        mid,
        trackName: sender.track?.kind || 'video',
      }));

      const r = await api.post(`/calls/session/${sid}/tracks/new`, {
        sessionDescription: {
          type: 'offer',
          sdp: offer.sdp,
        },
        tracks: tracksToPublish,
      });

      if (r.data?.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(r.data.sessionDescription));
        hasPublishedRef.current = true;
        console.log('✅ [WebRTC] Host published tracks successfully.');
      }
    } catch (err) {
      console.warn('❌ [WebRTC] Host publish error:', err);
    } finally {
      isPublishingRef.current = false;
    }
  }, []);

  // ── 2. SUBSCRIBE TO A REMOTE PARTICIPANT ─────────────────────────────────
  const subscribeTo = useCallback(async (remoteSid: string, _mySid: string) => {
    if (subPcsRef.current[remoteSid] || isSubscribingRef.current[remoteSid] || isCleaningUpRef.current) return;
    isSubscribingRef.current[remoteSid] = true;

    try {
      console.log('[WebRTC] Host subscribing to remote participant:', remoteSid);

      const subSessionRes = await api.post('/calls/session/subscribe');
      const subSid = subSessionRes.data?.sessionId;
      if (!subSid) throw new Error('Failed to create subscribe session');

      const pc = new RTCPeerConnection(rtcConfigRef.current);
      subPcsRef.current[remoteSid] = pc;

      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.addTransceiver('video', { direction: 'recvonly' });

      const inboundStream = new MediaStream();
      pc.ontrack = (e) => {
        console.log('🎥 [WebRTC] Host received remote track:', e.track.kind);
        inboundStream.addTrack(e.track);
        setRemoteStreams((prev) => ({
          ...prev,
          [remoteSid]: inboundStream,
        }));
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] Host ICE state for ${remoteSid}:`, pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          subPcsRef.current[remoteSid]?.close();
          delete subPcsRef.current[remoteSid];
          setRemoteStreams((prev) => { const n = { ...prev }; delete n[remoteSid]; return n; });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const r = await api.post(`/calls/session/${subSid}/tracks/new`, {
        sessionDescription: { type: 'offer', sdp: offer.sdp },
        tracks: [
          { location: 'remote', sessionId: remoteSid, trackName: 'audio' },
          { location: 'remote', sessionId: remoteSid, trackName: 'video' },
        ],
      });

      console.log('[WebRTC] Host subscribe response for', remoteSid, ':', r.data);

      if (r.data?.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(r.data.sessionDescription));
        console.log('✅ [WebRTC] Host subscribed successfully to:', remoteSid);
      } else {
        console.warn('⚠️ [WebRTC] Host no answer from Cloudflare subscribe:', r.data);
        pc.close();
        delete subPcsRef.current[remoteSid];
      }
    } catch (err: any) {
      console.warn('❌ [WebRTC] Host subscribe error for', remoteSid, err?.response?.data || err?.message || err);
      subPcsRef.current[remoteSid]?.close();
      delete subPcsRef.current[remoteSid];
    } finally {
      delete isSubscribingRef.current[remoteSid];
    }
  }, []);


  useEffect(() => {
    let alive = true;
    let timer: any;

    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        });

        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        const sessionRes = await api.post('/calls/session/new');
        if (!sessionRes.data?.sessionId) throw new Error('Failed to create host session');
        const sid = sessionRes.data.sessionId;
        sessionIdRef.current = sid;

        if (sessionRes.data?.iceServers?.length) {
          rtcConfigRef.current = {
            ...BASE_RTC_CONFIG,
            iceServers: [...BASE_RTC_CONFIG.iceServers!, ...sessionRes.data.iceServers],
          };
          console.log('[WebRTC] Host TURN loaded from session, total ICE servers:', rtcConfigRef.current.iceServers!.length);
        }

        await publishTracks(sid, stream);

        await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/join`, {
          sessionId: sid,
          name: userName,
          role: 'company',
        });

        const beat = async () => {
          if (!alive || isCleaningUpRef.current) return;
          try {
            const res = await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/heartbeat`, {
              sessionId: sid,
            });
            const participants: RemoteParticipant[] = (res.data?.participants || []).filter(
              (p: RemoteParticipant) => p.sessionId !== sid
            );

            setRemoteParticipants(participants);

            for (const p of participants) {
              if (!subPcsRef.current[p.sessionId] && !isSubscribingRef.current[p.sessionId]) {
                subscribeTo(p.sessionId, sid);
              }
            }

            const activeIds = new Set(participants.map((p) => p.sessionId));
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
        timer = setInterval(beat, 3000);
        heartbeatTimerRef.current = timer;
      } catch (err) {
        console.error('Host start call error:', err);
      }
    };

    startCall();

    return () => {
      alive = false;
      clearInterval(timer);
      isCleaningUpRef.current = true;
      releaseAllMedia();
      publishPcRef.current?.close();
      Object.values(subPcsRef.current).forEach((pc) => pc.close());
    };
  }, [roomName, userName, publishTracks, subscribeTo, releaseAllMedia]);

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoMuted(!track.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenTrackRef.current?.stop();
      screenTrackRef.current = null;
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        setIsScreenSharing(false);
        screenTrackRef.current = null;
      };
    } catch {
      setIsScreenSharing(false);
    }
  };

  const handleEndCall = async () => {
    isCleaningUpRef.current = true;
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    const sid = sessionIdRef.current;
    try {
      await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/end`, { sessionId: sid });
    } catch {}
    releaseAllMedia();
    publishPcRef.current?.close();
    Object.values(subPcsRef.current).forEach((pc) => pc.close());

    if (onDisconnected) {
      onDisconnected();
    } else {
      router.push('/dashboard/interviews');
    }
  };

  const copyMeetingLink = () => {
    if (typeof window !== 'undefined') {
      const candidateUrl = `${window.location.origin.replace('company.', '')}/meet/${roomName}?role=candidate`;
      navigator.clipboard.writeText(candidateUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const primaryRemote = remoteParticipants[0];
  const primaryRemoteStream = primaryRemote ? remoteStreams[primaryRemote.sessionId] || null : null;

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#09090b] text-white overflow-hidden select-none font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Glass Header */}
      <header className="relative z-30 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-zinc-950/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 text-xs shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="font-mono font-medium text-zinc-200 tracking-wider">
              {roomName.length > 20 ? `${roomName.slice(0, 16)}...` : roomName}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-white/[0.08] text-xs text-zinc-300">
            <Users size={13} className="text-zinc-400" />
            <span>{remoteParticipants.length + 1} Connected</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>REC LIVE</span>
          </div>

          <button
            onClick={copyMeetingLink}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-zinc-200 transition active:scale-95 shadow-sm"
            title="Copy Candidate Invite Link"
          >
            <span>{copiedLink ? '✓ Copied Link' : 'Copy Invite'}</span>
          </button>
        </div>
      </header>

      {/* Center Video Stage - Auto-expanding, perfectly balanced grid */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 md:p-6 flex items-center justify-center min-h-0 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full h-full max-h-[82vh] items-stretch">
          {/* Host Local Video Card */}
          <div className="relative w-full h-full min-h-[260px] rounded-3xl overflow-hidden bg-zinc-900/90 border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-center group transition-all duration-300">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition duration-300 ${isVideoMuted ? 'hidden' : ''}`}
            />
            {isVideoMuted && (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-zinc-800 border border-white/15 flex items-center justify-center text-white font-bold text-3xl shadow-2xl">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-zinc-400 tracking-wide">Camera is Off</span>
              </div>
            )}
            {/* Host Tag */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/[0.12] text-xs font-semibold text-white shadow-xl">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
              <span className="tracking-wide">{userName}</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30">
                Host
              </span>
            </div>

            {/* Mic muted indicator on video tile */}
            {isAudioMuted && (
              <div className="absolute top-4 right-4 z-20 p-2 rounded-full bg-red-500/80 backdrop-blur-md text-white shadow-lg">
                <MicOff size={14} />
              </div>
            )}
          </div>

          {/* Remote Candidate Card / Waiting Tile */}
          <div className="relative w-full h-full min-h-[260px]">
            {primaryRemote ? (
              <RemoteVideoTile
                stream={primaryRemoteStream}
                name={primaryRemote.name}
                role={primaryRemote.role}
              />
            ) : (
              <div className="w-full h-full rounded-3xl overflow-hidden bg-zinc-900/40 border border-dashed border-white/[0.15] backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 relative shadow-inner">
                {/* Concentric Pulse Rings */}
                <div className="relative flex items-center justify-center mb-5">
                  <div className="absolute w-28 h-28 rounded-full bg-blue-500/10 animate-ping" />
                  <div className="w-20 h-20 rounded-full bg-zinc-800/90 border border-white/10 flex items-center justify-center text-zinc-300 shadow-2xl">
                    <Users size={32} className="text-blue-400" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 tracking-tight">
                  Waiting for Candidate to join...
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
                  Share the candidate invite link. As soon as the candidate enters, their live video & audio will appear here in real-time.
                </p>
                <button
                  onClick={copyMeetingLink}
                  className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center gap-2"
                >
                  <span>{copiedLink ? '✓ Link Copied!' : 'Copy Candidate Invite Link'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Bottom Controls Dock */}
      <footer className="relative z-30 pb-6 pt-2 flex items-center justify-center shrink-0">
        <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-zinc-900/85 backdrop-blur-2xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
          <button
            onClick={toggleAudio}
            className={`p-3.5 rounded-full transition-all duration-200 active:scale-95 shadow-md ${
              isAudioMuted
                ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-red-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white'
            }`}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? <MicOff size={19} /> : <Mic size={19} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-full transition-all duration-200 active:scale-95 shadow-md ${
              isVideoMuted
                ? 'bg-red-500/90 hover:bg-red-600 text-white shadow-red-500/20'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white'
            }`}
            title={isVideoMuted ? 'Start Camera' : 'Turn Off Camera'}
          >
            {isVideoMuted ? <VideoOff size={19} /> : <VideoIcon size={19} />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full transition-all duration-200 active:scale-95 shadow-md ${
              isScreenSharing
                ? 'bg-blue-600 text-white shadow-blue-600/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? <StopCircle size={19} /> : <ScreenShare size={19} />}
          </button>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          <button
            onClick={handleEndCall}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs transition-all duration-200 flex items-center gap-2 shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95"
          >
            <PhoneOff size={15} />
            <span>End Interview</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
