'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Search,
  X,
  CheckCircle2,
  Clock,
  CreditCard,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  features: Record<string, boolean>;
}

interface Company {
  id: string;
  name: string;
  email: string;
  industry: string;
  size: string;
  isVerified: boolean;
  verificationBadge: string;
  aiResumeBuilderEnabled: boolean;
  createdAt: string;
  subscription?: {
    plan: {
      name: string;
      features: Record<string, boolean>;
    };
    features?: Record<string, boolean>;
  } | null;
  _count: {
    jobPostings: number;
    teamMembers: number;
  };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [assignPlanModalOpen, setAssignPlanModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [featuresModalOpen, setFeaturesModalOpen] = useState(false);
  const [customFeatures, setCustomFeatures] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [page, search]);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/admin/subscriptions');
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/companies?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setCompanies(res.data.companies);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = async (c: Company) => {
    try {
      const nextVerified = !c.isVerified;
      const res = await api.put(`/admin/companies/${c.id}/verify`, {
        isVerified: nextVerified,
        verificationBadge: nextVerified ? 'verified' : 'none',
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: `Company ${c.name} verification updated.` });
        fetchCompanies();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const handleToggleAiResume = async (c: Company) => {
    try {
      const nextVal = !c.aiResumeBuilderEnabled;
      const res = await api.put(`/admin/companies/${c.id}/features`, {
        aiResumeBuilderEnabled: nextVal,
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: `AI Resume Builder for ${c.name} is now ${nextVal ? 'ENABLED' : 'DISABLED'}.` });
        fetchCompanies();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const openAssignPlanModal = (c: Company) => {
    setSelectedCompany(c);
    setSelectedPlanId(plans[0]?.id || '');
    setAssignPlanModalOpen(true);
  };

  const handleAssignPlan = async () => {
    if (!selectedCompany || !selectedPlanId) return;
    try {
      const res = await api.put(`/admin/companies/${selectedCompany.id}/subscription`, {
        planId: selectedPlanId,
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: `Plan assigned to ${selectedCompany.name} successfully.` });
        setAssignPlanModalOpen(false);
        fetchCompanies();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to assign plan' });
    }
  };

  const openFeaturesModal = (c: Company) => {
    setSelectedCompany(c);
    const existing = (c.subscription?.features as Record<string, boolean>) || (c.subscription?.plan?.features as Record<string, boolean>) || {
      jobPostings: true,
      atsScoring: true,
      aiResumeScan: true,
      aiResumeBuilder: true,
      walkinInterview: false,
      seekerDiscovery: false,
      crmTalentPool: false,
      spotJobs: false,
      offerLetters: true,
      interviewScheduling: true,
      kanban: true,
    };
    setCustomFeatures(existing);
    setFeaturesModalOpen(true);
  };

  const handleSaveFeatures = async () => {
    if (!selectedCompany) return;
    try {
      const res = await api.put(`/admin/companies/${selectedCompany.id}/subscription/features`, {
        features: customFeatures,
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: `Feature overrides saved for ${selectedCompany.name}.` });
        setFeaturesModalOpen(false);
        fetchCompanies();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update feature overrides' });
    }
  };

  const featureKeys = [
    { key: 'walkinInterview', label: 'Walk-in Instant Interview Platform' },
    { key: 'seekerDiscovery', label: 'Direct Seeker Discovery / Database Search' },
    { key: 'crmTalentPool', label: 'Talent Pool & CRM Pipeline' },
    { key: 'spotJobs', label: 'Spot Job Booking Infrastructure' },
    { key: 'aiResumeScan', label: 'AI Resume Score & Match Analysis' },
    { key: 'aiResumeBuilder', label: 'AI Generated Resume Allow (per job)' },
    { key: 'offerLetters', label: 'Digital Offer Letters & Tracking' },
    { key: 'interviewScheduling', label: 'Automated Interview Scheduling' },
    { key: 'kanban', label: 'Kanban Applicant Pipeline' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Company Management</h1>
          <p className="page-subtitle">Manage employer workspaces, subscriptions, feature toggles & verification</p>
        </div>
        <div style={{ width: '340px' }}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              className="input search-input"
              placeholder="Search companies by name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg.text}</span>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setMsg(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="table-wrapper glass" style={{ width: '100%' }}>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Industry & Size</th>
              <th>Status</th>
              <th>Current Plan</th>
              <th>AI Resume Builder</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                  Loading companies...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                  No companies found.
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{c.industry || 'General'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.size || 'N/A'} • {c._count.jobPostings} jobs</div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleVerify(c)}
                      className={`badge ${c.isVerified ? 'badge-green' : 'badge-yellow'}`}
                      style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      title="Click to toggle verification status"
                    >
                      {c.isVerified ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>{c.verificationBadge}</span>
                        </>
                      ) : (
                        <>
                          <Clock size={13} />
                          <span>Unverified (Click to verify)</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {c.subscription?.plan?.name || 'Free (Default)'}
                    </span>
                  </td>
                  <td>
                    <label className="toggle" title="Toggle AI resume builder lock for applicants to this company">
                      <input
                        type="checkbox"
                        checked={c.aiResumeBuilderEnabled}
                        onChange={() => handleToggleAiResume(c)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openAssignPlanModal(c)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <CreditCard size={14} />
                        <span>Plan</span>
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openFeaturesModal(c)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <SlidersHorizontal size={14} />
                        <span>Features</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', width: '100%' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Showing {companies.length} of {total} companies
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', fontSize: '13px', color: 'var(--muted)' }}>
            Page {page} of {totalPages || 1}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Assign Plan Modal */}
      {assignPlanModalOpen && selectedCompany && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '480px', padding: '32px', background: 'var(--surface)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Assign Subscription Plan</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
              Assign a subscription tier to <strong style={{ color: '#fff' }}>{selectedCompany.name}</strong>.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label className="label">Select Subscription Plan</label>
              <select
                className="input"
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.name === 'Free' ? '(Default All-in-One Free)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => setAssignPlanModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssignPlan}>Save Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Override Modal */}
      {featuresModalOpen && selectedCompany && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', background: 'var(--surface)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Custom Feature Matrix Overrides</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
              Enable or disable specific platform modules specifically for <strong style={{ color: '#fff' }}>{selectedCompany.name}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              {featureKeys.map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{label}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Module code: <code style={{ color: 'var(--accent)' }}>{key}</code></div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={!!customFeatures[key]}
                      onChange={(e) => setCustomFeatures({ ...customFeatures, [key]: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => setFeaturesModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveFeatures}>Save Overrides</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
