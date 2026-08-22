// app/dashboard/jobs/page.tsx
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign,
  Building2,
  ChevronRight,
  CheckCircle2,
  Upload,
  FileText,
  X,
  AlertCircle,
  Globe,
  Lock,
  ShieldAlert,
  Bookmark
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { toggleSaveJob, getSavedJobs, getSavedJobIds } from '@/app/lib/jobApi';

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useGlassToast();

  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    locationType: 'all',
    location: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true); 

  // Initialize tab from query param if available
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'saved') {
      setActiveTab('saved');
    } else {
      setActiveTab('all');
    }
  }, [searchParams]);

  const switchTab = (tab: 'all' | 'saved') => {
    setActiveTab(tab);
    setPage(1);
    setSearchQuery('');
    if (tab === 'saved') {
      router.push('/dashboard/jobs?tab=saved');
    } else {
      router.push('/dashboard/jobs?tab=all');
    }
  };

  // Fetch saved job IDs on mount
  const fetchSavedJobIds = useCallback(async () => {
    try {
      const res = await getSavedJobIds();
      if (res?.success && Array.isArray(res.savedJobIds)) {
        setSavedJobIds(new Set(res.savedJobIds));
      }
    } catch (e) {
      console.error('Failed to load saved job IDs:', e);
    }
  }, []);

  const [appliedJobMap, setAppliedJobMap] = useState<Map<string, string>>(new Map());

  // Fetch applied job IDs on mount
  const fetchAppliedJobs = useCallback(async () => {
    try {
      const res = await api.get('/jobseeker/applications');
      if (res.data.success && Array.isArray(res.data.data)) {
        const map = new Map<string, string>();
        res.data.data.forEach((app: any) => {
          const jobId = app.jobPostingId || app.jobId || app.jobDetails?.id;
          if (jobId) {
            map.set(jobId, app.status || app.currentStage || 'applied');
          }
        });
        setAppliedJobMap(map);
      }
    } catch (e) {
      console.error('Failed to load applied job IDs:', e);
    }
  }, []);

  useEffect(() => {
    fetchSavedJobIds();
    fetchAppliedJobs();
  }, [fetchSavedJobIds, fetchAppliedJobs]);

  // Fetch data when activeTab, page, drop-down filters, or location string changes
  useEffect(() => {
    fetchJobs();
  }, [activeTab, page, filters]);

  // Fetch data when user stops writing or clears the search query input box
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchJobs();
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === 'saved') {
        const res = await getSavedJobs({
          page,
          limit: 12,
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
        });

        if (res?.success) {
          setIsAuthenticated(true);
          setJobs(res.data || []);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } else {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '12',
          ...(searchQuery.trim() && { search: searchQuery.trim() }),
          ...(filters.jobType !== 'all' && { jobType: filters.jobType }),
          ...(filters.locationType !== 'all' && { locationType: filters.locationType }),
          ...(filters.location.trim() && { location: filters.location.trim() }),
        });

        const response = await api.get(`/public/search?${params}`);
        
        if (response.data.success) {
          setIsAuthenticated(true);
          setJobs(response.data.data);
          setTotalPages(response.data.pagination?.totalPages || 1);
        }
      }
    } catch (error: any) {
      console.error('Error fetching positions:', error);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        showToast('Authentication Required', 'Please sign in to view jobs', 'info');
        router.push('/login?redirect=/dashboard/jobs');
      } else {
        showToast('Error', 'Failed to retrieve job database indices.', 'danger');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = async (job: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isCurrentlySaved = savedJobIds.has(job.id);

    // Optimistic UI state update
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) {
        next.delete(job.id);
      } else {
        next.add(job.id);
      }
      return next;
    });

    try {
      const res = await toggleSaveJob(job.id);
      if (res?.success) {
        showToast(
          res.isSaved ? 'Job Saved' : 'Removed from Saved',
          res.isSaved ? `"${job.title}" bookmarked.` : `"${job.title}" removed from bookmarks.`,
          'success'
        );

        if (activeTab === 'saved' && !res.isSaved) {
          setJobs((prev) => prev.filter((j) => j.id !== job.id));
        }
        fetchSavedJobIds();
      }
    } catch (err: any) {
      // Rollback on error
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.add(job.id);
        } else {
          next.delete(job.id);
        }
        return next;
      });
      showToast('Error', err.response?.data?.message || 'Failed to update saved job status', 'danger');
    }
  };

  const handleApplyClick = (job: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    if (selectedJob?.id) {
      setAppliedJobMap((prev) => new Map(prev).set(selectedJob.id, 'applied'));
    }
    setShowApplicationModal(false);
    setSelectedJob(null);
    fetchJobs(); 
    fetchAppliedJobs();
  };

  const calculateDaysAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const formatStatusLabel = (status: string | null) => {
    if (!status) return 'Application Submitted';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-8 rounded-3xl shadow-sm max-w-sm">
          <Lock className="w-10 h-10 text-[#86868b] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1d1d1f] dark:text-white mb-1">Authentication Required</h2>
          <p className="text-xs text-[#86868b] mb-6">Please sign in to view and apply for jobs</p>
          <button
            onClick={() => router.push('/login?redirect=/dashboard/jobs')}
            className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-bold text-xs shadow-[0_4px_14px_rgba(0,113,227,0.25)] transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased">
      {/* Page Title & Navigation Tabs */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
            {activeTab === 'saved' ? 'Saved Jobs' : 'Explore Vacancies'}
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-0.5 font-medium">
            {activeTab === 'saved' 
              ? 'Quick access to positions you bookmarked for later review and application' 
              : 'Find matching positions across various roles and tech stacks'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl self-start sm:self-auto shrink-0 border border-black/[0.04] dark:border-white/[0.06]">
          <button
            onClick={() => switchTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            <Briefcase size={13} />
            <span>All Positions</span>
          </button>

          <button
            onClick={() => switchTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#0071e3] shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            <Bookmark size={13} className={activeTab === 'saved' ? 'fill-[#0071e3]' : ''} />
            <span>Saved Jobs</span>
            {savedJobIds.size > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20">
                {savedJobIds.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" size={15} />
            <input
              type="text"
              placeholder={activeTab === 'saved' ? "Filter saved jobs by title, company..." : "Search by title, description or roles..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition-colors font-medium"
            />
          </div>

          {activeTab === 'all' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                className="px-3.5 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] font-medium focus:outline-none focus:border-[#0071e3] cursor-pointer"
              >
                <option value="all">All Employment Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>

              <select
                value={filters.locationType}
                onChange={(e) => setFilters({ ...filters, locationType: e.target.value })}
                className="px-3.5 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] font-medium focus:outline-none focus:border-[#0071e3] cursor-pointer"
              >
                <option value="all">All Environments</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>

              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" size={14} />
                <input
                  type="text"
                  placeholder="Preferred location..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] font-medium focus:outline-none focus:border-[#0071e3]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#86868b] text-xs tracking-wide font-medium">Loading records...</p>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-12 text-center max-w-md mx-auto shadow-xs">
          {activeTab === 'saved' ? (
            <>
              <Bookmark className="mx-auto mb-3 text-[#86868b]" size={28} />
              <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white mb-1">No saved jobs yet</h3>
              <p className="text-[#86868b] text-xs mb-4">
                Bookmark job listings you find interesting to easily review and apply to them later.
              </p>
              <button
                onClick={() => { setActiveTab('all'); setPage(1); }}
                className="px-4 py-2 bg-[#0071e3] text-white hover:bg-[#0077ed] rounded-2xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Browse Vacancies
              </button>
            </>
          ) : (
            <>
              <Briefcase className="mx-auto mb-3 text-[#86868b]" size={28} />
              <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white mb-1">No vacancies found</h3>
              <p className="text-[#86868b] text-xs mb-4">No current listings match your specific search criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ jobType: 'all', locationType: 'all', location: '' });
                }}
                className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white hover:bg-[#e5e5ea] rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {jobs.map((job) => {
              const hasApplied = job.hasApplied === true || appliedJobMap.has(job.id);
              const applicationStatus = job.applicationStatus || appliedJobMap.get(job.id);
              const isSaved = savedJobIds.has(job.id);
              
              return (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 hover:border-[#0071e3]/40 transition-all flex flex-col group relative shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {job.company?.logoUrl ? (
                        <img
                          src={job.company.logoUrl}
                          alt={job.company?.name || 'Company'}
                          className="w-10 h-10 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] object-cover shrink-0 shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl flex items-center justify-center shrink-0">
                          <Building2 size={16} className="text-[#0071e3]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-[#1d1d1f] dark:text-white text-xs font-bold truncate group-hover:text-[#0071e3] transition-colors">{job.company?.name || 'Company'}</h3>
                        <p className="text-[10px] text-[#86868b] truncate mt-0.5 uppercase tracking-wide font-semibold">{job.company?.industry || 'Technology'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {job.company?.verificationBadge === 'verified' && (
                        <span className="shrink-0 text-[9px] font-bold text-[#34c759] bg-[#34c759]/10 border border-[#34c759]/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Verified
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(job, e)}
                        title={isSaved ? 'Remove from Saved' : 'Save Job'}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-[#0071e3]/10 border-[#0071e3]/30 text-[#0071e3] shadow-xs'
                            : 'bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.06] dark:border-white/[0.08] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-black/[0.12] dark:border-white/[0.16]'
                        }`}
                      >
                        <Bookmark
                          size={14}
                          className={`transition-transform duration-200 ${isSaved ? 'fill-[#0071e3] scale-110' : 'group-hover:scale-105'}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mb-1">
                    <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-white tracking-tight group-hover:text-[#0071e3] truncate">
                      {job.title}
                    </h4>
                    {job.department && (
                      <p className="text-[10px] text-[#86868b] font-medium tracking-wide uppercase mt-0.5">{job.department}</p>
                    )}
                  </div>

                  <div className="space-y-2 text-xs my-4 flex-1 text-[#86868b]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-lg">
                        {job.jobType}
                      </span>
                      <span className="text-[11px] text-[#86868b] font-medium inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#86868b]" />
                        {job.locationType}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-[#86868b] font-medium">
                      {job.location && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin size={12} className="text-[#86868b]" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      )}
                      {job.salaryRange && (
                        <div className="flex items-center gap-1.5 text-[#34c759] font-bold">
                          <DollarSign size={12} className="text-[#34c759]" />
                          <span>{job.salaryRange}</span>
                        </div>
                      )}
                      {job.experienceRequired && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase size={12} className="text-[#86868b]" />
                          <span>{job.experienceRequired} experience</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const skillsList = Array.isArray(job.requiredSkills)
                      ? job.requiredSkills
                      : Array.isArray(job.skills)
                      ? job.skills
                      : typeof job.requiredSkills === 'string'
                      ? (job.requiredSkills.startsWith('[') ? (() => { try { return JSON.parse(job.requiredSkills); } catch { return job.requiredSkills.split(','); } })() : job.requiredSkills.split(','))
                      : typeof job.skills === 'string'
                      ? (job.skills.startsWith('[') ? (() => { try { return JSON.parse(job.skills); } catch { return job.skills.split(','); } })() : job.skills.split(','))
                      : [];

                    const validSkills = (Array.isArray(skillsList) ? skillsList : []).map((s: any) => String(s).trim()).filter(Boolean);

                    if (validSkills.length === 0) return null;

                    return (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {validSkills.slice(0, 2).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] text-[10px] rounded-lg border border-black/[0.04] dark:border-white/[0.06] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {validSkills.length > 2 && (
                          <span className="px-1.5 py-0.5 text-[#86868b] text-[10px] font-bold">
                            +{validSkills.length - 2}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-[#86868b] font-medium">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-[#86868b]" />
                        <span>{calculateDaysAgo(job.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-[#0071e3] group-hover:underline font-semibold">
                        <span>View position</span>
                        <ChevronRight size={13} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                    
                    {hasApplied ? (
                      <button
                        disabled
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        className="w-full py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] text-[#86868b] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed shadow-xs"
                      >
                        <CheckCircle2 size={13} className="text-[#34c759]" />
                        <span className="capitalize">{applicationStatus === 'applied' ? 'Applied' : formatStatusLabel(applicationStatus || 'Applied')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleApplyClick(job, e)}
                        className="w-full py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,113,227,0.25)] cursor-pointer"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors cursor-pointer shadow-xs"
              >
                Previous
              </button>
              <span className="text-[#86868b] text-xs font-semibold tracking-wide">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors cursor-pointer shadow-xs"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showApplicationModal && selectedJob && (
        <ApplicationModal
          job={selectedJob}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJob(null);
          }}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
}

// ─── APPLICATION MODAL COMPONENT ────────────────────
function ApplicationModal({ job, onClose, onSuccess }: { job: any; onClose: () => void; onSuccess: () => void; }) {
  const { showToast } = useGlassToast();
  const router = useRouter();

  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [uploadNew, setUploadNew] = useState(false);
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/jobseeker/resumes');
      if (response.data.success) {
        setResumes(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedResumeId(response.data.data[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error loading documents:', error);
      if (error.response?.status === 401) {
        showToast('Session Expired', 'Please sign in again', 'info');
        router.push('/login?redirect=/dashboard/jobs');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast('File Too Large', 'File size must be less than 10MB', 'danger');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        showToast('Unsupported Format', 'Only PDF and DOCX formats are supported.', 'danger');
        return;
      }
      setNewResumeFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!uploadNew && !selectedResumeId) {
      showToast('Selection Required', 'Please select a resume profile.', 'info');
      return;
    }
    if (uploadNew && !newResumeFile) {
      showToast('Document Missing', 'Please select a resume file to upload.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('jobPostingId', job.id);

      if (uploadNew && newResumeFile) {
        formData.append('applyWithNew', 'true');
        formData.append('newResume', newResumeFile);
      } else {
        formData.append('applyWithNew', 'false');
        formData.append('resumeId', selectedResumeId);
      }

      const response = await api.post('/jobseeker/applications/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        showToast(
          'Application Submitted',
          `Successfully applied for ${job.title} at ${job.company?.name || 'Company'}.`,
          'success'
        );
        onSuccess();
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      if (error.response?.status === 401) {
        showToast('Session Expired', 'Please sign in again', 'info');
        router.push('/login?redirect=/dashboard/jobs');
      } else {
        showToast(
          'Submission Failed',
          error.response?.data?.message || 'Failed to file application.',
          'danger'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl text-[#1d1d1f] dark:text-[#f5f5f7]">
        <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-[#f2f2f7]/40 dark:bg-[#2c2c2e]/40">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Submit Application</h2>
            <p className="text-xs text-[#86868b] mt-0.5 font-medium">{job.title} — {job.company?.name || 'Company'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl">
            <button
              onClick={() => setUploadNew(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                !uploadNew ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs font-bold' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Saved Resumes
            </button>
            <button
              onClick={() => setUploadNew(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                uploadNew ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs font-bold' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Upload Document
            </button>
          </div>

          {!uploadNew && (
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="w-5 h-5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4">
                  <FileText className="mx-auto mb-2 text-[#86868b]" size={20} />
                  <p className="text-[#86868b] text-xs font-medium">No saved resumes found in your profile</p>
                </div>
              ) : (
                resumes.map((resume) => (
                  <label
                    key={resume.id}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedResumeId === resume.id
                        ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs'
                        : 'border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7]/30 dark:bg-[#2c2c2e]/30 hover:border-black/[0.12] dark:hover:border-white/[0.15]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={resume.id}
                      checked={selectedResumeId === resume.id}
                      onChange={() => setSelectedResumeId(resume.id)}
                      className="accent-[#0071e3] w-4 h-4"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold text-xs truncate">{resume.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#86868b] font-medium">
                        <span>{resume.source === 'uploaded' ? 'Uploaded PDF' : 'Generated Resume'}</span>
                        {resume.atsScore && (
                          <span className="text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full font-bold">Match: {resume.atsScore}%</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          {uploadNew && (
            <div>
              <label className="block border-2 border-dashed border-black/[0.1] dark:border-white/[0.1] bg-[#f2f2f7]/40 dark:bg-[#2c2c2e]/40 hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] rounded-3xl p-6 text-center hover:border-[#0071e3] transition-all cursor-pointer">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                {newResumeFile ? (
                  <div className="space-y-2">
                    <FileText className="mx-auto text-[#0071e3]" size={28} />
                    <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-xs max-w-xs truncate mx-auto">{newResumeFile.name}</p>
                    <p className="text-[#86868b] text-[10px] uppercase font-bold tracking-wider">{(newResumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      onClick={(e) => { e.preventDefault(); setNewResumeFile(null); }}
                      className="text-[#ff3b30] text-xs font-semibold hover:underline pt-1 inline-block cursor-pointer"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Upload className="mx-auto text-[#0071e3]" size={24} />
                    <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-xs">Choose document from device</p>
                    <p className="text-[#86868b] text-[11px]">Supports PDF or DOCX formats up to 10MB</p>
                  </div>
                )}
              </label>
            </div>
          )}

          <div className="bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-3.5 flex gap-2.5">
            <AlertCircle className="text-[#86868b] shrink-0 mt-0.5" size={15} />
            <div className="text-xs text-[#86868b] font-medium leading-relaxed">
              <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold mb-0.5">Automated screening</p>
              <p>Your resume credentials will be analyzed by the platform parser to map matching qualification criteria for this role.</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2.5 bg-[#f2f2f7]/30 dark:bg-[#2c2c2e]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!uploadNew && !selectedResumeId) || (uploadNew && !newResumeFile)}
            className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(0,113,227,0.25)] cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}