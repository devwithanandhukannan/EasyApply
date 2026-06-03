'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import FaceTracker from './FaceTracker';
import { AttentionTracker } from '@/app/lib/attentionTracker';

// ==========================================
// MASTER FEATURE FLAG — set to true to enable attention monitoring
// When false, AttentionMonitor and FaceTracker will not run at all.
// ==========================================
export const ENABLE_ATTENTION_MONITORING = true;

interface AttentionMonitorProps {
  debug?: boolean;
  onScoreChange?: (score: number) => void;
  onWarning?: (type: 'noFace' | 'multipleFaces' | 'lookingAway', active: boolean) => void;
}

export default function AttentionMonitor({
  debug = false,
  onScoreChange,
  onWarning,
}: AttentionMonitorProps) {
  // Hard guard — never renders when flag is off
  if (!ENABLE_ATTENTION_MONITORING) return null;

  const { localParticipant } = useLocalParticipant();
  const trackerRef = useRef(new AttentionTracker());
  const lastWarningsRef = useRef({ noFace: false, multipleFaces: false, lookingAway: false });

  const cameraPublication = localParticipant
    ? Array.from(localParticipant.videoTrackPublications.values()).find(
        (pub) => pub.source === Track.Source.Camera
      )
    : null;

  const track = cameraPublication?.videoTrack;

  const handleDetection = useCallback(
    (faceCount: number, lookingAway: boolean) => {
      const result = trackerRef.current.update(faceCount, lookingAway);

      if (onScoreChange) {
        onScoreChange(result.attentionScore);
      }

      if (onWarning) {
        const last = lastWarningsRef.current;

        if (last.noFace !== result.noFaceWarning) {
          onWarning('noFace', result.noFaceWarning);
          last.noFace = result.noFaceWarning;
        }
        if (last.multipleFaces !== result.multipleFaceWarning) {
          onWarning('multipleFaces', result.multipleFaceWarning);
          last.multipleFaces = result.multipleFaceWarning;
        }
        if (last.lookingAway !== result.lookingAwayWarning) {
          onWarning('lookingAway', result.lookingAwayWarning);
          last.lookingAway = result.lookingAwayWarning;
        }
      }
    },
    [onScoreChange, onWarning]
  );

  if (!track?.mediaStreamTrack) return null;

  return (
    <FaceTracker
      mediaTrack={track.mediaStreamTrack}
      debug={debug}
      onDetection={handleDetection}
    />
  );
}