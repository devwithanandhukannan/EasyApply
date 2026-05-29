// app/meet/[id]/page.tsx (full updated version)

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  Loader2, AlertTriangle, Code2, Monitor, Square, 
  Tv, Layers, Trash2, Pencil, Palette, Video, Eraser, Play, Terminal, SquareSquare, Circle
} from 'lucide-react';
import api from '@/app/lib/axios';
import dynamic from 'next/dynamic';

// Heavy Monaco Text Editor and LiveKit components loaded dynamically
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

// Piston API execution
const executeCodeSandbox = async (
  language: string, 
  code: string, 
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>,
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setIsRunning(true);
  setConsoleLogs(prev => [...prev, `[Runtime]: Sending code to Piston API for ${language} execution...`]);

  const languageMap: Record<string, { language: string; version: string }> = {
    javascript: { language: 'javascript', version: '18.15.0' },
    python: { language: 'python', version: '3.10.0' },
    java: { language: 'java', version: '17.0.6' },
    cpp: { language: 'cpp', version: '10.2.0' },
    csharp: { language: 'csharp', version: '6.12.0' },
    go: { language: 'go', version: '1.20.0' },
    ruby: { language: 'ruby', version: '3.2.0' },
    php: { language: 'php', version: '8.2.0' },
    rust: { language: 'rust', version: '1.68.0' },
    typescript: { language: 'typescript', version: '5.0.0' }
  };

  const selected = languageMap[language];
  if (!selected) {
    setConsoleLogs(prev => [...prev, `[STDERR]: Unsupported language: ${language}`]);
    setIsRunning(false);
    return;
  }

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: selected.language,
        version: selected.version,
        files: [{ content: code }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      const output = data.run.output;
      const stderr = data.run.stderr;
      const signal = data.run.signal;

      if (stderr) {
        setConsoleLogs(prev => [...prev, `[STDERR]:\n${stderr}`]);
      }
      if (output) {
        setConsoleLogs(prev => [...prev, `[STDOUT]:\n${output}`]);
      }
      if (signal === 'SIGKILL') {
        setConsoleLogs(prev => [...prev, `[ERROR]: Execution timed out (possibly infinite loop)`]);
      }
      setConsoleLogs(prev => [...prev, `[PROCESS FINISHED]: Exit code ${data.run.code}`]);
    } else {
      setConsoleLogs(prev => [...prev, `[API ERROR]: ${data.message || 'Unknown error'}`]);
    }
  } catch (err: any) {
    setConsoleLogs(prev => [...prev, `[STDERR NETWORK]: ${err.message}`]);
  } finally {
    setIsRunning(false);
  }
};

