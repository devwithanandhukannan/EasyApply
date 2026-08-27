'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  ScreenShare, StopCircle, Users, DoorOpen, ShieldCheck,
  Power
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
  participantId: string;
  name: string;
  role: string;
  stream?: MediaStream;
}

export default function CloudflareMeetingRoom({
  roomName,
  role,
  userName = role === 'company' ? 'Interviewer' : 'Candidate',
  onDisconnected,
}: CloudflareMeetingRoomProps) {
  const router = useRouter();

  // Media & Devices State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Connection & Room State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing Cloudflare WebRTC...');
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  // Refs for WebRTC & Hardware Cleanup
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const publishPcRef = useRef<RTCPeerConnection | null>(null);
  const subPcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const heartbeatTimerRef = useRef<any>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isCleaningUpRef = useRef(false);

  const STUN_SERVERS: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  };

  // Helper to completely release camera, microphone, and screenshare hardware
  const releaseAllMediaHardware = () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        localStreamRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current.enabled = false;
        screenTrackRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    } catch (e) {
      console.error('Error releasing media hardware:', e);
    }
  };

  // ─── STEP 1: INITIALIZE LOCAL MEDIA & CLOUDFLARE SESSION ─────
  const initializeSession = useCallback(async () => {
    try {
      setConnectionStatus('Acquiring camera & microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setConnectionStatus('Connecting to Cloudflare WebRTC Edge...');
      // 1. Request new Cloudflare Calls session
      const sessionRes = await api.post('/calls/session/new');
      if (!sessionRes.data?.success || !sessionRes.data?.sessionId) {
        throw new Error(sessionRes.data?.message || 'Failed to obtain Calls session ID');
      }

      const newSessionId = sessionRes.data.sessionId;
      setSessionId(newSessionId);

      // 2. Setup Publisher PeerConnection
      const pubPc = new RTCPeerConnection(STUN_SERVERS);
      publishPcRef.current = pubPc;

      const tracksToPublish: any[] = [];
      stream.getTracks().forEach((track) => {
        const sender = pubPc.addTrack(track, stream);
        const transceiver = pubPc.getTransceivers().find(t => t.sender === sender);
        const mid = transceiver ? transceiver.mid || String(tracksToPublish.length) : String(tracksToPublish.length);
        tracksToPublish.push({
          location: 'local',
          mid: mid,
          trackName: track.kind,
        });
      });

      const offer = await pubPc.createOffer();
      await pubPc.setLocalDescription(offer);

      // Wait briefly for ICE gathering
      await new Promise<void>((resolve) => {
        if (pubPc.iceGatheringState === 'complete') resolve();
        else {
          const checkState = () => {
            if (pubPc.iceGatheringState === 'complete') {
              pubPc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          pubPc.addEventListener('icegatheringstatechange', checkState);
          setTimeout(resolve, 800);
        }
      });

      // 3. Publish tracks to Cloudflare Calls
      const publishRes = await api.post(`/calls/session/${newSessionId}/tracks/new`, {
        sessionDescription: {
          type: pubPc.localDescription?.type || 'offer',
          sdp: pubPc.localDescription?.sdp,
        },
        tracks: tracksToPublish,
      });

      if (!publishRes.data?.success || !publishRes.data?.sessionDescription) {
        throw new Error(publishRes.data?.message || 'Failed to publish media tracks to Cloudflare');
      }

      await pubPc.setRemoteDescription(new RTCSessionDescription(publishRes.data.sessionDescription));

      // 4. Register in Room as Company Host
      await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/join`, {
        sessionId: newSessionId,
        name: userName,
        role: role,
        tracks: ['audio', 'video'],
      });

      setConnecting(false);
      setConnectionStatus('Live & Ready on Cloudflare');
    } catch (err: any) {
      console.error('❌ Cloudflare Calls Init Error:', err);
      setConnectionStatus(`Connection Error: ${err.message || 'Check camera permissions'}`);
      setConnecting(false);
    }
  }, [roomName, role, userName]);

  // ─── STEP 2: SUBSCRIBE TO REMOTE PARTICIPANT ─────────────────
  const subscribeToParticipant = useCallback(async (remoteSessionId: string, currentSessionId: string) => {
    if (subPcsRef.current[remoteSessionId] || isCleaningUpRef.current) return;

    try {
      const subPc = new RTCPeerConnection(STUN_SERVERS);
      subPcsRef.current[remoteSessionId] = subPc;

      const remoteStream = new MediaStream();
      subPc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => remoteStream.addTrack(track));
        if (!event.streams[0]) remoteStream.addTrack(event.track);

        setRemoteStreams((prev) => ({
          ...prev,
          [remoteSessionId]: remoteStream,
        }));
      };

      const audioTransceiver = subPc.addTransceiver('audio', { direction: 'recvonly' });
      const videoTransceiver = subPc.addTransceiver('video', { direction: 'recvonly' });

      const offer = await subPc.createOffer();
      await subPc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        if (subPc.iceGatheringState === 'complete') resolve();
        else {
          const checkState = () => {
            if (subPc.iceGatheringState === 'complete') {
              subPc.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          subPc.addEventListener('icegatheringstatechange', checkState);
          setTimeout(resolve, 800);
        }
      });

      const subRes = await api.post(`/calls/session/${currentSessionId}/tracks/new`, {
        sessionDescription: {
          type: subPc.localDescription?.type || 'offer',
          sdp: subPc.localDescription?.sdp,
        },
        tracks: [
          { location: 'remote', sessionId: remoteSessionId, trackName: 'audio', mid: audioTransceiver.mid || '0' },
          { location: 'remote', sessionId: remoteSessionId, trackName: 'video', mid: videoTransceiver.mid || '1' },
        ],
      });

      if (subRes.data?.sessionDescription) {
        await subPc.setRemoteDescription(new RTCSessionDescription(subRes.data.sessionDescription));
      }
    } catch (err) {
      console.error(`❌ Failed to subscribe to ${remoteSessionId}:`, err);
    }
  }, []);

  // ─── STEP 3: POLL ROOM PARTICIPANTS & HEARTBEAT ──────────────
  useEffect(() => {
    if (!sessionId) return;

    const pollParticipants = async () => {
      if (isCleaningUpRef.current) return;
      try {
        const res = await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/heartbeat`, {
          sessionId,
          role,
        });

        if (res.data?.success && Array.isArray(res.data?.participants)) {
          const others: RemoteParticipant[] = res.data.participants.filter(
            (p: any) => p.sessionId !== sessionId
          );
          setRemoteParticipants(others);

          others.forEach((p) => {
            if (!subPcsRef.current[p.sessionId]) {
              subscribeToParticipant(p.sessionId, sessionId);
            }
          });

          const otherIds = new Set(others.map((p) => p.sessionId));
          Object.keys(subPcsRef.current).forEach((sid) => {
            if (!otherIds.has(sid)) {
              subPcsRef.current[sid]?.close();
              delete subPcsRef.current[sid];
              setRemoteStreams((prev) => {
                const next = { ...prev };
                delete next[sid];
                return next;
              });
            }
          });
        }
      } catch (err) {
        console.error('Participant poll error:', err);
      }
    };

    pollParticipants();
    heartbeatTimerRef.current = setInterval(pollParticipants, 3000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [sessionId, roomName, role, subscribeToParticipant]);

  // Mount and Clean up
  useEffect(() => {
    initializeSession();

    return () => {
      isCleaningUpRef.current = true;
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

      // Stop all camera and mic hardware instantly
      releaseAllMediaHardware();

      if (publishPcRef.current) {
        publishPcRef.current.close();
      }
      Object.values(subPcsRef.current).forEach((pc) => pc.close());

      if (sessionId) {
        api.post(`/calls/rooms/${encodeURIComponent(roomName)}/leave`, { sessionId, role }).catch(() => {});
      }
    };
  }, [initializeSession]);

  // ─── MEDIA CONTROLS ──────────────────────────────────────────
  const toggleAudio = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoMuted(!videoTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!publishPcRef.current || !localStream) return;

    if (isScreenSharing) {
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      const cameraTrack = localStream.getVideoTracks()[0];
      const videoSender = publishPcRef.current.getSenders().find((s) => s.track?.kind === 'video');
      if (videoSender && cameraTrack) {
        await videoSender.replaceTrack(cameraTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const videoSender = publishPcRef.current.getSenders().find((s) => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen sharing canceled or failed:', err);
      }
    }
  };

  // Completely End Interview (Ends for all participants and shuts off camera/mic)
  const handleEndInterview = async () => {
    releaseAllMediaHardware();
    try {
      await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/end`);
    } catch {}

    if (onDisconnected) {
      onDisconnected();
    } else {
      router.replace('/dashboard/walkin');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-[#f5f5f7] flex flex-col overflow-hidden select-none font-sans antialiased">
      {/* ─── TOP HEADER ──────────────────────────────────────────────── */}
      <div className="h-14 px-6 bg-black/60 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center shadow-md shadow-[#0071e3]/20">
            <DoorOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
              <span>{roomName}</span>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Host Live • Cloudflare SFU
              </span>
            </h2>
            <p className="text-[10px] text-[#86868b]">{connectionStatus}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-zinc-300">
            <Users className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>{remoteParticipants.length + 1} Connected</span>
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
            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-zinc-600 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Waiting for candidate to connect...</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              You are hosting this interview. The candidate will be permitted into this room automatically.
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
      <div className="h-20 px-6 bg-black/80 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-center gap-3 z-20">
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

        {/* End Interview for All Button */}
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
