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

import { useAuth } from '@/app/contexts/AuthContext';
import LockedFeaturePaywall from '@/app/components/LockedFeaturePaywall';

export default function SeekerDiscoveryPage() {
  const { showToast } = useGlassToast();
  const { company } = useAuth();

  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const hasDiscoveryAccess = company?.subscription?.features?.seekerDiscovery ?? false;

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

  if (!hasDiscoveryAccess) {
    return (
      <LockedFeaturePaywall
        featureKey="seekerDiscovery"
        featureTitle="Job Seeker Direct Discovery Database"
        featureDescription="Directly search, filter, and scout verified candidates across our global job seeker talent network."
      />
    );
  }

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
    <div className="flex flex-col text-[#1d1d1f] dark:text-[#f5f5f7] p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-7xl mx-auto">
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-2.5">
            <Search className="w-7 h-7 text-[#0071e3]" />
            <span>Job Seeker Direct Discovery</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-1">
            Browse verified job seekers who have opted-in to be discovered by all employers. Search by skills, availability, and background.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="px-4 py-2 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-2xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#86868b]" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* ─── ADVANCED FILTER BAR ────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Skill Tag Input */}
          <div className="lg:col-span-2 relative">
            <div className="relative">
              <Tag className="w-4 h-4 text-[#0071e3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type skill & press Enter (e.g. React, Node.js)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                className="w-full pl-9 pr-16 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] outline-none transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                disabled={!skillInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Location Input */}
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Location (e.g. Remote, Bangalore)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] outline-none transition-all font-medium"
            />
          </div>

          {/* Experience Filter Dropdown */}
          <div className="relative">
            <Briefcase className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={experienceFilter}
              onChange={(e) => {
                setExperienceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] outline-none cursor-pointer font-medium"
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
              className="w-full px-3.5 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] outline-none cursor-pointer font-medium"
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
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <span className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mr-1">
              Active Skills:
            </span>
            {selectedSkills.map((sk) => (
              <span
                key={sk}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0071e3]/10 dark:bg-[#0071e3]/20 border border-[#0071e3]/25 text-[#0071e3] dark:text-[#47a0ff] rounded-full text-xs font-semibold shadow-sm"
              >
                <span>{sk}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(sk)}
                  className="p-0.5 hover:bg-[#0071e3]/20 rounded-full transition-colors cursor-pointer"
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
              className="text-xs text-[#86868b] hover:text-[#0071e3] underline ml-2 cursor-pointer"
            >
              Clear Skills
            </button>
          </div>
        )}

        {/* ─── QUICK SUGGESTED SKILL PILLS ──────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs text-[#86868b] mr-1">Popular:</span>
          {POPULAR_SKILLS.filter((s) => !selectedSkills.includes(s)).map((pop) => (
            <button
              key={pop}
              type="button"
              onClick={() => handleAddSkill(pop)}
              className="px-3 py-1 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] border border-black/[0.04] dark:border-white/[0.06] hover:border-[#0071e3]/40 text-[#1d1d1f] dark:text-[#f5f5f7] rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              + {pop}
            </button>
          ))}
        </div>
      </div>

      {/* ─── CANDIDATES RESULTS GRID ────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-xs text-[#86868b] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
            <span>Discovering matching candidates...</span>
          </div>
        ) : seekers.length === 0 ? (
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-12 text-center text-[#86868b] space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] flex items-center justify-center mx-auto text-[#86868b]">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">No Matching Candidates Found</h3>
              <p className="text-xs text-[#86868b]">
                {hasActiveFilters
                  ? 'Try removing some skill tags or broadening your location/experience filters.'
                  : 'No candidate profiles available right now. Check back soon!'}
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-semibold transition-all shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pb-4">
            {seekers.map((s) => {
              const formatAvailability = (status?: string) => {
                if (!status) return 'Available';
                if (status === 'open_to_offers') return 'Open to Offers';
                if (status === 'SPOT_AVAILABLE' || status === 'spot_available') return 'Spot Available';
                return status.replace(/_/g, ' ');
              };

              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] p-5 sm:p-6 rounded-3xl flex flex-col justify-between space-y-4 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Candidate Avatar & Info */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#5856d6] flex items-center justify-center font-bold text-sm text-white shrink-0 overflow-hidden shadow-sm">
                          {s.profilePhotoUrl ? (
                            <img src={s.profilePhotoUrl} alt={s.fullName} className="w-full h-full object-cover" />
                          ) : (
                            s.fullName.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7] truncate" title={s.fullName}>
                            {s.fullName}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#86868b] mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-[#86868b] shrink-0" />
                            <span className="truncate">{s.location || 'Remote / Unspecified'}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap ${
                          s.availabilityStatus === 'available' || s.availabilityStatus === 'SPOT_AVAILABLE' || s.availabilityStatus === 'spot_available'
                            ? 'bg-[#34c759]/10 border border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158]'
                            : s.availabilityStatus === 'employed'
                            ? 'bg-[#ff9500]/10 border border-[#ff9500]/20 text-[#ff9500]'
                            : 'bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] dark:text-[#47a0ff]'
                        }`}
                      >
                        {formatAvailability(s.availabilityStatus)}
                      </span>
                    </div>

                    {/* Bio */}
                    {s.bio && (
                      <p className="text-xs text-[#6e6e73] dark:text-[#aeaeb2] line-clamp-2 leading-relaxed">
                        {s.bio}
                      </p>
                    )}

                    {/* Latest Experience */}
                    {s.experience && s.experience.length > 0 && (
                      <div className="p-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-xs space-y-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold truncate">
                          <Briefcase className="w-3.5 h-3.5 text-[#0071e3] shrink-0" />
                          <span className="truncate">{s.experience[0].role}</span>
                        </div>
                        <div className="text-[11px] text-[#86868b] truncate pl-5">
                          {s.experience[0].company} {s.experience[0].current ? '• Present' : ''}
                        </div>
                      </div>
                    )}

                    {/* Skills Tags */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {s.skills?.slice(0, 4).map((sk, idx) => {
                          const isMatched = selectedSkills.some(
                            (userSk) => userSk.toLowerCase() === sk.name.toLowerCase()
                          );
                          return (
                            <span
                              key={idx}
                              className={`px-2.5 py-0.5 text-[11px] rounded-lg font-medium border ${
                                isMatched
                                  ? 'bg-[#0071e3]/15 border-[#0071e3]/30 text-[#0071e3] dark:text-[#47a0ff] font-bold'
                                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] border-black/[0.04] dark:border-white/[0.06] text-[#1d1d1f] dark:text-[#f5f5f7]'
                              }`}
                            >
                              {sk.name}
                            </span>
                          );
                        })}
                        {s.skills && s.skills.length > 4 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-[#86868b] font-medium">
                            +{s.skills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer / Action */}
                  <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[#86868b]">
                      {s.linkedin && (
                        <a href={s.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="hover:text-[#0071e3]">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {s.github && (
                        <a href={s.github} target="_blank" rel="noopener noreferrer" title="GitHub" className="hover:text-[#0071e3]">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {s.portfolio && (
                        <a href={s.portfolio} target="_blank" rel="noopener noreferrer" title="Portfolio" className="hover:text-[#0071e3]">
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => openProfile(s.id)}
                      className="px-4 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <span>View Profile</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── PAGINATION ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] text-xs text-[#86868b]">
        <div>Showing {seekers.length} of {total} discoverable candidates</div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-xl disabled:opacity-40 transition-all font-semibold cursor-pointer"
          >
            ← Previous
          </button>
          <span className="flex items-center px-2 text-[#86868b] font-medium">Page {page} of {totalPages || 1}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-xl disabled:opacity-40 transition-all font-semibold cursor-pointer"
          >
            Next →
          </button>
        </div>
      </div>

      {/* ─── FULL PROFILE MODAL ─────────────────────────────────────── */}
      {selectedSeeker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#5856d6] flex items-center justify-center font-bold text-xl text-white overflow-hidden shrink-0 shadow-sm">
                  {selectedSeeker.profilePhotoUrl ? (
                    <img src={selectedSeeker.profilePhotoUrl} alt={selectedSeeker.fullName} className="w-full h-full object-cover" />
                  ) : (
                    selectedSeeker.fullName.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">{selectedSeeker.fullName}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#86868b] mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#86868b]" />
                    <span>{selectedSeeker.location || 'Location Not Specified'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedSeeker(null)} className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white p-1 rounded-xl hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSeeker.bio && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">About</div>
                <p className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed bg-[#f2f2f7] dark:bg-[#2c2c2e] p-4 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                  {selectedSeeker.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Skills &amp; Competencies</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeeker.skills?.map((s: any, idx: number) => (
                  <span key={idx} className="px-3 py-1 text-xs bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] dark:text-[#47a0ff] rounded-full font-semibold">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            {selectedSeeker.experience?.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Work Experience</div>
                <div className="space-y-2">
                  {selectedSeeker.experience.map((exp: any, idx: number) => (
                    <div key={idx} className="p-4 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl space-y-1">
                      <div className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center justify-between">
                        <span>{exp.role} • <span className="text-[#0071e3]">{exp.company}</span></span>
                        {exp.current && <span className="text-[10px] text-[#248a3d] dark:text-[#30d158] bg-[#34c759]/10 px-2 py-0.5 rounded-full font-bold">Present</span>}
                      </div>
                      {exp.description && <p className="text-xs text-[#6e6e73] dark:text-[#aeaeb2] leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {selectedSeeker.education?.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Education</div>
                <div className="space-y-2">
                  {selectedSeeker.education.map((edu: any, idx: number) => (
                    <div key={idx} className="p-4 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl">
                      <div className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">{edu.degree}</div>
                      <div className="text-xs text-[#86868b]">{edu.institution}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                onClick={() => setSelectedSeeker(null)}
                className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-semibold transition-all cursor-pointer"
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
