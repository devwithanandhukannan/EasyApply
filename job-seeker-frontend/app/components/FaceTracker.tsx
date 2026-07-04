'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FaceLandmarker,
  FilesetResolver,
  FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

interface Props {
  mediaTrack: MediaStreamTrack;
  onDetection: (faceCount: number, lookingAway: boolean) => void;
  debug?: boolean;
}

export default function FaceTracker({
  mediaTrack,
  onDetection,
  debug = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let isActive = true;

    async function initializeFaceLandmarker() {
      try {
        console.log('Initializing MediaPipe Face Landmarker...');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isActive) return;

        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 5,
          outputFacialTransformationMatrixes: true,
          outputFaceBlendshapes: false,
        });

        console.log('MediaPipe Face Landmarker initialized');
        if (isActive) setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Face Landmarker:', err);
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Initialization failed');
        }
      }
    }

    initializeFaceLandmarker();

    return () => {
      isActive = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Setup video stream with proper cleanup
  useEffect(() => {
    if (!mediaTrack) {
      console.warn('No media track provided');
      return;
    }

    const video = videoRef.current;
    if (!video) {
      console.warn('Video element not available');
      return;
    }

    let isMounted = true;

    const stream = new MediaStream([mediaTrack]);
    streamRef.current = stream;
    video.srcObject = stream;

    const handleLoadedData = () => {
      if (!isMounted) return;
      
      console.log('Video stream ready:', {
        width: video.videoWidth,
        height: video.videoHeight,
        readyState: video.readyState,
      });
      
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setIsVideoReady(true);
      } else {
        console.warn('Video has invalid dimensions');
      }
    };

    const handleError = (e: Event) => {
      if (!isMounted) return;
      console.error('Video error:', e);
      setError('Video stream error');
      setIsVideoReady(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedData);
    video.addEventListener('error', handleError);

    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch((err) => {
        if (err.name === 'AbortError' || !isMounted) {
          console.log('Video play pipeline released during layout unmount.');
          return;
        }
        console.error('Failed to play video:', err);
        setError('Failed to start video stream');
      });
    }

    return () => {
      isMounted = false;
      
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedData);
      video.removeEventListener('error', handleError);
      
      try {
        video.pause();
      } catch (e) {
        // Suppress track state transition exceptions
      }

      video.srcObject = null;
      streamRef.current = null;
      setIsVideoReady(false);
    };
  }, [mediaTrack]);

  // Memoized detection callback
  const runDetection = useCallback((video: HTMLVideoElement, now: number) => {
    // Additional strict guard rails to verify canvas frame buffer state before sending to WASM
    if (
      !landmarkerRef.current || 
      !video || 
      video.readyState < 3 || 
      video.videoWidth === 0 || 
      video.videoHeight === 0 ||
      video.paused
    ) {
      return;
    }

    try {
      const results: FaceLandmarkerResult = landmarkerRef.current.detectForVideo(
        video,
        Math.floor(now)
      );

      if (!results) return;

      const faceCount = results.faceLandmarks?.length || 0;
      let lookingAway = false;

      // Calculate gaze direction from transformation matrix
      if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
        const matrix = results.facialTransformationMatrixes[0].data;

        const yaw = Math.atan2(matrix[8], matrix[10]) * (180 / Math.PI);
        const pitch = Math.atan2(
          -matrix[9],
          Math.sqrt(matrix[8] * matrix[8] + matrix[10] * matrix[10])
        ) * (180 / Math.PI);

        const YAW_THRESHOLD = 25; 
        const PITCH_THRESHOLD = 20; 

        if (Math.abs(yaw) > YAW_THRESHOLD || Math.abs(pitch) > PITCH_THRESHOLD) {
          lookingAway = true;
        }

        if (debug) {
          console.log(
            `Faces: ${faceCount} | Yaw: ${yaw.toFixed(1)} | Pitch: ${pitch.toFixed(1)} | Away: ${lookingAway}`
          );
        }
      }

      onDetection(faceCount, lookingAway);

      if (debug && canvasRef.current && results.faceLandmarks) {
        drawDebugVisualization(video, canvasRef.current, results);
      }
    } catch (err) {
      console.warn('WASM pipeline dropped invalid hardware frame:', err);
    }
  }, [onDetection, debug]);

  // Run face detection loop
  useEffect(() => {
    if (!isInitialized || !isVideoReady) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let lastDetectionTime = 0;
    const DETECTION_INTERVAL = 150; // Increased interval slightly to prevent loop crowding
    let isDetecting = false;

    function detect() {
      if (
        !video ||
        !landmarkerRef.current ||
        video.readyState < 3 || // Require HAVE_FUTURE_DATA minimum
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      const now = performance.now();

      if (now - lastDetectionTime < DETECTION_INTERVAL || isDetecting) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      isDetecting = true;
      lastDetectionTime = now;

      runDetection(video, now);
      isDetecting = false;

      animationFrameRef.current = requestAnimationFrame(detect);
    }

    console.log('Starting face detection loop');
    animationFrameRef.current = requestAnimationFrame(detect);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      console.log('Stopped face detection loop');
    };
  }, [isInitialized, isVideoReady, runDetection]);

  function drawDebugVisualization(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    results: FaceLandmarkerResult
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.faceLandmarks) {
      for (const landmarks of results.faceLandmarks) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';

        for (const landmark of landmarks) {
          ctx.beginPath();
          ctx.arc(
            landmark.x * canvas.width,
            landmark.y * canvas.height,
            2,
            0,
            2 * Math.PI
          );
          ctx.fill();
        }

        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        
        if (landmarks.length > 10) {
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const x = landmarks[i].x * canvas.width;
            const y = landmarks[i].y * canvas.height;
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-900/90 text-white px-4 py-2 rounded-lg text-xs font-mono z-50 max-w-md">
        Face Tracker Error: {error}
      </div>
    );
  }

  return (
    <>
      {/* Fixed CSS Hack: Elements thrown entirely off-screen via left positioning 
        maintain active rendering pipelines, ensuring video frames continue updating
      */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className={debug ? 'fixed bottom-20 right-4 z-40 border-2 border-blue-500 rounded-lg w-40 h-auto' : 'fixed z-0'}
        style={{ 
          width: debug ? '160px' : '320px', 
          height: debug ? 'auto' : '240px',
          top: debug ? 'auto' : '-9999px',
          left: debug ? 'auto' : '-9999px',
          opacity: debug ? 1 : 1,
          pointerEvents: 'none'
        }}
      />

      {debug && (
        <canvas
          ref={canvasRef}
          className="fixed top-20 right-4 z-50 border-2 border-green-500 rounded-lg shadow-2xl"
          style={{ width: '320px', height: 'auto' }}
        />
      )}

      {!isInitialized && (
        <div className="fixed bottom-4 right-4 bg-blue-900/90 text-white px-4 py-2 rounded-lg text-xs font-mono z-50 animate-pulse">
          Initializing MediaPipe Face Detection...
        </div>
      )}

      {isInitialized && !isVideoReady && (
        <div className="fixed bottom-4 right-4 bg-yellow-900/90 text-white px-4 py-2 rounded-lg text-xs font-mono z-50 animate-pulse">
          Waiting for video stream...
        </div>
      )}

      {isInitialized && isVideoReady && debug && (
        <div className="fixed bottom-4 right-4 bg-green-900/90 text-white px-4 py-2 rounded-lg text-xs font-mono z-50">
          Face Detection Active
        </div>
      )}
    </>
  );
}