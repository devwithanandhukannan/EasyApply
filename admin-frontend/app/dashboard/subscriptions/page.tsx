'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Plus,
  X,
  Briefcase,
  Users,
  Check,
  Building2,
  Pencil,
  Sparkles,
  Globe,
  Lock,
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  features: Record<string, boolean>;
  maxJobPostings: number;
  maxTeamMembers: number;
  isActive: boolean;
  isPublic: boolean;
  isCustom: boolean;
  price: string | number | null;
  createdAt: string;
  _count?: {
    companySubscriptions: number;
  };
}

interface FeatureRequest {
  id: string;
  companyId: string;
  requestedFeatures: Record<string, boolean>;
  message: string | null;
  budgetRange: string | null;
  status: 'PENDING' | 'REVIEWED' | 'FULFILLED' | 'REJECTED';
  adminNotes: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    email: string;
    industry: string;
    size: string;
    subscription?: {
      plan?: {
        id: string;
        name: string;
      };
    };
  };
}

const ALL_FEATURES = [
  { key: 'jobPostings', label: 'Job Postings Management' },
  { key: 'atsScoring', label: 'AI ATS Applicant Scoring' },
  { key: 'aiResumeScan', label: 'Automated Resume Match Scan' },
  { key: 'aiResumeBuilder', label: 'AI Resume Builder Access' },
  { key: 'walkinInterview', label: 'Walk-In Instant Interview Rooms' },
  { key: 'seekerDiscovery', label: 'Job Seeker Direct Discovery Database' },
  { key: 'crmTalentPool', label: 'CRM & Candidate Talent Pools' },
  { key: 'spotJobs', label: 'Spot Job Booking Engine' },
  { key: 'offerLetters', label: 'Digital Offer Letters Generation & Tracking' },
  { key: 'interviewScheduling', label: 'Interview Batch Scheduler' },
  { key: 'kanban', label: 'Kanban Application Pipeline' },
];

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'requests'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [maxJobPostings, setMaxJobPostings] = useState(5);
  const [maxTeamMembers, setMaxTeamMembers] = useState(3);
  const [isCustom, setIsCustom] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [features, setFeatures] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPlans();
    fetchFeatureRequests();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subscriptions');
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureRequests = async () => {
    try {
      const res = await api.get('/admin/feature-requests');
      if (res.data.success) {
        setFeatureRequests(res.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch feature requests:', err);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setDescription('');
    setPrice('');
    setMaxJobPostings(10);
    setMaxTeamMembers(5);
    setIsCustom(true);
    setIsPublic(false); // Default custom packages to private/not on landing
    const initialFeatures: Record<string, boolean> = {};
    ALL_FEATURES.forEach((f) => { initialFeatures[f.key] = true; });
    setFeatures(initialFeatures);
    setModalOpen(true);
  };

  const openCreateModalForRequest = (req: FeatureRequest) => {
    setEditingPlan(null);
    setName(`${req.company.name} Custom Tier`);
    setDescription(`Tailored custom package for ${req.company.name}${req.budgetRange ? ` (${req.budgetRange})` : ''}`);
    setPrice('');
    setMaxJobPostings(15);
    setMaxTeamMembers(10);
    setIsCustom(true);
    setIsPublic(false); // Hidden from public landing
    const initialFeatures: Record<string, boolean> = {};
    ALL_FEATURES.forEach((f) => {
      initialFeatures[f.key] = !!req.requestedFeatures[f.key];
    });
    setFeatures(initialFeatures);
    setModalOpen(true);
  };

  const openEditModal = (p: Plan) => {
    setEditingPlan(p);
    setName(p.name);
    setDescription(p.description || '');
    setPrice(p.price ? String(p.price) : '');
    setMaxJobPostings(p.maxJobPostings);
    setMaxTeamMembers(p.maxTeamMembers);
    setIsCustom(p.isCustom);
    setIsPublic(p.isPublic ?? true);
    setFeatures(p.features || {});
    setModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        price: price ? parseFloat(price) : null,
        maxJobPostings: Number(maxJobPostings),
        maxTeamMembers: Number(maxTeamMembers),
        isCustom,
        isPublic,
        features,
      };

      if (editingPlan) {
        const res = await api.put(`/admin/subscriptions/${editingPlan.id}`, payload);
        if (res.data.success) {
          setMsg({ type: 'success', text: `Plan ${name} updated successfully.` });
        }
      } else {
        const res = await api.post('/admin/subscriptions', payload);
        if (res.data.success) {
          setMsg({ type: 'success', text: `Plan ${name} created successfully.` });
        }
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save plan' });
    }
  };

  const handleToggleActive = async (p: Plan) => {
    try {
      const res = await api.put(`/admin/subscriptions/${p.id}`, { isActive: !p.isActive });
      if (res.data.success) {
        setMsg({ type: 'success', text: `Plan ${p.name} status updated.` });
        fetchPlans();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    try {
      const res = await api.put(`/admin/feature-requests/${requestId}/status`, { status });
      if (res.data.success) {
        setMsg({ type: 'success', text: `Request marked as ${status}.` });
        fetchFeatureRequests();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const pendingRequestsCount = featureRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Subscription & Pricing Plans</h1>
          <p className="page-subtitle">Configure public landing tiers, feature locks, & custom enterprise packages</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} />
          <span>Create Custom Package</span>
        </button>
      </div>

      {msg && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span>{msg.text}</span>
          <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setMsg(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('plans')}
          className={`btn ${activeTab === 'plans' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Sparkles size={15} />
          <span>Subscription Plans ({plans.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Building2 size={15} />
          <span>Company Custom Requests</span>
          {pendingRequestsCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '999px' }}>
              {pendingRequestsCount} new
            </span>
          )}
        </button>
      </div>

      {activeTab === 'plans' ? (
        /* Plan Cards Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px', marginBottom: '32px', width: '100%' }}>
          {loading ? (
            <div style={{ color: 'var(--muted)', textAlign: 'center', gridColumn: '1/-1', padding: '40px' }}>
              Loading subscription plans...
            </div>
          ) : (
            plans.map((p) => (
              <div key={p.id} className="glass" style={{ padding: '28px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0' }}>{p.name}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {p.isCustom ? 'Custom Tailored Package' : 'Standard Tier'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {p.name === 'Free' && <span className="badge badge-blue">Default Free</span>}
                    </div>
                    {p.isPublic ? (
                      <span style={{ fontSize: '10px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4, fontWeight: '600' }}>
                        <Globe size={11} /> Public Landing
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: 4, fontWeight: '600' }}>
                        <Lock size={11} /> Custom Package Only
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', color: '#fff' }}>
                  {p.price ? `₹${p.price}` : 'Free'}
                  {p.price && <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--muted)' }}> /month</span>}
                </div>

                <p style={{ color: 'var(--muted)', fontSize: '13px', minHeight: '38px', marginBottom: '20px' }}>
                  {p.description || 'No description provided.'}
                </p>

                {/* Limits */}
                <div style={{ background: 'var(--surface2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Briefcase size={14} className="text-indigo-400" />
                    <span>Max Jobs: <strong style={{ color: '#fff' }}>{p.maxJobPostings >= 9999 ? 'Unlimited' : p.maxJobPostings}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={14} className="text-purple-400" />
                    <span>Team Size: <strong style={{ color: '#fff' }}>{p.maxTeamMembers >= 9999 ? 'Unlimited' : p.maxTeamMembers}</strong></span>
                  </div>
                </div>

                {/* Features List */}
                <div style={{ flex: 1, marginBottom: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Included Features ({Object.values(p.features || {}).filter(Boolean).length}/{ALL_FEATURES.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    {ALL_FEATURES.map((f) => {
                      const enabled = p.features && p.features[f.key];
                      return (
                        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: enabled ? 'var(--text)' : 'var(--muted)', opacity: enabled ? 1 : 0.45 }}>
                          {enabled ? <Check size={14} style={{ color: 'var(--success)', flexShrink: 0 }} /> : <X size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />}
                          <span>{f.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} />
                    <span>{p._count?.companySubscriptions ?? 0} companies</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Pencil size={14} />
                      <span>Edit</span>
                    </button>
                    {p.name !== 'Free' && (
                      <button
                        className={`btn btn-sm ${p.isActive ? 'btn-ghost' : 'btn-success'}`}
                        onClick={() => handleToggleActive(p)}
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Company Custom Feature Requests View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {featureRequests.length === 0 ? (
            <div className="glass" style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
              <Building2 size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <h3>No Feature Requests Yet</h3>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>When companies request custom business features or packages from their workspace, they will appear here.</p>
            </div>
          ) : (
            featureRequests.map((req) => (
              <div key={req.id} className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{req.company.name}</h3>
                      <span className={`badge ${
                        req.status === 'PENDING' ? 'badge-red' :
                        req.status === 'FULFILLED' ? 'badge-green' : 'badge-blue'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                      {req.company.email} · {req.company.industry} · Current Plan: <strong style={{ color: '#fff' }}>{req.company.subscription?.plan?.name || 'Free'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openCreateModalForRequest(req)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} />
                      <span>Create Package for {req.company.name}</span>
                    </button>
                    {req.status !== 'FULFILLED' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleUpdateRequestStatus(req.id, 'FULFILLED')}
                      >
                        Mark Fulfilled
                      </button>
                    )}
                    {req.status === 'PENDING' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleUpdateRequestStatus(req.id, 'REJECTED')}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                {/* Requested Modules */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Requested Modules:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {ALL_FEATURES.filter(f => req.requestedFeatures[f.key]).map(f => (
                      <span key={f.key} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
                        ✓ {f.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Message and Budget */}
                {(req.message || req.budgetRange) && (
                  <div style={{ background: 'var(--surface2)', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {req.budgetRange && (
                      <div><strong>Budget Range:</strong> <span style={{ color: '#34d399' }}>{req.budgetRange}</span></div>
                    )}
                    {req.message && (
                      <div><strong>Requirements Note:</strong> <em>"{req.message}"</em></div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} />
                  <span>Submitted on {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <form onSubmit={handleSavePlan} className="glass" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', background: 'var(--surface)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create Subscription Package'}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
              Define plan pricing, landing page visibility, and toggle exact modules on/off.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="label">Plan Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Startup Pro / Custom VIP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Price (INR / month) (Leave empty for Free)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 2999"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Public Landing Visibility Toggle */}
            <div style={{ marginBottom: '16px', background: 'var(--surface2)', padding: '14px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                  Visible on Public Landing & Pricing Pages
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  Toggle ON for standard public tiers. Toggle OFF for private/custom packages assigned to specific companies.
                </div>
              </div>
              <label className="toggle" style={{ marginLeft: '12px' }}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="label">Description</label>
              <textarea
                className="input"
                style={{ resize: 'vertical', minHeight: '60px' }}
                placeholder="Short description of who this plan is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label className="label">Max Active Job Postings</label>
                <input
                  className="input"
                  type="number"
                  value={maxJobPostings}
                  onChange={(e) => setMaxJobPostings(Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="label">Max Team Members</label>
                <input
                  className="input"
                  type="number"
                  value={maxTeamMembers}
                  onChange={(e) => setMaxTeamMembers(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Feature Toggle Matrix */}
            <div style={{ marginBottom: '28px' }}>
              <label className="label" style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                Included Features & Modules
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {ALL_FEATURES.map((f) => {
                  const isEnabled = !!features[f.key];
                  return (
                    <div
                      key={f.key}
                      onClick={() => setFeatures({ ...features, [f.key]: !isEnabled })}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: isEnabled ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface2)',
                        borderRadius: '10px',
                        border: `1px solid ${isEnabled ? 'rgba(99, 102, 241, 0.3)' : 'var(--border)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: '500', color: isEnabled ? '#fff' : 'var(--text)', paddingRight: '8px' }}>
                        {f.label}
                      </span>
                      <label className="toggle" style={{ pointerEvents: 'none', marginLeft: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          readOnly
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Package</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
