'use client';

import { useState, useEffect } from 'react';
import { createTalentPool, updateTalentPool } from '../lib/api/crm';
import { Loader2, X } from 'lucide-react';

interface Pool {
  id: string;
  name: string;
  description?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editPool?: Pool | null;
}

export default function TalentPoolModal({ open, onClose, onSuccess, editPool }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editPool) {
      setName(editPool.name);
      setDescription(editPool.description ?? '');
    } else {
      setName('');
      setDescription('');
    }
    setError('');
  }, [editPool, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Pool parameter string name is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (editPool) {
        await updateTalentPool(editPool.id, { name: name.trim(), description });
      } else {
        await createTalentPool({ name: name.trim(), description });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Something went wrong during allocation.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-zinc-100">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl transition-all">
        
        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-zinc-900 p-4 bg-zinc-900/40">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            {editPool ? 'Modify Cluster Node' : 'Instantiate Pipeline Cluster'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Scope Container */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Pool Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Senior Frontend Infrastructure"
              className="w-full px-3 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Configure structural routing or sourcing metrics criteria..."
              rows={3}
              className="w-full px-3 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 resize-none shadow-inner"
            />
          </div>

          {/* Context Boundary Alert Banner */}
          {error && (
            <div className="p-3 text-xs rounded-xl border flex items-center gap-2 bg-red-950/40 border-red-900/40 text-red-400">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-400" />
              {error}
            </div>
          )}
        </div>

        {/* Operational Flow Controls */}
        <div className="flex justify-end gap-2 p-4 bg-zinc-900/20 border-t border-zinc-900 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin text-zinc-950" />}
            {loading ? 'Saving Parameters...' : editPool ? 'Save Cluster Properties' : 'Initialize Segment'}
          </button>
        </div>
      </div>
    </div>
  );
}