export default function UnifiedLiveKitMeetPage() {
  const { id: interviewId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleType = searchParams.get('role') === 'candidate' ? 'jobseeker' : 'company';

  const [credentials, setCredentials] = useState<{ token: string; serverUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('video_only');
  const [screenShareActive, setScreenShareActive] = useState(false);

  // Code editor state
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [codeValue, setCodeValue] = useState(`// Advanced Execution Sandbox Layer\nfunction evaluateSolution() {\n  console.log("Initializing Test Matrix Compilation Execution...");\n  let totalMatches = 0;\n  for(let i = 0; i < 100; i++) {\n    if (i % 3 === 0) totalMatches += i;\n  }\n  console.log("Vector Calculations Complete.");\n  return totalMatches;\n}\n\nconsole.log("Result Value Array Output:", evaluateSolution());`);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['[System]: Remote execution runtime kernel initialized. Static analysis ready.']);

  // Whiteboard state (unchanged)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('pencil');
  const [brushColor, setBrushColor] = useState('#60a5fa');
  const [brushSize, setBrushSize] = useState(4);
  const [shapesRegistry, setShapesRegistry] = useState<DrawItem[]>([]);

  useEffect(() => {
    if (!interviewId) return;
    let cancelled = false;

    const fetchRoomCredentials = async () => {
      try {
        const endpoint = roleType === 'jobseeker'
          ? `/interviews/${interviewId}/token/jobseeker`
          : `/interviews/${interviewId}/token/company`;

        const response = await api.post(endpoint);
        if (cancelled) return;

        if (response.data?.success && response.data?.token) {
          setCredentials({
            token: response.data.token,
            serverUrl: 'http://localhost:7880' 
          });
        } else {
          setError(response.data?.message || 'Failed to extract verification token signatures.');
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to authenticate secure session layer.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRoomCredentials();
    return () => { cancelled = true; };
  }, [interviewId, roleType]);

  useEffect(() => {
    drawCanvasFrame();
  }, [shapesRegistry, activeTab]);

  const handleDisconnected = () => {
    router.replace('/dashboard/interviews');
  };

  const handleRunCode = () => {
    executeCodeSandbox(editorLanguage, codeValue, setConsoleLogs, setIsRunning);
  };

  // Whiteboard functions (unchanged)
  const drawCanvasFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    const gridSpacing = 25;
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    shapesRegistry.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (shape.points.length < 2) return;

      if (shape.type === 'pencil') {
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
      } else if (shape.type === 'rectangle') {
        const start = shape.points[0];
        const end = shape.points[shape.points.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (shape.type === 'circle') {
        const start = shape.points[0];
        const end = shape.points[shape.points.length - 1];
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;

    if (toolMode === 'eraser') {
      executeEraserCollisionCheck(x, y);
    } else {
      currentPathRef.current = [{ x, y }];
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode === 'eraser') {
      executeEraserCollisionCheck(x, y);
    } else {
      currentPathRef.current.push({ x, y });
      
      drawCanvasFrame();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        
        if (toolMode === 'pencil') {
          ctx.beginPath();
          ctx.moveTo(currentPathRef.current[0].x, currentPathRef.current[0].y);
          currentPathRef.current.forEach(pt => ctx.lineTo(pt.x, pt.y));
          ctx.stroke();
        } else if (toolMode === 'rectangle') {
          const start = currentPathRef.current[0];
          ctx.strokeRect(start.x, start.y, x - start.x, y - start.y);
        } else if (toolMode === 'circle') {
          const start = currentPathRef.current[0];
          const radius = Math.sqrt(Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2));
          ctx.beginPath(); ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI); ctx.stroke();
        }
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (toolMode !== 'eraser' && currentPathRef.current.length > 0) {
      const newShape: DrawItem = {
        id: crypto.randomUUID(),
        type: toolMode,
        points: [...currentPathRef.current],
        color: brushColor,
        size: brushSize
      };
      setShapesRegistry(prev => [...prev, newShape]);
    }
    currentPathRef.current = [];
  };

  const executeEraserCollisionCheck = (cx: number, cy: number) => {
    const clickRadiusTolerance = 15;
    
    setShapesRegistry(prevShapes => {
      return prevShapes.filter(shape => {
        const intersectionDetected = shape.points.some(pt => {
          const distantVector = Math.sqrt(Math.pow(pt.x - cx, 2) + Math.pow(pt.y - cy, 2));
          return distantVector <= clickRadiusTolerance;
        });
        return !intersectionDetected;
      });
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Initializing secure workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !credentials) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black p-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Connection Failed</h2>
        <p className="text-sm text-zinc-400 text-center max-w-md">{error || 'Unable to join the meeting. Please try again later.'}</p>
        <button
          onClick={() => router.replace('/dashboard/interviews')}
          className="mt-6 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-black overflow-hidden text-white font-mono">
      <header className="h-14 border-b border-zinc-900 bg-zinc-950 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-300">Live Workspace Session Layer</span>
          <span className="text-[10px] bg-zinc-900 px-2 py-0.5 border border-zinc-800 rounded text-zinc-500 uppercase">{roleType} View</span>
        </div>

        <div className="flex items-center gap-1.5 bg-black p-1 border border-zinc-900 rounded-lg">
          <button 
            onClick={() => setActiveTab('video_only')}
            className={`px-3 py-1.5 rounded-md text-[11px] uppercase font-bold flex items-center gap-1.5 transition-all ${activeTab === 'video_only' ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Video size={13} /> Split View
          </button>
          <button 
            onClick={() => setActiveTab('code_editor')}
            className={`px-3 py-1.5 rounded-md text-[11px] uppercase font-bold flex items-center gap-1.5 transition-all ${activeTab === 'code_editor' ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Code2 size={13} /> IDE Sandbox
          </button>
          <button 
            onClick={() => setActiveTab('whiteboard')}
            className={`px-3 py-1.5 rounded-md text-[11px] uppercase font-bold flex items-center gap-1.5 transition-all ${activeTab === 'whiteboard' ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Layers size={13} /> Whiteboard
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScreenShareActive(!screenShareActive)}
            className={`px-3 py-1.5 text-[11px] uppercase font-bold border rounded-lg transition-all flex items-center gap-1.5 ${
              screenShareActive 
                ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400 hover:bg-emerald-950/50' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <Tv size={13} />
            {screenShareActive ? 'Stop Share' : 'Share Tab / Screen'}
          </button>
          <button onClick={handleDisconnected} className="px-3 py-1.5 text-[11px] uppercase font-bold bg-red-950/40 border border-red-900 text-red-400 rounded-lg hover:bg-red-950/60 transition-colors">
            Leave
          </button>
        </div>
      </header>

      <main className="flex flex-1 w-full overflow-hidden min-h-0 bg-black relative">
        {activeTab !== 'video_only' && (
          <div className="flex-1 h-full border-r border-zinc-900 bg-zinc-950 flex flex-col min-w-0 transition-all duration-300">
            {activeTab === 'code_editor' && (
              <div className="flex flex-col flex-1 min-h-0 bg-[#1e1e1e]">
                <div className="h-11 px-4 border-b border-zinc-900 bg-black flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-zinc-500" />
                    <span className="text-[11px] text-zinc-400 uppercase font-bold">Monaco Core Context Sandbox</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select 
                      value={editorLanguage}
                      onChange={(e) => setEditorLanguage(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-bold px-2 py-1 rounded text-zinc-300 outline-none cursor-pointer"
                    >
                      <option value="javascript">JavaScript (NodeJS 18)</option>
                      <option value="python">Python 3.10</option>
                      <option value="java">Java 17</option>
                      <option value="cpp">C++ (GCC 10.2)</option>
                      <option value="csharp">C# (.NET 6.12)</option>
                      <option value="go">Go 1.20</option>
                      <option value="ruby">Ruby 3.2</option>
                      <option value="php">PHP 8.2</option>
                      <option value="rust">Rust 1.68</option>
                      <option value="typescript">TypeScript 5.0</option>
                    </select>
                    
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-black font-bold text-[11px] rounded flex items-center gap-1 transition-all uppercase"
                    >
                      {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} className="fill-black" />}
                      Run Code
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    language={editorLanguage === 'cpp' ? 'cpp' : editorLanguage === 'csharp' ? 'csharp' : editorLanguage}
                    theme="vs-dark"
                    value={codeValue}
                    onChange={(value) => setCodeValue(value || '')}
                    options={{
                      fontSize: 12,
                      fontFamily: 'monospace',
                      minimap: { enabled: false },
                      automaticLayout: true,
                      padding: { top: 12 }
                    }}
                  />
                </div>

                <div className="h-44 border-t border-zinc-900 bg-black flex flex-col shrink-0 font-mono text-[11px]">
                  <div className="h-7 px-4 bg-zinc-950 border-b border-zinc-900/60 flex items-center text-zinc-500 uppercase font-bold text-[9px] tracking-wider">
                    Virtual Stdout Execution Stream Logs Output
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto space-y-1 select-text selection:bg-zinc-800 text-zinc-400">
                    {consoleLogs.map((log, idx) => (
                      <div key={idx} className={`${log.startsWith('[STDERR') ? 'text-red-400' : log.startsWith('[PROCESS') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'whiteboard' && (
              <div className="flex flex-col flex-1 min-h-0 bg-zinc-950">
                <div className="h-11 px-4 border-b border-zinc-900 bg-black flex items-center justify-between shrink-0">
                  <div className="text-[11px] text-zinc-400 uppercase font-bold">Vector Construction Whiteboard Workspace</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-900 p-0.5 rounded border border-zinc-800">
                      <button 
                        onClick={() => setToolMode('pencil')}
                        className={`p-1.5 rounded text-xs transition-colors ${toolMode === 'pencil' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                        title="Freehand Pencil Pen Tool"
                      >
                        <Pencil size={13} />
                      </button>
                      <button 
                        onClick={() => setToolMode('rectangle')}
                        className={`p-1.5 rounded text-xs transition-colors ${toolMode === 'rectangle' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                        title="Rectangle Vector Builder"
                      >
                        <SquareSquare size={13} />
                      </button>
                      <button 
                        onClick={() => setToolMode('circle')}
                        className={`p-1.5 rounded text-xs transition-colors ${toolMode === 'circle' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                        title="Circle Vector Bounds Tool"
                      >
                        <Circle size={13} />
                      </button>
                      <button 
                        onClick={() => setToolMode('eraser')}
                        className={`p-1.5 rounded text-xs transition-colors ${toolMode === 'eraser' ? 'bg-zinc-800 text-red-400' : 'text-zinc-400 hover:text-red-400'}`}
                        title="Advanced Path-Collision Eraser"
                      >
                        <Eraser size={13} />
                      </button>
                    </div>

                    <div className="h-4 w-px bg-zinc-800" />

                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={brushColor} 
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="w-5 h-5 bg-transparent border-none cursor-pointer p-0"
                        title="Palette Vector Shifter"
                      />
                      <input 
                        type="range" min="2" max="12" 
                        value={brushSize} 
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-16 h-1 accent-blue-400 bg-zinc-800 rounded appearance-none cursor-pointer"
                        title="Stroke Size Controller"
                      />
                    </div>

                    <button 
                      onClick={() => setShapesRegistry([])}
                      className="p-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded transition-colors"
                      title="Purge Frame Data Registry"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-black/40 flex items-center justify-center p-4 min-h-0 overflow-auto">
                  <canvas
                    ref={canvasRef}
                    width={900}
                    height={580}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className="bg-black border border-zinc-900 rounded-xl shadow-2xl cursor-crosshair max-w-full max-h-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className={`${activeTab === 'video_only' ? 'w-full' : 'w-[380px] md:w-[420px]'} h-full shrink-0 flex flex-col relative bg-black`}>
          <LiveKitMeetingRoom 
            token={credentials.token} 
            serverUrl={credentials.serverUrl} 
            onDisconnected={handleDisconnected}
            screenShareActive={screenShareActive}
          />
        </div>
      </main>
    </div>
  );
}