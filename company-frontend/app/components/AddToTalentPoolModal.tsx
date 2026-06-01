'use client';

import { useEffect, useState } from 'react';
import { X, Plus, FolderOpen, Loader2, CheckSquare } from 'lucide-react';
import api from '@/app/lib/axios';

interface AddToTalentPoolModalProps {
  open: boolean;
  onClose: () => void;
  jobSeekerProfileId: string;
  candidateName: string;
}

export default function AddToTalentPoolModal({
  open,
  onClose,
  jobSeekerProfileId,
  candidateName
}: AddToTalentPoolModalProps) {
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDesc, setNewPoolDesc] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (open) {
      fetchTalentPools();
    }
  }, [open]);

  const fetchTalentPools = async () => {
    try {
      setLoading(true);
      // Calls your GET router for listing CRM talent pools
      const response = await api.get('/crm/talent-pools');
      if (response.data.success) {
        setPools(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to grab CRM talent pools:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoolName.trim()) return;

    try {
      setSubmitting(true);
      // Hits router.post('/talent-pools', createTalentPool)
      const response = await api.post('/crm/talent-pools', {
        name: newPoolName,
        description: newPoolDesc
      });

      if (response.data.success) {
        setNewPoolName('');
        setNewPoolDesc('');
        setShowCreateForm(false);
        // Refresh options list and set selected tracking
        const addedPool = response.data.data;
        setPools(prev => [addedPool, ...prev]);
        setSelectedPoolId(addedPool.id);
      }
    } catch (err: any) {
      console.error('Failed to create talent pool:', err);
    } finally {
      setSubmitting(false);
    }
  };

 const handleAddMember = async () => {
    if (!selectedPoolId) return;

    try {
      setSubmitting(true);
      setStatusMessage(null);

      // ── Change candidateIds to jobSeekerProfileIds ──
      const response = await api.post(`/crm/talent-pools/${selectedPoolId}/members`, {
        jobSeekerProfileIds: [jobSeekerProfileId] 
      });

      if (response.data.success) {
        setStatusMessage({ type: 'success', text: `Successfully appended ${candidateName} to pool!` });
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error attaching member to pool:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Candidate might already exist in this pool.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-white">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-zinc-900 p-4 bg-zinc-900/20">
          <div className="flex items-center gap-2 text-zinc-400">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Talent Pool Assignment</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inner Context Wrap */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-zinc-400">Assigning candidate:</p>
            <h3 className="text-sm font-bold text-white uppercase mt-0.5">{candidateName}</h3>
          </div>

          {statusMessage && (
            <div className={`p-3 text-xs rounded border ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' 
                : 'bg-red-950/30 border-red-900 text-red-400'
            }`}>
              {statusMessage.text}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : (
            <>
              {!showCreateForm ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Choose Pipeline Pool</label>
                    {pools.length === 0 ? (
                      <div className="p-4 border border-dashed border-zinc-900 text-center rounded text-xs text-zinc-600">
                        No active custom pools found.
                      </div>
                    ) : (
                      <select
                        value={selectedPoolId}
                        onChange={(e) => setSelectedPoolId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-700"
                      >
                        <option value="">-- Select custom pool targeted pipeline --</option>
                        {pools.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p._count?.members || p.members?.length || 0} members)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(true)}
                      className="text-xs text-zinc-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create a new pool
                    </button>

                    <button
                      disabled={!selectedPoolId || submitting}
                      onClick={handleAddMember}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-1.5"
                    >
                      {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                      Confirm Allocation
                    </button>
                  </div>
                </div>
              ) : (
                /* Sub-Form to build dynamic collection profile if it doesn't map yet */
                <form onSubmit={handleCreatePool} className="space-y-3 border-t border-zinc-900 pt-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">New Talent Pool Node</h4>
                  
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Pool Name (e.g. Senior Frontend Core)"
                      value={newPoolName}
                      onChange={(e) => setNewPoolName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-zinc-700"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <textarea
                      placeholder="Optional technical scope details..."
                      value={newPoolDesc}
                      onChange={(e) => setNewPoolDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !newPoolName.trim()}
                      className="px-3 py-1 bg-zinc-200 hover:bg-white text-black font-bold rounded disabled:opacity-50"
                    >
                      Save & Select
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}