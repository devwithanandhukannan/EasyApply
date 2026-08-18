'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Sparkles, Users, ChevronRight, AlertCircle,
  Minus, Plus, CheckSquare, Square, Loader2, Check
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
  'Strongly recommend': 'text-[#248a3d] dark:text-[#30d158] bg-[#34c759]/10 border-[#34c759]/20',
  'Recommend':          'text-[#0071e3] bg-[#0071e3]/10 border-[#0071e3]/20',
  'Consider':           'text-[#ff9500] bg-[#ff9500]/10 border-[#ff9500]/20',
  'Do not recommend':   'text-[#ff3b30] bg-[#ff3b30]/10 border-[#ff3b30]/20',
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

    if (targetStatus === 'technical_round' || targetStatus === 'hr_round') {
      setScheduleModal({ open: true, targetStatus });
      return;
    }

    const ids = new Set(selectedCandidateIds);
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
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 flex items-center justify-center text-[#0071e3]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-[#1d1d1f] dark:text-white tracking-tight">AI Candidate Filter</h2>
                <p className="text-xs text-[#86868b] font-medium mt-0.5">{jobTitle}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] rounded-xl text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">

            {!results ? (
              <>
                {/* Top N selector */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                    How many top candidates to surface?
                  </label>
                  <div className="flex items-center gap-4 bg-[#f8f8fa] dark:bg-[#2c2c2e] p-4 rounded-2xl border border-black/[0.04]">
                    <button
                      type="button"
                      onClick={() => setTopN(Math.max(1, topN - 1))}
                      className="p-2.5 bg-white dark:bg-[#1c1c1e] hover:bg-[#f2f2f7] dark:hover:bg-[#3a3a3c] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-white transition cursor-pointer shadow-xs"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-3xl font-bold text-[#1d1d1f] dark:text-white">{topN}</span>
                      <p className="text-xs text-[#86868b] font-medium mt-0.5">candidates</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTopN(Math.min(50, topN + 1))}
                      className="p-2.5 bg-white dark:bg-[#1c1c1e] hover:bg-[#f2f2f7] dark:hover:bg-[#3a3a3c] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-white transition cursor-pointer shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[3, 5, 10, 20].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setTopN(n)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          topN === n
                            ? 'bg-[#0071e3] text-white shadow-[0_4px_14px_rgba(0,113,227,0.25)]'
                            : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                        }`}
                      >
                        Top {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom prompt */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                    Custom instructions for AI <span className="text-[#86868b] font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={4}
                    placeholder="e.g. Prioritize candidates with startup experience and strong system design background..."
                    className="w-full px-4 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-white placeholder:text-[#86868b] text-xs font-medium focus:border-[#0071e3] outline-none resize-none"
                  />
                  <p className="text-[11px] text-[#86868b]">
                    Add any specific priorities, must-haves, or criteria beyond the job description.
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl text-[#ff3b30] text-xs font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {/* AI Summary */}
                {results.aiSummary && (
                  <div className="p-4 bg-[#0071e3]/5 border border-[#0071e3]/20 rounded-2xl">
                    <p className="text-xs font-bold text-[#0071e3] mb-1">AI Screening Executive Summary</p>
                    <p className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed italic">{results.aiSummary}</p>
                  </div>
                )}

                {/* Filter Tabs */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold tracking-wider text-[#86868b] uppercase">
                    Filter By Stage Status
                  </p>
                  <div className="flex flex-wrap gap-1.5 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#0071e3] text-white shadow-[0_4px_14px_rgba(0,113,227,0.25)]'
                              : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                          }`}
                        >
                          {status.label}{' '}
                          <span className="ml-1 text-[10px] opacity-75">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selection header + batch move */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8f8fa] dark:bg-[#2c2c2e] p-3 rounded-2xl border border-black/[0.04]">
                  <div className="flex items-center gap-2">
                    {filteredCandidates.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSelectAllFiltered}
                        className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition cursor-pointer"
                      >
                        {isAllFilteredSelected
                          ? <CheckSquare className="h-4 w-4 text-[#0071e3]" />
                          : <Square className="h-4 w-4" />}
                      </button>
                    )}
                    <p className="text-xs text-[#86868b] font-medium">
                      Showing <span className="text-[#1d1d1f] dark:text-white font-bold">{filteredCandidates.length}</span> of{' '}
                      <span className="text-[#1d1d1f] dark:text-white font-bold">{results.totalApplicants}</span> total applicants
                    </p>
                  </div>

                  {selectedCandidateIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] px-2.5 py-1 rounded-xl font-bold">
                        {selectedCandidateIds.size} Selected
                      </span>
                      {isBulkProcessing ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] rounded-xl">
                          <Loader2 className="h-3 w-3 animate-spin text-[#0071e3]" />
                          <span className="text-[11px] text-[#86868b] font-medium">Updating...</span>
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
                          className="bg-white dark:bg-[#1c1c1e] text-xs border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-[#1d1d1f] dark:text-white font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="">Move Batch To...</option>
                          <option value="applied">Applied</option>
                          <option value="screened">Screened</option>
                          <option value="technical_round">Technical Round (+Schedule)</option>
                          <option value="hr_round">HR Round (+Schedule)</option>
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
                  <div className="text-center py-12 border border-dashed border-black/[0.08] dark:border-white/[0.1] rounded-2xl">
                    <Users className="h-8 w-8 text-[#86868b] mx-auto mb-2" />
                    <p className="text-[#86868b] text-xs font-medium">
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
                      className={`border rounded-2xl p-4 space-y-3 transition-all relative group ${
                        isCandidateSelected
                          ? 'bg-[#0071e3]/5 border-[#0071e3]'
                          : 'bg-[#f8f8fa] dark:bg-[#2c2c2e] border-black/[0.04] dark:border-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectCandidate(c.applicationId)}
                            className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition cursor-pointer"
                          >
                            {isCandidateSelected
                              ? <CheckSquare className="h-4 w-4 text-[#0071e3]" />
                              : <Square className="h-4 w-4" />}
                          </button>
                          <span className="text-2xl font-bold text-[#86868b]">#{c.rank}</span>
                          <div className="h-9 w-9 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.04] flex items-center justify-center text-[#1d1d1f] dark:text-white text-xs font-bold shrink-0">
                            {c.candidate?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[#1d1d1f] dark:text-white text-xs">{c.candidate?.fullName}</p>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#f2f2f7] dark:bg-[#1c1c1e] text-[#86868b]">
                                {normalizedStatus.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-[#86868b] text-[11px] font-medium">{c.candidate?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">Match</p>
                            <p className={`text-base font-bold ${c.score >= 70 ? 'text-[#248a3d] dark:text-[#30d158]' : c.score >= 40 ? 'text-[#ff9500]' : 'text-[#ff3b30]'}`}>
                              {c.score}%
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${REC_STYLES[c.recommendation] ?? ''}`}>
                            {c.recommendation}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed border-l-2 border-[#0071e3] pl-3 italic">
                        {c.matchReason}
                      </p>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {c.strengths?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-[#248a3d] dark:text-[#30d158] mb-1 uppercase tracking-wider">Strengths</p>
                            <ul className="space-y-1">
                              {c.strengths.map((s: string, i: number) => (
                                <li key={i} className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7] font-medium flex gap-1.5">
                                  <span className="text-[#34c759]">•</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {c.gaps?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold text-[#ff3b30] mb-1 uppercase tracking-wider">Gaps</p>
                            <ul className="space-y-1">
                              {c.gaps.map((g: string, i: number) => (
                                <li key={i} className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7] font-medium flex gap-1.5">
                                  <span className="text-[#ff3b30]">•</span>
                                  <span>{g}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => { handleClose(); router.push(`/dashboard/jobs/${jobId}/applicants/${c.applicationId}`); }}
                        className="flex items-center gap-1.5 text-[#0071e3] hover:text-[#0077ed] text-xs font-bold transition pt-1 cursor-pointer"
                      >
                        <span>View full profile</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 sm:p-6 border-t border-black/[0.06] dark:border-white/[0.08] flex gap-3">
            {results ? (
              <>
                <button
                  onClick={() => { setResults(null); setSelectedCandidateIds(new Set()); }}
                  className="flex-1 px-4 py-2.5 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] rounded-2xl text-[#1d1d1f] dark:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Re-run Filter
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] rounded-2xl text-white text-xs font-bold shadow-[0_4px_14px_rgba(0,113,227,0.25)] transition cursor-pointer"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2.5 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] rounded-2xl text-[#1d1d1f] dark:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRun}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 rounded-2xl text-white text-xs font-bold shadow-[0_4px_14px_rgba(0,113,227,0.25)] transition cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Analysing candidates…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Run AI Filter</span>
                    </>
                  )}
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
          patchResultsStatus(selectedCandidateIds, status);
          setSelectedCandidateIds(new Set());
          setScheduleModal({ open: false, targetStatus: 'technical_round' });
        }}
      />
    </>
  );
}