// company-frontend/app/meet/[id]/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, Send, Play, Mic, VideoOff, CheckCircle } from 'lucide-react';

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: string;
}

export default function DeepLiveInterviewStudio({ params }: { params: { id: string } }) {
  const interviewId = params.id;
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  
  const [role] = useState<'interviewer' | 'candidate'>('interviewer'); // Derived from session auth contexts
  const [code, setCode] = useState('// Live typing editor payload space...');
  const [chatMessage, setChatMessage] = useState('');
  const [chatThread, setChatThread] = useState<ChatMessage[]>([]);
  const [terminalLog, setTerminalLog] = useState('Terminal standing by...');

  useEffect(() => {
    // Open persistent tunnel onto backend namespace execution context
    socketRef.current = io('http://localhost:5000/live-workspace', {
      query: { interviewId, role }
    });

    // Wire up listeners for collaborative sync states
    socketRef.current.on('code-delta-broadcast', (data: { code: string }) => {
      setCode(data.code);
    });

    socketRef.current.on('chat-message-broadcast', (msg: ChatMessage) => {
      setChatThread((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [interviewId, role]);

  // Handle autoscrolling as instant chat messages fill the layout bounds
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatThread]);

  const dispatchTextMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const msgPayload: ChatMessage = {
      sender: role === 'interviewer' ? 'Interviewer' : 'Candidate',
      text: chatMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socketRef.current?.emit('chat-message-emit', msgPayload);
    setChatThread((prev) => [...prev, msgPayload]);
    setChatMessage('');
  };

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-white overflow-hidden font-sans">
      
      {/* 1. MEDIA COLUMN PANELS */}
      <div className="w-[300px] border-r border-zinc-900 bg-zinc-950 flex flex-col">
        <div className="p-4 flex-1 space-y-4 overflow-y-auto">
          <div className="relative aspect-video bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 text-xs">
            Candidate Video Feed
          </div>
          <div className="relative aspect-video bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 text-xs">
            Interviewer Video Feed
          </div>
        </div>

        <div className="p-4 border-t border-zinc-900 grid grid-cols-2 gap-2 bg-zinc-950/40">
          <button className="flex items-center justify-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 font-medium"><Mic className="h-3.5 w-3.5"/>Mute</button>
          <button className="flex items-center justify-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 font-medium"><VideoOff className="h-3.5 w-3.5"/>Cam Off</button>
        </div>
      </div>

      {/* 2. LIVE COMPILER INTERFACE CENTER */}
      <div className="flex-1 flex flex-col border-r border-zinc-900">
        <div className="h-14 border-b border-zinc-900 px-6 flex items-center justify-between bg-zinc-950/40">
          <span className="text-xs font-semibold tracking-wider text-zinc-400 font-mono">WORKSPACE_SANDBOX.TS</span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-xs font-semibold rounded-lg"><Play className="h-3 w-3 fill-current" /> Run</button>
        </div>
        <div className="flex-1 min-h-[60%]">
          <Editor 
            height="100%" 
            theme="vs-dark" 
            language="javascript" 
            value={code} 
            onChange={(val) => { setCode(val || ''); socketRef.current?.emit('code-delta-update', { code: val }); }}
            options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true }}
          />
        </div>
        <div className="h-[30%] bg-zinc-950 p-4 border-t border-zinc-900 font-mono text-xs text-zinc-400">
          <div className="text-zinc-600 font-bold text-[10px] uppercase tracking-wider mb-2">Stdout Trace Logger</div>
          {terminalLog}
        </div>
      </div>

      {/* 3. INSTANT PERSISTENT CHAT COMPONENT CONTAINER */}
      <div className="w-[340px] bg-zinc-950 flex flex-col">
        <div className="h-14 px-4 border-b border-zinc-900 flex items-center gap-2 bg-zinc-950/40">
          <MessageSquare className="h-4 w-4 text-zinc-400" />
          <h3 className="text-xs font-semibold text-white">Live Discussion Channel</h3>
        </div>

        {/* Dynamic Live Text Flow Streams */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {chatThread.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.sender === 'Interviewer' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.sender === 'Interviewer' ? 'bg-zinc-100 text-black rounded-tr-none' : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none'
              }`}>
                <p>{msg.text}</p>
              </div>
              <span className="text-[9px] text-zinc-600 font-mono mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Text Messaging Dispatch Form */}
        <form onSubmit={dispatchTextMessage} className="p-3 border-t border-zinc-900 bg-zinc-950 flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type message to sync room stream..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
          <button type="submit" className="p-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-lg transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}