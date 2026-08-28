'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  ScreenShare, StopCircle, Users, DoorOpen, ShieldCheck,
  Clock, CheckCircle, AlertCircle, Sparkles
} from 'lucide-react';
import api from '@/app/lib/axios';

interface CloudflareMeetingRoomProps {
  roomName: string;
  role: 'company' | 'candidate';
  userName?: string;
  onDisconnected?: () => void;
  onAdmittedStatusChange?: (isAdmitted: boolean) => void;
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
  onAdmittedStatusChange,
}: CloudflareMeetingRoomProps) {
  const router = useRouter();

  // Media & Devices State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Admission & Waiting State
  const [isAdmitted, setIsAdmitted] = useState(role === 'company');
  const [isHostPresent, setIsHostPresent] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  // Connection & Room State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('Requesting admission to room...');
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  // Refs for WebRTC & Hardware Cleanup
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
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

  const releaseAllMediaHardware = useCallback(() => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        localStreamRef.current = null;
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current.enabled = false;
        screenTrackRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
      }
    } catch (e) {
      console.error('Error releasing media hardware:', e);
    }
  }, []);

  // Notify parent component about admission status
  useEffect(() => {
    if (onAdmittedStatusChange) {
      onAdmittedStatusChange(role === 'company' ? true : isAdmitted);
    }
  }, [isAdmitted, role, onAdmittedStatusChange]);

  // Acquire local stream on mount for pre-call check & streaming
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
      })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          previewVideoRef.current.play().catch(() => {});
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Camera/Mic permission warning:', err);
      });

    return () => {
      active = false;
      releaseAllMediaHardware();
    };
  }, [releaseAllMediaHardware]);

  // Keep preview stream attached whenever DOM node updates or camera unmutes
  useEffect(() => {
    const stream = localStreamRef.current || localStream;
    if (stream) {
      if (!isAdmitted && previewVideoRef.current && !isVideoMuted) {
        if (previewVideoRef.current.srcObject !== stream) {
          previewVideoRef.current.srcObject = stream;
        }
        previewVideoRef.current.play().catch(() => {});
      }
      if (isAdmitted && localVideoRef.current && !isVideoMuted) {
        if (localVideoRef.current.srcObject !== stream) {
          localVideoRef.current.srcObject = stream;
        }
        localVideoRef.current.play().catch(() => {});
      }
    }
  }, [isAdmitted, localStream, isVideoMuted]);

  // ─── STEP 1: REQUEST ADMISSION & SETUP WEBRTC SESSION ────────
  const requestEntry = useCallback(async () => {
    try {
      setConnectionStatus('Setting up secure session...');
      let curSessionId = sessionId;
      if (!curSessionId) {
        const sessionRes = await api.post('/calls/session/new');
        if (!sessionRes.data?.success || !sessionRes.data?.sessionId) {
          throw new Error(sessionRes.data?.message || 'Failed to create Calls session');
        }
        curSessionId = sessionRes.data.sessionId;
        setSessionId(curSessionId);
      }

      // Request entry to room
      const joinRes = await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/join`, {
        sessionId: curSessionId,
        name: userName,
        role: 'candidate',
        tracks: ['audio', 'video'],
      });

      setIsHostPresent(Boolean(joinRes.data?.isHostPresent));
      setIsAdmitted(Boolean(joinRes.data?.isAdmitted));
      setConnecting(false);
    } catch (err: any) {
      console.error('❌ Request entry error:', err);
      setConnectionStatus('Connecting to room...');
    }
  }, [roomName, userName, sessionId]);

  // Initial Entry Request with Periodic Retry
  useEffect(() => {
    requestEntry();
    const retryInterval = setInterval(() => {
      if (!sessionId || connecting) {
        requestEntry();
      }
    }, 3000);
    return () => clearInterval(retryInterval);
  }, [requestEntry, sessionId, connecting]);

  // ─── STEP 2: PUBLISH MEDIA TRACKS (ONCE ADMITTED BY HOST) ────
  const publishMediaTracks = useCallback(async (currentSessionId: string) => {
    if (publishPcRef.current || isCleaningUpRef.current) return;
    const stream = localStreamRef.current || localStream;
    if (!stream) return;

    try {
      const pubPc = new RTCPeerConnection(STUN_SERVERS);
      publishPcRef.current = pubPc;

      const tracksToPublish: any[] = [];
      stream.getTracks().forEach((track) => {
        const sender = pubPc.addTrack(track, stream);
        const transceiver = pubPc.getTransceivers().find((t) => t.sender === sender);
        const mid = transceiver ? transceiver.mid || String(tracksToPublish.length) : String(tracksToPublish.length);
        tracksToPublish.push({
          location: 'local',
          mid: mid,
          trackName: track.kind,
        });
      });

      const offer = await pubPc.createOffer();
      await pubPc.setLocalDescription(offer);

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

      const publishRes = await api.post(`/calls/session/${currentSessionId}/tracks/new`, {
        sessionDescription: {
          type: pubPc.localDescription?.type || 'offer',
          sdp: pubPc.localDescription?.sdp,
        },
        tracks: tracksToPublish,
      });

      if (publishRes.data?.sessionDescription) {
        await pubPc.setRemoteDescription(new RTCSessionDescription(publishRes.data.sessionDescription));
      }
    } catch (err) {
      console.error('❌ Failed to publish candidate tracks:', err);
    }
  }, [localStream]);

  // ─── STEP 3: SUBSCRIBE TO HOST AUDIO/VIDEO ───────────────────
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
      console.error(`❌ Failed to subscribe to host:`, err);
      if (subPcsRef.current[remoteSessionId]) {
        subPcsRef.current[remoteSessionId].close();
        delete subPcsRef.current[remoteSessionId];
      }
    }
  }, []);

  // ─── STEP 4: HEARTBEAT (POLLS ADMISSION STATUS & HOST STREAM) ─
  useEffect(() => {
    if (!sessionId) return;

    const pollStatus = async () => {
      if (isCleaningUpRef.current) return;
      try {
        const res = await api.post(`/calls/rooms/${encodeURIComponent(roomName)}/heartbeat`, {
          sessionId,
          role: 'candidate',
          name: userName,
        });

        if (res.data?.isEnded) {
          setIsSessionEnded(true);
          releaseAllMediaHardware();
          return;
        }

        if (res.data?.isDeclined) {
          setIsDeclined(true);
          releaseAllMediaHardware();
          return;
        }

        setIsHostPresent(Boolean(res.data?.isHostPresent));

        // When Host admits candidate:
        if (res.data?.isAdmitted) {
          if (!isAdmitted) {
            setIsAdmitted(true);
          }
          publishMediaTracks(sessionId);

          if (Array.isArray(res.data?.participants)) {
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
        }
      } catch (err) {
        console.error('Candidate heartbeat error:', err);
      }
    };

    pollStatus();
    heartbeatTimerRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [sessionId, roomName, userName, isAdmitted, publishMediaTracks, subscribeToParticipant, releaseAllMediaHardware]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      isCleaningUpRef.current = true;
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

      releaseAllMediaHardware();

      if (publishPcRef.current) publishPcRef.current.close();
      Object.values(subPcsRef.current).forEach((pc) => pc.close());

      if (sessionId) {
        api.post(`/calls/rooms/${encodeURIComponent(roomName)}/leave`, { sessionId, role: 'candidate' }).catch(() => {});
      }
    };
  }, [roomName, sessionId, releaseAllMediaHardware]);

  // ─── MEDIA CONTROLS ──────────────────────────────────────────
  const toggleAudio = () => {
    const stream = localStreamRef.current || localStream;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current || localStream;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const willBeMuted = !videoTrack.enabled;
      setIsVideoMuted(willBeMuted);
      if (!willBeMuted) {
        if (!isAdmitted && previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          previewVideoRef.current.play().catch(() => {});
        }
        if (isAdmitted && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
      }
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
        console.error('Screen sharing error:', err);
      }
    }
  };

  const handleLeaveCall = () => {
    releaseAllMediaHardware();
    if (onDisconnected) {
      onDisconnected();
    } else {
      router.replace('/dashboard/applications');
    }
  };

  // ─── SCREEN A: SESSION ENDED BY HOST ─────────────────────────
  if (isSessionEnded) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 shadow-xl">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Interview Session Ended</h2>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-6">
          The interviewer has concluded this session. Your camera and microphone have been safely turned off.
        </p>
        <button
          onClick={handleLeaveCall}
          className="px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ─── SCREEN B: DECLINED ACCESS ───────────────────────────────
  if (isDeclined) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 shadow-xl">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Interview Access Deferred</h2>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-6">
          The host has postponed or declined this interview queue request.
        </p>
        <button
          onClick={handleLeaveCall}
          className="px-6 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ─── SCREEN C: WAITING FOR HOST ADMISSION (LOBBY GATE) ────────
  if (!isAdmitted) {
    return (
      <div className="h-full w-full bg-[#09090b] text-[#f5f5f7] flex flex-col items-center justify-center p-6 select-none font-sans relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-[#0071e3]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full flex flex-col items-center text-center z-10 space-y-5">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${
            isHostPresent
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isHostPresent ? 'bg-emerald-400' : 'bg-amber-400'} animate-ping`} />
            <span>{isHostPresent ? 'Interviewer Present • Awaiting Admission' : 'Waiting for Interviewer to Join'}</span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">You're in the Waiting Lobby</h2>
            <p className="text-xs text-[#86868b] mt-1.5 leading-relaxed">
              {isHostPresent
                ? 'The interviewer has been notified of your presence and will admit you into the room.'
                : 'The interview host has not entered yet. You will be admitted as soon as the host connects.'}
            </p>
          </div>

          {/* Camera Pre-Check Preview */}
          <div className="w-full h-56 rounded-3xl overflow-hidden bg-zinc-900 border border-white/[0.08] relative shadow-2xl flex items-center justify-center">
            <video
              ref={previewVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
            />
            {isVideoMuted && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center font-bold text-xl text-white">
                  {userName.charAt(0)}
                </div>
                <p className="text-xs text-zinc-500">Camera preview off</p>
              </div>
            )}

            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.1] text-xs font-semibold text-white">
              <span>{userName} (Candidate Preview)</span>
            </div>
          </div>

          {/* Quick Pre-Check Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-2xl font-semibold transition-all cursor-pointer ${
                isAudioMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'
              }`}
              title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-2xl font-semibold transition-all cursor-pointer ${
                isVideoMuted
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'
              }`}
              title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLeaveCall}
              className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all border border-white/[0.08] cursor-pointer"
            >
              Exit Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SCREEN D: ADMITTED & ACTIVE LIVE INTERVIEW STREAM ────────────
  return (
    <div className="h-full w-full bg-[#09090b] text-[#f5f5f7] flex flex-col overflow-hidden select-none font-sans antialiased">
      {/* Top Bar */}
      <div className="h-12 px-4 bg-black/60 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-tight">{roomName}</span>
          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Admitted • Live
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <Users className="w-3.5 h-3.5 text-[#0071e3]" />
          <span>{remoteParticipants.length + 1} Connected</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-3 grid grid-cols-1 gap-3 relative overflow-hidden bg-radial from-zinc-900/40 to-[#09090b]">
        {/* Remote Host Video */}
        {remoteParticipants.length > 0 && remoteParticipants[0] ? (
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.08] flex items-center justify-center shadow-2xl">
            {remoteStreams[remoteParticipants[0].sessionId] ? (
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el && el.srcObject !== remoteStreams[remoteParticipants[0].sessionId]) {
                    el.srcObject = remoteStreams[remoteParticipants[0].sessionId];
                  }
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center font-bold text-xl text-white">
                  {remoteParticipants[0].name.charAt(0)}
                </div>
                <p className="text-xs text-zinc-400">Connecting video stream...</p>
              </div>
            )}

            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/[0.1] text-[11px] font-semibold text-white">
              <span>{remoteParticipants[0].name} (Interviewer)</span>
              <span className="text-[9px] text-[#0071e3] font-bold uppercase">• Host</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/[0.08] flex flex-col items-center justify-center text-center p-6 bg-zinc-900/30">
            <Users className="w-8 h-8 text-zinc-600 animate-pulse mb-2" />
            <p className="text-xs text-zinc-400 font-medium">Connecting to Interviewer...</p>
          </div>
        )}

        {/* Local Self View Overlay (PiP Style) */}
        <div className="absolute bottom-4 right-4 w-40 h-28 rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.15] shadow-2xl z-30 group">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
          />
          {isVideoMuted && (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-xs text-zinc-500 font-medium">
              Camera Off
            </div>
          )}

          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[9px] font-semibold text-white">
            You
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="h-16 px-4 bg-black/80 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-center gap-2.5 z-20 shrink-0">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-2xl font-semibold transition-all cursor-pointer ${
            isAudioMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'
          }`}
          title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-2xl font-semibold transition-all cursor-pointer ${
            isVideoMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'
          }`}
          title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-2xl font-semibold transition-all cursor-pointer ${
            isScreenSharing
              ? 'bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/30'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/[0.08]'
          }`}
          title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
        >
          {isScreenSharing ? <StopCircle className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
        </button>

        <button
          onClick={handleLeaveCall}
          className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer ml-2"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
}
