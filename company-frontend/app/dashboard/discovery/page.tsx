'use client';

import { useEffect, useState } from 'react';
import api from '@/app/lib/axios';
import {
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Link as LinkIcon,
  Globe,
  Users,
  Filter,
  CheckCircle2,
  Lock,
  Mail,
  Loader2
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';

interface Seeker {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  location: string | null;
  bio: string | null;
  availabilityStatus: string;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  skills: { name: string }[];
  experience: { role: string; company: string; current: boolean }[];
  education: { degree: string; institution: string }[];
  _count: {
    applications: number;
    skills: number;
  };
}

export default function SeekerDiscoveryPage() {
  const { showToast } = useGlassToast();

  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [skillsFilter, setSkillsFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Selected candidate profile modal
  const [selectedSeeker, setSelectedSeeker] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    fetchSeekers();
  }, [page, availabilityFilter]);

  const fetchSeekers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '12');
      if (skillsFilter) params.append('skills', skillsFilter);
      if (locationFilter) params.append('location', locationFilter);
      if (availabilityFilter) params.append('availability', availabilityFilter);

      const res = await api.get(`/walkin/discovery/seekers?${params.toString()}`);
      if (res.data?.success) {
        setSeekers(res.data.seekers);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSeekers();
  };

  const openProfile = async (id: string) => {
    try {
      setLoadingProfile(true);
      const res = await api.get(`/walkin/discovery/seekers/${id}`);
      if (res.data?.success) {
        setSelectedSeeker(res.data.seeker);
      }
    } catch (err: any) {
      showToast('Error', 'Failed to load profile', 'danger');
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black text-zinc-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Search className="w-7 h-7 text-indigo-400" />
            <span>Job Seeker Direct Discovery</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Browse verified job seekers who have opted-in to be discovered by all employers. Search by skills, availability, and background.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleApplyFilter} className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 flex flex-wrap gap-3 items-center shrink-0">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="🔍 Skills (e.g. React, Node.js, Python)"
            value={skillsFilter}
            onChange={(e) => setSkillsFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="w-[180px]">
          <input
            type="text"
            placeholder="📍 Location (e.g. Bangalore, Remote)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="w-[150px]">
          <select
            value={availabilityFilter}
            onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Availability</option>
            <option value="available">Available Now</option>
            <option value="employed">Employed</option>
            <option value="open_to_offers">Open to Offers</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shrink-0"
        >
          Apply Filters
        </button>
      </form>

      {/* Candidates Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs text-zinc-600">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
            <span>Discovering matching candidates...</span>
          </div>
        ) : seekers.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-600 space-y-2">
            <Users className="w-10 h-10 text-zinc-800" />
            <div className="text-xs font-semibold text-zinc-500">No matching candidates found</div>
            <p className="text-[11px] text-zinc-600">Try broadening your skill or location filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {seekers.map((s) => (
              <div
                key={s.id}
                className="bg-zinc-950/70 border border-zinc-900 hover:border-zinc-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all hover:bg-zinc-900/30"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                        {s.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{s.fullName}</div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{s.location || 'Remote / Not set'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 text-[9px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full uppercase">
                      {s.availabilityStatus}
                    </span>
                  </div>

                  {s.bio && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {s.bio}
                    </p>
                  )}

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {s.skills?.slice(0, 5).map((sk, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md">
                        {sk.name}
                      </span>
                    ))}
                    {s.skills?.length > 5 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-zinc-600">
                        +{s.skills.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer / Action */}
                <div className="pt-3 border-t border-zinc-900/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-500">
                    {s.linkedin && <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />}
                    {s.github && <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />}
                    {s.portfolio && <Globe className="w-3.5 h-3.5 text-zinc-400" />}
                  </div>

                  <button
                    onClick={() => openProfile(s.id)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl text-xs font-semibold"
                  >
                    View Full Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between shrink-0 pt-3 border-t border-zinc-900 text-xs text-zinc-500">
        <div>Showing {seekers.length} of {total} discoverable candidates</div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="flex items-center px-2">Page {page} of {totalPages || 1}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Full Profile Modal */}
      {selectedSeeker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-lg text-white">
                  {selectedSeeker.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedSeeker.fullName}</h3>
                  <p className="text-xs text-zinc-400">{selectedSeeker.location || 'Location Not Specified'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSeeker(null)} className="text-zinc-500 hover:text-white text-lg">✕</button>
            </div>

            {selectedSeeker.bio && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-zinc-500 uppercase">About</div>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-900">
                  {selectedSeeker.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-zinc-500 uppercase">Skills & Competencies</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeeker.skills?.map((s: any, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            {selectedSeeker.experience?.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-500 uppercase">Work Experience</div>
                <div className="space-y-2">
                  {selectedSeeker.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-1">
                      <div className="text-xs font-bold text-white">{exp.role} • <span className="text-indigo-400">{exp.company}</span></div>
                      {exp.description && <p className="text-[11px] text-zinc-400">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {selectedSeeker.education?.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-500 uppercase">Education</div>
                <div className="space-y-2">
                  {selectedSeeker.education.map((edu: any, idx: number) => (
                    <div key={idx} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
                      <div className="text-xs font-bold text-white">{edu.degree}</div>
                      <div className="text-[11px] text-zinc-500">{edu.institution}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-zinc-900">
              <button
                onClick={() => setSelectedSeeker(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
