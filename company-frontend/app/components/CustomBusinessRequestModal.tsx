// app/components/CustomBusinessRequestModal.tsx
'use client';

import { useState } from 'react';
import { X, Sparkles, Check, Send, Loader2 } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from './GlassToastContainer';

interface CustomBusinessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFeature?: string;
}

const AVAILABLE_MODULES = [
  { key: 'walkinInterview', label: 'Walk-In Instant Interview Rooms', desc: 'Host real-time live queues and conduct instant video assessments with candidates.' },
  { key: 'seekerDiscovery', label: 'Candidate Direct Discovery Engine', desc: 'Directly search, filter and scout the verified global job seeker talent pool.' },
  { key: 'crmTalentPool', label: 'CRM & Custom Talent Pools', desc: 'Maintain private talent pools, tag candidates, and organize long-term pipelines.' },
  { key: 'spotJobs', label: 'Spot Jobs On-Demand Dispatch', desc: 'Publish instant hourly/daily gigs and claim verified freelance talent.' },
  { key: 'offerLetters', label: 'Digital Offer Letters & Tracking', desc: 'Generate branded digital offer letters with signature workflows and analytics.' },
  { key: 'interviewScheduling', label: 'Live Video Technical Interviews', desc: 'Multi-language live video interview rooms with code editors and scoring.' },
  { key: 'atsScoring', label: 'AI Semantic ATS Candidate Scoring', desc: 'Automated AI scoring and keyword analysis across all incoming applications.' },
];

export default function CustomBusinessRequestModal({ isOpen, onClose, initialFeature }: CustomBusinessRequestModalProps) {
  const { showToast } = useGlassToast();
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (initialFeature) {
      init[initialFeature] = true;
    } else {
      init['walkinInterview'] = true;
      init['seekerDiscovery'] = true;
    }
    return init;
  });
  const [message, setMessage] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleFeature = (key: string) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeSelected = Object.keys(selectedFeatures).filter(k => selectedFeatures[k]);
    if (activeSelected.length === 0) {
      showToast('Error', 'Please select at least one feature to request.', 'danger');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/company/feature-requests', {
        requestedFeatures: selectedFeatures,
        message: message.trim() || undefined,
        budgetRange: budgetRange.trim() || undefined,
      });

      if (res.data?.success) {
        setSubmitted(true);
        showToast('Request Sent', 'Your custom feature request has been sent to our administrator team.', 'success');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to submit feature request.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-white/[0.1] relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Custom Package Requested!</h2>
            <p className="text-sm text-zinc-500 dark:text-[#86868b] max-w-md mx-auto leading-relaxed">
              Our administrator team has received your feature requirements. We will configure your company&apos;s custom subscription package and update your workspace within 24 hours.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0062c4] text-white font-semibold text-xs rounded-full shadow-sm transition-all cursor-pointer"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0071e3] text-xs font-semibold mb-2">
                <Sparkles size={13} />
                <span>Enterprise Custom Plan</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Request Custom Business Features
              </h2>
              <p className="text-xs text-zinc-500 dark:text-[#86868b] mt-1 leading-relaxed">
                Select the specific modules and capacities your hiring team needs. EasyApply administrators will create a tailored subscription package for your company.
              </p>
            </div>

            {/* Modules Checkbox Matrix */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar mb-5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
                Select Modules to Unlock:
              </label>
              {AVAILABLE_MODULES.map((m) => {
                const checked = !!selectedFeatures[m.key];
                return (
                  <div
                    key={m.key}
                    onClick={() => toggleFeature(m.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      checked
                        ? 'bg-blue-500/10 border-blue-500/30 dark:border-blue-500/40 shadow-xs'
                        : 'bg-zinc-50/80 dark:bg-[#121214] border-zinc-200/80 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-[#1c1c1e]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      checked
                        ? 'bg-[#0071e3] border-[#0071e3] text-white'
                        : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#18181b]'
                    }`}>
                      {checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{m.label}</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-[#86868b] mt-0.5 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                );
              })}

              {/* Custom Message & Budget */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Special Requirements or Hiring Volume Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Need unlimited walk-in rooms for our upcoming tech hiring drive with 100+ candidates..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs p-3 bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/[0.08] rounded-xl focus:border-[#0071e3] outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Expected Monthly Budget (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹5,000 - ₹15,000 / month"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full text-xs p-2.5 bg-zinc-50 dark:bg-[#121214] border border-zinc-200 dark:border-white/[0.08] rounded-xl focus:border-[#0071e3] outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.08] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0062c4] disabled:opacity-50 text-white font-bold text-xs rounded-full shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Submit Feature Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
