'use client';
import { useState } from 'react';
import api from '@/app/lib/axios';
import { X, Sparkles, Filter, ChevronRight } from 'lucide-react';

interface Candidate {
  applicationId: string;
  profileId: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  availabilityStatus: string;
  atsScore: number | null;
  matchScore: number | null;
  matchReason: string;
  strengths: string[];
  gaps: string[];
}

export default function CandidateSearchModal({ isOpen, onClose, onSelectCandidates }: any) {
  const [jobQuery, setJobQuery] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [filters, setFilters] = useState({
    minMatch: 70,
    location: '',
    skills: '',
    availability: '',
    minAtsScore: 0,
  });
  const [searchResults, setSearchResults] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await api.post('/company/candidates/search', {
        jobDescription: jobQuery,
        requiredSkills: requiredSkills.split(',').map(s => s.trim()),
        filters: {
          minMatch: filters.minMatch,
          location: filters.location,
          skills: filters.skills.split(',').map(s => s.trim()).filter(Boolean),
          availability: filters.availability,
          minAtsScore: filters.minAtsScore,
        },
      });
      setSearchResults(res.data.candidates || []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (applicationId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(applicationId)) newSet.delete(applicationId);
    else newSet.add(applicationId);
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === searchResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(searchResults.map(c => c.applicationId)));
    }
  };

  const handleSchedule = () => {
    const selectedCandidates = searchResults.filter(c => selectedIds.has(c.applicationId));
    onSelectCandidates(selectedCandidates);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-950 p-5 border-b border-zinc-900 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <h2 className="text-xl font-bold text-white">AI Candidate Search</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Search inputs */}
          <div className="space-y-4">
            <textarea
              placeholder="Paste job description or role requirements..."
              value={jobQuery}
              onChange={e => setJobQuery(e.target.value)}
              rows={4}
              className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white"
            />
            <input
              placeholder="Required skills (comma separated)"
              value={requiredSkills}
              onChange={e => setRequiredSkills(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white"
            />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Min match %" value={filters.minMatch} onChange={e => setFilters({...filters, minMatch: +e.target.value})} className="bg-black border border-zinc-800 rounded-lg p-2 text-white" />
              <input placeholder="Location" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})} className="bg-black border border-zinc-800 rounded-lg p-2 text-white" />
              <input placeholder="Must have skills" value={filters.skills} onChange={e => setFilters({...filters, skills: e.target.value})} className="bg-black border border-zinc-800 rounded-lg p-2 text-white" />
              <select value={filters.availability} onChange={e => setFilters({...filters, availability: e.target.value})} className="bg-black border border-zinc-800 rounded-lg p-2 text-white">
                <option value="">Availability</option>
                <option value="available">Available</option>
                <option value="spot_available">Spot available</option>
                <option value="not_available">Not available</option>
              </select>
              <input type="number" placeholder="Min ATS score" value={filters.minAtsScore} onChange={e => setFilters({...filters, minAtsScore: +e.target.value})} className="bg-black border border-zinc-800 rounded-lg p-2 text-white" />
            </div>
            <button onClick={handleSearch} className="px-4 py-2 bg-white text-black rounded-lg font-medium">Search & Rank</button>
          </div>

          {/* Results */}
          {loading && <div className="text-center py-8">Ranking candidates with AI...</div>}
          {!loading && searchResults.length === 0 && jobQuery && <div className="text-center py-8 text-zinc-500">No candidates found. Try different filters.</div>}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">{searchResults.length} candidates found</span>
                <button onClick={handleSelectAll} className="text-xs text-violet-400">
                  {selectedIds.size === searchResults.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              {searchResults.map(cand => (
                <div key={cand.applicationId} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-start gap-4">
                  <input type="checkbox" checked={selectedIds.has(cand.applicationId)} onChange={() => toggleSelect(cand.applicationId)} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">{cand.fullName}</h3>
                      {cand.matchScore && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">{cand.matchScore}% match</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{cand.email} • {cand.location || 'No location'}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cand.skills.slice(0, 5).map(s => <span key={s} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs">{s}</span>)}
                    </div>
                    {cand.matchReason && <p className="text-xs text-zinc-400 mt-2 italic">{cand.matchReason}</p>}
                  </div>
                  <div className="text-right text-xs text-zinc-500">ATS: {cand.atsScore ?? '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="sticky bottom-0 bg-zinc-950 border-t border-zinc-900 p-4 flex justify-end">
            <button onClick={handleSchedule} className="px-6 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium">
              Schedule Interviews ({selectedIds.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}