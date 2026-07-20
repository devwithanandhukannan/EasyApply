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
  LineChart,
  Users,
  ChevronRight,
  Star,
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';

export default function CompanyFrontPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const features = [
    {
      icon: <Kanban className="w-5 h-5" />,
      color: 'indigo',
      title: 'Hiring Pipelines',
      description:
        'Drag-and-drop Kanban boards to move candidates through fully customizable evaluation stages.',
      tag: 'Multi-stage Workflows',
    },
    {
      icon: <Video className="w-5 h-5" />,
      color: 'blue',
      title: 'Live Interview Rooms',
      description:
        'HD video calls with integrated multi-language code editors, question panels, and candidate scoring.',
      tag: 'LiveKit Powered',
    },
    {
      icon: <Bot className="w-5 h-5" />,
      color: 'violet',
      title: 'AI Resume Matching',
      description:
        'Groq-powered semantic search ranks your entire applicant pool by skill relevance in milliseconds.',
      tag: 'Groq AI Engine',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      color: 'amber',
      title: 'Spot Job Dispatch',
      description:
        'Post same-day hourly or daily task listings that instantly reach available on-demand workers nearby.',
      tag: 'Real-Time Deployment',
    },
    {
      icon: <ShieldAlert className="w-5 h-5" />,
      color: 'emerald',
      title: 'Proctored Assessments',
      description:
        'Client-side MediaPipe monitoring for tab-focus alerts and face detection during coding exams.',
      tag: 'Privacy-First',
    },
    {
      icon: <LineChart className="w-5 h-5" />,
      color: 'rose',
      title: 'Analytics Dashboard',
      description:
        'Monitor drop-off rates, source distributions, and time-to-hire metrics in real-time dashboards.',
      tag: 'Live Metrics',
    },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    indigo: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.28)', text: '#818cf8', glow: 'rgba(99,102,241,0.3)' },
    blue:   { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.28)', text: '#60a5fa', glow: 'rgba(59,130,246,0.3)' },
    violet: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.28)', text: '#a78bfa', glow: 'rgba(139,92,246,0.3)' },
    amber:  { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', text: '#fbbf24', glow: 'rgba(245,158,11,0.3)' },
    emerald:{ bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', text: '#34d399', glow: 'rgba(16,185,129,0.3)' },
    rose:   { bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.25)',  text: '#fb7185', glow: 'rgba(244,63,94,0.3)' },
  };

  const stats = [
    { value: '500+', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
    { value: '92%', label: 'Hire Rate', icon: <TrendingUp className="w-4 h-4" /> },
    { value: '3x', label: 'Faster Hiring', icon: <Clock className="w-4 h-4" /> },
    { value: '10k+', label: 'Candidates', icon: <Users className="w-4 h-4" /> },
  ];

  const ticker = [
    'Kanban Pipelines', 'AI Matching', 'Live Video Rooms', 'Spot Job Dispatch',
    'Code Assessments', 'Proctoring Suite', 'Analytics Hub', 'Multi-Tenant',
    'Kanban Pipelines', 'AI Matching', 'Live Video Rooms', 'Spot Job Dispatch',
    'Code Assessments', 'Proctoring Suite', 'Analytics Hub', 'Multi-Tenant',
  ];

  const companyLogos = ['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma', 'Loom', 'Retool', 'Amplitude'];

  return (
    <div className="min-h-screen bg-[#030508] text-white font-sans overflow-x-hidden relative">
      {/* ── AMBIENT BACKGROUND ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.14) 0%, transparent 70%)' }} />
        <div className="absolute top-[25%] right-[-150px] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[10%] left-[-100px] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
      </div>

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', background: 'rgba(3,5,8,0.85)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.45)' }}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold tracking-tight text-white">EasyApply</span>
              <span className="text-[10px] font-medium" style={{ color: 'rgba(165,180,252,0.7)' }}>for Business</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Product', 'Pricing', 'Customers', 'Docs'].map((item) => (
              <span key={item} className="text-xs font-medium cursor-pointer transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.45)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
                {item}
              </span>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigation('/login')}
              className="text-xs font-medium px-4 py-2 rounded-xl transition-all duration-200"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.background = 'transparent';
              }}>
              Sign In
            </button>
            <button
              onClick={() => handleNavigation('/register')}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              Start for Free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 text-center">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full mb-8 badge text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Enterprise Hiring Platform
          <ChevronRight className="w-3 h-3 opacity-60" />
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up-delay-1 text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05] mb-6 max-w-5xl mx-auto">
          <span className="gradient-text">Automate hiring.</span>
          <br />
          <span className="gradient-text-indigo">Hire smarter, faster.</span>
        </h1>

        {/* Sub */}
        <p className="animate-fade-up-delay-2 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          An end-to-end multi-tenant platform for managing candidate pipelines, running live technical interviews, and deploying spot job listings — all powered by AI.
        </p>

        {/* Actions */}
        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => handleNavigation('/register')}
            className="btn-primary group inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #c084fc 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}>
            <Building2 className="w-4 h-4" />
            Register Your Company
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => handleNavigation('/login')}
            className="btn-secondary inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-medium">
            <CheckCircle className="w-4 h-4 opacity-50" />
            Access Employer Portal
          </button>
        </div>

        {/* Stats Row */}
        <div className="animate-fade-up-delay-4 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-4 text-center flex flex-col items-center gap-2">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold stat-number">{s.value}</div>
              <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUSTED BY (Logo Cloud) ────────────────────────────────── */}
      <div className="relative z-10 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.012)' }}>
        <p className="text-center text-xs font-medium mb-5" style={{ color: 'rgba(255,255,255,0.2)' }}>TRUSTED BY LEADING COMPANIES</p>
        <div className="ticker-wrapper">
          <div className="ticker-content">
            {[...companyLogos, ...companyLogos].map((name, i) => (
              <span key={i} className="inline-flex items-center gap-3 px-8 text-sm font-semibold"
                style={{ color: 'rgba(255,255,255,0.15)' }}>
                <span className="w-1 h-1 rounded-full bg-indigo-500 inline-block" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES GRID ─────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-medium badge">
            <Star className="w-3 h-3" />
            Platform Features
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            <span className="gradient-text">The full hiring stack,</span>
            <br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>built for modern teams</span>
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Everything from first touch to offer letter — managed in one intelligent workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const c = colorMap[f.color];
            return (
              <div key={i} className="glass-card rounded-3xl p-7 flex flex-col gap-5 cursor-default">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, boxShadow: `0 0 20px ${c.glow}` }}>
                  {f.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{f.description}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: c.text }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {f.tag}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="divider-gradient mb-16" />
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 gradient-text">
            Your hiring command center
          </h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Real-time pipeline visibility and candidate management at a glance
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 max-w-4xl mx-auto">
          {/* Window chrome */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-60" />
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-60" />
            </div>
            <div className="flex-1 h-6 rounded-lg flex items-center px-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Company Dashboard — Hiring Pipelines</span>
            </div>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <BarChart3 className="w-3 h-3" style={{ color: '#818cf8' }} />
            </div>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Open Roles', value: '24', change: '+3', color: '#818cf8' },
              { label: 'Applications', value: '486', change: '+42', color: '#60a5fa' },
              { label: 'Interviews Today', value: '12', change: '+5', color: '#34d399' },
              { label: 'Offers Sent', value: '7', change: '+2', color: '#fbbf24' },
            ].map((m, i) => (
              <div key={i} className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.label}</div>
                <div className="text-xl font-bold mb-1" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[11px] font-medium" style={{ color: 'rgba(52,211,153,0.8)' }}>↑ {m.change} this week</div>
              </div>
            ))}
          </div>

          {/* Kanban columns */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { title: 'Applied', count: 142, color: '#818cf8', bg: 'rgba(99,102,241,0.08)' },
              { title: 'Screening', count: 58, color: '#60a5fa', bg: 'rgba(59,130,246,0.08)' },
              { title: 'Interview', count: 24, color: '#34d399', bg: 'rgba(16,185,129,0.08)' },
              { title: 'Offer', count: 9, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' },
              { title: 'Hired', count: 4, color: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
            ].map((col, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: col.bg, border: `1px solid ${col.color}20` }}>
                <div className="text-[11px] font-semibold mb-2" style={{ color: col.color }}>{col.title}</div>
                <div className="text-xl font-bold text-white mb-3">{col.count}</div>
                {/* Mini card stubs */}
                {Array.from({ length: Math.min(3, Math.floor(col.count / 40) + 1) }).map((_, j) => (
                  <div key={j} className="h-7 rounded-lg mb-1.5"
                    style={{ background: `${col.color}10`, border: `1px solid ${col.color}15` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="divider-gradient mb-16" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-medium badge-amber">
              <Zap className="w-3 h-3" />
              Built for scale
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-5">
              <span className="gradient-text">One platform</span>
              <br />
              <span className="gradient-text-indigo">for every hiring need</span>
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              From early-stage startups to enterprise hiring teams, EasyApply scales with your organization. Manage multiple job postings, review hundreds of applications, and run concurrent live interviews simultaneously.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                'Multi-tenant workspace isolation',
                'Role-based access control for team members',
                'Automated email & WhatsApp candidate comms',
                'Custom assessment templates per role',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <CheckCircle className="w-3 h-3" style={{ color: '#818cf8' }} />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleNavigation('/register')}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              Get Started Today
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Feature checklist cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Kanban className="w-4 h-4" />, title: 'Kanban Boards', color: 'indigo' },
              { icon: <Video className="w-4 h-4" />, title: 'Video Interviews', color: 'blue' },
              { icon: <Bot className="w-4 h-4" />, title: 'AI Screening', color: 'violet' },
              { icon: <ShieldAlert className="w-4 h-4" />, title: 'Proctoring', color: 'emerald' },
              { icon: <BarChart3 className="w-4 h-4" />, title: 'Analytics', color: 'rose' },
              { icon: <Users className="w-4 h-4" />, title: 'Team Roles', color: 'amber' },
            ].map((item, i) => {
              const c = colorMap[item.color];
              return (
                <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.title}</span>
                  <CheckCircle className="w-3.5 h-3.5 ml-auto" style={{ color: c.text }} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="divider-gradient mb-16" />
        <div className="rounded-3xl p-12 sm:p-16 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.1) 50%, rgba(192,132,252,0.1) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-medium badge">
              <Sparkles className="w-3 h-3" />
              Start hiring smarter today
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-5 gradient-text max-w-3xl mx-auto leading-tight">
              Build your dream team with AI
            </h2>
            <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Join 500+ companies using EasyApply to automate their hiring workflows and find top talent faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleNavigation('/register')}
                className="btn-primary group inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-semibold"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #c084fc 100%)', boxShadow: '0 12px 40px rgba(99,102,241,0.5)' }}>
                <Building2 className="w-5 h-5" />
                Register Your Company
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => handleNavigation('/login')}
                className="btn-secondary inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-medium">
                Sign In to Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Building2 className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>EasyApply for Business</span>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>© 2026 EasyApply Ecosystem. Configured for enterprise use.</p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Security', 'Support'].map((item) => (
              <span key={item} className="text-xs cursor-pointer transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.22)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.22)')}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}