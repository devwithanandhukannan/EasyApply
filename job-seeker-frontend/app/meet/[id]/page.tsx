'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, AlertTriangle, Code2, Monitor, Square, Tv, Layers,
  Trash2, Pencil, Play, Terminal, SquareSquare, Circle, Eraser, Video, ShieldAlert
} from 'lucide-react';
import api from '@/app/lib/axios';
import axios from 'axios';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const LiveKitMeetingRoom = dynamic(() => import('@/app/components/LiveKitMeetingRoom'), { ssr: false });

type WorkspaceTab = 'video_only' | 'code_editor' | 'whiteboard';
type ToolMode = 'pencil' | 'eraser' | 'rectangle' | 'circle';

interface DrawItem {
  id: string;
  type: ToolMode;
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

const languageBoilerplates: Record<string, string> = {
  javascript: `// JavaScript\nconsole.log("Hello World");`,
  typescript: `// TypeScript\nconsole.log("Hello World");`,
  python: `# Python\nprint("Hello World")`,
  java: `// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}`,
  cpp: `// C++\n#include <iostream>\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}`,
  csharp: `// C#\nusing System;\npublic class Program {\n    public static void Main() {\n        Console.WriteLine("Hello World");\n    }\n}`,
  go: `// Go\npackage main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello World")\n}`,
  ruby: `# Ruby\nputs "Hello World"`,
  php: `<?php\necho "Hello World";`,
  rust: `// Rust\nfn main() {\n    println!("Hello World");\n}`,
};

export default function MeetPage() {
  const { id: interviewId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleType = searchParams.get('role') === 'candidate' ? 'jobseeker' : 'company';

  const [credentials, setCredentials] = useState<{ token: string; serverUrl: string; iceServers?: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('video_only');
  const [screenShareActive, setScreenShareActive] = useState(false);

  // Security Monitoring States
  const [securityViolations, setSecurityViolations] = useState<string[]>([]);
  const [audioCoachingWarning, setAudioCoachingWarning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Code editor
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [codeValue, setCodeValue] = useState(languageBoilerplates['javascript']);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['[ready]']);
  const editorRef = useRef<any>(null);

  // Whiteboard
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('pencil');
  const [brushColor, setBrushColor] = useState('#60a5fa');
  const [brushSize, setBrushSize] = useState(4);
  const [shapesRegistry, setShapesRegistry] = useState<DrawItem[]>([]);

  // Fullscreen tracking
  const fullscreenRequestedRef = useRef(false);

  // Logger helper for violations
  const logViolation = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMsg = `[${timestamp}] ${msg}`;
    
    setSecurityViolations((prev) => {
      const newViolations = [logMsg, ...prev.slice(0, 9)]; // Keep last 10
      return newViolations;
    });

    // Optional: Send to backend
    try {
      api.post(`/interviews/${interviewId}/security-logs`, {
        event: msg,
        timestamp: new Date().toISOString(),
        role: roleType
      }).catch(() => {}); // Silent fail
    } catch {}
  }, [interviewId, roleType]);

  // --- COMPLIANCE & PROCTORING SIDE EFFECTS ---
  useEffect(() => {
    if (roleType !== 'jobseeker') return;

    let mounted = true;

    // 1. Right Click Blocking
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (mounted) logViolation('Right-click menu blocked');
      return false;
    };

    // 2. Clipboard Monitoring - Block all clipboard operations
    const handlePaste = (e: ClipboardEvent) => {
      // Allow paste only in whiteboard canvas (drawing doesn't use clipboard anyway)
      const target = e.target as HTMLElement;
      const isEditorOrInput = 
        target.closest('.monaco-editor') || 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isEditorOrInput) {
        e.preventDefault();
        e.stopPropagation();
        if (mounted) logViolation('Paste operation blocked');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString();
      if (selection && selection.length > 10) {
        if (mounted) logViolation(`Copy operation detected (${selection.length} chars)`);
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditorOrInput = 
        target.closest('.monaco-editor') || 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isEditorOrInput) {
        e.preventDefault();
        e.stopPropagation();
        if (mounted) logViolation('Cut operation blocked');
      }
    };

    // 3. Cross-platform keyboard shortcuts blocking
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
      const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0;

      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      // Block copy: Cmd/Ctrl + C
      if (cmdOrCtrl && e.key.toLowerCase() === 'c') {
        const selection = window.getSelection()?.toString();
        if (selection && selection.length > 10) {
          e.preventDefault();
          if (mounted) logViolation('Copy keyboard shortcut blocked (Cmd/Ctrl+C)');
        }
      }

      // Block paste: Cmd/Ctrl + V
      if (cmdOrCtrl && e.key.toLowerCase() === 'v') {
        const target = e.target as HTMLElement;
        const isEditorOrInput = 
          target.closest('.monaco-editor') || 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        if (isEditorOrInput) {
          e.preventDefault();
          if (mounted) logViolation('Paste keyboard shortcut blocked (Cmd/Ctrl+V)');
        }
      }

      // Block cut: Cmd/Ctrl + X
      if (cmdOrCtrl && e.key.toLowerCase() === 'x') {
        const target = e.target as HTMLElement;
        const isEditorOrInput = 
          target.closest('.monaco-editor') || 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;

        if (isEditorOrInput) {
          e.preventDefault();
          if (mounted) logViolation('Cut keyboard shortcut blocked (Cmd/Ctrl+X)');
        }
      }

      // Block developer tools
      // F12 (all platforms)
      if (e.key === 'F12') {
        e.preventDefault();
        if (mounted) logViolation('Developer tools shortcut blocked (F12)');
      }

      // Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux)
      if (
        (isMac && e.metaKey && e.altKey && e.key.toLowerCase() === 'i') ||
        (!isMac && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i')
      ) {
        e.preventDefault();
        if (mounted) logViolation('Developer tools shortcut blocked (Cmd+Opt+I / Ctrl+Shift+I)');
      }

      // Cmd+Option+J (Mac) or Ctrl+Shift+J (Windows/Linux)
      if (
        (isMac && e.metaKey && e.altKey && e.key.toLowerCase() === 'j') ||
        (!isMac && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'j')
      ) {
        e.preventDefault();
        if (mounted) logViolation('Console shortcut blocked (Cmd+Opt+J / Ctrl+Shift+J)');
      }

      // Cmd+Option+C (Mac) or Ctrl+Shift+C (Windows/Linux) - Element inspector
      if (
        (isMac && e.metaKey && e.altKey && e.key.toLowerCase() === 'c') ||
        (!isMac && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c')
      ) {
        e.preventDefault();
        if (mounted) logViolation('Element inspector blocked (Cmd+Opt+C / Ctrl+Shift+C)');
      }

      // Block print: Cmd/Ctrl + P
      if (cmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (mounted) logViolation('Print dialog blocked (Cmd/Ctrl+P)');
      }

      // Block save: Cmd/Ctrl + S
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (mounted) logViolation('Save dialog blocked (Cmd/Ctrl+S)');
      }

      // Block view source: Cmd/Ctrl + U
      if (cmdOrCtrl && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        if (mounted) logViolation('View source blocked (Cmd/Ctrl+U)');
      }
    };

    // 4. Tab Switches & Window Focus Loss
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && mounted) {
        logViolation('Tab switched away (visibilitychange)');
      }
    };

