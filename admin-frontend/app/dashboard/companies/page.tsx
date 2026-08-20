'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Building2,
  X,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';

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
  const { showToast } = useGlassToast();

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
      showToast('Error', 'Failed to fetch companies', 'danger');
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
        showToast('Success', `Updated verification for ${c.name}`, 'success');
        fetchCompanies();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Update failed', 'danger');
    }
  };

  const handleToggleAiResume = async (c: Company) => {
    try {
      const nextVal = !c.aiResumeBuilderEnabled;
      const res = await api.put(`/admin/companies/${c.id}/features`, {
        aiResumeBuilderEnabled: nextVal,
      });
      if (res.data.success) {
        showToast('Success', `AI Resume Builder for ${c.name} is now ${nextVal ? 'ENABLED' : 'DISABLED'}.`, 'success');
        fetchCompanies();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Update failed', 'danger');
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
        showToast('Success', `Plan assigned to ${selectedCompany.name} successfully.`, 'success');
        setAssignPlanModalOpen(false);
        fetchCompanies();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to assign plan', 'danger');
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
        showToast('Success', `Feature overrides saved for ${selectedCompany.name}.`, 'success');
        setFeaturesModalOpen(false);
        fetchCompanies();
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update feature overrides', 'danger');
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
    <div className="w-full space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] dark:text-white tracking-tight">
            Company Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#6b7280] dark:text-zinc-400 mt-1">
            Manage employer workspaces, subscription tiers, verification badges &amp; feature overrides
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            className="input pl-10 pr-4 py-2 text-xs rounded-2xl"
            placeholder="Search companies by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Companies Table Card */}
      <div className="glass-card rounded-3xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#121422] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9fafb] dark:bg-[#181b2e] border-b border-black/[0.06] dark:border-white/[0.08] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Company</th>
                <th className="py-3.5 px-4">Industry &amp; Scale</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Current Plan</th>
                <th className="py-3.5 px-4 text-center">AI CV Allow</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400 font-medium">
                    <div className="inline-block w-5 h-5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading company directory...</p>
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400">
                    No companies found matching your query.
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0071e3] flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-white truncate max-w-xs">{c.name}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-zinc-700 dark:text-zinc-300">
                      <div className="font-semibold">{c.industry || 'General Industry'}</div>
                      <div className="text-[11px] text-zinc-400">{c.size || 'N/A'} • {c._count.jobPostings} jobs • {c._count.teamMembers} members</div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleVerify(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-transform hover:scale-105 cursor-pointer ${
                          c.isVerified
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                        title="Click to toggle verification status"
                      >
                        {c.isVerified ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Verified</span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            <span>Unverified</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                        {c.subscription?.plan?.name || 'Free (Default)'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleAiResume(c)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                          c.aiResumeBuilderEnabled
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-zinc-100 dark:bg-white/10 text-zinc-400'
                        }`}
                      >
                        {c.aiResumeBuilderEnabled ? 'Allowed' : 'Locked'}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAssignPlanModal(c)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                        >
                          <CreditCard size={13} />
                          <span>Plan</span>
                        </button>
                        <button
                          onClick={() => openFeaturesModal(c)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal size={13} />
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

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#15182a] text-xs text-zinc-500">
          <div>
            Showing <span className="font-bold text-zinc-800 dark:text-zinc-200">{companies.length}</span> of <span className="font-bold text-zinc-800 dark:text-zinc-200">{total}</span> companies
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181b2e] hover:bg-zinc-50 dark:hover:bg-[#22263d] disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span className="px-2 font-semibold">Page {page} of {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#181b2e] hover:bg-zinc-50 dark:hover:bg-[#22263d] disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Assign Plan Modal */}
      {assignPlanModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="glass-card rounded-3xl w-full max-w-md p-6 bg-white dark:bg-[#181b2e] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Assign Subscription Plan</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Assign a subscription package to <strong className="text-zinc-800 dark:text-zinc-200">{selectedCompany.name}</strong>.
              </p>
            </div>

            <div>
              <label className="label">Select Subscription Tier</label>
              <select
                className="select"
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

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setAssignPlanModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPlan}
                className="btn-primary text-xs"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Override Modal */}
      {featuresModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="glass-card rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 sm:p-7 bg-white dark:bg-[#181b2e] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Custom Feature Overrides</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Explicitly toggle platform modules specifically for <strong className="text-zinc-800 dark:text-zinc-200">{selectedCompany.name}</strong>.
              </p>
            </div>

            <div className="space-y-2.5">
              {featureKeys.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-[#121422] border border-black/[0.04] dark:border-white/[0.06]"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">{label}</div>
                    <div className="text-[10px] text-zinc-400">code: <code className="text-[#0071e3]">{key}</code></div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!customFeatures[key]}
                    onChange={(e) => setCustomFeatures({ ...customFeatures, [key]: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0071e3] focus:ring-[#0071e3] cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setFeaturesModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeatures}
                className="btn-primary text-xs"
              >
                Save Overrides
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
