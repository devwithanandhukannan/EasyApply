'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  Briefcase,
  Video,
  Zap,
  KeyRound,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Activity,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface Stats {
  companies: number;
  seekers: number;
  applications: number;
  subscriptions: number;
  activeJobs: number;
  openWalkInRooms: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { title: 'Total Companies', value: stats?.companies ?? 0, icon: Building2, href: '/dashboard/companies', iconColor: 'text-indigo-400', iconBg: 'rgba(99, 102, 241, 0.15)' },
    { title: 'Registered Job Seekers', value: stats?.seekers ?? 0, icon: Users, href: '/dashboard/seekers', iconColor: 'text-purple-400', iconBg: 'rgba(168, 85, 247, 0.15)' },
    { title: 'Total Applications', value: stats?.applications ?? 0, icon: FileText, href: '/dashboard/ats', iconColor: 'text-emerald-400', iconBg: 'rgba(16, 185, 129, 0.15)' },
    { title: 'Active Subscriptions', value: stats?.subscriptions ?? 0, icon: CreditCard, href: '/dashboard/subscriptions', iconColor: 'text-amber-400', iconBg: 'rgba(245, 158, 11, 0.15)' },
    { title: 'Active Job Postings', value: stats?.activeJobs ?? 0, icon: Briefcase, href: '/dashboard/companies', iconColor: 'text-cyan-400', iconBg: 'rgba(6, 182, 212, 0.15)' },
    { title: 'Live Walk-in Rooms', value: stats?.openWalkInRooms ?? 0, icon: Video, href: '/dashboard/companies', iconColor: 'text-rose-400', iconBg: 'rgba(244, 63, 94, 0.15)' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header">
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">Real-time health, monetization & activity metrics across EasyApply</p>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
          Loading platform metrics...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px', width: '100%' }}>
            {statItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link key={idx} href={item.href} style={{ textDecoration: 'none' }}>
                  <div className="stat-card" style={{ cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={24} className={item.iconColor} />
                      </div>
                      <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        View <ArrowRight size={13} />
                      </span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                      {item.value.toLocaleString()}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: '500' }}>
                      {item.title}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', width: '100%' }}>
            <div className="glass" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px' }}>
                <Zap size={20} className="text-amber-400" />
                <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Quick Management</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/dashboard/companies" className="btn btn-ghost" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Building2 size={16} />
                    <span>Manage Companies & Feature Toggles</span>
                  </div>
                  <ChevronRight size={16} />
                </Link>
                <Link href="/dashboard/subscriptions" className="btn btn-ghost" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CreditCard size={16} />
                    <span>Custom Subscription Matrix & Plans</span>
                  </div>
                  <ChevronRight size={16} />
                </Link>
                <Link href="/dashboard/settings" className="btn btn-ghost" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <KeyRound size={16} />
                    <span>System Credentials (Razorpay, SMTP, Groq, LiveKit)</span>
                  </div>
                  <ChevronRight size={16} />
                </Link>
                <Link href="/dashboard/ats" className="btn btn-ghost" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Bot size={16} />
                    <span>Trigger ATS Batch Re-calculation</span>
                  </div>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            <div className="glass" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '16px' }}>
                <ShieldCheck size={20} className="text-emerald-400" />
                <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Security & System Status</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>Credential Storage</span>
                  <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={13} />
                    AES-256 Encrypted
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>Seeker Pricing Policy</span>
                  <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={13} />
                    100% Free Forever
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>Walk-in Priority Queue</span>
                  <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={13} />
                    Active (Skill + Aging)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--muted)' }}>API Status</span>
                  <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={13} />
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
