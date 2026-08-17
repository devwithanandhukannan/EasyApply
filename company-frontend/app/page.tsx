'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { redirect, useRouter } from 'next/navigation';
import {
  Rocket, User, Building2, Kanban, Video, Bot,
  Zap, ShieldAlert, LineChart, Users, BarChart3,
  CheckCircle, ArrowRight,
} from 'lucide-react';

export default function CompanyFrontPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  const handleNavigation = (path: string) => { router.push(path); };

  const features = [
    { icon: Kanban, title: 'Hiring Pipelines', desc: 'Drag-and-drop Kanban boards to move candidates through fully customizable evaluation stages.' },
    { icon: Video, title: 'Live Interview Rooms', desc: 'HD video calls with integrated multi-language code editors, question panels, and candidate scoring.' },
    { icon: Bot, title: 'AI Resume Matching', desc: 'Groq-powered semantic search ranks your entire applicant pool by skill relevance in milliseconds.' },
    { icon: Zap, title: 'Spot Job Dispatch', desc: 'Post same-day hourly or daily task listings that instantly reach available on-demand workers nearby.' },
    { icon: ShieldAlert, title: 'Proctored Assessments', desc: 'Client-side MediaPipe monitoring for tab-focus alerts and face detection during coding exams.' },
    { icon: LineChart, title: 'Analytics Dashboard', desc: 'Monitor drop-off rates, source distributions, and time-to-hire metrics in real-time dashboards.' },
  ];

  const scaleItems = [
    { icon: Kanban, title: 'Kanban Boards' },
    { icon: Video, title: 'Video Interviews' },
    { icon: Bot, title: 'AI Screening' },
    { icon: ShieldAlert, title: 'Proctoring' },
    { icon: BarChart3, title: 'Analytics' },
    { icon: Users, title: 'Team Roles' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fc', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: '#111827' }}>

      {/* ── NAVBAR ─────────────────────────────────── */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => handleNavigation('/')}>
            <Rocket size={20} color="#2563eb" strokeWidth={2.5} />
            <span style={{ fontWeight: 700, fontSize: 17, color: '#111827', letterSpacing: '-0.02em' }}>EasyApply</span>
          </div>

          {/* Pill Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: 999, padding: 3, gap: 2 }}>
            <button
              onClick={() => window.open('http://localhost:3000', '_self')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999,
                background: 'transparent', color: '#6b7280', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#111827'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
            >
              <User size={13} strokeWidth={2.5} /> Job Seekers
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999,
              background: '#2563eb', color: '#ffffff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Building2 size={13} strokeWidth={2} /> Employers
            </button>
          </div>

          {/* Sign In */}
          <button
            onClick={() => handleNavigation('/login')}
            style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: '#111827', cursor: 'pointer', letterSpacing: '-0.01em' }}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 24, color: '#111827' }}>
          Hire top talent with AI-powered precision.
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px', fontWeight: 400 }}>
          Manage candidate pipelines, run live technical interviews, and deploy spot job listings — all in one enterprise-grade platform powered by AI.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleNavigation('/register')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 999, padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2563eb'; }}
          >
            <Building2 size={15} strokeWidth={2.5} /> Register Your Company <ArrowRight size={15} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleNavigation('/login')}
            style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 999, padding: '13px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.01em' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e5e7eb'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'; }}
          >
            Access Employer Portal
          </button>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #e5e7eb', paddingTop: 48 }}>
          {[
            { value: '500+', label: 'Companies Hiring' },
            { value: '92%', label: 'Hire Rate' },
            { value: '3x', label: 'Faster Hiring' },
            { value: '10k+', label: 'Candidates Placed' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 16px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#2563eb', letterSpacing: '-0.04em', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: '#e5e7eb', marginTop: 48 }} />
      </section>

      {/* ── FEATURES ───────────────────────────────── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 96px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 48, color: '#111827' }}>
          The full hiring stack for modern teams.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                style={{ background: '#ffffff', borderRadius: 16, padding: '28px 24px', border: '1px solid #e5e7eb', transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={18} color="#2563eb" strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8, letterSpacing: '-0.02em' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '56px 24px 40px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Rocket size={18} color="#2563eb" strokeWidth={2.5} />
              <span style={{ fontWeight: 700, fontSize: 16, color: '#111827', letterSpacing: '-0.02em' }}>EasyApply</span>
            </div>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>© 2024 EasyApply AI. Precision Recruitment.</p>
          </div>
          {[
            { title: 'Platform', links: ['AI Resume Builder', 'Kanban Pipeline', 'Live Interviews'] },
            { title: 'Solutions', links: ['For Job Seekers', 'For Employers', 'Enterprise CRM'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Contact'] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map((link) => (
                  <span
                    key={link}
                    style={{ fontSize: 13, color: '#6b7280', cursor: 'pointer', transition: 'color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = '#111827'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = '#6b7280'; }}
                  >{link}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}