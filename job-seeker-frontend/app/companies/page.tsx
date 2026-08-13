'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/app/lib/axios';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Building2,
  Search,
  CheckCircle,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  Layers,
  Tag,
  Sparkles,
  ArrowRight,
  Globe,
  Users,
  Filter,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface CompanyItem {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string;
  size: string;
  tagline: string | null;
  isVerified?: boolean;
  verificationBadge: string;
  activeJobsCount?: number;
}

interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  department: string | null;
  description: string;
  jobType: string;
  locationType: string | null;
  location: string | null;
  experienceRequired: string | null;
  requiredSkills: string[] | any;
  salaryRange: string | null;
  deadline: string | null;
  status: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
    industry: string;
    size: string;
    verificationBadge: string;
  };
  _count?: {
    applications: number;
  };
}

export default function CompaniesDirectory() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'companies' | 'jobs'>('companies');
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadJobs();
  }, []);

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const res = await axios.get('/public/companies');
      if (res.data?.success) {
        setCompanies(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await axios.get('/public/public');
      if (res.data?.success) {
        setJobs(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (verifiedOnly && c.verificationBadge !== 'verified' && !c.isVerified) {
        return false;
      }
      if (industryFilter && c.industry.toLowerCase() !== industryFilter.toLowerCase()) {
        return false;
      }
      if (sizeFilter && c.size !== sizeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(query);
        const matchIndustry = c.industry?.toLowerCase().includes(query);
        const matchTagline = c.tagline?.toLowerCase().includes(query);
        return matchName || matchIndustry || matchTagline;
      }
      return true;
    });
  }, [companies, verifiedOnly, industryFilter, sizeFilter, searchQuery]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    const now = new Date();
    return jobs.filter((job) => {
      // 1. Deadline check
      if (job.deadline && new Date(job.deadline) < now) {
        return false;
      }
      // 2. Verified check
      if (verifiedOnly && job.company?.verificationBadge !== 'verified') {
        return false;
      }
      // 3. Department filter
      if (departmentFilter && job.department !== departmentFilter) {
        return false;
      }
      // 4. Job type filter
      if (jobTypeFilter && job.jobType !== jobTypeFilter) {
        return false;
      }
      // 5. Keyword search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = job.title?.toLowerCase().includes(query);
        const companyMatch = job.company?.name?.toLowerCase().includes(query);
        const locationMatch = job.location?.toLowerCase().includes(query);
        const deptMatch = job.department?.toLowerCase().includes(query);
        let skillsMatch = false;
        if (Array.isArray(job.requiredSkills)) {
          skillsMatch = job.requiredSkills.some((s) =>
            String(s).toLowerCase().includes(query)
          );
        }
        return titleMatch || companyMatch || locationMatch || deptMatch || skillsMatch;
      }
      return true;
    });
  }, [jobs, verifiedOnly, departmentFilter, jobTypeFilter, searchQuery]);

  // Unique options for filter dropdowns
  const uniqueIndustries = useMemo(
    () => [...new Set(companies.map((c) => c.industry).filter(Boolean))],
    [companies]
  );
  const uniqueCompanySizes = useMemo(
    () => [...new Set(companies.map((c) => c.size).filter(Boolean))],
    [companies]
  );
  const uniqueDepartments = useMemo(
    () => [...new Set(jobs.map((j) => j.department).filter(Boolean) as string[])],
    [jobs]
  );
  const uniqueJobTypes = useMemo(
    () => [...new Set(jobs.map((j) => j.jobType).filter(Boolean))],
    [jobs]
  );

  const hasActiveFilters =
    searchQuery !== '' ||
    industryFilter !== '' ||
    sizeFilter !== '' ||
    departmentFilter !== '' ||
    jobTypeFilter !== '' ||
    verifiedOnly;

  const resetFilters = () => {
    setSearchQuery('');
    setIndustryFilter('');
    setSizeFilter('');
    setDepartmentFilter('');
    setJobTypeFilter('');
    setVerifiedOnly(false);
  };

  const totalVerifiedCount = useMemo(
    () => companies.filter((c) => c.verificationBadge === 'verified' || c.isVerified).length,
    [companies]
  );

  return (
    <div className="min-h-screen bg-[#020409] text-white font-sans overflow-x-hidden relative flex flex-col">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[35%] left-[-150px] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[60%] right-[-150px] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-white/[0.06]"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(2,4,9,0.85)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 bg-transparent border-0 cursor-pointer p-0 text-left"
          >
            <div
              className="relative w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 0 20px rgba(99,102,241,0.4)',
              }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              EasyApply <span className="text-blue-400 font-normal">for Seekers</span>
            </span>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="text-xs font-medium cursor-pointer transition-colors duration-200 bg-transparent border-0 text-white/50 hover:text-white"
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`text-xs font-medium cursor-pointer transition-colors duration-200 bg-transparent border-0 ${
                activeTab === 'companies' ? 'text-white font-semibold' : 'text-white/50 hover:text-white'
              }`}
            >
              Companies
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`text-xs font-medium cursor-pointer transition-colors duration-200 bg-transparent border-0 ${
                activeTab === 'jobs' ? 'text-white font-semibold' : 'text-white/50 hover:text-white'
              }`}
            >
              Open Jobs
            </button>
          </nav>

          {/* Auth Action */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                }}
              >
                Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                }}
              >
                Sign In
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO HEADER ────────────────────────────────────────────── */}
      <section className="relative z-10 pt-12 pb-8 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-medium badge">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Ecosystem Directory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
                <span className="gradient-text">Browse Companies</span>{' '}
                <span className="gradient-text-blue">& Open Roles</span>
              </h1>
              <p className="text-sm text-white/50 max-w-xl leading-relaxed">
                Connect with verified tech companies, explore company cultures, and apply directly to live technical positions.
              </p>
            </div>

            {/* Metric Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="glass-card rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <Building2 className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-sm font-bold text-white">{companies.length}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Companies</div>
                </div>
              </div>
              <div className="glass-card rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-violet-400" />
                <div>
                  <div className="text-sm font-bold text-white">{jobs.length}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Live Positions</div>
                </div>
              </div>
              <div className="glass-card rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-sm font-bold text-white">{totalVerifiedCount}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dual Tabs & Search Container */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="inline-flex p-1 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              <button
                onClick={() => setActiveTab('companies')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'companies'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Companies</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    activeTab === 'companies' ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-white/40'
                  }`}
                >
                  {filteredCompanies.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'jobs'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Job Openings</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-white/40'
                  }`}
                >
                  {filteredJobs.length}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder={
                  activeTab === 'companies'
                    ? 'Search companies by name, industry, or keywords...'
                    : 'Search jobs by title, company, skills, or location...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/[0.08] focus:border-indigo-500/50 rounded-2xl text-xs text-white placeholder-white/40 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white bg-transparent border-0 cursor-pointer p-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER TOOLBAR ─────────────────────────────────────────── */}
      <section className="relative z-10 border-b border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'companies' ? (
              <>
                {/* Industry Filter */}
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-xs text-white/80 focus:outline-none transition"
                >
                  <option value="" className="bg-[#090d16] text-white">All Industries</option>
                  {uniqueIndustries.map((ind) => (
                    <option key={ind} value={ind} className="bg-[#090d16] text-white">
                      {ind}
                    </option>
                  ))}
                </select>

                {/* Size Filter */}
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-xs text-white/80 focus:outline-none transition"
                >
                  <option value="" className="bg-[#090d16] text-white">All Sizes</option>
                  {uniqueCompanySizes.map((size) => (
                    <option key={size} value={size} className="bg-[#090d16] text-white">
                      {size} employees
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                {/* Department Filter */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-xs text-white/80 focus:outline-none transition"
                >
                  <option value="" className="bg-[#090d16] text-white">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#090d16] text-white">
                      {dept}
                    </option>
                  ))}
                </select>

                {/* Job Type Filter */}
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-xs text-white/80 focus:outline-none transition"
                >
                  <option value="" className="bg-[#090d16] text-white">All Arrangements</option>
                  {uniqueJobTypes.map((type) => (
                    <option key={type} value={type} className="bg-[#090d16] text-white">
                      {type}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Verified Only Checkbox */}
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-xl text-xs text-white/70 hover:text-white cursor-pointer select-none transition">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-zinc-900 border-white/20 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Verified only</span>
            </label>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="text-xs text-white/40 font-medium">
            Showing{' '}
            <span className="text-white font-semibold">
              {activeTab === 'companies' ? filteredCompanies.length : filteredJobs.length}
            </span>{' '}
            {activeTab === 'companies' ? 'companies' : 'open positions'}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 py-10 w-full">
        {activeTab === 'companies' ? (
          /* ── COMPANIES TAB CONTENT ─────────────────────────────────── */
          <div>
            {loadingCompanies ? (
              /* Loading Skeletons for Companies */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="glass-card rounded-3xl p-6 flex flex-col gap-4 animate-pulse border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.05]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/[0.08] rounded w-3/4" />
                        <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-10 bg-white/[0.03] rounded-xl" />
                    <div className="h-4 bg-white/[0.05] rounded w-1/3 mt-auto" />
                  </div>
                ))}
              </div>
            ) : filteredCompanies.length > 0 ? (
              /* Companies Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCompanies.map((comp) => {
                  const isVerified = comp.verificationBadge === 'verified' || comp.isVerified;
                  const activeJobs = comp.activeJobsCount ?? 0;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => router.push(`/careers/${comp.id}`)}
                      className="glass-card rounded-3xl p-6 flex flex-col justify-between group cursor-pointer border border-white/[0.08] hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Top Accent Line */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500 transition-all duration-500" />

                      <div>
                        {/* Company Card Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] group-hover:border-white/20 p-2 flex items-center justify-center flex-shrink-0 overflow-hidden transition">
                            {comp.logoUrl ? (
                              <img
                                src={comp.logoUrl}
                                alt={comp.name}
                                className="w-full h-full object-contain rounded-xl"
                              />
                            ) : (
                              <Building2 className="w-7 h-7 text-white/40 group-hover:text-blue-400 transition" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                                {comp.name}
                              </h3>
                              {isVerified && (
                                <div
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                  style={{
                                    background: 'rgba(16,185,129,0.12)',
                                    border: '1px solid rgba(16,185,129,0.25)',
                                    color: '#34d399',
                                  }}
                                  title="Verified Employer"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Verified</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                              <span>{comp.industry || 'Technology'}</span>
                              {comp.size && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3 opacity-60" />
                                    {comp.size}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tagline */}
                        <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mb-6">
                          {comp.tagline || 'Leading engineering team hiring top talent on EasyApply.'}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium">
                          {activeJobs > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              {activeJobs} {activeJobs === 1 ? 'Job' : 'Jobs'} Available
                            </span>
                          ) : (
                            <span className="text-white/40">Profile Open</span>
                          )}
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-blue-300 group-hover:translate-x-1 transition-all">
                          <span>View Hub</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State for Companies */
              <div className="glass-card rounded-3xl p-12 text-center max-w-lg mx-auto my-12 border border-dashed border-white/[0.1]">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 text-white/40">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">No Companies Match Filters</h3>
                <p className="text-xs text-white/40 mb-6 leading-relaxed">
                  We couldn't find any registered companies matching your current filter criteria. Try adjusting keywords or clearing filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── JOBS TAB CONTENT ─────────────────────────────────────── */
          <div>
            {loadingJobs ? (
              /* Loading Skeletons for Jobs */
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="glass-card rounded-2xl p-5 flex flex-col md:flex-row gap-5 animate-pulse border border-white/[0.06]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/[0.08] rounded w-1/3" />
                      <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              /* Stacked Job Cards */
              <div className="space-y-3.5">
                {filteredJobs.map((job) => {
                  const companyId = job.company?.id || job.companyId;

                  return (
                    <div
                      key={job.id}
                      onClick={() => router.push(`/careers/${companyId}/jobs/${job.id}`)}
                      className="glass-card rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group cursor-pointer border border-white/[0.08] hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Left Subtle Highlight Accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-transparent group-hover:bg-indigo-500 transition-colors" />

                      {/* Job Info Section */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Company Logo (clickable directly to company career hub) */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/careers/${companyId}`);
                          }}
                          className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/[0.04] border border-white/[0.08] group-hover:border-white/20 p-2 flex items-center justify-center flex-shrink-0 overflow-hidden transition"
                          title="View Company Hub"
                        >
                          {job.company?.logoUrl ? (
                            <img
                              src={job.company.logoUrl}
                              alt={job.company.name}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-white/40 group-hover:text-blue-400 transition" />
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                              {job.title}
                            </h3>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/careers/${companyId}`);
                              }}
                              className="text-[11px] text-white/60 font-semibold bg-white/[0.04] hover:bg-white/[0.08] hover:text-white px-2 py-0.5 rounded-md border border-white/[0.08] transition"
                            >
                              {job.company?.name || 'Company'}
                            </button>

                            {job.company?.verificationBadge === 'verified' && (
                              <div
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                style={{
                                  background: 'rgba(16,185,129,0.12)',
                                  border: '1px solid rgba(16,185,129,0.25)',
                                  color: '#34d399',
                                }}
                              >
                                <CheckCircle className="w-2.5 h-2.5" />
                                <span>Verified</span>
                              </div>
                            )}
                          </div>

                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
                            {job.department && (
                              <span className="text-white/70 font-medium">{job.department}</span>
                            )}
                            <span className="text-white/20">•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-white/40" />
                              {job.location || job.locationType || 'Remote'}
                            </span>
                            {job.experienceRequired && (
                              <>
                                <span className="text-white/20">•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-white/40" />
                                  {job.experienceRequired}
                                </span>
                              </>
                            )}
                            {job.salaryRange && (
                              <>
                                <span className="text-white/20">•</span>
                                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                  <DollarSign className="w-3 h-3" />
                                  {job.salaryRange}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Skills chips */}
                          {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {job.requiredSkills.slice(0, 6).map((skill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded-md text-[10px] text-white/60 font-mono"
                                >
                                  <Tag className="w-2.5 h-2.5 text-white/30" />
                                  {skill}
                                </span>
                              ))}
                              {job.requiredSkills.length > 6 && (
                                <span className="text-[10px] text-white/40 self-center">
                                  +{job.requiredSkills.length - 6} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action Section */}
                      <div className="flex items-center justify-between md:justify-end gap-5 border-t border-white/[0.04] md:border-t-0 pt-3 md:pt-0 flex-shrink-0">
                        <div className="flex flex-col items-start md:items-end gap-1">
                          <span className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/80 text-[10px] font-bold tracking-wider uppercase">
                            {job.jobType}
                          </span>
                          {job.deadline && (
                            <span className="text-[10px] text-white/40">
                              Until:{' '}
                              {new Date(job.deadline).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-indigo-600/30 group-hover:border-indigo-500/50 transition-all shadow-inner">
                          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State for Jobs */
              <div className="glass-card rounded-3xl p-12 text-center max-w-lg mx-auto my-12 border border-dashed border-white/[0.1]">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-4 text-white/40">
                  <Layers className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">No Active Positions Match</h3>
                <p className="text-xs text-white/40 mb-6 leading-relaxed">
                  There are currently no job openings matching your filter criteria. Try resetting keywords or broadening filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-8 border-t border-white/[0.06] mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-white/50">EasyApply Ecosystem</span>
          </div>
          <p className="text-xs text-white/30">© 2026 EasyApply. Connecting ambitious talent with world-class teams.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="text-xs text-white/40 hover:text-white bg-transparent border-0 cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => router.push('/login')}
              className="text-xs text-white/40 hover:text-white bg-transparent border-0 cursor-pointer"
            >
              Seeker Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}