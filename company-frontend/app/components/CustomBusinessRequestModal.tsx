'use client';

import { useState } from 'react';
import { X, Sparkles, Check, Send, Loader2, Building2, ShieldAlert } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Custom Package Requested!</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              Our administrator team has received your feature requirements. We will configure your company's custom subscription package and update your workspace within 24 hours.
            </p>
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full shadow-sm transition-all"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-2">
                <Sparkles size={13} />
                <span>Enterprise Custom Plan</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Request Custom Business Features
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Select the specific modules and capacities your hiring team needs. EasyApply administrators will create a tailored subscription package for your company.
              </p>
            </div>

            {/* Modules Checkbox Matrix */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar mb-5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
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
                        ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                        : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      checked
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900">{m.label}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                );
              })}

              {/* Custom Message & Budget */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Special Requirements or Hiring Volume Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Need unlimited walk-in rooms for our upcoming tech hiring drive with 100+ candidates..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Expected Monthly Budget (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹5,000 - ₹15,000 / month"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-full shadow-sm flex items-center gap-2 transition-all"
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
