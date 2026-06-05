'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { redirect, useRouter } from 'next/navigation';
import { 
  Building2, 
  Sparkles, 
  ArrowRight, 
  Kanban, 
  Video, 
  Bot, 
  Zap, 
  ShieldAlert,
  LineChart
} from 'lucide-react';

export default function CompanyFrontPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Route active employer sessions back to their working dashboard
  if (isAuthenticated) {
    redirect('/dashboard');
  }

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 antialiased selection:bg-zinc-800 selection:text-white font-sans flex flex-col justify-between">
      
      {/* ─── ENTERPRISE NAVIGATION ─────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-black/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <div className="h-6 w-6 rounded-md bg-zinc-100 flex items-center justify-center shadow-sm">
              <Building2 className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase text-white">
              Interviewer <span className="text-zinc-500 font-normal">for Business</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigation('/login')}
              className="text-xs font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={() => handleNavigation('/register')}
              className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-zinc-100 text-zinc-950 text-xs font-medium hover:bg-white transition-all duration-200 shadow-sm"
            >
              Register Portal
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO LAYER ────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-24 pb-16 flex flex-col items-center justify-center text-center">
        
        {/* Micro Tech Token */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/60 mb-6 select-none">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest">
            Next.js Corporate Console
          </span>
        </div>

        {/* Hero Copy */}
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Automate screening workflows. <br />
          <span className="text-zinc-500">Run real-time interview rooms.</span>
        </h1>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl font-light leading-relaxed mb-10">
          An end-to-end multi-tenant platform for matching talents, managing automated candidate pipelines, running live technical coding labs, and distributing secure dynamic offer sheets[cite: 1].
        </p>

        {/* Action Splines */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => handleNavigation('/login')}
            className="group inline-flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-white px-6 py-3 rounded-full text-xs font-medium hover:bg-zinc-800/60 hover:border-zinc-700 transition-all duration-200 shadow-xl"
          >
            Access Employer Workspace
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* ─── GRID SYSTEMS METRICS ──────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full mt-24 text-left">
          
          {/* Card 1: Kanban Boards */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all group">
            <div>
              <div className="p-2 bg-zinc-900 border border-zinc-800 w-fit rounded-xl mb-4 text-zinc-400 group-hover:text-white transition-colors">
                <Kanban className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                Hiring Pipelines
              </h3>
              <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                Seamless drag-and-drop tracking to migrate applicants across fully tailored evaluation checkpoints.
              </p>
            </div>
          </div>

          {/* Card 2: LiveKit Editor Rooms */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all group">
            <div>
              <div className="p-2 bg-zinc-900 border border-zinc-800 w-fit rounded-xl mb-4 text-zinc-400 group-hover:text-white transition-colors">
                <Video className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                Real-Time Video Rooms
              </h3>
              <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                Natively run HD audio/video streaming coupled alongside execution-ready compiler blocks and dynamic question panels.
              </p>
            </div>
          </div>

          {/* Card 3: Groq Semantic Match */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all group">
            <div>
              <div className="p-2 bg-zinc-900 border border-zinc-800 w-fit rounded-xl mb-4 text-zinc-400 group-hover:text-white transition-colors">
                <Bot className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                Semantic AI Parsing
              </h3>
              <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                Scan your database records instantly with the Groq engine to prioritize elite talents based on skill relevance matching.
              </p>
            </div>
          </div>

          {/* Card 4: Spot Jobs Allocation */}
          <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between hover:border-zinc-800 transition-all group">
            <div>
              <div className="p-2 bg-zinc-900 border border-zinc-800 w-fit rounded-xl mb-4 text-zinc-400 group-hover:text-white transition-colors">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-200 mb-2">
                Rapid Spot Jobs
              </h3>
              <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                Deploy temporary hourly or daily task listings with immediate dispatch directly to on-demand target seekers.
              </p>
            </div>
          </div>

        </section>

        {/* ─── INFRASTRUCTURE INTEGRITY STATEMENT ────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4 text-left">
          <div className="p-6 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl flex items-start gap-4">
            <ShieldAlert className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Client-Side Proctoring Suite
              </h4>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">
                Assess candidate capabilities via local client-side MediaPipe systems, non-intrusively gathering tab focus alerts and face presence evaluations during active exam intervals.
              </p>
            </div>
          </div>

          <div className="p-6 bg-zinc-950/40 border border-zinc-900/80 rounded-2xl flex items-start gap-4">
            <LineChart className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Unified Data Hub
              </h4>
              <p className="text-xs text-zinc-500 font-light leading-relaxed">
                Analyze critical business metrics including drop-off conversions, source distributions, and average acquisition turnaround intervals in real-time.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* ─── MINIMAL FOOTER ────────────────────────────────── */}
      <footer className="border-t border-zinc-900 py-6 bg-black">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-600 font-light tracking-wide gap-3 select-none">
          <p>© 2026 Interviewer Core Ecosystem. Configured for desktop administration.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">System Framework</span>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Data Encapsulation</span>
            <span className="hover:text-zinc-400 transition-colors cursor-pointer">Security Ledger</span>
          </div>
        </div>
      </footer>

    </div>
  );
}