'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '@/app/lib/axios';
import { useAuth } from '@/app/contexts/AuthContext';
import ThemeToggle from '@/app/components/ThemeToggle';
import {
  Building2,
  Search,
  Briefcase,
  MapPin,
  Clock,
  ChevronRight,
  Layers,
  ArrowRight,
  Globe,
  Users,
  X,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Sparkles,
  Video,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
  Radio,
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

interface WalkInRoomItem {
  id: string;
  title: string;
  description: string | null;
  requiredSkills: string[];
  minExperience?: string | null;
  priorityThreshold?: number;
  evaluationCriteria?: string | null;
  roomCode: string;
  livekitRoom: string;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  maxQueue: number;
  createdAt: string;
  companyId?: string;
  company: {
    id?: string;
    name: string;
    logoUrl: string | null;
    industry: string;
    isVerified?: boolean;
    verificationBadge?: string;
  };
  _count: {
    queue: number;
  };
  mySkillMatch?: number | null;
  hasApplied?: boolean;
}

export default function CompaniesDirectory() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black/10 dark:border-white/10 border-t-[#0071e3] rounded-full animate-spin" />
      </div>
    }>
      <CompaniesDirectoryContent />
    </Suspense>
  );
}

function CompaniesDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const tabQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'companies' | 'jobs' | 'walkin'>(
    tabQuery === 'walkin' ? 'walkin' : tabQuery === 'jobs' ? 'jobs' : 'companies'
  );

  useEffect(() => {
    if (tabQuery === 'walkin' || tabQuery === 'jobs' || tabQuery === 'companies') {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingWalkin, setLoadingWalkin] = useState(true);

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [walkinRooms, setWalkinRooms] = useState<WalkInRoomItem[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [walkinStatusFilter, setWalkinStatusFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Quick Room Code Lookup & Clipboard states
  const [directRoomCode, setDirectRoomCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
    loadJobs();
    loadWalkinRooms();
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
      const res = await axios.get('/public/jobs');
      if (res.data?.success) {
        setJobs(res.data.data?.jobs || res.data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadWalkinRooms = async () => {
    setLoadingWalkin(true);
    try {
      const res = await axios.get('/walkin/active-rooms');
      if (res.data?.success) {
        setWalkinRooms(res.data.rooms || []);
      }
    } catch (error) {
      console.error('Failed to load walk-in rooms:', error);
    } finally {
      setLoadingWalkin(false);
    }
  };

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  const handleCopyLink = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = typeof window !== 'undefined' ? `${window.location.origin}/walkin/${code}` : `/walkin/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(code);
    setTimeout(() => setCopiedLink(null), 2200);
  };

  const handleDirectCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = directRoomCode.trim().toUpperCase();
    if (!clean) return;
    router.push(`/walkin/${clean}`);
  };

  // Map company name to walk-in rooms
  const companyWalkinMap = useMemo(() => {
    const map: Record<string, WalkInRoomItem[]> = {};
    walkinRooms.forEach((r) => {
      const compName = r.company?.name?.toLowerCase();
      if (compName) {
        if (!map[compName]) map[compName] = [];
        map[compName].push(r);
      }
    });
    return map;
  }, [walkinRooms]);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((comp) => {
      if (verifiedOnly && !(comp.verificationBadge === 'verified' || comp.isVerified)) {
        return false;
      }
      if (industryFilter && comp.industry?.toLowerCase() !== industryFilter.toLowerCase()) {
        return false;
      }
      if (sizeFilter && comp.size !== sizeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = comp.name.toLowerCase().includes(query);
        const industryMatch = comp.industry?.toLowerCase().includes(query);
        const taglineMatch = comp.tagline?.toLowerCase().includes(query);
        return nameMatch || industryMatch || taglineMatch;
      }
      return true;
    });
  }, [companies, verifiedOnly, industryFilter, sizeFilter, searchQuery]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (verifiedOnly && job.company?.verificationBadge !== 'verified') {
        return false;
      }
      if (departmentFilter && job.department?.toLowerCase() !== departmentFilter.toLowerCase()) {
        return false;
      }
      if (jobTypeFilter && job.jobType?.toLowerCase() !== jobTypeFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = job.title.toLowerCase().includes(query);
        const companyMatch = job.company?.name?.toLowerCase().includes(query);
        const locationMatch =
          job.location?.toLowerCase().includes(query) ||
          job.locationType?.toLowerCase().includes(query);
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

  // Filtered Walk-In Rooms
  const filteredWalkinRooms = useMemo(() => {
    return walkinRooms.filter((room) => {
      if (verifiedOnly && !(room.company?.verificationBadge === 'verified' || room.company?.isVerified)) {
        return false;
      }
      if (walkinStatusFilter && room.status !== walkinStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = room.title?.toLowerCase().includes(query);
        const companyMatch = room.company?.name?.toLowerCase().includes(query);
        const descMatch = room.description?.toLowerCase().includes(query);
        const codeMatch = room.roomCode?.toLowerCase().includes(query);
        const skillsMatch =
          Array.isArray(room.requiredSkills) &&
          room.requiredSkills.some((s) => String(s).toLowerCase().includes(query));
        return titleMatch || companyMatch || descMatch || codeMatch || skillsMatch;
      }
      return true;
    });
  }, [walkinRooms, verifiedOnly, walkinStatusFilter, searchQuery]);

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
    walkinStatusFilter !== '' ||
    verifiedOnly;

  const resetFilters = () => {
    setSearchQuery('');
    setIndustryFilter('');
    setSizeFilter('');
    setDepartmentFilter('');
    setJobTypeFilter('');
    setWalkinStatusFilter('');
    setVerifiedOnly(false);
  };

  const totalVerifiedCount = useMemo(
    () => companies.filter((c) => c.verificationBadge === 'verified' || c.isVerified).length,
    [companies]
  );

  const totalWalkinCount = walkinRooms.length;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] font-sans flex flex-col transition-colors">
      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 bg-transparent border-0 cursor-pointer p-0 text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0071e3] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              EasyApply <span className="text-[#86868b] font-normal text-xs">for Seekers</span>
            </span>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`text-xs font-semibold transition-colors bg-transparent border-0 cursor-pointer ${
                activeTab === 'companies'
                  ? 'text-[#0071e3]'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Companies
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`text-xs font-semibold transition-colors bg-transparent border-0 cursor-pointer ${
                activeTab === 'jobs'
                  ? 'text-[#0071e3]'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Open Jobs
            </button>
            <button
              onClick={() => setActiveTab('walkin')}
              className={`text-xs font-semibold transition-colors bg-transparent border-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'walkin'
                  ? 'text-[#0071e3]'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Walk-In Rooms</span>
              {totalWalkinCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse" />
              )}
            </button>
          </nav>

          {/* Auth Action & Theme */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {isAuthenticated ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold transition-all shadow-[0_2px_8px_rgba(0,113,227,0.25)] cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold transition-all shadow-[0_2px_8px_rgba(0,113,227,0.25)] cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO HEADER ────────────────────────────────────────────── */}
      <section className="pt-12 pb-8 border-b border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#111112]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] text-xs font-semibold">
                <Globe className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Ecosystem Directory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Browse Companies &amp; Live Opportunities
              </h1>
              <p className="text-sm text-[#86868b] max-w-xl leading-relaxed font-medium">
                Connect with verified tech companies, join live instant walk-in video queues, and apply directly to active positions.
              </p>
            </div>

            {/* Metric Stats Pills */}
            <div className="flex items-center gap-3 flex-wrap">
              <div
                onClick={() => setActiveTab('companies')}
                className={`bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs cursor-pointer hover:border-black/[0.15] dark:hover:border-white/[0.2] transition ${
                  activeTab === 'companies' ? 'ring-2 ring-[#0071e3]/30' : ''
                }`}
              >
                <Building2 className="w-4 h-4 text-[#0071e3]" />
                <div>
                  <div className="text-sm font-bold text-[#1d1d1f] dark:text-white">{companies.length}</div>
                  <div className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold">Companies</div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('jobs')}
                className={`bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs cursor-pointer hover:border-black/[0.15] dark:hover:border-white/[0.2] transition ${
                  activeTab === 'jobs' ? 'ring-2 ring-[#af52de]/30' : ''
                }`}
              >
                <Briefcase className="w-4 h-4 text-[#af52de]" />
                <div>
                  <div className="text-sm font-bold text-[#1d1d1f] dark:text-white">{jobs.length}</div>
                  <div className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold">Live Positions</div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('walkin')}
                className={`bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs cursor-pointer hover:border-black/[0.15] dark:hover:border-white/[0.2] transition ${
                  activeTab === 'walkin' ? 'ring-2 ring-[#34c759]/30' : ''
                }`}
              >
                <Video className="w-4 h-4 text-[#34c759]" />
                <div>
                  <div className="text-sm font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
                    <span>{totalWalkinCount}</span>
                    {totalWalkinCount > 0 && <span className="w-2 h-2 rounded-full bg-[#34c759] animate-pulse" />}
                  </div>
                  <div className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold">Walk-In Rooms</div>
                </div>
              </div>

              <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#34c759]" />
                <div>
                  <div className="text-sm font-bold text-[#1d1d1f] dark:text-white">{totalVerifiedCount}</div>
                  <div className="text-[10px] text-[#86868b] uppercase tracking-wider font-semibold">Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Triple Tabs & Search Container */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            {/* Segmented Control Tabs */}
            <div className="inline-flex p-1 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setActiveTab('companies')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'companies'
                    ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Companies</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'companies'
                      ? 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white'
                      : 'bg-black/[0.04] dark:bg-white/[0.04] text-[#86868b]'
                  }`}
                >
                  {filteredCompanies.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'jobs'
                    ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Job Openings</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'jobs'
                      ? 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white'
                      : 'bg-black/[0.04] dark:bg-white/[0.04] text-[#86868b]'
                  }`}
                >
                  {filteredJobs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('walkin')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'walkin'
                    ? 'bg-white dark:bg-[#1c1c1e] text-[#0071e3] shadow-xs'
                    : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>Walk-In Rooms</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'walkin'
                      ? 'bg-[#0071e3]/10 text-[#0071e3]'
                      : 'bg-black/[0.04] dark:bg-white/[0.04] text-[#86868b]'
                  }`}
                >
                  {filteredWalkinRooms.length}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <input
                type="text"
                placeholder={
                  activeTab === 'companies'
                    ? 'Search companies by name, industry...'
                    : activeTab === 'jobs'
                    ? 'Search jobs by title, company, skills...'
                    : 'Search walk-in rooms, role, skills, or room code...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3] rounded-2xl text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-transparent border-0 cursor-pointer p-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER TOOLBAR ─────────────────────────────────────────── */}
      <section className="border-b border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-[#161617]/50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'companies' ? (
              <>
                {/* Industry Filter */}
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition cursor-pointer font-medium"
                >
                  <option value="">All Industries</option>
                  {uniqueIndustries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>

                {/* Size Filter */}
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition cursor-pointer font-medium"
                >
                  <option value="">All Sizes</option>
                  {uniqueCompanySizes.map((size) => (
                    <option key={size} value={size}>
                      {size} employees
                    </option>
                  ))}
                </select>
              </>
            ) : activeTab === 'jobs' ? (
              <>
                {/* Department Filter */}
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition cursor-pointer font-medium"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                {/* Job Type Filter */}
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition cursor-pointer font-medium"
                >
                  <option value="">All Arrangements</option>
                  {uniqueJobTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                {/* Walk-In Status Filter */}
                <select
                  value={walkinStatusFilter}
                  onChange={(e) => setWalkinStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition cursor-pointer font-medium"
                >
                  <option value="">All Room Statuses</option>
                  <option value="OPEN">Open (Accepting Queue)</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </>
            )}

            {/* Verified Only Checkbox */}
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer select-none transition font-medium">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#0071e3] focus:ring-0 cursor-pointer"
              />
              <span>Verified only</span>
            </label>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#ff3b30] bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-xl transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-[#86868b] font-medium">
            Showing{' '}
            <span className="text-[#1d1d1f] dark:text-white font-bold">
              {activeTab === 'companies'
                ? filteredCompanies.length
                : activeTab === 'jobs'
                ? filteredJobs.length
                : filteredWalkinRooms.length}
            </span>{' '}
            results
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {activeTab === 'companies' ? (
          /* ── COMPANIES TAB CONTENT ─────────────────────────────────── */
          <div>
            {loadingCompanies ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 flex flex-col gap-4 animate-pulse border border-black/[0.06] dark:border-white/[0.08] shadow-xs"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded w-3/4" />
                        <div className="h-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-10 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-xl" />
                    <div className="h-4 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded w-1/3 mt-auto" />
                  </div>
                ))}
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCompanies.map((comp) => {
                  const isVerified = comp.verificationBadge === 'verified' || comp.isVerified;
                  const activeJobs = comp.activeJobsCount ?? 0;
                  const companyWalkins = companyWalkinMap[comp.name.toLowerCase()] || [];
                  const hasLiveWalkin = companyWalkins.length > 0;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => router.push(`/careers/${comp.id}`)}
                      className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 flex flex-col justify-between group cursor-pointer border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.2] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-200"
                    >
                      <div>
                        {/* Company Card Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] p-2 flex items-center justify-center shrink-0 overflow-hidden">
                            {comp.logoUrl ? (
                              <img
                                src={comp.logoUrl}
                                alt={comp.name}
                                className="w-full h-full object-contain rounded-xl"
                              />
                            ) : (
                              <Building2 className="w-6 h-6 text-[#0071e3]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors truncate">
                                {comp.name}
                              </h3>
                              {isVerified && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34c759]/10 border border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Verified</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-xs text-[#86868b] font-medium">
                              <span>{comp.industry || 'Technology'}</span>
                              {comp.size && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-[#86868b]" />
                                    {comp.size}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Live Walk-In Badge if present */}
                        {hasLiveWalkin && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('walkin');
                              setSearchQuery(comp.name);
                            }}
                            className="mb-3 px-3 py-1.5 bg-[#0071e3]/10 hover:bg-[#0071e3]/15 border border-[#0071e3]/20 rounded-xl flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#0071e3]">
                              <Zap className="w-3.5 h-3.5 fill-[#0071e3]" />
                              <span>{companyWalkins.length} Live Walk-In {companyWalkins.length === 1 ? 'Room' : 'Rooms'}</span>
                            </span>
                            <span className="text-[10px] text-[#0071e3] font-semibold flex items-center gap-0.5">
                              <span>Join Now</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}

                        {/* Tagline */}
                        <p className="text-xs text-[#86868b] font-medium line-clamp-2 leading-relaxed mb-6">
                          {comp.tagline || 'Leading engineering team hiring top talent on EasyApply.'}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                          {activeJobs > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-[#248a3d] dark:text-[#30d158]">
                              <span className="w-2 h-2 rounded-full bg-[#34c759]" />
                              {activeJobs} {activeJobs === 1 ? 'Job' : 'Jobs'} Available
                            </span>
                          ) : (
                            <span className="text-[#86868b]">Profile Open</span>
                          )}
                        </div>

                        <div className="inline-flex items-center gap-1 text-xs font-bold text-[#0071e3] group-hover:translate-x-0.5 transition-transform">
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
              <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center mx-auto mb-4 text-[#86868b]">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-1">No Companies Match Filters</h3>
                <p className="text-xs text-[#86868b] font-medium mb-6 leading-relaxed">
                  No registered companies found with the specified criteria. Try clearing search keywords or filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0071e3] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'jobs' ? (
          /* ── JOBS TAB CONTENT ─────────────────────────────────────── */
          <div>
            {loadingJobs ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 flex flex-col md:flex-row gap-5 animate-pulse border border-black/[0.06] dark:border-white/[0.08] shadow-xs"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded w-1/3" />
                      <div className="h-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="space-y-3.5">
                {filteredJobs.map((job) => {
                  const companyId = job.company?.id || job.companyId;

                  return (
                    <div
                      key={job.id}
                      onClick={() => router.push(`/careers/${companyId}/jobs/${job.id}`)}
                      className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 group cursor-pointer border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.2] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-200"
                    >
                      {/* Job Info Section */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Company Logo */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/careers/${companyId}`);
                          }}
                          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] p-2 flex items-center justify-center shrink-0 overflow-hidden"
                          title="View Company Hub"
                        >
                          {job.company?.logoUrl ? (
                            <img
                              src={job.company.logoUrl}
                              alt={job.company.name}
                              className="w-full h-full object-contain rounded-xl"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-[#0071e3]" />
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors truncate">
                              {job.title}
                            </h3>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/careers/${companyId}`);
                              }}
                              className="text-[11px] text-[#0071e3] font-semibold bg-[#0071e3]/10 hover:bg-[#0071e3]/15 px-2.5 py-0.5 rounded-full border border-[#0071e3]/20 transition cursor-pointer"
                            >
                              {job.company?.name || 'Company'}
                            </button>

                            {job.company?.verificationBadge === 'verified' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34c759]/10 border border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>

                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#86868b] font-medium">
                            {job.department && (
                              <span className="text-[#1d1d1f] dark:text-white font-semibold">{job.department}</span>
                            )}
                            <span className="text-black/20 dark:text-white/20">•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#86868b]" />
                              {job.location || job.locationType || 'Remote'}
                            </span>
                            {job.experienceRequired && (
                              <>
                                <span className="text-black/20 dark:text-white/20">•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#86868b]" />
                                  {job.experienceRequired}
                                </span>
                              </>
                            )}
                            {job.salaryRange && (
                              <>
                                <span className="text-black/20 dark:text-white/20">•</span>
                                <span className="flex items-center gap-1 text-[#248a3d] dark:text-[#30d158] font-bold">
                                  <span>{job.salaryRange}</span>
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
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-full text-[10px] text-[#1d1d1f] dark:text-[#f5f5f7] font-medium"
                                >
                                  <Tag className="w-2.5 h-2.5 text-[#86868b]" />
                                  {skill}
                                </span>
                              ))}
                              {job.requiredSkills.length > 6 && (
                                <span className="text-[10px] text-[#86868b] font-medium self-center">
                                  +{job.requiredSkills.length - 6} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action Section */}
                      <div className="flex items-center justify-between md:justify-end gap-4 border-t border-black/[0.06] dark:border-white/[0.08] md:border-t-0 pt-3 md:pt-0 shrink-0">
                        <div className="flex flex-col items-start md:items-end gap-1">
                          <span className="px-2.5 py-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1d1d1f] dark:text-white text-[10px] font-bold uppercase tracking-wider">
                            {job.jobType}
                          </span>
                          {job.deadline && (
                            <span className="text-[10px] text-[#86868b] font-medium">
                              Until: {new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        <div className="w-9 h-9 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#86868b] group-hover:text-[#0071e3] transition-colors">
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State for Jobs */
              <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center mx-auto mb-4 text-[#86868b]">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-1">No Active Positions Match</h3>
                <p className="text-xs text-[#86868b] font-medium mb-6 leading-relaxed">
                  No job openings match the selected filters. Try broadening your search or resetting filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0071e3] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── WALK-IN ROOMS TAB CONTENT ───────────────────────────── */
          <div className="space-y-6">
            {/* Quick Room Code Box Card */}
            <div className="bg-gradient-to-r from-blue-900/10 via-[#0071e3]/5 to-purple-900/10 dark:from-blue-950/30 dark:via-[#1c1c1e] dark:to-purple-950/30 border border-[#0071e3]/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] text-xs font-bold">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-[#34c759]" />
                  <span>Instant Walk-In Evaluation</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                  Queue Live, Interview Fast
                </h2>
                <p className="text-xs sm:text-sm text-[#86868b] font-medium leading-relaxed">
                  Skip traditional applications. Enter any private walk-in room code or select an open room below to join live video evaluation queues.
                </p>
              </div>

              {/* Enter Room Code Form */}
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl p-4 sm:p-5 w-full md:w-84 shrink-0 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1d1d1f] dark:text-white mb-2.5">
                  <KeyRound className="w-4 h-4 text-[#0071e3]" />
                  <span>Have a Private Room Code?</span>
                </div>
                <form onSubmit={handleDirectCodeSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. FMPZZ3"
                    maxLength={10}
                    value={directRoomCode}
                    onChange={(e) => setDirectRoomCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3] rounded-xl px-3 py-2 text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] font-mono font-bold uppercase tracking-wider outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!directRoomCode.trim()}
                    className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 transition shadow-xs cursor-pointer"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Walk-in Room Cards Grid */}
            {loadingWalkin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 flex flex-col gap-4 animate-pulse border border-black/[0.06] dark:border-white/[0.08] shadow-xs"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded w-3/4" />
                        <div className="h-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-10 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-xl" />
                    <div className="h-8 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-xl mt-auto" />
                  </div>
                ))}
              </div>
            ) : filteredWalkinRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredWalkinRooms.map((room) => {
                  const isOpen = room.status === 'OPEN';
                  const isPaused = room.status === 'PAUSED';
                  const isCopied = copiedCode === room.roomCode;
                  const isLinkCopied = copiedLink === room.roomCode;

                  return (
                    <div
                      key={room.id}
                      onClick={() => router.push(`/walkin/${room.roomCode}`)}
                      className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 flex flex-col justify-between group cursor-pointer border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.2] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] transition-all duration-200"
                    >
                      <div className="space-y-4">
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] p-2 flex items-center justify-center shrink-0 overflow-hidden">
                              {room.company?.logoUrl ? (
                                <img
                                  src={room.company.logoUrl}
                                  alt={room.company.name}
                                  className="w-full h-full object-contain rounded-xl"
                                />
                              ) : (
                                <Building2 className="w-6 h-6 text-[#0071e3]" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">
                                  {room.company?.name}
                                </span>
                                {(room.company?.verificationBadge === 'verified' || room.company?.isVerified) && (
                                  <span className="inline-flex items-center text-[#34c759]">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#86868b] font-medium">
                                {room.company?.industry || 'Technology'}
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isOpen
                                ? 'bg-[#34c759]/10 border border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158]'
                                : 'bg-[#ff9500]/10 border border-[#ff9500]/20 text-[#ff9500]'
                            }`}
                          >
                            {room.status}
                          </span>
                        </div>

                        {/* Room Title & Description */}
                        <div>
                          <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors">
                            {room.title}
                          </h3>
                          {room.description && (
                            <p className="text-xs text-[#86868b] font-medium line-clamp-2 leading-relaxed mt-1">
                              {room.description}
                            </p>
                          )}
                        </div>

                        {/* Skills Chips */}
                        {Array.isArray(room.requiredSkills) && room.requiredSkills.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">
                              Required Skills
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {room.requiredSkills.slice(0, 5).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-0.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-full text-[10px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]"
                                >
                                  {skill}
                                </span>
                              ))}
                              {room.requiredSkills.length > 5 && (
                                <span className="text-[10px] text-[#86868b] font-medium self-center">
                                  +{room.requiredSkills.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer & Code Copy Actions */}
                      <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-3 mt-4">
                        {/* Queue Info & Room Code Bar */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-[#86868b] font-medium">
                            <Users className="w-3.5 h-3.5" />
                            <span>
                              Queue: <strong className="text-[#1d1d1f] dark:text-white">{room._count?.queue ?? 0}</strong> / {room.maxQueue}
                            </span>
                          </span>

                          {/* Room Code Badge with Copy Button */}
                          <div className="flex items-center gap-1.5">
                            <div
                              onClick={(e) => handleCopyCode(room.roomCode, e)}
                              className={`px-2 py-1 rounded-lg border font-mono font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                                isCopied
                                  ? 'bg-[#34c759]/15 border-[#34c759]/40 text-[#248a3d] dark:text-[#30d158]'
                                  : 'bg-[#0071e3]/10 hover:bg-[#0071e3]/15 border-[#0071e3]/20 text-[#0071e3]'
                              }`}
                              title="Click to copy Room Code"
                            >
                              <span>{room.roomCode}</span>
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-[#34c759]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </div>

                            {/* Copy direct link button */}
                            <button
                              onClick={(e) => handleCopyLink(room.roomCode, e)}
                              className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                                isLinkCopied
                                  ? 'bg-[#34c759]/15 border-[#34c759]/40 text-[#248a3d] dark:text-[#30d158]'
                                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-black/[0.06] dark:border-white/[0.08] text-[#86868b]'
                              }`}
                              title="Copy Direct Link to Room"
                            >
                              {isLinkCopied ? (
                                <Check className="w-3.5 h-3.5 text-[#34c759]" />
                              ) : (
                                <ExternalLink className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Join / Access Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/walkin/${room.roomCode}`);
                          }}
                          disabled={isPaused}
                          className={`w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                            isOpen
                              ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-[0_2px_8px_rgba(0,113,227,0.25)]'
                              : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#ff9500] border border-black/[0.04] dark:border-white/[0.06] cursor-not-allowed'
                          }`}
                        >
                          {isOpen ? (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Walk-In Queue</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <span>Room Temporarily Paused</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State for Walk-In Rooms */
              <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center mx-auto mb-4 text-[#86868b]">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white mb-1">
                  No Walk-In Rooms Found
                </h3>
                <p className="text-xs text-[#86868b] font-medium mb-6 leading-relaxed">
                  No active walk-in interview rooms match your search criteria. Check back soon or enter a private room code above.
                </p>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0071e3] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#111112] mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#0071e3] flex items-center justify-center text-white">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">EasyApply Ecosystem</span>
          </div>
          <p className="text-xs text-[#86868b] font-medium">© 2026 EasyApply. Connecting ambitious talent with world-class teams.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="text-xs text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-transparent border-0 cursor-pointer font-medium"
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className="text-xs text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-transparent border-0 cursor-pointer font-medium"
            >
              Companies
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className="text-xs text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-transparent border-0 cursor-pointer font-medium"
            >
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('walkin')}
              className="text-xs text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-transparent border-0 cursor-pointer font-medium"
            >
              Walk-In
            </button>
            <button
              onClick={() => router.push('/login')}
              className="text-xs text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-transparent border-0 cursor-pointer font-medium"
            >
              Seeker Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}