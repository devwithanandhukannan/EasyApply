'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { redirect, useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    redirect('/dashboard');
  }

  const handleSignIn = () => { window.location.href = '/login'; };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4fc', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: '#111827' }}>

      {/* ── NAVBAR ─────────────────────────────────── */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => router.push('/')}>
            <span style={{ fontSize: 22 }}>🚀</span>
            <span style={{ fontWeight: 700, fontSize: 17, color: '#111827', letterSpacing: '-0.02em' }}>EasyApply</span>
          </div>

          {/* Pill Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', borderRadius: 999, padding: 3, gap: 2 }}>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999,
                background: '#2563eb', color: '#ffffff', border: 'none', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <span>👤</span> Job Seekers
            </button>
            <button
              onClick={() => router.push('http://localhost:3001')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999,
                background: 'transparent', color: '#6b7280', border: 'none', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#111827'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
            >
              <span>🏢</span> Employers
            </button>
          </div>

          {/* Sign In */}
          <button
            onClick={handleSignIn}
            style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: '#111827', cursor: 'pointer', letterSpacing: '-0.01em' }}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────── */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 24, color: '#111827' }}>
          Land your dream tech role with AI-optimized precision.
        </h1>
        <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px', fontWeight: 400 }}>
          Stop guessing. Our advanced AI tailors your resume to bypass ATS filters, while our live interview environments let you prove your skills instantly. Built for the modern developer.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleSignIn}
            style={{
              background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 999,
              padding: '13px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s', letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2563eb'; }}
          >
            Get Started Free
          </button>
          <button
            onClick={() => router.push('/companies')}
            style={{
              background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 999,
              padding: '13px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e5e7eb'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'; }}
          >
            Explore Employer Tools
          </button>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid #e5e7eb', paddingTop: 48 }}>
          {[
            { value: '50k+', label: 'Resumes Optimized' },
            { value: '<48h', label: 'Avg. Time to Interview' },
            { value: '92%', label: 'ATS Pass Rate' },
            { value: '10k+', label: 'Companies Hiring' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 16px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#2563eb', letterSpacing: '-0.04em', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 400 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: '#e5e7eb', marginTop: 48 }} />
      </section>

      {/* ── FEATURES ───────────────────────────────── */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 96px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 48, color: '#111827' }}>
          Everything you need to get hired.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { icon: '🧠', title: 'AI Resume Parser', desc: 'Upload your resume and receive instant ATS scoring, keyword analysis, and actionable improvements.' },
            { icon: '⚡', title: 'Spot Job Alerts', desc: 'Toggle availability for same-day assignments near you. Accept placement requests with a single tap.' },
            { icon: '🎥', title: 'Live Interview Rooms', desc: 'Join HD video technical interviews with integrated code editors, whiteboard tools, and secure proctoring.' },
            { icon: '📊', title: 'Application Tracker', desc: 'Track every application in a visual Kanban pipeline with real-time status updates.' },
            { icon: '🔒', title: 'Proctored Assessments', desc: 'Complete coding and aptitude tests in a secure, AI-monitored environment trusted by top employers.' },
            { icon: '💬', title: 'WhatsApp OTP Login', desc: 'No passwords, no friction. Sign in instantly with a one-time code sent directly to your WhatsApp.' },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                background: '#ffffff', borderRadius: 16, padding: '28px 24px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s', cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8, letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────── */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '56px 24px 40px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>🚀</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#111827', letterSpacing: '-0.02em' }}>EasyApply</span>
            </div>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>© 2024 EasyApply AI. Precision Recruitment.</p>
          </div>
          {/* Columns */}
          {[
            { title: 'Platform', links: ['AI Resume Builder', 'Kanban Pipeline', 'Live Interviews'] },
            { title: 'Solutions', links: ['For Job Seekers', 'For Employers', 'Enterprise CRM'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Contact'] },
          ].map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 16, letterSpacing: '-0.01em' }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map((link) => (
                  <span
                    key={link}
                    style={{ fontSize: 13, color: '#6b7280', cursor: 'pointer', transition: 'color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = '#111827'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = '#6b7280'; }}
                  >
                    {link}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}