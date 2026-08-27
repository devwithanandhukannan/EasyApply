'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import ThemeToggle from '@/app/components/ThemeToggle';
import {
  Rocket, Building2, Kanban, Video, Bot,
  Zap, ShieldAlert, LineChart, Users, BarChart3,
  CheckCircle2, ArrowRight, ChevronRight, Globe,
  DoorOpen, Sparkles, Layers, ShieldCheck, Check,
  Laptop, ExternalLink
} from 'lucide-react';

const JOBSEEKER_URL = typeof window !== 'undefined' && window.location.hostname.includes('dearresume.com')
  ? 'https://dearresume.com'
  : typeof window !== 'undefined' && (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('easyapply'))
  ? 'https://cloudflare.easyapply-jobseeker.pages.dev'
  : (process.env.NEXT_PUBLIC_JOBSEEKER_URL || 'http://localhost:3000');

export default function CompanyFrontPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.push('/dashboard');
  }

  const features = [
    {
      icon: DoorOpen,
      title: 'Live Walk-In Interview Rooms',
      desc: 'Host on-demand video interview sessions with 6-character room codes. Evaluate candidates queued in real-time with integrated notes and scoring.',
      badge: 'Interactive',
      color: '#0071e3',
    },
    {
      icon: Bot,
      title: 'Groq AI Semantic Screening',
      desc: 'Screen 10,000+ resumes in milliseconds. Real-time ATS match scoring, missing keyword analysis, and automated candidate shortlisting.',
      badge: 'AI Powered',
      color: '#8b5cf6',
    },
    {
      icon: Kanban,
      title: 'Drag-and-Drop Hiring Pipelines',
      desc: 'Fully customizable visual Kanban boards. Move candidates between Applied, Screening, Interview, and Offer stages with automatic notifications.',
      badge: 'Visual CRM',
      color: '#ff9500',
    },
    {
      icon: Video,
      title: 'HD Proctored Video Interviews',
      desc: 'Built-in LiveKit WebRTC video rooms with embedded Monaco multi-language code editor, whiteboard, and client-side tab-focus proctoring.',
      badge: 'Proctored',
      color: '#0071e3',
    },
    {
      icon: Zap,
      title: 'Instant Spot Job Dispatch',
      desc: 'Need immediate contract talent or same-day assignments? Post hourly spot jobs that instantly notify available nearby verified specialists.',
      badge: 'Same-Day',
      color: '#10b981',
    },
    {
      icon: Users,
      title: 'Multi-Role Team Workspaces',
      desc: 'Role-based access controls for Recruiters, Technical Interviewers, HR Managers, and Admins to collaborate with team-wide hiring notes.',
      badge: 'Team Ready',
      color: '#6366f1',
    },
  ];

  const stats = [
    { value: '70%', label: 'Shorter Time to Hire', desc: 'Instant queues replace back-and-forth emails' },
    { value: '10k+', label: 'Verified Seekers', desc: 'Ready for live evaluation and spot dispatch' },
    { value: '94%', label: 'ATS Screening Accuracy', desc: 'Deep semantic skill relevance scoring' },
    { value: '3x', label: 'Candidate Engagement', desc: 'Live HD video and interactive code assessments' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Post Roles & Launch Walk-Ins',
      desc: 'Create job postings or activate a live walk-in room with target skills, criteria, and custom queue sizes.',
    },
    {
      num: '02',
      title: 'AI Scores & Live Video Evaluation',
      desc: 'AI scores incoming candidate resumes while candidates queue up directly for 1-on-1 live video assessment.',
    },
    {
      num: '03',
      title: 'Generate Offers in Minutes',
      desc: 'Select candidates, draft customized offer letters from templates, and secure top talent before competitors.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#111827] dark:text-[#f5f5f7] font-sans antialiased selection:bg-[#0071e3]/20 selection:text-[#0071e3] flex flex-col transition-colors duration-300">
      
      {/* ── HEADER NAVBAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white flex items-center justify-center shadow-[0_2px_10px_rgba(0,113,227,0.35)] group-hover:scale-105 transition-transform">
              <Rocket className="w-5 h-5 -rotate-12 fill-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[#111827] dark:text-white group-hover:text-[#0071e3] transition-colors">
                DearResume <span className="text-xs font-semibold text-[#0071e3] ml-1">for Employers</span>
              </span>
              <span className="text-[10px] font-semibold text-[#86868b] -mt-1 hidden sm:inline">
                Hiring Intelligence &amp; Live Walk-In Suite
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#f2f2f7]/80 dark:bg-[#1c1c1e]/80 p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <a
              href="#features"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#86868b] hover:text-[#111827] dark:hover:text-white hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-xs transition-all"
            >
              Features
            </a>
            <a
              href="#walkin"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#86868b] hover:text-[#111827] dark:hover:text-white hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-xs transition-all flex items-center gap-1.5"
            >
              <DoorOpen className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Walk-In Suite</span>
            </a>
            <a
              href="#how-it-works"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#86868b] hover:text-[#111827] dark:hover:text-white hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-xs transition-all"
            >
              How It Works
            </a>
            <a
              href={`${JOBSEEKER_URL}/companies`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#0071e3] hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-xs transition-all flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Directory</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#111827] dark:text-white rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold shadow-[0_2px_8px_rgba(0,113,227,0.3)] transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ───────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-[#0071e3]/12 via-[#6366f1]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] shadow-xs text-xs font-bold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0071e3] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071e3]" />
              </span>
              <span className="text-[#111827] dark:text-white">Next-Gen Recruitment Operating System</span>
              <span className="text-[#86868b]">•</span>
              <a href={`${JOBSEEKER_URL}/companies`} target="_blank" rel="noreferrer" className="text-[#0071e3] hover:underline flex items-center gap-0.5">
                View Directory <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-[1.08]">
              Hire top engineering talent with{' '}
              <span className="bg-gradient-to-r from-[#0071e3] via-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
                AI precision &amp; live walk-ins.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#86868b] font-medium leading-relaxed max-w-2xl mx-auto">
              Automate candidate ranking with Groq semantic intelligence, host instant live video walk-in evaluation rooms, and manage team pipelines without friction.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => router.push('/register')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,113,227,0.35)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Register Your Company</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => router.push('/login')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] text-[#111827] dark:text-[#f5f5f7] border border-black/[0.08] dark:border-white/[0.1] font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <span>Access Employer Portal</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Fast facts */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#86868b] font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                Live Walk-In Video Rooms
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                Visual Kanban Pipeline
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                Public Directory Exposure
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────── */}
      <section className="py-12 border-y border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-[#111112]/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-1 text-center sm:text-left">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-white tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0071e3]">
                  {s.label}
                </div>
                <p className="text-[11px] text-[#86868b] font-medium">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES GRID ───────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0071e3]/10 text-[#0071e3]">
              Enterprise Suite
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] dark:text-white tracking-tight">
              Everything required to scale your engineering team.
            </h2>
            <p className="text-sm sm:text-base text-[#86868b] font-medium">
              From sourcing to live evaluation and e-signature offer letters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => router.push('/register')}
                  className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.2] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                        style={{
                          backgroundColor: `${item.color}10`,
                          borderColor: `${item.color}30`,
                          color: item.color,
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-[#111827] dark:text-white group-hover:text-[#0071e3] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-[#0071e3]">
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── WALK-IN LIVE SPOTLIGHT SECTION ────────────────────────── */}
      <section id="walkin" className="py-16 bg-gradient-to-b from-[#f2f2f7]/50 to-[#fafafa] dark:from-[#151516]/50 dark:to-[#000000] border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Instant Walk-In Room Hosting</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#111827] dark:text-white">
                Eliminate Recruiter Lag with Live Video Walk-Ins
              </h2>
              <p className="text-xs sm:text-sm text-[#86868b] font-medium leading-relaxed">
                Publish a room code directly to the public directory. Candidates join real-time queues, submit their AI-analyzed resumes, and meet interviewers in browser-native HD video.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={() => router.push('/register')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#0071e3]/20 transition-all hover:scale-105 cursor-pointer"
              >
                <DoorOpen className="w-4 h-4" />
                <span>Create Walk-In Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={`${JOBSEEKER_URL}/companies?tab=walkin`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#111827] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Globe className="w-4 h-4 text-[#0071e3]" />
                <span>View Public Directory</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-STEP HIRING PROCESS ──────────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#6366f1]/10 text-[#6366f1]">
              Seamless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] dark:text-white tracking-tight">
              Speed and precision at every stage.
            </h2>
            <p className="text-sm sm:text-base text-[#86868b] font-medium">
              Eliminate friction between sourcing, technical evaluation, and closing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] space-y-4 shadow-xs relative overflow-hidden"
              >
                <div className="text-4xl font-extrabold text-[#0071e3]/20 dark:text-[#0071e3]/30 font-mono">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-[#111827] dark:text-white">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed font-medium">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#111112] py-14 mt-auto">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2 group">
                <div className="w-7 h-7 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-xs">
                  <Rocket className="w-4 h-4 -rotate-12 fill-white/20" />
                </div>
                <span className="font-bold text-base tracking-tight text-[#111827] dark:text-white">
                  DearResume for Employers
                </span>
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed font-medium">
                End-to-end recruitment intelligence, automated ATS screening, and instant walk-in video interview rooms.
              </p>
              <div className="pt-1">
                <ThemeToggle />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white">
                Employer Tools
              </h4>
              <ul className="space-y-2 text-xs text-[#86868b] font-medium">
                <li>
                  <Link href="/register" className="hover:text-[#0071e3] transition-colors">
                    Post Open Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#0071e3] transition-colors">
                    Walk-In Interview Rooms
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#0071e3] transition-colors">
                    Spot Job Dispatch
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white">
                Public Ecosystem
              </h4>
              <ul className="space-y-2 text-xs text-[#86868b] font-medium">
                <li>
                  <a href={`${JOBSEEKER_URL}/companies`} target="_blank" rel="noreferrer" className="hover:text-[#0071e3] transition-colors flex items-center gap-1">
                    <span>Public Directory</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </li>
                <li>
                  <a href={`${JOBSEEKER_URL}/companies?tab=walkin`} target="_blank" rel="noreferrer" className="hover:text-[#0071e3] transition-colors flex items-center gap-1">
                    <span>Live Walk-In Rooms</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </li>
                <li>
                  <a href={JOBSEEKER_URL} target="_blank" rel="noreferrer" className="hover:text-[#0071e3] transition-colors flex items-center gap-1">
                    <span>Candidate Portal</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-white">
                Account
              </h4>
              <ul className="space-y-2 text-xs text-[#86868b] font-medium">
                <li>
                  <Link href="/login" className="hover:text-[#0071e3] transition-colors">
                    Employer Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#0071e3] transition-colors">
                    Register Company
                  </Link>
                </li>
                <li>
                  <Link href="/forgot-password" className="hover:text-[#0071e3] transition-colors">
                    Account Recovery
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868b] font-medium">
            <p>© {new Date().getFullYear()} DearResume Enterprise. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href={`${JOBSEEKER_URL}/companies`} target="_blank" rel="noreferrer" className="hover:text-[#0071e3]">
                {JOBSEEKER_URL}/companies
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}