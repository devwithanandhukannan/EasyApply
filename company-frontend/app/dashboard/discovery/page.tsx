'use client';

import { useEffect, useState, useRef } from 'react';
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
  Loader2,
  Plus,
  X,
  RotateCcw,
  Tag,
  Building2,
  Calendar
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
  experience: { role: string; company: string; current: boolean; startYear?: string; endYear?: string }[];
  education: { degree: string; institution: string; startYear?: string; endYear?: string }[];
  _count: {
    applications: number;
    skills: number;
    experience: number;
  };
}

const POPULAR_SKILLS = [
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'Tailwind',
  'Next.js',
  'Flutter',
  'Java',
  'SQL',
  'Docker',
  'Figma',
];

export default function SeekerDiscoveryPage() {
  const { showToast } = useGlassToast();

  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');

  // Selected candidate profile modal
  const [selectedSeeker, setSelectedSeeker] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    fetchSeekers();
  }, [page, availabilityFilter, experienceFilter, selectedSkills]);

  const fetchSeekers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '12');

      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedSkills.length > 0) params.append('skills', selectedSkills.join(','));
      if (locationFilter.trim()) params.append('location', locationFilter.trim());
      if (availabilityFilter) params.append('availability', availabilityFilter);
      if (experienceFilter) params.append('experience', experienceFilter);

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

  const handleAddSkill = (skillToAdd?: string) => {
    const raw = skillToAdd || skillInput;
    const clean = raw.trim();
    if (!clean) return;

    // Handle comma separated skills if typed
    const parts = clean.split(',').map((s) => s.trim()).filter(Boolean);
    const updated = Array.from(new Set([...selectedSkills, ...parts]));

    setSelectedSkills(updated);
    setSkillInput('');
    setPage(1);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skillToRemove));
    setPage(1);
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSkillInput('');
    setSelectedSkills([]);
    setLocationFilter('');
    setAvailabilityFilter('');
    setExperienceFilter('');
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillInput.trim()) {
      handleAddSkill();
    } else {
      setPage(1);
      fetchSeekers();
    }
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

  const hasActiveFilters =
    searchQuery ||
    selectedSkills.length > 0 ||
    locationFilter ||
    availabilityFilter ||
    experienceFilter;

  return (
    <div className="min-h-screen flex flex-col bg-black text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Search className="w-7 h-7 text-indigo-400" />
            <span>Job Seeker Direct Discovery</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Browse verified job seekers who have opted-in to be discovered by all employers. Search by skills, availability, and background.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* ─── ADVANCED FILTER BAR ────────────────────────────────────── */}
      <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Skill Tag Input */}
          <div className="lg:col-span-2 relative">
            <div className="relative">
              <Tag className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type skill & press Enter (e.g. React, Node.js)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className="w-full pl-9 pr-14 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                disabled={!skillInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold transition-all"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Location Input */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Location (e.g. Remote, Bangalore)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          {/* Experience Filter Dropdown */}
          <div className="relative">
            <Briefcase className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={experienceFilter}
              onChange={(e) => {
                setExperienceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-none cursor-pointer"
            >
              <option value="">All Experience</option>
              <option value="experienced">With Work Experience</option>
              <option value="fresher">Fresher / Entry Level (0-1 yrs)</option>
              <option value="mid">Mid Level (2-5 yrs)</option>
              <option value="senior">Senior (5+ yrs)</option>
            </select>
          </div>

          {/* Availability Filter Dropdown */}
          <div className="relative">
            <select
              value={availabilityFilter}
              onChange={(e) => {
                setAvailabilityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl text-xs text-white outline-none cursor-pointer"
            >
              <option value="">All Availability</option>
              <option value="available">Available Now</option>
              <option value="employed">Employed</option>
              <option value="open_to_offers">Open to Offers</option>
            </select>
          </div>
        </form>

        {/* ─── ENTERED SKILL CHIPS WITH CLOSE BUTTONS ───────────────── */}
        {selectedSkills.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-zinc-900">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
              Active Skills:
            </span>
            {selectedSkills.map((sk) => (
              <span
                key={sk}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/60 border border-indigo-500/50 text-indigo-300 rounded-full text-xs font-semibold shadow-sm animate-in fade-in zoom-in-95"
              >
                <span>{sk}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(sk)}
                  className="p-0.5 hover:bg-indigo-800/40 rounded-full text-indigo-400 hover:text-white transition-colors"
                  title={`Remove ${sk}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                setSelectedSkills([]);
                setPage(1);
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 underline ml-2"
            >
              Clear Skills
            </button>
          </div>
        )}

        {/* ─── QUICK SUGGESTED SKILL PILLS ──────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] text-zinc-500 mr-1">Popular:</span>
          {POPULAR_SKILLS.filter((s) => !selectedSkills.includes(s)).map((pop) => (
            <button
              key={pop}
              type="button"
              onClick={() => handleAddSkill(pop)}
              className="px-2.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-500/40 text-zinc-400 hover:text-zinc-200 rounded-lg text-[11px] font-medium transition-all"
            >
              + {pop}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CANDIDATES RESULTS GRID ────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-xs text-zinc-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span>Discovering matching candidates...</span>
          </div>
        ) : seekers.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-12 text-center text-zinc-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-zinc-200">No Matching Candidates Found</h3>
              <p className="text-xs text-zinc-500">
                {hasActiveFilters
                  ? 'Try removing some skill tags or broadening your location/experience filters.'
                  : 'No candidate profiles available right now. Check back soon!'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {seekers.map((s) => (
              <div
                key={s.id}
                className="bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all hover:bg-zinc-900/30 shadow-md"
              >
                <div className="space-y-3">
                  {/* Candidate Avatar & Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-sm text-white shrink-0 overflow-hidden">
                        {s.profilePhotoUrl ? (
                          <img src={s.profilePhotoUrl} alt={s.fullName} className="w-full h-full object-cover" />
                        ) : (
                          s.fullName.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{s.fullName}</div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <span>{s.location || 'Remote / Unspecified'}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${
                        s.availabilityStatus === 'available'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : s.availabilityStatus === 'employed'
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                          : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                      }`}
                    >
                      {s.availabilityStatus || 'Active'}
                    </span>
                  </div>

                  {/* Bio */}
                  {s.bio && (
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {s.bio}
                    </p>
                  )}

                  {/* Latest Experience */}
                  {s.experience && s.experience.length > 0 && (
                    <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-300 font-semibold truncate">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{s.experience[0].role}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate pl-5">
                        {s.experience[0].company} {s.experience[0].current ? '• Present' : ''}
                      </div>
                    </div>
                  )}

                  {/* Skills Tags */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-1">
                      {s.skills?.slice(0, 5).map((sk, idx) => {
                        const isMatched = selectedSkills.some(
                          (userSk) => userSk.toLowerCase() === sk.name.toLowerCase()
                        );
                        return (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 text-[10px] rounded-md font-medium border ${
                              isMatched
                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}
                          >
                            {sk.name}
                          </span>
                        );
                      })}
                      {s.skills?.length > 5 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-zinc-500">
                          +{s.skills.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer / Action */}
                <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-zinc-500">
                    {s.linkedin && (
                      <a href={s.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="hover:text-white">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {s.github && (
                      <a href={s.github} target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-white">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {s.portfolio && (
                      <a href={s.portfolio} target="_blank" rel="noopener noreferrer" title="Portfolio" className="hover:text-white">
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => openProfile(s.id)}
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <span>View Profile</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── PAGINATION ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 pt-4 border-t border-zinc-900 text-xs text-zinc-400">
        <div>Showing {seekers.length} of {total} discoverable candidates</div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl disabled:opacity-40 transition-all font-medium"
          >
            ← Previous
          </button>
          <span className="flex items-center px-2 text-zinc-500 font-medium">Page {page} of {totalPages || 1}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl disabled:opacity-40 transition-all font-medium"
          >
            Next →
          </button>
        </div>
      </div>

      {/* ─── FULL PROFILE MODAL ─────────────────────────────────────── */}
      {selectedSeeker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-xl text-white overflow-hidden shrink-0">
                  {selectedSeeker.profilePhotoUrl ? (
                    <img src={selectedSeeker.profilePhotoUrl} alt={selectedSeeker.fullName} className="w-full h-full object-cover" />
                  ) : (
                    selectedSeeker.fullName.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedSeeker.fullName}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{selectedSeeker.location || 'Location Not Specified'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedSeeker(null)} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSeeker.bio && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">About</div>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-900">
                  {selectedSeeker.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Skills & Competencies</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeeker.skills?.map((s: any, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            {selectedSeeker.experience?.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Work Experience</div>
                <div className="space-y-2">
                  {selectedSeeker.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{exp.role} • <span className="text-indigo-400">{exp.company}</span></span>
                        {exp.current && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">Present</span>}
                      </div>
                      {exp.description && <p className="text-[11px] text-zinc-400 leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {selectedSeeker.education?.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Education</div>
                <div className="space-y-2">
                  {selectedSeeker.education.map((edu: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-zinc-900/40 border border-zinc-900 rounded-xl">
                      <div className="text-xs font-bold text-white">{edu.degree}</div>
                      <div className="text-[11px] text-zinc-500">{edu.institution}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-zinc-900">
              <button
                onClick={() => setSelectedSeeker(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-all"
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

