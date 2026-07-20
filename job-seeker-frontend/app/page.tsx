'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { redirect } from 'next/navigation';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  FileText,
  Video,
  MessageSquare,
  Star,
  TrendingUp,
  Brain,
  Globe,
  ChevronRight,
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  const handleSignIn = () => {
    window.location.href = '/login';
  };

  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      color: 'blue',
      title: 'AI Resume Parser',
      description:
        'Upload your resume and receive instant ATS scoring, keyword analysis, and actionable improvements powered by Groq AI.',
      tag: '0–100 Live Score',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      color: 'violet',
      title: 'Spot Job Alerts',
      description:
        'Toggle availability for same-day technical assignments near you. Accept placement requests with a single tap.',
      tag: 'Real-Time Dispatch',
    },
    {
      icon: <Video className="w-5 h-5" />,
      color: 'emerald',
      title: 'Live Interview Rooms',
      description:
        'Join HD video technical interviews with integrated code editors, whiteboard tools, and secure proctoring.',
      tag: 'MediaPipe Secure',
    },
  ];

  const steps = [
    { step: '01', title: 'Create Profile', desc: 'Sign in via WhatsApp OTP — no passwords needed' },
    { step: '02', title: 'Upload Resume', desc: 'Get instant AI feedback and optimization suggestions' },
    { step: '03', title: 'Apply to Jobs', desc: 'Match with companies based on your skills and preferences' },
    { step: '04', title: 'Interview Live', desc: 'Clear assessments in real-time video rooms' },
  ];

  const stats = [
    { value: '10k+', label: 'Active Seekers' },
    { value: '98%', label: 'ATS Pass Rate' },
    { value: '4.9★', label: 'App Rating' },
    { value: '24h', label: 'Avg. Placement' },
  ];

  const ticker = [
    'Resume Scoring', 'AI Matching', 'Live Interviews', 'Spot Jobs',
    'WhatsApp OTP', 'Code Assessments', 'Real-Time Tracking', 'ATS Optimization',
    'Resume Scoring', 'AI Matching', 'Live Interviews', 'Spot Jobs',
    'WhatsApp OTP', 'Code Assessments', 'Real-Time Tracking', 'ATS Optimization',
  ];

  return (
    <div className="min-h-screen bg-[#020409] text-white font-sans overflow-x-hidden relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.13) 0%, transparent 70%)' }} />
        <div className="absolute top-[30%] left-[-100px] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.07) 0%, transparent 70%)' }} />
        <div className="absolute top-[50%] right-[-100px] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
      </div>

      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', background: 'rgba(2,4,9,0.8)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              EasyApply <span className="text-blue-400 font-normal">for Seekers</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Companies'].map((item) => (
              <span key={item} className="text-xs font-medium cursor-pointer transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                {item}
              </span>
            ))}
          </nav>

          {/* CTA */}
          <button
            onClick={handleSignIn}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}>
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 text-center">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-8 badge text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          AI-powered job matching platform
          <ChevronRight className="w-3 h-3 opacity-60" />
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up-delay-1 text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05] mb-6 max-w-4xl mx-auto">
          <span className="gradient-text">Land your dream job</span>
          <br />
          <span className="gradient-text-blue">faster than ever.</span>
        </h1>

        {/* Sub */}
        <p className="animate-fade-up-delay-2 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.45)' }}>
          Build an ATS-optimized profile, clear proctored coding assessments, and attend real-time technical interviews — all in one seamless platform.
        </p>

        {/* Actions */}
        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={handleSignIn}
            className="btn-primary group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
            <MessageSquare className="w-4 h-4" />
            Sign In via WhatsApp OTP
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="btn-secondary inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-medium">
            <Globe className="w-4 h-4 opacity-60" />
            Browse Companies
          </button>
        </div>

        {/* Stats Row */}
        <div className="animate-fade-up-delay-4 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold stat-number mb-1">{s.value}</div>
              <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TICKER ──────────────────────────────────────────────────── */}
      <div className="relative z-10 py-4 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="ticker-content">
          {ticker.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-6 text-xs font-medium"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-medium"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'rgba(165,180,252,1)' }}>
            <Star className="w-3 h-3" />
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            <span className="gradient-text">Everything you need</span>
            <br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>to get hired faster</span>
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Our AI-powered platform handles every step of the job application process, from profile optimization to live interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const colors = {
              blue: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', text: '#60a5fa', glow: 'rgba(59,130,246,0.3)' },
              violet: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', text: '#a78bfa', glow: 'rgba(139,92,246,0.3)' },
              emerald: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#34d399', glow: 'rgba(16,185,129,0.3)' },
            }[f.color] ?? { bg: '', border: '', text: '', glow: '' };
            return (
              <div key={i} className="glass-card rounded-3xl p-7 flex flex-col gap-5 group cursor-default">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, boxShadow: `0 0 20px ${colors.glow}` }}>
                  {f.icon}
                </div>
                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.description}</p>
                </div>
                {/* Tag */}
                <div className="inline-flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: colors.text }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {f.tag}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="divider-gradient mb-16" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-medium"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'rgba(52,211,153,1)' }}>
              <TrendingUp className="w-3 h-3" />
              How it works
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">
              <span className="gradient-text">4 steps to</span>
              <br />
              <span className="gradient-text-blue">your next role</span>
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Our streamlined process eliminates the friction of traditional job hunting — from profile creation to offer acceptance in as little as 24 hours.
            </p>
            <button
              onClick={handleSignIn}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}>
              Start Your Journey
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Steps */}
          <div className="flex flex-col gap-3">
            {steps.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-5 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.25)', color: 'rgba(165,180,252,1)' }}>
                  {s.step}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-0.5">{s.title}</h4>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto opacity-20 group-hover:opacity-60 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPLICATION TRACKER PREVIEW ─────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="divider-gradient mb-16" />
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 gradient-text">Track every application</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Real-time visibility across your entire job pipeline</p>
        </div>

        <div className="glass-card rounded-3xl p-8 max-w-3xl mx-auto">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-60" />
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-60" />
            </div>
            <div className="flex-1 h-6 rounded-lg flex items-center px-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Application Tracker</span>
            </div>
          </div>

          {/* Pipeline stages */}
          <div className="flex items-start gap-2 overflow-x-auto pb-2">
            {[
              { label: 'Applied', count: 12, color: '#60a5fa', active: true },
              { label: 'Under Review', count: 5, color: '#a78bfa', active: false },
              { label: 'Shortlisted', count: 3, color: '#34d399', active: false },
              { label: 'Interview', count: 1, color: '#fbbf24', active: false },
              { label: 'Offer', count: 0, color: '#f87171', active: false },
            ].map((stage, i) => (
              <div key={i} className="flex-1 min-w-[100px]">
                <div className="rounded-xl p-3 mb-2"
                  style={{ background: stage.active ? `${stage.color}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${stage.active ? stage.color + '30' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="text-xs font-medium mb-1" style={{ color: stage.active ? stage.color : 'rgba(255,255,255,0.3)' }}>{stage.label}</div>
                  <div className="text-2xl font-bold" style={{ color: stage.active ? stage.color : 'rgba(255,255,255,0.15)' }}>{stage.count}</div>
                </div>
                <div className="h-1 rounded-full" style={{ background: stage.active ? stage.color : 'rgba(255,255,255,0.05)' }} />
              </div>
            ))}
          </div>

          {/* Recent application rows */}
          <div className="mt-6 flex flex-col gap-2">
            {[
              { company: 'Google', role: 'Senior SWE', status: 'Under Review', statusColor: '#a78bfa' },
              { company: 'Stripe', role: 'Backend Engineer', status: 'Shortlisted', statusColor: '#34d399' },
              { company: 'Vercel', role: 'Frontend Engineer', status: 'Applied', statusColor: '#60a5fa' },
            ].map((app, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="text-xs font-semibold text-white">{app.role}</div>
                  <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{app.company}</div>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: `${app.statusColor}15`, color: app.statusColor, border: `1px solid ${app.statusColor}25` }}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="divider-gradient mb-16" />
        <div className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.1) 50%, rgba(139,92,246,0.1) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-medium badge">
              <Sparkles className="w-3 h-3" />
              Join thousands of job seekers
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5 gradient-text max-w-2xl mx-auto leading-tight">
              Your next role is one tap away
            </h2>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Sign in with WhatsApp OTP — no email, no password, no friction.
            </p>
            <button
              onClick={handleSignIn}
              className="btn-primary group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-semibold"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)', boxShadow: '0 12px 40px rgba(99,102,241,0.5)' }}>
              <MessageSquare className="w-5 h-5" />
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>EasyApply for Seekers</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 EasyApply Ecosystem. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Support'].map((item) => (
              <span key={item} className="text-xs cursor-pointer transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}