    const handleWindowBlur = () => {
      if (mounted && document.visibilityState === 'visible') {
        logViolation('Window focus lost (Alt+Tab / Cmd+Tab)');
      }
    };

    const handleWindowFocus = () => {
      // Check if fullscreen was exited while away
      if (fullscreenRequestedRef.current && !document.fullscreenElement && mounted) {
        logViolation('Returned to window - fullscreen was exited');
      }
    };

    // 5. Fullscreen Enforcement
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && fullscreenRequestedRef.current && mounted) {
        logViolation('Exited fullscreen mode');
      }
    };

    const handleFullscreenError = () => {
      if (mounted) logViolation('Fullscreen request failed');
    };

    // Request fullscreen on first interaction
    const requestFullscreen = () => {
      if (!document.fullscreenElement && !fullscreenRequestedRef.current) {
        document.documentElement.requestFullscreen()
          .then(() => {
            fullscreenRequestedRef.current = true;
          })
          .catch((err) => {
            console.error('Fullscreen request error:', err);
          });
      }
    };

    // Bind all event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('fullscreenerror', handleFullscreenError);

    // Request fullscreen on first click
    const requestFsOnce = () => {
      requestFullscreen();
      document.removeEventListener('click', requestFsOnce);
    };
    document.addEventListener('click', requestFsOnce);

    // Cleanup
    return () => {
      mounted = false;
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('fullscreenerror', handleFullscreenError);
      document.removeEventListener('click', requestFsOnce);
    };
  }, [roleType, logViolation]);

  // 6. Audio Level Monitoring (Sustained Voice / Coaching Analysis)
  useEffect(() => {
    if (roleType !== 'jobseeker') return;

    let mounted = true;
    let sustainedNoiseCounter = 0;

    const initAudioMonitoring = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        audioStreamRef.current = stream;
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContextClass();
        audioContextRef.current = context;

        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);

        // Monitor audio levels every 250ms
        audioIntervalRef.current = setInterval(() => {
          if (!mounted || !analyserRef.current) return;

          analyser.getFloatTimeDomainData(dataArray);
          
          // Calculate RMS (Root Mean Square) Volume
          let sumSquares = 0;
          for (let i = 0; i < bufferLength; i++) {
            sumSquares += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sumSquares / bufferLength);

          // Threshold: 0.04 represents active conversational audio
          // Adjust this based on testing - may need calibration
          if (rms > 0.04) {
            sustainedNoiseCounter++;
            // 8 consecutive hits = ~2 seconds of sustained audio
            if (sustainedNoiseCounter >= 8) {
              if (mounted) {
                setAudioCoachingWarning(true);
                if (sustainedNoiseCounter === 8) { // Log only once per streak
                  logViolation('Sustained background audio detected (possible coaching)');
                }
              }
            }
          } else {
            // Decay counter gradually
            if (sustainedNoiseCounter > 0) {
              sustainedNoiseCounter = Math.max(0, sustainedNoiseCounter - 1);
            }
            if (sustainedNoiseCounter === 0 && mounted) {
              setAudioCoachingWarning(false);
            }
          }
        }, 250);

      } catch (err) {
        console.error('Audio monitoring error:', err);
        if (mounted) {
          logViolation('Microphone access denied - audio monitoring disabled');
        }
      }
    };

    initAudioMonitoring();

    return () => {
      mounted = false;
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [roleType, logViolation]);

  // Room Initialization
  useEffect(() => {
    if (!interviewId) return;
    let cancelled = false;

    const fetchCreds = async () => {
      try {
        const endpoint =
          roleType === 'jobseeker'
            ? `/interviews/${interviewId}/token/jobseeker`
            : `/interviews/${interviewId}/token/company`;

        const res = await api.post(endpoint);
        if (cancelled) return;

        if (res.data?.success && res.data?.token) {
          setCredentials({ 
            token: res.data.token, 
            serverUrl: res.data.livekitUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'http://localhost:7880',
            iceServers: res.data.iceServers || undefined
          });
        } else {
          setError(res.data?.message || 'Failed to get room token.');
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error('Token fetch error:', err);
        setError(err.response?.data?.message || 'Unable to join session.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCreds();
    return () => { 
      cancelled = true; 
    };
  }, [interviewId, roleType]);

  // Whiteboard canvas redraw
  useEffect(() => {
    if (activeTab === 'whiteboard' && canvasRef.current) {
      drawCanvasFrame();
    }
  }, [shapesRegistry, activeTab, brushColor, brushSize]);

  const handleDisconnected = useCallback(() => {
    // Exit fullscreen before leaving
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    router.replace('/dashboard/interviews');
  }, [router]);

  // Code execution
  const executeCompilePipeline = async () => {
    setIsRunning(true);
    setConsoleLogs(['[compiling...]']);

    const langMap: Record<string, number> = {
      javascript: 63, 
      typescript: 74, 
      python: 71, 
      java: 62,
      cpp: 54, 
      csharp: 51, 
      go: 60, 
      ruby: 72, 
      php: 68, 
      rust: 73,
    };

    const COMPILER_API_KEY = process.env.NEXT_PUBLIC_JUDGE0_API_KEY || 'a3dde5427emshec7c45862006035p16e126jsnd102eff61b2b';
    const headers = {
      'x-rapidapi-key': COMPILER_API_KEY,
      'x-rapidapi-host': 'judge029.p.rapidapi.com',
      'Content-Type': 'application/json',
    };

    try {
      const encoded = btoa(unescape(encodeURIComponent(codeValue)));
      const sub = await axios.request({
        method: 'POST',
        url: 'https://judge029.p.rapidapi.com/submissions',
        params: { base64_encoded: 'true', wait: 'false', fields: '*' },
        headers,
        data: JSON.stringify({ 
          language_id: langMap[editorLanguage], 
          source_code: encoded, 
          stdin: '' 
        }),
      });

      const token = sub.data?.token;
      if (!token) throw new Error('No execution token returned.');

      let result = null;
      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500));
        const poll = await axios.request({
          method: 'GET',
          url: `https://judge029.p.rapidapi.com/submissions/${token}`,
          params: { base64_encoded: 'true', fields: '*' },
          headers,
        });
        result = poll.data;
        
        // Status ID > 2 means processing is complete
        if (result.status?.id > 2) break;
        attempts++;
      }

      if (!result) throw new Error('Execution timed out.');

      const decode = (s: string | null | undefined) => {
        if (!s) return '';
        try { 
          return decodeURIComponent(escape(atob(s))); 
        } catch { 
          return s; 
        }
      };

      const sid = result.status?.id;
      
      // Status codes:
      // 3 = Accepted
      // 4 = Wrong Answer
      // 5 = Time Limit Exceeded
      // 6 = Compilation Error
      // 7-12 = Runtime Errors
      
      if (sid === 6) {
        setConsoleLogs(['[compilation error]', decode(result.compile_output)]);
      } else if (sid >= 7 && sid <= 12) {
        setConsoleLogs([
          `[runtime error: ${result.status?.description}]`, 
          decode(result.stderr) || decode(result.stdout) || 'No error details available'
        ]);
      } else {
        const out = decode(result.stdout).trim();
        const err = decode(result.stderr);
        const logs: string[] = [];
        
        if (err?.trim()) logs.push(`[stderr]\n${err}`);
        logs.push(out || '(no output)');
        
        if (result.time || result.memory) {
          logs.push(`[executed in ${result.time || 0}s · ${result.memory || 0}kb]`);
        }
        
        setConsoleLogs(logs);
      }
    } catch (err: any) {
      console.error('Code execution error:', err);
      if (err.response?.status === 403) {
        setConsoleLogs([`[error] 403 Forbidden: Judge0 API Key is invalid or expired. Please update NEXT_PUBLIC_JUDGE0_API_KEY.`]);
      } else if (err.response?.status === 429) {
        setConsoleLogs([`[error] 429 Too Many Requests: Judge0 API rate limit exceeded.`]);
      } else {
        setConsoleLogs([`[error] ${err.message || 'Execution failed'}`]);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setEditorLanguage(lang);
    if (languageBoilerplates[lang]) {
      setCodeValue(languageBoilerplates[lang]);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;

    // Disable copy/paste in Monaco editor for candidates
    if (roleType === 'jobseeker') {
      editor.onKeyDown((e: any) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        // Block Cmd/Ctrl + C, V, X
        if (cmdOrCtrl && ['KeyC', 'KeyV', 'KeyX'].includes(e.code)) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    }
  };

  // Whiteboard Canvas rendering
  const drawCanvasFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 24) {
      ctx.beginPath(); 
      ctx.moveTo(x, 0); 
      ctx.lineTo(x, canvas.height); 
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 24) {
      ctx.beginPath(); 
      ctx.moveTo(0, y); 
      ctx.lineTo(canvas.width, y); 
      ctx.stroke();
    }

    // Draw all shapes
    shapesRegistry.forEach((shape) => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (shape.type === 'pencil' && shape.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        shape.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (shape.type === 'rectangle' && shape.points.length >= 2) {
        const s = shape.points[0];
        const e = shape.points[shape.points.length - 1];
        ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
      } else if (shape.type === 'circle' && shape.points.length >= 2) {
        const s = shape.points[0];
        const e = shape.points[shape.points.length - 1];
        const r = Math.hypot(e.x - s.x, e.y - s.y);
        ctx.beginPath(); 
        ctx.arc(s.x, s.y, r, 0, 2 * Math.PI); 
        ctx.stroke();
      }
    });
  }, [shapesRegistry]);

  const drawPreview = useCallback((cx: number, cy: number) => {
    drawCanvasFrame();
    const canvas = canvasRef.current;
    if (!canvas || currentPathRef.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const s = currentPathRef.current[0];
    
    if (toolMode === 'pencil') {
      ctx.beginPath(); 
      ctx.moveTo(s.x, s.y);
      currentPathRef.current.forEach((p) => ctx.lineTo(p.x, p.y)); 
      ctx.stroke();
    } else if (toolMode === 'rectangle') {
      ctx.strokeRect(s.x, s.y, cx - s.x, cy - s.y);
    } else if (toolMode === 'circle') {
      const r = Math.hypot(cx - s.x, cy - s.y);
      ctx.beginPath(); 
      ctx.arc(s.x, s.y, r, 0, 2 * Math.PI); 
      ctx.stroke();
    }
  }, [toolMode, brushColor, brushSize, drawCanvasFrame]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    
    isDrawingRef.current = true;
    
    if (toolMode === 'eraser') {
      eraseAt(x, y);
    } else {
      currentPathRef.current = [{ x, y }];
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    
    if (toolMode === 'eraser') {
      eraseAt(x, y);
    } else {
      currentPathRef.current.push({ x, y });
      drawPreview(x, y);
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    
    if (toolMode !== 'eraser' && currentPathRef.current.length > 0) {
      setShapesRegistry((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: toolMode,
          points: [...currentPathRef.current],
          color: brushColor,
          size: brushSize,
        },
      ]);
    }
    currentPathRef.current = [];
  };

  const eraseAt = (cx: number, cy: number) => {
    setShapesRegistry((prev) =>
      prev.filter((s) => !s.points.some((p) => Math.hypot(p.x - cx, p.y - cy) <= 15))
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          <p className="text-[11px] text-white/25 tracking-widest uppercase">Joining session</p>
        </div>
      </div>
    );
  }

  if (error || !credentials) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black gap-4 p-6">
        <div className="w-10 h-10 rounded-2xl bg-red-950/60 border border-red-900/40 flex items-center justify-center">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-white text-sm font-medium mb-1">Unable to join</p>
          <p className="text-white/40 text-xs max-w-xs">{error || 'Session credentials unavailable.'}</p>
        </div>
        <button
          onClick={() => router.replace('/dashboard/interviews')}
          className="mt-2 px-5 py-2 bg-white text-black text-xs font-semibold rounded-xl hover:bg-white/90 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isVideoOnly = activeTab === 'video_only';

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-[#0a0a0a] overflow-hidden text-white relative select-none" 
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
    >

      {/* Header */}
      <header className="h-12 px-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse" />
            <span className="text-[11px] text-white/50 font-medium">Live</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[11px] text-white/33 capitalize">{roleType}</span>
          
          {/* Proctoring Badge */}
          {roleType === 'jobseeker' && (
            <>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                <div className="w-1 h-1 rounded-full bg-blue-400" />
                <span className="text-[9px] text-blue-400 uppercase tracking-wider font-semibold">Proctored</span>
              </div>
            </>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-xl p-1" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          {([
            { id: 'video_only', icon: Video, label: 'Video' },
            { id: 'code_editor', icon: Code2, label: 'Code' },
            { id: 'whiteboard', icon: Layers, label: 'Board' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeTab === id
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScreenShareActive((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
              screenShareActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'bg-white/5 text-white/50 border border-white/8 hover:text-white/80'
            }`}
          >
            <Tv size={12} />
            {screenShareActive ? 'Stop' : 'Share'}
          </button>
          <button
            onClick={handleDisconnected}
            className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 w-full overflow-hidden min-h-0">
        
        {/* Left panel */}
        {!isVideoOnly && (
          <div className="flex-1 h-full flex flex-col min-w-0" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>

            {/* Code Editor */}
            {activeTab === 'code_editor' && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="h-11 px-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d' }}>
                  <div className="flex items-center gap-2">
                    <Terminal size={13} className="text-white/25" />
                    <span className="text-[11px] text-white/35 font-medium">Code Editor</span>
                    {roleType === 'jobseeker' && (
                      <span className="text-[9px] text-amber-400/60 ml-1">(Copy/Paste Disabled)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={editorLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-white/5 border border-white/8 text-[11px] px-2.5 py-1 rounded-lg text-white/60 outline-none cursor-pointer"
                      style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23999\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '28px' }}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python 3</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="csharp">C#</option>
                      <option value="go">Go</option>
                      <option value="ruby">Ruby</option>
                      <option value="php">PHP</option>
                      <option value="rust">Rust</option>
                    </select>
                    <button
                      onClick={executeCompilePipeline}
                      disabled={isRunning}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isRunning ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Play size={11} className="fill-black" />
                      )}
                      Run
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    language={editorLanguage}
                    theme="vs-dark"
                    value={codeValue}
                    onChange={(v) => setCodeValue(v || '')}
                    onMount={handleEditorDidMount}
                    options={{
                      fontSize: 13,
                      fontFamily: '"SF Mono", "JetBrains Mono", "Fira Code", monospace',
                      minimap: { enabled: false },
                      automaticLayout: true,
                      padding: { top: 14 },
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      contextmenu: roleType !== 'jobseeker', // Disable context menu for candidates
                      quickSuggestions: true,
                      suggestOnTriggerCharacters: true,
                      acceptSuggestionOnEnter: 'on',
                      tabCompletion: 'on',
                      wordWrap: 'on',
                      formatOnPaste: false, // Disable format on paste
                      formatOnType: true,
                    }}
                  />
                </div>

                {/* Console */}
                <div className="h-40 flex flex-col shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#080808' }}>
                  <div className="h-8 px-4 flex items-center gap-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <Terminal size={11} className="text-white/25" />
                    <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider">Output</span>
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto space-y-1 font-mono">
                    {consoleLogs.map((log, i) => (
                      <pre
                        key={i}
                        className={`text-[11px] whitespace-pre-wrap break-words ${
                          log.startsWith('[error') || log.startsWith('[compilation') || log.startsWith('[runtime')
                            ? 'text-red-400'
                            : log.startsWith('[stderr')
                            ? 'text-amber-400'
                            : log.startsWith('[')
                            ? 'text-white/30'
                            : 'text-white/70'
                        }`}
                      >
                        {log}
                      </pre>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Whiteboard */}
            {activeTab === 'whiteboard' && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="h-11 px-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d' }}>
                  <span className="text-[11px] text-white/35 font-medium">Whiteboard</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                      {([
                        { mode: 'pencil', Icon: Pencil },
                        { mode: 'rectangle', Icon: SquareSquare },
                        { mode: 'circle', Icon: Circle },
                        { mode: 'eraser', Icon: Eraser },
                      ] as const).map(({ mode, Icon }) => (
                        <button
                          key={mode}
                          onClick={() => setToolMode(mode)}
                          className={`p-1.5 rounded-md transition-colors ${
                            toolMode === mode ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'
                          }`}
                        >
                          <Icon size={13} />
                        </button>
                      ))}
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <input 
                      type="color" 
                      value={brushColor} 
                      onChange={(e) => setBrushColor(e.target.value)} 
                      className="w-5 h-5 border-none bg-transparent cursor-pointer p-0 rounded" 
                      title="Brush color"
                    />
                    <input 
                      type="range" 
                      min="2" 
                      max="12" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                      className="w-16 h-1 accent-blue-400 cursor-pointer" 
                      title="Brush size"
                    />
                    <button
                      onClick={() => setShapesRegistry([])}
                      className="p-1.5 rounded-lg text-white/25 hover:text-red-400 transition-colors"
                      title="Clear canvas"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-black/50 p-4 min-h-0 overflow-auto">
                  <canvas
                    ref={canvasRef}
                    width={900}
                    height={580}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className="cursor-crosshair max-w-full max-h-full rounded-2xl"
                    style={{ background: '#080808', border: '1px solid rgba(255,255,255,0.06)' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right panel — video */}
        <div
          className={`${isVideoOnly ? 'w-full' : 'w-[420px] md:w-[480px]'} h-full shrink-0 flex flex-col relative`}
          style={{ background: '#000' }}
        >
          {credentials && (
            <LiveKitMeetingRoom
              token={credentials.token}
              serverUrl={credentials.serverUrl}
              iceServers={credentials.iceServers}
              onDisconnected={handleDisconnected}
              screenShareActive={screenShareActive}
              debugMode={false}
            />
          )}
        </div>
      </main>

      {/* Security Violations Overlay */}
      {roleType === 'jobseeker' && (securityViolations.length > 0 || audioCoachingWarning) && (
        <div className="absolute bottom-5 left-5 z-50 max-w-md rounded-xl bg-red-950/90 border border-red-500/40 p-4 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex gap-3 items-start">
            <ShieldAlert size={18} className="text-red-400 mt-0.5 shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-200 mb-1">Security Monitoring Active</p>
              <p className="text-[10px] text-red-300/80 leading-relaxed mb-2">
                All violations are logged and reviewed. Please maintain assessment integrity.
              </p>
              <div className="space-y-1 font-mono text-[9px] text-red-300/70 max-h-32 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#ef4444 transparent' }}>
                {audioCoachingWarning && (
                  <div className="flex items-start gap-1.5 text-amber-300 font-semibold mb-1">
                    <span className="shrink-0">⚠</span>
                    <span>Sustained background audio detected</span>
                  </div>
                )}
                {securityViolations.map((v, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="shrink-0">•</span>
                    <span className="break-words">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}