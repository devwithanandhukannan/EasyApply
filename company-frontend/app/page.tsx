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
import EasyApplyLogo from '@/app/components/EasyApplyLogo';

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
      title: 'Hiring Pipelines',
      description: 'Drag-and-drop Kanban boards to move candidates through fully customizable evaluation stages.',
      tag: 'Multi-stage Workflows',
    },
    {
      icon: <Video className="w-5 h-5" />,
      title: 'Live Interview Rooms',
      description: 'HD video calls with integrated multi-language code editors, question panels, and candidate scoring.',
      tag: 'LiveKit Powered',
    },
    {
      icon: <Bot className="w-5 h-5" />,
      title: 'AI Resume Matching',
      description: 'Groq-powered semantic search ranks your entire applicant pool by skill relevance in milliseconds.',
      tag: 'Groq AI Engine',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Spot Job Dispatch',
      description: 'Post same-day hourly or daily task listings that instantly reach available on-demand workers nearby.',
      tag: 'Real-Time Deployment',
    },
    {
      icon: <ShieldAlert className="w-5 h-5" />,
      title: 'Proctored Assessments',
      description: 'Client-side MediaPipe monitoring for tab-focus alerts and face detection during coding exams.',
      tag: 'Privacy-First',
    },
    {
      icon: <LineChart className="w-5 h-5" />,
      title: 'Analytics Dashboard',
      description: 'Monitor drop-off rates, source distributions, and time-to-hire metrics in real-time dashboards.',
      tag: 'Live Metrics',
    },
  ];

  const stats = [
    { value: '500+', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
    { value: '92%', label: 'Hire Rate', icon: <TrendingUp className="w-4 h-4" /> },
    { value: '3x', label: 'Faster Hiring', icon: <Clock className="w-4 h-4" /> },
    { value: '10k+', label: 'Candidates', icon: <Users className="w-4 h-4" /> },
  ];

  const companyLogos = ['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma', 'Loom', 'Retool', 'Amplitude'];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans overflow-x-hidden">

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 bg-[rgba(245,245,247,0.85)] backdrop-blur-xl"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-[52px] flex items-center justify-between">
          <EasyApplyLogo size="md" badge="Business" />

          <nav className="hidden md:flex items-center gap-7">
            {['Product', 'Pricing', 'Customers', 'Docs'].map((item) => (
              <span
                key={item}
                className="text-[13px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors cursor-pointer"
              >
                {item}
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigation('/login')}
              className="text-[13px] font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors bg-transparent border-0 cursor-pointer px-2"
            >
              Sign In
            </button>
            <button
              onClick={() => handleNavigation('/register')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-black transition-colors"
            >
              Start for Free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-[12px] font-medium bg-white border border-black/[0.08] text-[#6e6e73] shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1d1d1f] inline-block" />
          Enterprise Hiring Platform
          <ChevronRight className="w-3 h-3 opacity-40" />
        </div>

        <h1 className="animate-fade-up-delay-1 text-5xl sm:text-7xl font-bold tracking-[-0.04em] leading-[1.02] mb-6 max-w-4xl mx-auto text-[#1d1d1f]">
          Automate hiring.<br />
          <span className="text-[#6e6e73]">Hire smarter, faster.</span>
        </h1>

        <p className="animate-fade-up-delay-2 text-[17px] max-w-2xl mx-auto mb-10 leading-relaxed text-[#6e6e73]">
          An end-to-end multi-tenant platform for managing candidate pipelines,
          running live technical interviews, and deploying spot job listings — all powered by AI.
        </p>

        <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <button
            onClick={() => handleNavigation('/register')}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#1d1d1f] text-white text-[15px] font-semibold hover:bg-black transition-all shadow-sm hover:shadow-lg"
          >
            <Building2 className="w-4 h-4" />
            Register Your Company
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => handleNavigation('/login')}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white border border-black/10 text-[#1d1d1f] text-[15px] font-medium hover:bg-[#f0f0f0] transition-all shadow-sm"
          >
            <CheckCircle className="w-4 h-4 text-[#86868b]" />
            Access Employer Portal
          </button>
        </div>

        {/* Stats */}
        <div className="animate-fade-up-delay-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-black/[0.06] flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#f5f5f7] text-[#1d1d1f]">
                {s.icon}
              </div>
              <div className="text-2xl font-bold text-[#1d1d1f]">{s.value}</div>
              <div className="text-[12px] text-[#86868b]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUSTED BY ───────────────────────────────────────── */}
      <div
        className="py-6 overflow-hidden bg-white"
        style={{ borderTop: '1px solid rgba(0,0,0,0.07)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}
      >
        <p className="text-center text-[11px] font-semibold tracking-widest uppercase text-[#86868b] mb-4">
          Trusted by leading companies
        </p>
        <div className="ticker-wrapper">
          <div className="ticker-content">
            {[...companyLogos, ...companyLogos].map((name, i) => (
              <span key={i} className="inline-flex items-center gap-3 px-8 text-[13px] font-semibold text-[#c7c7cc]">
                <span className="w-1 h-1 rounded-full bg-[#1d1d1f] opacity-20 inline-block" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5 text-[12px] font-medium bg-white border border-black/[0.08] text-[#6e6e73]">
            <Star className="w-3 h-3" />
            Platform Features
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] mb-4 text-[#1d1d1f]">
            The full hiring stack,<br />
            <span className="text-[#6e6e73]">built for modern teams.</span>
          </h2>
          <p className="text-[15px] max-w-lg mx-auto text-[#86868b]">
            Everything from first touch to offer letter — managed in one intelligent workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-7 flex flex-col gap-4 border border-black/[0.06] shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#f5f5f7] text-[#1d1d1f]">
                {f.icon}
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#1d1d1f] mb-1.5 tracking-tight">{f.title}</h3>
                <p className="text-[13px] leading-relaxed text-[#6e6e73]">{f.description}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1d1d1f] mt-auto">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {f.tag}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────────── */}
      <section className="bg-white border-y border-black/[0.07] py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] mb-4 text-[#1d1d1f]">
              Your hiring command center.
            </h2>
            <p className="text-[15px] text-[#86868b]">
              Real-time pipeline visibility and candidate management at a glance.
            </p>
          </div>

          <div className="bg-[#f9f9f9] rounded-3xl p-8 max-w-4xl mx-auto border border-black/[0.07] shadow-sm">
            {/* Window chrome */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div
                className="flex-1 h-6 rounded-lg flex items-center px-3 text-[11px] text-[#86868b]"
                style={{ background: '#f0f0f0', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                Company Dashboard — Hiring Pipelines
              </div>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#f0f0f0] border border-black/[0.07]">
                <BarChart3 className="w-3 h-3 text-[#86868b]" />
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Open Roles', value: '24', change: '+3' },
                { label: 'Applications', value: '486', change: '+42' },
                { label: 'Interviews Today', value: '12', change: '+5' },
                { label: 'Offers Sent', value: '7', change: '+2' },
              ].map((m, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 bg-white border border-black/[0.06]"
                >
                  <div className="text-[11px] text-[#86868b] mb-2">{m.label}</div>
                  <div className="text-xl font-bold text-[#1d1d1f] mb-1">{m.value}</div>
                  <div className="text-[11px] font-medium text-emerald-600">↑ {m.change} this week</div>
                </div>
              ))}
            </div>

            {/* Kanban columns */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { title: 'Applied', count: 142, bg: '#f0f9ff', border: '#bae6fd', text: '#0ea5e9' },
                { title: 'Screening', count: 58, bg: '#fafaf9', border: '#e7e5e4', text: '#78716c' },
                { title: 'Interview', count: 24, bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
                { title: 'Offer', count: 9, bg: '#fefce8', border: '#fef08a', text: '#ca8a04' },
                { title: 'Hired', count: 4, bg: '#fdf4ff', border: '#e9d5ff', text: '#9333ea' },
              ].map((col, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                  <div className="text-[11px] font-semibold mb-2" style={{ color: col.text }}>{col.title}</div>
                  <div className="text-xl font-bold text-[#1d1d1f] mb-3">{col.count}</div>
                  {Array.from({ length: Math.min(3, Math.floor(col.count / 40) + 1) }).map((_, j) => (
                    <div key={j} className="h-6 rounded-lg mb-1.5 bg-white border border-black/[0.06]" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BUILT FOR SCALE ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-[12px] font-medium bg-[#fefce8] border border-yellow-200 text-yellow-700">
              <Zap className="w-3 h-3" />
              Built for scale
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] mb-5 text-[#1d1d1f]">
              One platform<br />
              <span className="text-[#6e6e73]">for every hiring need.</span>
            </h2>
            <p className="text-[15px] leading-relaxed mb-8 text-[#6e6e73]">
              From early-stage startups to enterprise hiring teams, EasyApply scales with your organization.
              Manage multiple job postings, review hundreds of applications, and run concurrent live interviews simultaneously.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                'Multi-tenant workspace isolation',
                'Role-based access control for team members',
                'Automated email & WhatsApp candidate comms',
                'Custom assessment templates per role',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f0fdf4] border border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-[14px] text-[#6e6e73]">{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleNavigation('/register')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1d1d1f] text-white text-[14px] font-semibold hover:bg-black transition-all"
            >
              Get Started Today
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Feature grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Kanban className="w-4 h-4" />, title: 'Kanban Boards' },
              { icon: <Video className="w-4 h-4" />, title: 'Video Interviews' },
              { icon: <Bot className="w-4 h-4" />, title: 'AI Screening' },
              { icon: <ShieldAlert className="w-4 h-4" />, title: 'Proctoring' },
              { icon: <BarChart3 className="w-4 h-4" />, title: 'Analytics' },
              { icon: <Users className="w-4 h-4" />, title: 'Team Roles' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-black/[0.06] shadow-sm hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#f5f5f7] text-[#1d1d1f]">
                  {item.icon}
                </div>
                <span className="text-[13px] font-medium text-[#1d1d1f]">{item.title}</span>
                <CheckCircle className="w-3.5 h-3.5 ml-auto text-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="bg-[#1d1d1f] py-28">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-[12px] font-medium bg-white/10 border border-white/10 text-white/70">
            <Sparkles className="w-3 h-3" />
            Start hiring smarter today
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.04em] mb-5 text-white leading-tight max-w-3xl mx-auto">
            Build your dream team<br />with AI.
          </h2>
          <p className="text-[15px] mb-10 text-white/50 max-w-md mx-auto">
            Join 500+ companies using EasyApply to automate their hiring workflows and find top talent faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleNavigation('/register')}
              className="group inline-flex items-center gap-2 px-9 py-4 rounded-full bg-white text-[#1d1d1f] text-[15px] font-semibold hover:bg-[#f5f5f7] transition-all shadow-lg hover:shadow-xl"
            >
              <Building2 className="w-4 h-4" />
              Register Your Company
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => handleNavigation('/login')}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-white/20 text-white/80 text-[15px] font-medium hover:bg-white/10 transition-all"
            >
              Sign In to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-[#f5f5f7] border-t border-black/[0.07] py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <EasyApplyLogo size="sm" badge="Business" />
          <p className="text-[12px] text-[#86868b]">© 2026 EasyApply Ecosystem. Configured for enterprise use.</p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Security', 'Support'].map((item) => (
              <span
                key={item}
                className="text-[12px] text-[#86868b] hover:text-[#1d1d1f] cursor-pointer transition-colors"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}