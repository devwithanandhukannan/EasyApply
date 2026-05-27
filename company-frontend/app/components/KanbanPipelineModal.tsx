// app/components/KanbanPipelineModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, ArrowRight, User, Mail, Phone, ChevronRight } from 'lucide-react';
import api from '@/app/lib/axios';

interface KanbanPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  onMutationEvent: () => void;
}

const STAGE_COLUMNS = [
  { key: 'applied', label: 'Applied', color: 'border-zinc-800 text-zinc-400' },
  { key: 'screened', label: 'Screened', color: 'border-blue-900/50 text-blue-400' },
  { key: 'technical_round', label: 'Tech Round', color: 'border-purple-900/50 text-purple-400' },
  { key: 'hr_round', label: 'HR Round', color: 'border-cyan-900/50 text-cyan-400' },
  { key: 'offer_sent', label: 'Offer Sent', color: 'border-amber-900/50 text-amber-400' },
  { key: 'hired', label: 'Hired', color: 'border-emerald-900/50 text-emerald-400' },
  { key: 'rejected', label: 'Rejected', color: 'border-red-900/50 text-red-400' }
];

export default function KanbanPipelineModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  onMutationEvent
}: KanbanPipelineModalProps) {
  const [boardData, setBoardData] = useState<Record<string, any[]>>({
    applied: [], screened: [], technical_round: [], hr_round: [], offer_sent: [], hired: [], rejected: []
  });
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchBoardData();
  }, [isOpen, jobId]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/kanban/job/${jobId}`);
      if (res.data.success) {
        setBoardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed processing pipeline matrix loading:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: string, currentStatus: string, nextStatus: string) => {
    try {
      setActioningId(applicationId);
      // Dispatches request directly down into your PATCH routing matrix handler
      const res = await api.patch('/kanban/move-card', {
        applicationId,
        jobPostingId: jobId,
        sourceStatus: currentStatus,
        destinationStatus: nextStatus,
        newIndex: 0
      });

      if (res.data.success) {
        await fetchBoardData();
        onMutationEvent();
      }
    } catch (err) {
      console.error('Failed changing candidate route position vector:', err);
    } finally {
      setActioningId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-900 w-full h-[95vh] max-w-[98vw] rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs text-white animate-in zoom-in-95 duration-150">
        
        {/* Top Control Block */}
        <div className="px-6 py-4 border-b border-zinc-900 bg-black/40 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white tracking-tight">Job Application Pipeline Matrix</h3>
              <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-[10px] uppercase">
                VAPT-Core Grid
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-xl">Target Context: <span className="text-zinc-300 font-bold">{jobTitle}</span> ({jobId})</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchBoardData} 
              disabled={loading}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white border border-zinc-800 transition-all disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white border border-zinc-800 transition-all cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Kanban Board Column Grid wrapper */}
        <div className="flex-1 overflow-x-auto p-4 bg-black/20 flex gap-3 select-none items-start custom-scrollbar">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2 animate-pulse">
              <div className="h-5 w-5 animate-spin rounded-full border border-zinc-800 border-t-zinc-500" />
              <span>Parsing structural board clusters...</span>
            </div>
          ) : (
            STAGE_COLUMNS.map((col) => {
              const cards = boardData[col.key] || [];
              return (
                <div key={col.key} className="w-72 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col max-h-full flex-shrink-0">
                  
                  {/* Column Header */}
                  <div className={`p-3 border-b border-zinc-900 flex items-center justify-between rounded-t-xl bg-black/20`}>
                    <span className="font-semibold text-[11px] tracking-wider uppercase text-zinc-300">{col.label}</span>
                    <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-500">
                      {cards.length}
                    </span>
                  </div>

                  {/* Vertical Content Cards Bucket */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar max-h-[calc(95vh-140px)] min-h-[200px]">
                    {cards.length === 0 ? (
                      <div className="py-8 text-center text-zinc-700 font-mono text-[10px] border border-dashed border-zinc-900 rounded-lg">
                        Empty Sector
                      </div>
                    ) : (
                      cards.map((card) => {
                        const profile = card.jobSeekerProfile || {};
                        return (
                          <div 
                            key={card.id} 
                            className={`p-3 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 rounded-lg transition-all space-y-2.5 relative group/card ${
                              actioningId === card.id ? 'opacity-40 pointer-events-none' : ''
                            }`}
                          >
                            {/* Profile Core Data Info */}
                            <div className="space-y-1">
                              <p className="font-medium text-zinc-200 text-[11px] truncate">{profile.fullName || 'Anonymous Identity'}</p>
                              <div className="space-y-0.5 text-zinc-500 text-[10px]">
                                <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 flex-shrink-0" /> {profile.email}</p>
                                {profile.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 flex-shrink-0" /> {profile.phone}</p>}
                              </div>
                            </div>

                            {/* Dropdown Quick Move Matrix Actions */}
                            <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-1">
                              <span className="text-[9px] text-zinc-600 uppercase font-mono">Move To:</span>
                              <select
                                value={col.key}
                                onChange={(e) => handleUpdateStatus(card.id, col.key, e.target.value)}
                                className="bg-black border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 focus:outline-none focus:border-zinc-700 max-w-[70%] appearance-none cursor-pointer text-center font-bold"
                              >
                                {STAGE_COLUMNS.map(opt => (
                                  <option key={opt.key} value={opt.key} disabled={opt.key === col.key}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}