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
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';

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
  const { showToast } = useGlassToast();

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
      showToast('Error', 'Failed to fetch plans', 'danger');
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
    setIsPublic(false);
    const initialFeatures: Record<string, boolean> = {};
    ALL_FEATURES.forEach((f) => { initialFeatures[f.key] = true; });
    setFeatures(initialFeatures);
    setModalOpen(true);
  };

  const openCreateModalForRequest = (req: FeatureRequest) => {
    const compName = req.company?.name || (req as any).companyName || 'Company';
    setEditingPlan(null);
    setName(`${compName} Custom Tier`);
    setDescription(`Tailored custom package for ${compName}${req.budgetRange ? ` (${req.budgetRange})` : ''}`);
    setPrice('');
    setMaxJobPostings(15);
    setMaxTeamMembers(10);
    setIsCustom(true);
    setIsPublic(false);
    const initialFeatures: Record<string, boolean> = {};
    ALL_FEATURES.forEach((f) => {
      initialFeatures[f.key] = !!req.requestedFeatures?.[f.key];
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
          showToast('Success', `Plan ${name} updated successfully.`, 'success');
        }
      } else {
        const res = await api.post('/admin/subscriptions', payload);
        if (res.data.success) {
          showToast('Success', `Plan ${name} created successfully.`, 'success');
        }
      }
      setModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to save plan', 'danger');
    }
  };

  const handleToggleActive = async (p: Plan) => {
    try {
      const res = await api.put(`/admin/subscriptions/${p.id}`, { isActive: !p.isActive });
      if (res.data.success) {
        showToast('Success', `Plan ${p.name} status updated.`, 'success');
        fetchPlans();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Update failed', 'danger');
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: string) => {
    try {
      const res = await api.put(`/admin/feature-requests/${requestId}/status`, { status });
      if (res.data.success) {
        showToast('Updated', `Request marked as ${status}.`, 'success');
        fetchFeatureRequests();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Update failed', 'danger');
    }
  };

  const pendingRequestsCount = featureRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
            Subscription &amp; Pricing Packages
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] dark:text-zinc-400 mt-1">
            Configure public landing tiers, feature limits, and custom enterprise packages
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Create Package</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-[#0071e3] text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
          }`}
        >
          <Sparkles size={14} />
          <span>Active Plans ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-[#0071e3] text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
          }`}
        >
          <Building2 size={14} />
          <span>Custom Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
              {pendingRequestsCount} new
            </span>
          )}
        </button>
      </div>

      {activeTab === 'plans' ? (
        /* Plan Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-zinc-400">
              <div className="inline-block w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-medium">Loading subscription tiers...</p>
            </div>
          ) : (
            plans.map((p) => (
              <div
                key={p.id}
                className="glass-card rounded-3xl p-6 bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-200"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{p.name}</h3>
                        {p.name === 'Free' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-[#0071e3] border border-blue-500/20">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {p.isCustom ? 'Custom Enterprise Tier' : 'Standard Public Tier'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          p.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                        title="Edit Plan"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                      {p.price ? `₹${Number(p.price).toLocaleString()}` : 'Free'}
                      {p.price ? <span className="text-xs font-normal text-zinc-400">/mo</span> : ''}
                    </div>
                    {p.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 gap-2 mb-5 p-3 rounded-2xl bg-zinc-50 dark:bg-[#181b2e] border border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-[#0071e3]" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{p.maxJobPostings} Jobs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-purple-500" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{p.maxTeamMembers} Team</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 mb-6">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Features Included</div>
                    {ALL_FEATURES.slice(0, 6).map((f) => {
                      const enabled = !!p.features?.[f.key];
                      return (
                        <div key={f.key} className="flex items-center gap-2 text-xs">
                          {enabled ? (
                            <Check size={14} className="text-emerald-500 shrink-0" />
                          ) : (
                            <X size={14} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                          )}
                          <span className={enabled ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600 line-through'}>
                            {f.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer status */}
                <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    {p.isPublic ? <Globe size={12} className="text-emerald-500" /> : <Lock size={12} className="text-amber-500" />}
                    <span>{p.isPublic ? 'Public Landing' : 'Private Custom'}</span>
                  </span>
                  <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                    {p._count?.companySubscriptions ?? 0} companies
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Feature Requests Tab */
        <div className="space-y-4">
          {featureRequests.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] text-center text-zinc-400">
              No custom package feature requests from companies yet.
            </div>
          ) : (
            featureRequests.map((req) => (
              <div
                key={req.id}
                className="glass-card rounded-3xl p-6 bg-white dark:bg-[#121422] border border-black/[0.06] dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      {req.company?.name || (req as any).companyName || 'Company'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {req.message || 'No additional notes provided.'}
                  </p>
                  {req.budgetRange && (
                    <div className="text-xs font-semibold text-[#0071e3]">
                      Budget: {req.budgetRange}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCreateModalForRequest(req)}
                    className="btn-primary text-xs flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Create Custom Tier</span>
                  </button>
                  <button
                    onClick={() => handleUpdateRequestStatus(req.id, 'FULFILLED')}
                    className="btn-secondary text-xs"
                  >
                    Mark Fulfilled
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="glass-card rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 bg-white dark:bg-[#181b2e] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {editingPlan ? `Edit Package: ${editingPlan.name}` : 'Create Subscription Package'}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Configure pricing tier parameters, limits, and module permissions</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 text-zinc-400 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="label">Package Name</label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Growth Pro Tier"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Monthly Price (INR ₹)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 2999 (Leave blank for Free)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Max Active Jobs</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={maxJobPostings}
                    onChange={(e) => setMaxJobPostings(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Max Team Members</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={maxTeamMembers}
                    onChange={(e) => setMaxTeamMembers(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="label">Public Visibility</label>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-[#121422] border border-black/[0.04] dark:border-white/[0.06]">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
                  />
                  <label htmlFor="isPublic" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                    Showcase this tier on public landing &amp; pricing pages
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Included Features &amp; Modules</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-zinc-50/50 dark:bg-[#121422]">
                  {ALL_FEATURES.map((f) => (
                    <label
                      key={f.key}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-white dark:hover:bg-white/5 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={!!features[f.key]}
                        onChange={(e) => setFeatures({ ...features, [f.key]: e.target.checked })}
                        className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3]"
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  {editingPlan ? 'Save Changes' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
