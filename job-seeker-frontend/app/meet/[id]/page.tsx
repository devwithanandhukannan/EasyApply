'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2, AlertTriangle, Code2, Monitor, Square, Tv, Layers,
  Trash2, Pencil, Play, Terminal, SquareSquare, Circle, Eraser, Video,
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

  const [credentials, setCredentials] = useState<{ token: string; serverUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('video_only');
  const [screenShareActive, setScreenShareActive] = useState(false);

  // Code editor
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [codeValue, setCodeValue] = useState(languageBoilerplates['javascript']);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['[ready]']);

  // Whiteboard
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

    const fetchCreds = async () => {
      try {
        const endpoint =
          roleType === 'jobseeker'
            ? `/interviews/${interviewId}/token/jobseeker`
            : `/interviews/${interviewId}/token/company`;

        const res = await api.post(endpoint);
        if (cancelled) return;

        if (res.data?.success && res.data?.token) {
          setCredentials({ token: res.data.token, serverUrl: 'http://localhost:7880' });
        } else {
          setError(res.data?.message || 'Failed to get room token.');
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Unable to join session.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCreds();
    return () => { cancelled = true; };
  }, [interviewId, roleType]);

  useEffect(() => {
    if (activeTab === 'whiteboard') drawCanvasFrame();
  }, [shapesRegistry, activeTab]);

  const handleDisconnected = () => router.replace('/dashboard/interviews');

  // Code execution
  const executeCompilePipeline = async () => {
    setIsRunning(true);
    setConsoleLogs(['[compiling...]']);

    const langMap: Record<string, number> = {
      javascript: 63, typescript: 74, python: 71, java: 62,
      cpp: 54, csharp: 51, go: 60, ruby: 72, php: 68, rust: 73,
    };

    const COMPILER_API_KEY = 'a3dde5427emshec7c45862006035p16e126jsnd102eff61b2b';
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
        data: JSON.stringify({ language_id: langMap[editorLanguage], source_code: encoded, stdin: '' }),
      });

      const token = sub.data?.token;
      if (!token) throw new Error('No execution token returned.');

      let result = null;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const poll = await axios.request({
          method: 'GET',
          url: `https://judge029.p.rapidapi.com/submissions/${token}`,
          params: { base64_encoded: 'true', fields: '*' },
          headers,
        });
        result = poll.data;
        if (result.status?.id > 2) break;
      }

      if (!result) throw new Error('Timed out waiting for result.');

      const decode = (s: string | null | undefined) => {
        if (!s) return '';
        try { return decodeURIComponent(escape(atob(s))); } catch { return s; }
      };

      const sid = result.status?.id;
      if (sid === 6) {
        setConsoleLogs(['[compilation error]', decode(result.compile_output)]);
      } else if (sid >= 7 && sid <= 12) {
        setConsoleLogs([`[runtime error: ${result.status?.description}]`, decode(result.stderr)]);
      } else {
        const out = decode(result.stdout).trim();
        const err = decode(result.stderr);
        const logs: string[] = [];
        if (err?.trim()) logs.push(`[stderr]\n${err}`);
        logs.push(out || '(no output)');
        if (result.time || result.memory)
          logs.push(`[${result.time}s · ${result.memory}kb]`);
        setConsoleLogs(logs);
      }
    } catch (err: any) {
      setConsoleLogs([`[error] ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setEditorLanguage(lang);
    if (languageBoilerplates[lang]) setCodeValue(languageBoilerplates[lang]);
  };

  // Whiteboard
  const drawCanvasFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 24) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 24) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

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
        const s = shape.points[0], e = shape.points[shape.points.length - 1];
        ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
      } else if (shape.type === 'circle' && shape.points.length >= 2) {
        const s = shape.points[0], e = shape.points[shape.points.length - 1];
        const r = Math.hypot(e.x - s.x, e.y - s.y);
        ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 2 * Math.PI); ctx.stroke();
      }
    });
  }, [shapesRegistry]);

  const drawPreview = (cx: number, cy: number) => {
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
      ctx.beginPath(); ctx.moveTo(s.x, s.y);
      currentPathRef.current.forEach((p) => ctx.lineTo(p.x, p.y)); ctx.stroke();
    } else if (toolMode === 'rectangle') {
      ctx.strokeRect(s.x, s.y, cx - s.x, cy - s.y);
    } else if (toolMode === 'circle') {
      ctx.beginPath(); ctx.arc(s.x, s.y, Math.hypot(cx - s.x, cy - s.y), 0, 2 * Math.PI); ctx.stroke();
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    isDrawingRef.current = true;
    if (toolMode === 'eraser') eraseAt(x, y);
    else currentPathRef.current = [{ x, y }];
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (toolMode === 'eraser') eraseAt(x, y);
    else { currentPathRef.current.push({ x, y }); drawPreview(x, y); }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (toolMode !== 'eraser' && currentPathRef.current.length > 0) {
      setShapesRegistry((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: toolMode, points: [...currentPathRef.current], color: brushColor, size: brushSize },
      ]);
    }
    currentPathRef.current = [];
  };

  const eraseAt = (cx: number, cy: number) => {
    setShapesRegistry((prev) =>
      prev.filter((s) => !s.points.some((p) => Math.hypot(p.x - cx, p.y - cy) <= 15))
    );
  };

  // Loading / Error states
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
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0a] overflow-hidden text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>

      {/* Header */}
      <header className="h-12 px-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)' }}>

        {/* Left — live indicator + role */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse" />
            <span className="text-[11px] text-white/50 font-medium">Live</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[11px] text-white/30 capitalize">{roleType}</span>
        </div>

        {/* Center — tab switcher */}
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

        {/* Right — screen share + leave */}
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

        {/* Left panel — code / whiteboard */}
        {!isVideoOnly && (
          <div className="flex-1 h-full flex flex-col min-w-0" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>

            {/* Code Editor */}
            {activeTab === 'code_editor' && (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Toolbar */}
                <div className="h-11 px-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d' }}>
                  <div className="flex items-center gap-2">
                    <Terminal size={13} className="text-white/25" />
                    <span className="text-[11px] text-white/35 font-medium">Code Editor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={editorLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-white/5 border border-white/8 text-[11px] px-2.5 py-1 rounded-lg text-white/60 outline-none cursor-pointer appearance-none"
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
                      {isRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} className="fill-black" />}
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
                    options={{ fontSize: 13, fontFamily: '"SF Mono", "JetBrains Mono", monospace', minimap: { enabled: false }, automaticLayout: true, padding: { top: 14 }, lineNumbers: 'on', scrollBeyondLastLine: false }}
                  />
                </div>

                {/* Console */}
                <div className="h-40 flex flex-col shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#080808' }}>
                  <div className="h-8 px-4 flex items-center gap-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <Terminal size={11} className="text-white/25" />
                    <span className="text-[10px] text-white/25 font-medium uppercase tracking-wider">Output</span>
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto space-y-1 select-text">
                    {consoleLogs.map((log, i) => (
                      <pre
                        key={i}
                        className={`text-[11px] font-mono whitespace-pre-wrap ${
                          log.startsWith('[error') || log.startsWith('[compilation') || log.startsWith('[runtime')
                            ? 'text-[#ff0000]'
                            : log.startsWith('[')
                            ? 'text-white/25'
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
                {/* Toolbar */}
                <div className="h-11 px-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d' }}>
                  <span className="text-[11px] text-white/35 font-medium">Whiteboard</span>
                  <div className="flex items-center gap-2">
                    {/* Tool group */}
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
                    <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-5 h-5 border-none bg-transparent cursor-pointer p-0 rounded" />
                    <input type="range" min="2" max="12" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-16 h-1 accent-blue-400 cursor-pointer" />
                    <button
                      onClick={() => setShapesRegistry([])}
                      className="p-1.5 rounded-lg text-white/25 hover:text-[#ff0000] transition-colors"
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
          {credentials ? (
            <LiveKitMeetingRoom
              token={credentials.token}
              serverUrl={credentials.serverUrl}
              onDisconnected={handleDisconnected}
              screenShareActive={screenShareActive}
              debugMode={false}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 size={18} className="text-white/20 animate-spin" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}