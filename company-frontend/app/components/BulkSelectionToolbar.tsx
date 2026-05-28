'use client';

import { useState } from 'react';
import { MoveRight, Star, Flag, Tag, X, ChevronDown, Trash2 } from 'lucide-react';
import api from '@/app/lib/axios';

interface Props {
  selectedIds: string[];
  onClear: () => void;
  onSuccess: () => void;
}

export default function BulkSelectionToolbar({ selectedIds, onClear, onSuccess }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const handleMove = async (targetStatus: string) => {
    setIsProcessing(true);
    try {
      const response = await api.post('/company/selection/bulk/move', {
        applicationIds: selectedIds,
        targetStatus
      });
      
      if (response.data.success) {
        onSuccess();
        onClear();
      }
    } catch (error: any) {
      console.error('Bulk move error:', error);
      alert(error.response?.data?.message || 'Failed to move applications');
    } finally {
      setIsProcessing(false);
      setShowMoveMenu(false);
    }
  };

  const handleStar = async (starred: boolean) => {
    setIsProcessing(true);
    try {
      await api.post('/company/selection/bulk/star', {
        applicationIds: selectedIds,
        starred
      });
      onSuccess();
      onClear();
    } catch (error) {
      console.error('Bulk star error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetPriority = async (priority: number | null) => {
    setIsProcessing(true);
    try {
      await api.post('/company/selection/bulk/priority', {
        applicationIds: selectedIds,
        priority
      });
      onSuccess();
      onClear();
    } catch (error) {
      console.error('Bulk priority error:', error);
    } finally {
      setIsProcessing(false);
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
              <MoveRight className="w-3.5 h-3.5" />
              Move to
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoveMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMoveMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoveMenu(false)} />
                <div className="absolute bottom-full mb-2 left-0 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden w-52 shadow-xl z-20">
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => handleMove('screened')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors rounded"
                    >
                      📋 Screening
                    </button>
                    <button
                      onClick={() => handleMove('technical_round')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors rounded"
                    >
                      💻 Technical Round
                    </button>
                    <button
                      onClick={() => handleMove('hr_round')}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors rounded"
                    >
                      👔 HR Round
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

          {/* Star/Unstar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStar(true)}
              disabled={isProcessing}
              className="px-3 py-1.5 border border-zinc-800 hover:border-amber-600 bg-zinc-900 text-zinc-400 hover:text-amber-400 rounded-lg text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Star selected"
            >
              <Star className="w-3.5 h-3.5" />
              Star
            </button>
            <button
              onClick={() => handleStar(false)}
              disabled={isProcessing}
              className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300 rounded-lg text-xs transition-colors disabled:opacity-50"
              title="Remove star"
            >
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
              <Flag className="w-3.5 h-3.5" />
              Priority
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPriorityMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPriorityMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPriorityMenu(false)} />
                <div className="absolute bottom-full mb-2 left-0 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden w-40 shadow-xl z-20">
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => handleSetPriority(1)}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-zinc-900 transition-colors rounded"
                    >
                      P1 - High
                    </button>
                    <button
                      onClick={() => handleSetPriority(2)}
                      className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-zinc-900 transition-colors rounded"
                    >
                      P2 - Medium
                    </button>
                    <button
                      onClick={() => handleSetPriority(3)}
                      className="w-full text-left px-3 py-2 text-xs text-blue-400 hover:bg-zinc-900 transition-colors rounded"
                    >
                      P3 - Low
                    </button>
                    <div className="h-px bg-zinc-800 my-1" />
                    <button
                      onClick={() => handleSetPriority(null)}
                      className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors rounded"
                    >
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
    </>
  );
}