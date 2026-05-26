'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Users, ChevronRight, AlertCircle, Minus, Plus } from 'lucide-react';
import api from '@/app/lib/axios';

interface AIFilterModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  jobId:     string;
  jobTitle:  string;
}

const REC_STYLES: Record<string, string> = {
  'Strongly recommend': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Recommend':          'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Consider':           'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Do not recommend':   'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function AIFilterModal({ isOpen, onClose, jobId, jobTitle }: AIFilterModalProps) {
  const router = useRouter();
  const [topN,         setTopN]         = useState(5);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [results,      setResults]      = useState<any>(null);
  const [error,        setError]        = useState('');

  if (!isOpen) return null;

  const handleRun = async () => {
    try {
      setIsLoading(true);
      setError('');
      setResults(null);
      const r = await api.post(`/company/jobs/${jobId}/ai-filter`, {
        topN,
        customPrompt: customPrompt.trim() || undefined,
      });
      setResults(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'AI filter failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResults(null);
    setError('');
    setCustomPrompt('');
    setTopN(5);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">AI Candidate Filter</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{jobTitle}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {!results ? (
            <>
              {/* Top N selector */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  How many top candidates to surface?
                </label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setTopN(Math.max(1, topN - 1))}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-white transition-colors">
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-4xl font-bold text-white">{topN}</span>
                    <p className="text-xs text-zinc-500 mt-1">candidates</p>
                  </div>
                  <button onClick={() => setTopN(Math.min(50, topN + 1))}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-white transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {/* Quick presets */}
                <div className="flex gap-2 mt-3 justify-center">
                  {[3, 5, 10, 20].map(n => (
                    <button key={n} onClick={() => setTopN(n)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${topN === n ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}>
                      Top {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom prompt */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Custom instructions for AI <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  rows={4}
                  placeholder="e.g. Prioritize candidates with startup experience and strong system design background. Prefer candidates who have worked with microservices..."
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Add any specific priorities, must-haves, or criteria beyond the job description.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </>
          ) : (
            /* Results */
            <div className="space-y-4">
              {/* Summary */}
              {results.aiSummary && (
                <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                  <p className="text-xs font-semibold text-violet-400 mb-1">AI Summary</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{results.aiSummary}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                  Showing top <span className="text-white font-semibold">{results.rankedCandidates?.length}</span> of{' '}
                  <span className="text-white font-semibold">{results.totalApplicants}</span> applicants
                </p>
              </div>

              {results.rankedCandidates?.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-400">No applicants to rank.</p>
                </div>
              )}

              {results.rankedCandidates?.map((c: any) => (
                <div key={c.applicationId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                  {/* Rank row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-zinc-600">#{c.rank}</span>
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {c.candidate?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{c.candidate?.fullName}</p>
                        <p className="text-zinc-500 text-xs">{c.candidate?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500">Match</p>
                        <p className={`text-lg font-bold ${c.score >= 70 ? 'text-emerald-400' : c.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{c.score}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${REC_STYLES[c.recommendation] ?? ''}`}>
                        {c.recommendation}
                      </span>
                    </div>
                  </div>

                  {/* Match reason */}
                  <p className="text-xs text-zinc-400 leading-relaxed border-l-2 border-violet-500/40 pl-3">{c.matchReason}</p>

                  {/* Strengths / Gaps */}
                  <div className="grid grid-cols-2 gap-3">
                    {c.strengths?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-400 mb-1">Strengths</p>
                        <ul className="space-y-0.5">
                          {c.strengths.map((s: string, i: number) => (
                            <li key={i} className="text-[10px] text-zinc-400 flex gap-1.5"><span className="text-emerald-500">+</span>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {c.gaps?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-red-400 mb-1">Gaps</p>
                        <ul className="space-y-0.5">
                          {c.gaps.map((g: string, i: number) => (
                            <li key={i} className="text-[10px] text-zinc-400 flex gap-1.5"><span className="text-red-500">−</span>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* View full profile link */}
                  <button
                    onClick={() => { handleClose(); router.push(`/dashboard/jobs/${jobId}/applicants/${c.applicationId}`); }}
                    className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors">
                    View full profile <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-900 flex gap-3">
          {results ? (
            <>
              <button onClick={() => setResults(null)}
                className="flex-1 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-white text-sm font-medium transition-colors">
                Re-run Filter
              </button>
              <button onClick={handleClose}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-zinc-100 rounded-lg text-black text-sm font-medium transition-colors">
                Done
              </button>
            </>
          ) : (
            <>
              <button onClick={handleClose}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-white text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleRun} disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-all">
                {isLoading
                  ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Analysing candidates…</>
                  : <><Sparkles className="h-4 w-4" />Run AI Filter</>
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}