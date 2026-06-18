'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, HelpCircle, ShieldAlert, CheckCircle, Lightbulb } from 'lucide-react';
import api from '@/app/lib/axios';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  location: string;
  experience: string;
  offeredSalary?: string;
}

interface BenchmarkData {
  currency: string;
  metrics: {
    minimum: number;
    median: number;
    maximum: number;
  };
  marketRating: 'Below Market' | 'Market Rate' | 'Above Market';
  percentileIndicator: number;
  analysisNotes: string;
  negotiationTips: string[];
}

export default function SalaryBenchmarkingModal({
  isOpen,
  onClose,
  title,
  location,
  experience,
  offeredSalary,
}: SalaryModalProps) {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMarketMetrics();
    }
  }, [isOpen, title, location, experience, offeredSalary]);

  const loadMarketMetrics = async () => {
    try {
      setLoading(true);
      setErr('');
      const queryParams = new URLSearchParams({
        title,
        location,
        experience,
        ...(offeredSalary && { offeredSalary })
      });

      const res = await api.get(`/jobseeker/salary-compare?${queryParams.toString()}`);
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setErr('Could not pull statistical variables correctly.');
      }
    } catch (error) {
      console.error(error);
      setErr('Failed to fetch platform market data models.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getRatingStyle = (rating?: string) => {
    if (rating === 'Above Market') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (rating === 'Market Rate') return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-900 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Salary Benchmarking Analysis</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Real-time aggregate data models powered by Groq AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-400 rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-xs tracking-wide">Aggregating platform datasets & market markers...</p>
            </div>
          ) : err ? (
            <div className="p-4 border border-red-900/30 bg-red-950/10 text-red-400 rounded-xl flex items-start gap-2">
              <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
              <p>{err}</p>
            </div>
          ) : data ? (
            <>
              {/* Context Summary Cards */}
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase text-zinc-600 font-semibold tracking-wider block">Target Position</span>
                  <span className="text-zinc-200 font-medium">{title}</span>
                  <span className="text-zinc-500 text-xs block mt-0.5">{location} • {experience}</span>
                </div>
                {offeredSalary && (
                  <div className="sm:border-l sm:border-zinc-900 sm:pl-4 flex flex-col justify-center">
                    <span className="text-[10px] uppercase text-emerald-500 font-semibold tracking-wider block">Offered Evaluation</span>
                    <span className="text-xl font-bold text-white tracking-tight">{offeredSalary}</span>
                  </div>
                )}
              </div>

              {/* Range Distributions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white tracking-tight">Market Compensation Bracket</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRatingStyle(data.marketRating)}`}>
                    {data.marketRating}
                  </span>
                </div>

                <div className="bg-black border border-zinc-900 p-5 rounded-xl space-y-5">
                  <div className="grid grid-cols-3 text-center">
                    <div>
                      <span className="text-xs text-zinc-500 block">Min Market</span>
                      <span className="text-base font-bold text-zinc-300 mt-1 block">
                        {data.metrics.minimum.toLocaleString()} <span className="text-xs font-normal text-zinc-600">{data.currency}</span>
                      </span>
                    </div>
                    <div className="border-x border-zinc-900">
                      <span className="text-xs text-zinc-500 block">Median Baseline</span>
                      <span className="text-base font-bold text-emerald-400 mt-1 block">
                        {data.metrics.median.toLocaleString()} <span className="text-xs font-normal text-zinc-600">{data.currency}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 block">Max Potential</span>
                      <span className="text-base font-bold text-zinc-300 mt-1 block">
                        {data.metrics.maximum.toLocaleString()} <span className="text-xs font-normal text-zinc-600">{data.currency}</span>
                      </span>
                    </div>
                  </div>

                  {/* Percentile Range Graphic Meter Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[11px] text-zinc-600 font-medium">
                      <span>0th percentile</span>
                      <span className="text-emerald-500/70">Median (50th)</span>
                      <span>100th percentile</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full relative overflow-visible">
                      <div className="absolute top-0 bottom-0 left-0 bg-zinc-800 rounded-l-full" style={{ width: '30%' }}></div>
                      <div className="absolute top-0 bottom-0 left-[30%] bg-emerald-500/20" style={{ width: '40%' }}></div>
                      
                      {/* Percentile Pointer Marker pin */}
                      <div 
                        className="absolute -top-1.5 w-5 h-5 bg-emerald-400 rounded-full border-4 border-black flex items-center justify-center shadow-md transition-all duration-700"
                        style={{ left: `calc(${data.percentileIndicator}% - 10px)` }}
                        title={`Sits at ${data.percentileIndicator}th percentile`}
                      >
                        <div className="absolute -bottom-6 bg-zinc-900 text-[10px] text-zinc-300 px-1.5 py-0.5 border border-zinc-800 rounded whitespace-nowrap font-mono">
                          {data.percentileIndicator}th Percentile
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Narrative Analysis Insights */}
              <div className="space-y-2">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle size={15} className="text-zinc-400" />
                  Market Analysis
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed bg-zinc-900/10 border border-zinc-900/60 p-3 rounded-xl">
                  {data.analysisNotes}
                </p>
              </div>

              {/* Strategic Tips Bullet Points */}
              <div className="space-y-2 pt-1">
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <Lightbulb size={15} className="text-amber-400" />
                  Negotiation Playbook Strategies
                </h4>
                <ul className="space-y-2">
                  {data.negotiationTips.map((tip, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs text-zinc-400 leading-normal">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </div>

        {/* Footnote Disclaimers section */}
        <div className="p-4 border-t border-zinc-900 bg-black text-[11px] text-zinc-600 flex items-start gap-1.5">
          <HelpCircle size={13} className="mt-0.5 flex-shrink-0" />
          <p>
            Anonymized compensation metrics are tracked from continuous live platform records. Use estimates as guidance metrics alongside verified local legal benefits parameters.
          </p>
        </div>

      </div>
    </div>
  );
}