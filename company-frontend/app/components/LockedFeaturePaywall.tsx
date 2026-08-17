'use client';

import { useState } from 'react';
import { Lock, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import CustomBusinessRequestModal from './CustomBusinessRequestModal';

interface LockedFeaturePaywallProps {
  featureKey: string;
  featureTitle: string;
  featureDescription: string;
  benefits?: string[];
}

export default function LockedFeaturePaywall({
  featureKey,
  featureTitle,
  featureDescription,
  benefits = [
    'Unlock unlimited real-time candidate engagement',
    'Streamline hiring workflows with zero manual overhead',
    'Full recruiter collaboration and real-time live telemetry',
    'Dedicated high-availability cloud infrastructure'
  ],
}: LockedFeaturePaywallProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-12 shadow-sm text-center relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-50/70 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon Tag */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 text-gray-700 mb-6 shadow-xs">
          <Lock size={26} strokeWidth={2.2} />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold mb-3">
            <Sparkles size={13} />
            <span>Premium Module</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {featureTitle} is Locked
          </h1>

          <p className="text-sm text-gray-600 max-w-lg mx-auto mt-3 leading-relaxed">
            {featureDescription}
          </p>
        </div>

        {/* Highlights */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-left max-w-md mx-auto space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            What you'll get with this module:
          </p>
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-gray-700">
              <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles size={14} />
            <span>Request Custom Business Plan</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mt-4">
          Default Free tier includes Core Job Postings & Kanban Pipeline. Custom enterprise packages are provisioned by EasyApply administrators.
        </p>
      </div>

      <CustomBusinessRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialFeature={featureKey}
      />
    </div>
  );
}
