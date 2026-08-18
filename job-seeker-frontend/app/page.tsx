'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { useAuth } from '@/app/contexts/AuthContext';
import ThemeToggle from '@/app/components/ThemeToggle';
import {
  Rocket, Sparkles, Video, Brain, Zap, Shield,
  ArrowRight, CheckCircle2, ChevronRight, Building2,
  Users, Layers, Clock, Globe, Search, Play,
  MessageSquare, Star, Laptop, Lock, ArrowUpRight
} from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const stats = [
    { value: '50K+', label: 'AI Profiles Evaluated', desc: 'Real-time ATS parsing & scoring' },
    { value: '< 15m', label: 'Walk-In Queue Wait', desc: 'Direct live video evaluation' },
    { value: '94%', label: 'Precision Matching', desc: 'Semantic skill & role alignment' },
    { value: '1.2K+', label: 'Verified Tech Hubs', desc: 'Actively hosting walk-in rooms' },
  ];

  const features = [
    {
      icon: Video,
      title: 'Instant Walk-In Video Rooms',
      desc: 'No more waiting weeks for recruiter screening calls. Enter public walk-in queues, grab room codes, and speak 1-on-1 with hiring teams directly in your browser.',
      badge: 'Live Now',
      color: '#0071e3',
      href: '/companies?tab=walkin'
    },
    {
      icon: Brain,
      title: 'Deep ATS & Skill Intelligence',
      desc: 'Our neural resume parser highlights critical missing keywords, computes deep compatibility scores, and applies aging score boosts to keep your profile on top.',
      badge: 'AI Powered',
      color: '#8b5cf6',
      href: '/login'
    },
    {
      icon: Zap,
      title: 'Same-Day Spot Placements',
      desc: 'Toggle your real-time availability badge to receive immediate placement invitations from fast-moving startups and high-growth engineering teams.',
      badge: 'Instant Offers',
      color: '#ff9500',
      href: '/login'
    },
    {
      icon: Building2,
      title: 'Public Ecosystem Directory',
      desc: 'Browse hundreds of verified engineering companies, discover their tech stacks, explore open roles, and access active walk-in rooms with zero barriers.',
      badge: 'Public Access',
      color: '#34c759',
      href: '/companies'
    },
    {
      icon: Shield,
      title: 'Proctored Code & Video Interviews',
      desc: 'Integrated LiveKit HD video environments with built-in Monaco code editor, real-time audio/video streaming, and secure browser-based evaluation.',
      badge: 'Integrated',
      color: '#0071e3',
      href: '/login'
    },
    {
      icon: MessageSquare,
      title: 'Frictionless WhatsApp OTP Auth',
      desc: 'Never forget a password again. Sign in securely in under 3 seconds with a lightning-fast one-time verification code sent right to your WhatsApp.',
      badge: 'Seamless',
      color: '#10b981',
      href: '/login'
    }
  ];

  const workflowSteps = [
    {
      num: '01',
      title: 'Build & Optimize Profile',
      desc: 'Upload your resume for instant AI scoring, skill extraction, and personalized profile benchmarking.'
    },
    {
      num: '02',
      title: 'Explore Live Hubs & Walk-Ins',
      desc: 'Browse open roles and active walk-in rooms in the public company directory at /companies.'
    },
    {
      num: '03',
      title: 'Interview & Get Hired Fast',
      desc: 'Queue up directly for walk-in rooms or 1-on-1 interviews with company leads and secure fast offers.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300 font-sans antialiased overflow-x-hidden selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
      
      {/* ── STICKY GLASS NAVBAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/75 dark:bg-[#000000]/75 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#5856d6] text-white flex items-center justify-center shadow-[0_2px_10px_rgba(0,113,227,0.35)] group-hover:scale-105 transition-transform">
              <Rocket className="w-5 h-5 -rotate-12 fill-white/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors">
                EasyApply
              </span>
              <span className="text-[10px] font-semibold text-[#86868b] -mt-1 hidden sm:inline">
                Career Intelligence Platform
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#f2f2f7]/80 dark:bg-[#1c1c1e]/80 p-1 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <Link
              href="/companies"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#1d1d1f] dark:text-white hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-xs transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Explore Companies</span>
            </Link>
            <Link
              href="/companies?tab=walkin"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-xs transition-all flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-[#34c759]" />
              <span>Walk-In Rooms</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
            </Link>
            <a
              href="#features"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-xs transition-all"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-white dark:hover:bg-[#2c2c2e] hover:shadow-xs transition-all"
            >
              How It Works
            </a>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            <Link
              href="/companies"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#f2f2f7] dark:bg-[#1c1c1e] hover:bg-[#e5e5ea] dark:hover:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] transition shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#86868b]" />
              <span>Public Directory</span>
            </Link>

            {isAuthenticated ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold shadow-[0_2px_8px_rgba(0,113,227,0.3)] transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold shadow-[0_2px_8px_rgba(0,113,227,0.3)] transition cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Ambient Subtle Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-[#0071e3]/15 via-[#5856d6]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-[#34c759]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto space-y-6"
          >
            {/* Pill Tag */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] shadow-xs text-xs font-bold">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34c759] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34c759]" />
              </span>
              <span className="text-[#1d1d1f] dark:text-white">AI Matching & Live Walk-In Interview Hub</span>
              <span className="text-[#86868b]">•</span>
              <Link href="/companies" className="text-[#0071e3] hover:underline flex items-center gap-0.5">
                Explore Directory <ChevronRight className="w-3 h-3" />
              </Link>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white leading-[1.08]"
            >
              Skip the resume black hole.{' '}
              <span className="bg-gradient-to-r from-[#0071e3] via-[#5856d6] to-[#af52de] bg-clip-text text-transparent">
                Queue live, interview fast.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-[#86868b] font-medium leading-relaxed max-w-2xl mx-auto"
            >
              EasyApply eliminates months of silence. Join active walk-in video queues, get evaluated instantly by verified engineering teams, and discover dream opportunities publicly.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            >
              <Link
                href="/companies"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,113,227,0.35)] transition-all hover:scale-[1.02] active:scale-95"
              >
                <Building2 className="w-4 h-4" />
                <span>Explore Companies & Walk-Ins</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.08] dark:border-white/[0.1] font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.02] active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Get Started as Candidate</span>
              </Link>
            </motion.div>

            {/* Fast facts footer */}
            <motion.div
              variants={fadeInUp}
              className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#86868b] font-semibold"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                No password required (WhatsApp OTP)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                Public company directory & live room codes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34c759]" />
                100% Free for Job Seekers
              </span>
            </motion.div>
          </motion.div>

          {/* ── INTERACTIVE MOCKUP SHOWCASE ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mt-14 max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-black/[0.08] to-transparent dark:from-white/[0.15] dark:to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
          >
            <div className="rounded-[22px] bg-white dark:bg-[#151516] border border-black/[0.06] dark:border-white/[0.08] overflow-hidden p-4 md:p-6 space-y-4">
              
              {/* Mockup Top Window Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="text-[11px] font-bold text-[#86868b] ml-2">EasyApply Live Queue & Match Suite</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border border-[#34c759]/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                    Live System Active
                  </span>
                </div>
              </div>

              {/* Mockup Inner Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Panel 1: Live Walk-In Queue */}
                <div className="p-4 rounded-2xl bg-[#f2f2f7]/60 dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-[#0071e3]" />
                      Walk-In Room #FMPZZ3
                    </span>
                    <span className="text-[10px] font-bold text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full">
                      Queue: 2 / 20
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] text-xs space-y-1">
                      <div className="font-bold text-[#1d1d1f] dark:text-white">Senior Fullstack Engineer</div>
                      <div className="text-[11px] text-[#86868b]">NextGen Labs • React & Node.js</div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-[#86868b]">Estimated Wait</span>
                      <strong className="text-[#248a3d] dark:text-[#30d158]">~4 minutes</strong>
                    </div>
                  </div>
                  <Link
                    href="/companies?tab=walkin"
                    className="w-full py-2 bg-[#0071e3] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>Enter Walk-In Hub</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Panel 2: AI Match Scoring */}
                <div className="p-4 rounded-2xl bg-[#f2f2f7]/60 dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-[#8b5cf6]" />
                      Semantic Profile Match
                    </span>
                    <span className="text-[10px] font-extrabold text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-0.5 rounded-full">
                      94% Score
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#86868b]">Core Tech Match</span>
                      <span className="font-bold text-[#1d1d1f] dark:text-white">TypeScript, Next.js, PostgreSQL</span>
                    </div>
                    <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#8b5cf6] h-full rounded-full w-[94%]" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#86868b] pt-1">
                      <span>Aging Boost Active (+12%)</span>
                      <span className="text-[#248a3d] dark:text-[#30d158] font-bold">Priority Seeker</span>
                    </div>
                  </div>
                </div>

                {/* Panel 3: Live Proctored Interview */}
                <div className="p-4 rounded-2xl bg-[#f2f2f7]/60 dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#ff9500]" />
                      HD Video & Code Editor
                    </span>
                    <span className="text-[10px] font-bold text-[#ff9500] bg-[#ff9500]/10 px-2 py-0.5 rounded-full">
                      Proctored
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-black/50 border border-black/[0.04] dark:border-white/[0.06] font-mono text-[11px] text-[#86868b]">
                    <span className="text-[#0071e3]">function</span> <span className="text-amber-500">evaluateCandidate</span>() {'{'}<br />
                    &nbsp;&nbsp;<span className="text-[#34c759]">return</span> matchScore &gt; 90;<br />
                    {'}'}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#86868b]">
                    <span>Audio/Video: LiveKit HD</span>
                    <span className="text-[#0071e3] font-bold">1-Click Join</span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS COUNTER STRIP ────────────────────────────────────────── */}
      <section className="py-12 border-y border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-[#111112]/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="space-y-1 text-center sm:text-left"
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-[#0071e3]">
                  {s.label}
                </div>
                <p className="text-[11px] text-[#86868b] font-medium">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES GRID ───────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0071e3]/10 text-[#0071e3]">
              Next-Gen Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
              Engineered for velocity. Built for talent.
            </h2>
            <p className="text-sm sm:text-base text-[#86868b] font-medium">
              Every tool you need to eliminate friction and secure your next role faster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: idx * 0.08 }}
                  onClick={() => router.push(item.href)}
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
                          color: item.color
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-[#0071e3]">
                    <span>Learn More</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── PUBLIC DIRECTORY SPOTLIGHT ────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-b from-[#f2f2f7]/50 to-[#fafafa] dark:from-[#151516]/50 dark:to-[#000000] border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border border-[#34c759]/20">
                <Globe className="w-3.5 h-3.5" />
                <span>Public Ecosystem Directory</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
                Discover Companies & Active Walk-In Rooms Publicly
              </h2>
              <p className="text-xs sm:text-sm text-[#86868b] font-medium leading-relaxed">
                Looking for open positions or live walk-in video interview rooms? Anyone can browse active tech companies, copy 6-character room codes, and join live evaluation queues immediately.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
              <Link
                href="/companies"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#0071e3]/20 transition-all hover:scale-105"
              >
                <Building2 className="w-4 h-4" />
                <span>Browse Companies (/companies)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/companies?tab=walkin"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Video className="w-4 h-4 text-[#34c759]" />
                <span>Active Walk-In Rooms</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-STEP PROCESS SECTION ───────────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#5856d6]/10 text-[#5856d6]">
              Simple & Transparent
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
              From discovery to offer in three steps.
            </h2>
            <p className="text-sm sm:text-base text-[#86868b] font-medium">
              No black-box recruitment. Instant clarity at every stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflowSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] space-y-4 shadow-xs relative overflow-hidden"
              >
                <div className="text-4xl font-extrabold text-[#0071e3]/20 dark:text-[#0071e3]/30 font-mono">
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed font-medium">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CALL TO ACTION HERO CARD ──────────────────────────────────── */}
      <section className="py-16 pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl p-8 md:p-14 text-center bg-gradient-to-b from-[#0071e3] to-[#0051a8] text-white shadow-[0_20px_60px_rgba(0,113,227,0.3)] space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
              Start Your Journey Today
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
              Ready to meet top engineering teams without the wait?
            </h2>

            <p className="text-white/80 text-sm sm:text-base font-medium max-w-xl mx-auto leading-relaxed">
              Explore hundreds of verified companies or sign in with your phone number to start queuing for live walk-ins today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/companies"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white text-[#0071e3] font-bold text-xs shadow-lg hover:bg-white/90 transition-all hover:scale-105"
              >
                Browse Public Directory
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white/15 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition"
              >
                Candidate Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SLEEK APPLE-STYLE FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#111112] py-14">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2 group">
                <div className="w-7 h-7 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-xs">
                  <Rocket className="w-4 h-4 -rotate-12" />
                </div>
                <span className="font-bold text-base tracking-tight text-[#1d1d1f] dark:text-white">
                  EasyApply
                </span>
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed font-medium">
                AI-native career intelligence, semantic skill matching, and real-time walk-in video interview rooms.
              </p>
              <div className="pt-1">
                <ThemeToggle />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] dark:text-white">
                Public Ecosystem
              </h4>
              <ul className="space-y-2 text-xs text-[#86868b] font-medium">
                <li>
                  <Link href="/companies" className="hover:text-[#0071e3] transition-colors">
                    Companies Directory
                  </Link>
                </li>
                <li>
                  <Link href="/companies?tab=walkin" className="hover:text-[#0071e3] transition-colors flex items-center gap-1.5">
                    <span>Walk-In Rooms</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759]" />
                  </Link>
                </li>
                <li>
                  <Link href="/companies?tab=jobs" className="hover:text-[#0071e3] transition-colors">
                    Open Engineering Jobs
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] dark:text-white">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-[#86868b] font-medium">
                <li>
                  <Link href="/login" className="hover:text-[#0071e3] transition-colors">
                    AI Resume Parser
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#0071e3] transition-colors">
                    Spot Job Placement
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#0071e3] transition-colors">
                    Candidate Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] dark:text-white">
                Legal & Security
              </h4>
              <ul className="space-y-2 text-xs text-[#86868b] font-medium">
                <li>
                  <span className="text-[#86868b]">Zero-Password Auth</span>
                </li>
                <li>
                  <span className="text-[#86868b]">Proctored Evaluation</span>
                </li>
                <li>
                  <span className="text-[#86868b]">Privacy & Terms</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868b] font-medium">
            <p>© {new Date().getFullYear()} EasyApply AI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/companies" className="hover:text-[#0071e3]">
                http://localhost:3000/companies
              </Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}