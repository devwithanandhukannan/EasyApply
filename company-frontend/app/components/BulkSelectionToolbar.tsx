'use client';

import { useState } from 'react';
import { MoveRight, Star, Flag, X, ChevronDown, Loader2 } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from './GlassToastContainer';
import ScheduleInterviewsModal from './ScheduleInterviewsModal';

interface Props {
  selectedIds: string[];
  jobId: string;
  onClear: () => void;
  onSuccess: () => void;
  // Optimistic update: parent passes this so toolbar can patch UI instantly
  onOptimisticStatusUpdate?: (applicationIds: string[], newStatus: string) => void;
}

export default function BulkSelectionToolbar({
  selectedIds,
  jobId,
  onClear,
  onSuccess,
  onOptimisticStatusUpdate,
}: Props) {
  const { showToast } = useGlassToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [scheduleModal, setScheduleModal] = useState<{ open: boolean; targetStatus: string }>({
    open: false,
    targetStatus: 'technical_round',
  });

  const handleMove = async (targetStatus: string) => {
    setShowMoveMenu(false);

    if (targetStatus === 'technical_round' || targetStatus === 'hr_round') {
      setScheduleModal({ open: true, targetStatus });
      return;
    }

    setIsProcessing(true);
    setProcessingAction(targetStatus);

    // Optimistic update — patch UI before API responds
    onOptimisticStatusUpdate?.(selectedIds, targetStatus);

    try {
      const response = await api.patch('/company/selection/bulk/status', {
        applicationIds: selectedIds,
        targetStatus,
      });
      if (response.data.success) {
        showToast('success', response.data.message || `Moved ${selectedIds.length} to ${targetStatus.replace(/_/g, ' ')}`, 'success');
        onSuccess(); // triggers parent re-fetch to sync with DB
        onClear();
      }
    } catch (error: any) {
      // Rollback optimistic update on failure
      showToast('failed', error.response?.data?.message || 'Failed to update status', 'danger');
      onSuccess(); // re-fetch to restore correct state
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  const handleStar = async (starred: boolean) => {
    setIsProcessing(true);
    setProcessingAction(starred ? 'star' : 'unstar');
    try {
      await api.post('/company/selection/bulk/star', {
        applicationIds: selectedIds,
        starred,
      });
      onSuccess();
      onClear();
    } catch (error) {
      console.error('Bulk star error:', error);
      showToast('failed', 'Failed to update star', 'danger');
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  };

  const handleSetPriority = async (priority: number | null) => {
    setIsProcessing(true);
    setProcessingAction('priority');
    try {
      await api.post('/company/selection/bulk/priority', {
        applicationIds: selectedIds,
        priority,
      });
      onSuccess();
      onClear();
    } catch (error) {
      console.error('Bulk priority error:', error);
      showToast('failed', 'Failed to update priority', 'danger');
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
      setShowPriorityMenu(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClear} />

      {/* Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl z-50 font-mono">
        <div className="flex items-center gap-4">

          <span className="text-sm text-zinc-400">
            <span className="text-white font-bold">{selectedIds.length}</span> selected
          </span>

          <div className="h-6 w-px bg-zinc-800" />

          {/* Move Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              disabled={isProcessing}
              className="px-3 py-1.5 bg-white text-black font-semibold rounded-lg text-xs hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing && processingAction && !['star', 'unstar', 'priority'].includes(processingAction) ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MoveRight className="w-3.5 h-3.5" />
              )}
              Move to
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoveMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMoveMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoveMenu(false)} />
                <div className="absolute bottom-full mb-2 left-0 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden w-56 shadow-xl z-20">
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => handleMove('applied')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors rounded"
                    >
                      📥 Applied
                    </button>
                    <button
                      onClick={() => handleMove('screened')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors rounded"
                    >
                      📋 Screened
                    </button>
                    <button
                      onClick={() => handleMove('technical_round')}
                      className="w-full text-left px-3 py-2 text-xs text-blue-300 hover:bg-zinc-900 hover:text-blue-200 transition-colors rounded flex items-center justify-between"
                    >
                      <span>💻 Technical Round</span>
                      <span className="text-[9px] text-zinc-500 border border-zinc-700 rounded px-1 py-0.5">+ Schedule</span>
                    </button>
                    <button
                      onClick={() => handleMove('hr_round')}
                      className="w-full text-left px-3 py-2 text-xs text-purple-300 hover:bg-zinc-900 hover:text-purple-200 transition-colors rounded flex items-center justify-between"
                    >
                      <span>👔 HR Round</span>
                      <span className="text-[9px] text-zinc-500 border border-zinc-700 rounded px-1 py-0.5">+ Schedule</span>
                    </button>
                    <button
                      onClick={() => handleMove('offer_sent')}
                      className="w-full text-left px-3 py-2 text-xs text-amber-300 hover:bg-zinc-900 hover:text-amber-200 transition-colors rounded"
                    >
                      📄 Offer Sent
                    </button>
                    <button
                      onClick={() => handleMove('hired')}
                      className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-zinc-900 hover:text-emerald-300 transition-colors rounded"
                    >
                      ✅ Hired
                    </button>
                    <div className="h-px bg-zinc-800 my-1" />
                    <button
                      onClick={() => handleMove('rejected')}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-zinc-900 hover:text-red-300 transition-colors rounded"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Star / Unstar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStar(true)}
              disabled={isProcessing}
              className="px-3 py-1.5 border border-zinc-800 hover:border-amber-600 bg-zinc-900 text-zinc-400 hover:text-amber-400 rounded-lg text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing && processingAction === 'star' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Star className="w-3.5 h-3.5" />
              )}
              Star
            </button>
            <button
              onClick={() => handleStar(false)}
              disabled={isProcessing}
              className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300 rounded-lg text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isProcessing && processingAction === 'unstar' && (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              Unstar
            </button>
          </div>

          {/* Priority Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              disabled={isProcessing}
              className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isProcessing && processingAction === 'priority' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Flag className="w-3.5 h-3.5" />
              )}
              Priority
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPriorityMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPriorityMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPriorityMenu(false)} />
                <div className="absolute bottom-full mb-2 left-0 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden w-40 shadow-xl z-20">
                  <div className="p-2 space-y-0.5">
                    <button onClick={() => handleSetPriority(1)}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-zinc-900 transition-colors rounded">
                      P1 — High
                    </button>
                    <button onClick={() => handleSetPriority(2)}
                      className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-zinc-900 transition-colors rounded">
                      P2 — Medium
                    </button>
                    <button onClick={() => handleSetPriority(3)}
                      className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-zinc-900 transition-colors rounded">
                      P3 — Low
                    </button>
                    <div className="h-px bg-zinc-800 my-1" />
                    <button onClick={() => handleSetPriority(null)}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors rounded">
                      Clear Priority
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-zinc-800" />

          {/* Clear Selection */}
          <button
            onClick={onClear}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Interview Scheduling Modal */}
      <ScheduleInterviewsModal
        isOpen={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false, targetStatus: 'technical_round' })}
        jobId={jobId}
        selectedApplicationIds={selectedIds}
        initialTargetStatus={scheduleModal.targetStatus}
        onSuccess={() => {
          // Optimistic update for interview rounds too
          onOptimisticStatusUpdate?.(selectedIds, scheduleModal.targetStatus);
          setScheduleModal({ open: false, targetStatus: 'technical_round' });
          onSuccess();
          onClear();
        }}
      />
    </>
  );
}