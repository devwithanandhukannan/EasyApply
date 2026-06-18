'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Sparkles, Users, ChevronRight, AlertCircle,
  Minus, Plus, CheckSquare, Square, Loader2,
} from 'lucide-react';
import api from '@/app/lib/axios';
import ScheduleInterviewsModal from './ScheduleInterviewsModal';

interface AIFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

const REC_STYLES: Record<string, string> = {
  'Strongly recommend': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Recommend':          'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Consider':           'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'Do not recommend':   'text-red-400 bg-red-500/10 border-red-500/20',
};

const PIPELINE_STATUSES = [
  { label: 'All',            value: 'all' },
  { label: 'Applied',        value: 'applied' },
  { label: 'Screened',       value: 'screened' },
  { label: 'Technical Round',value: 'technical_round' },
  { label: 'HR Round',       value: 'hr_round' },
  { label: 'Offer Sent',     value: 'offer_sent' },
  { label: 'Hired',          value: 'hired' },
  { label: 'Rejected',       value: 'rejected' },
];

export default function AIFilterModal({ isOpen, onClose, jobId, jobTitle }: AIFilterModalProps) {
  const router = useRouter();
  const [topN,         setTopN]         = useState(5);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [results,      setResults]      = useState<any>(null);
  const [error,        setError]        = useState('');

  const [activeStatusTab,       setActiveStatusTab]       = useState('all');
  const [selectedCandidateIds,  setSelectedCandidateIds]  = useState<Set<string>>(new Set());
  const [isBulkProcessing,      setIsBulkProcessing]      = useState(false);
  const [scheduleModal,         setScheduleModal]         = useState<{ open: boolean; targetStatus: string }>({
    open: false,
    targetStatus: 'technical_round',
  });

  // ─── DERIVED STATE ────────────────────────────────────────────────
  const filteredCandidates = useMemo(() => {
    if (!results?.rankedCandidates) return [];
    if (activeStatusTab === 'all') return results.rankedCandidates;
    return results.rankedCandidates.filter((c: any) => {
      const s = (c.currentStatus || '').toLowerCase().trim().replace(/ /g, '_');
      return s === activeStatusTab;
    });
  }, [results, activeStatusTab]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredCandidates.length === 0) return false;
    return filteredCandidates.every((c: any) => selectedCandidateIds.has(c.applicationId));
  }, [filteredCandidates, selectedCandidateIds]);

  // All hooks above this line — early return is safe here
  if (!isOpen) return null;

  // ─── HANDLERS ─────────────────────────────────────────────────────
  const handleRun = async () => {
    try {
      setIsLoading(true);
      setError('');
      setResults(null);
      setSelectedCandidateIds(new Set());
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
    setActiveStatusTab('all');
    setSelectedCandidateIds(new Set());
    onClose();
  };

  const handleToggleSelectCandidate = (appId: string) => {
    const updated = new Set(selectedCandidateIds);
    updated.has(appId) ? updated.delete(appId) : updated.add(appId);
    setSelectedCandidateIds(updated);
  };

  const handleToggleSelectAllFiltered = () => {
    const updated = new Set(selectedCandidateIds);
    if (isAllFilteredSelected) {
      filteredCandidates.forEach((c: any) => updated.delete(c.applicationId));
    } else {
      filteredCandidates.forEach((c: any) => updated.add(c.applicationId));
    }
    setSelectedCandidateIds(updated);
  };

  // Optimistic patch helper — updates currentStatus inside results immediately
  const patchResultsStatus = (ids: Set<string>, newStatus: string) => {
    setResults((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        rankedCandidates: prev.rankedCandidates.map((c: any) =>
          ids.has(c.applicationId) ? { ...c, currentStatus: newStatus } : c
        ),
      };
    });
  };

  const handleBatchUpdateStatus = async (targetStatus: string) => {
    if (selectedCandidateIds.size === 0) return;

    // Interview rounds → open scheduling modal
    if (targetStatus === 'technical_round' || targetStatus === 'hr_round') {
      setScheduleModal({ open: true, targetStatus });
      return;
    }

    // Snapshot selected ids before clearing
    const ids = new Set(selectedCandidateIds);

    // Optimistic update — reflect change instantly in the modal list
    patchResultsStatus(ids, targetStatus);
    setSelectedCandidateIds(new Set());

    try {
      setIsBulkProcessing(true);
      await api.patch('/company/selection/bulk/status', {
        applicationIds: Array.from(ids),
        targetStatus,
      });
    } catch (err) {
      console.error('Batch status update failed:', err);
      // Rollback — re-fetch results to restore correct state
      // We don't have a re-fetch here so just show stale warning;
      // parent's onSuccess will re-fetch the full list anyway
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <>
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
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">

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
                  <div className="flex gap-2 mt-3 justify-center">
                    {[3, 5, 10, 20].map((n) => (
                      <button key={n} type="button" onClick={() => setTopN(n)}
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
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={4}
                    placeholder="e.g. Prioritize candidates with startup experience and strong system design background..."
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
              <div className="space-y-4">
                {/* AI Summary */}
                {results.aiSummary && (
                  <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                    <p className="text-xs font-semibold text-violet-400 mb-1">AI Summary</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">{results.aiSummary}</p>
                  </div>
                )}

                {/* Filter Tabs */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
                    Filter By Stage Status
                  </p>
                  <div className="flex flex-wrap gap-1.5 border-b border-zinc-900 pb-3">
                    {PIPELINE_STATUSES.map((status) => {
                      const isActive = activeStatusTab === status.value;
                      const count = status.value === 'all'
                        ? results.rankedCandidates?.length
                        : results.rankedCandidates?.filter(
                            (c: any) =>
                              (c.currentStatus || '').toLowerCase().trim().replace(/ /g, '_') === status.value
                          ).length || 0;
                      return (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => {
                            setActiveStatusTab(status.value);
                            setSelectedCandidateIds(new Set());
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-zinc-100 text-black font-semibold'
                              : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-white'
                          }`}
                        >
                          {status.label}{' '}
                          <span className="ml-1 text-[10px] text-zinc-500">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selection header + batch move */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/30 p-2 rounded-xl border border-zinc-900">
                  <div className="flex items-center gap-2">
                    {filteredCandidates.length > 0 && (
                      <button type="button" onClick={handleToggleSelectAllFiltered}
                        className="text-zinc-400 hover:text-white transition-colors">
                        {isAllFilteredSelected
                          ? <CheckSquare className="h-4 w-4 text-violet-400" />
                          : <Square className="h-4 w-4" />}
                      </button>
                    )}
                    <p className="text-xs text-zinc-400">
                      Showing <span className="text-white font-semibold">{filteredCandidates.length}</span> of{' '}
                      <span className="text-white font-semibold">{results.totalApplicants}</span> total applicants
                    </p>
                  </div>

                  {selectedCandidateIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded-md font-medium">
                        {selectedCandidateIds.size} Selected
                      </span>
                      {isBulkProcessing ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg">
                          <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
                          <span className="text-[11px] text-zinc-400">Updating...</span>
                        </div>
                      ) : (
                        <select
                          disabled={isBulkProcessing}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleBatchUpdateStatus(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="bg-black text-xs border border-zinc-800 rounded-lg px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
                        >
                          <option value="">Move Batch To...</option>
                          <option value="applied">Applied</option>
                          <option value="screened">Screened</option>
                          <option value="technical_round">💻 Technical Round (+Schedule)</option>
                          <option value="hr_round">👔 HR Round (+Schedule)</option>
                          <option value="offer_sent">Offer Sent</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {/* Empty state */}
                {filteredCandidates.length === 0 && (
                  <div className="text-center py-12 border border-zinc-900 border-dashed rounded-xl">
                    <Users className="h-8 w-8 text-zinc-800 mx-auto mb-2" />
                    <p className="text-zinc-500 text-xs font-medium">
                      No candidates in the "{activeStatusTab.replace(/_/g, ' ')}" stage.
                    </p>
                  </div>
                )}

                {/* Candidate cards */}
                {filteredCandidates.map((c: any) => {
                  const isCandidateSelected = selectedCandidateIds.has(c.applicationId);
                  const normalizedStatus = (c.currentStatus || 'applied').toLowerCase().replace(/ /g, '_');
                  return (
                    <div
                      key={c.applicationId}
                      className={`border rounded-xl p-4 space-y-3 transition-all relative group ${
                        isCandidateSelected
                          ? 'bg-zinc-900/70 border-violet-500/40 shadow-md shadow-violet-950/10'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => handleToggleSelectCandidate(c.applicationId)}
                            className="text-zinc-500 hover:text-white transition-colors">
                            {isCandidateSelected
                              ? <CheckSquare className="h-4 w-4 text-violet-400" />
                              : <Square className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />}
                          </button>
                          <span className="text-2xl font-bold text-zinc-600">#{c.rank}</span>
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {c.candidate?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-white text-sm">{c.candidate?.fullName}</p>
                              {/* Status badge — reflects optimistic updates */}
                              <span className={`text-[10px] uppercase font-medium tracking-wide px-1.5 py-0.5 rounded border ${
                                normalizedStatus === 'hired'            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-400' :
                                normalizedStatus === 'rejected'         ? 'bg-red-950/40 border-red-800/50 text-red-400' :
                                normalizedStatus === 'technical_round'  ? 'bg-blue-950/40 border-blue-800/50 text-blue-300' :
                                normalizedStatus === 'hr_round'         ? 'bg-purple-950/40 border-purple-800/50 text-purple-300' :
                                normalizedStatus === 'offer_sent'       ? 'bg-amber-950/40 border-amber-800/50 text-amber-300' :
                                normalizedStatus === 'screened'         ? 'bg-zinc-800 border-zinc-700 text-zinc-300' :
                                'bg-zinc-800 border-zinc-700 text-zinc-400'
                              }`}>
                                {normalizedStatus.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-zinc-500 text-xs">{c.candidate?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-500">Match</p>
                            <p className={`text-lg font-bold ${c.score >= 70 ? 'text-emerald-400' : c.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {c.score}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${REC_STYLES[c.recommendation] ?? ''}`}>
                            {c.recommendation}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 leading-relaxed border-l-2 border-violet-500/40 pl-3">
                        {c.matchReason}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        {c.strengths?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-emerald-400 mb-1">Strengths</p>
                            <ul className="space-y-0.5">
                              {c.strengths.map((s: string, i: number) => (
                                <li key={i} className="text-[10px] text-zinc-400 flex gap-1.5">
                                  <span className="text-emerald-500">+</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {c.gaps?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-red-400 mb-1">Gaps</p>
                            <ul className="space-y-0.5">
                              {c.gaps.map((g: string, i: number) => (
                                <li key={i} className="text-[10px] text-zinc-400 flex gap-1.5">
                                  <span className="text-red-500">−</span>{g}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => { handleClose(); router.push(`/dashboard/jobs/${jobId}/applicants/${c.applicationId}`); }}
                        className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors pt-1"
                      >
                        View full profile <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-zinc-900 flex gap-3">
            {results ? (
              <>
                <button
                  onClick={() => { setResults(null); setSelectedCandidateIds(new Set()); }}
                  className="flex-1 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-white text-sm font-medium transition-colors"
                >
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
                    : <><Sparkles className="h-4 w-4" />Run AI Filter</>}
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewsModal
        isOpen={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false, targetStatus: 'technical_round' })}
        jobId={jobId}
        selectedApplicationIds={Array.from(selectedCandidateIds)}
        initialTargetStatus={scheduleModal.targetStatus}
        onSuccess={() => {
          const status = scheduleModal.targetStatus;
          // Optimistic update for interview round moves
          patchResultsStatus(selectedCandidateIds, status);
          setSelectedCandidateIds(new Set());
          setScheduleModal({ open: false, targetStatus: 'technical_round' });
        }}
      />
    </>
  );
}