'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import publicAPIService from '@/app/lib/public';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  Building2, MapPin, Users, Briefcase, Globe, 
  Search, Clock, ChevronRight,
  ArrowLeft, ShieldCheck, CheckCircle2,
  Sparkles, Layers, DollarSign, Filter,
  Lock
} from 'lucide-react';

interface CompanyProfile {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string;
  size: string;
  tagline: string | null;
  services: string[];
  products: any;
  seoKeywords: string[];
  coreValues: string[];
  gallery: string[];
  youtubeLink: string | null;
  officeLocations: any[];
  socialMedia: any;
  corporateLink: string | null;
  verificationBadge: string;
  isVerified: boolean;
  activeJobsCount: number;
  teamSize: number;
}

interface Job {
  id: string;
  title: string;
  department: string | null;
  jobType: string;
  locationType: string | null;
  location: string | null;
  experienceRequired: string | null;
  salaryRange: string | null;
  requiredSkills: any;
  deadline: string | null;
  openings: number;
  applicationsCount: number;
  createdAt: string;
  hasApplied: boolean;
  applicationStatus: string | null;
  appliedAt: string | null;
}

export default function CompanyCareerPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const companyIdentifier = params.company as string;

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [activeTab, setActiveTab] = useState<'jobs' | 'about'>('jobs');

  useEffect(() => {
    if (companyIdentifier) {
      loadCompanyData();
    }
  }, [companyIdentifier]);

  useEffect(() => {
    filterJobs();
  }, [searchQuery, selectedDept, selectedType, selectedLocation, jobs]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const response = await publicAPIService.getCompanyProfile(companyIdentifier);
      const resData = response.data;
      if (resData?.success && resData?.data) {
        setCompany(resData.data.company);
        setJobs(resData.data.jobs || []);
        setFilteredJobs(resData.data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(q) ||
        job.department?.toLowerCase().includes(q) ||
        job.location?.toLowerCase().includes(q) ||
        (Array.isArray(job.requiredSkills) && job.requiredSkills.some((s: string) => s.toLowerCase().includes(q)))
      );
    }

    if (selectedDept !== 'all') {
      filtered = filtered.filter(job => job.department === selectedDept);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(job => job.jobType === selectedType);
    }

    if (selectedLocation !== 'all') {
      filtered = filtered.filter(job => job.locationType === selectedLocation);
    }

    setFilteredJobs(filtered);
  };

  const handleJobClick = (jobId: string) => {
    router.push(`/careers/${companyIdentifier}/jobs/${jobId}`);
  };

  const getDepartments = () => [...new Set(jobs.map(j => j.department).filter(Boolean))] as string[];
  const getJobTypes = () => [...new Set(jobs.map(j => j.jobType).filter(Boolean))] as string[];
  const getLocationTypes = () => [...new Set(jobs.map(j => j.locationType).filter(Boolean))] as string[];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-black/10 dark:border-white/10 border-t-[#0071e3] rounded-full animate-spin" />
        <p className="text-[#86868b] text-xs font-semibold mt-4">Loading company profile...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xs">
            <Building2 className="w-8 h-8 text-[#86868b]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Company Not Found</h1>
          <p className="text-[#86868b] text-sm leading-relaxed mb-6 font-medium">The requested company profile could not be found or may be private.</p>
          <button 
            onClick={() => router.push('/companies')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0071e3] text-white rounded-2xl font-bold text-xs shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] antialiased font-sans">
      {/* ── TOP HEADER ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
          {/* Top Row: Back & Auth */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.push('/companies')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] rounded-xl text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Companies</span>
            </button>

            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/login?redirect=/careers/${companyIdentifier}`)}
                  className="px-3.5 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold rounded-xl transition text-xs shadow-xs cursor-pointer"
                >
                  Sign In to Apply
                </button>
              </div>
            ) : (
              user && (
                <div className="px-3 py-1 bg-[#34c759]/10 border border-[#34c759]/20 rounded-xl flex items-center gap-2 text-xs font-bold text-[#248a3d] dark:text-[#30d158]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Signed in as {user.fullName || 'Candidate'}</span>
                </div>
              )
            )}
          </div>

          {/* Company Brand Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2">
            <div className="w-16 h-16 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs p-2">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain rounded-xl" />
              ) : (
                <Building2 className="w-7 h-7 text-[#0071e3]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">{company.name}</h1>
                {(company.verificationBadge === 'verified' || company.isVerified) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34c759]/10 border border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              {company.tagline && (
                <p className="text-[#86868b] text-xs max-w-2xl truncate mb-2 font-medium">{company.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#86868b] font-medium">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#0071e3]" />
                  <span>{company.industry}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#86868b]" />
                  <span>{company.size} employees</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 text-[#248a3d] dark:text-[#30d158] font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{company.activeJobsCount} Open Positions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-[#f2f2f7] dark:bg-[#2c2c2e]'
              }`}
            >
              Open Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-[#0071e3] text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white bg-[#f2f2f7] dark:bg-[#2c2c2e]'
              }`}
            >
              About Company
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENT AREA ──────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-6 w-full">
        {activeTab === 'jobs' ? (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                <input
                  type="text"
                  placeholder="Search open roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition font-medium"
                />
              </div>

              {getDepartments().length > 0 && (
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition cursor-pointer font-medium"
                >
                  <option value="all">All Departments</option>
                  {getDepartments().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}

              {getJobTypes().length > 0 && (
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition cursor-pointer font-medium"
                >
                  <option value="all">All Job Types</option>
                  {getJobTypes().map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            </div>

            {/* Job Cards */}
            {filteredJobs.length === 0 ? (
              <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-12 text-center max-w-md mx-auto my-8 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                <Briefcase className="w-8 h-8 text-[#86868b] mx-auto mb-3" />
                <h3 className="text-base font-bold mb-1">No Positions Match</h3>
                <p className="text-xs text-[#86868b] font-medium">Try modifying search keywords or clearing filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobClick(job.id)}
                    className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.15] dark:hover:border-white/[0.2] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all cursor-pointer group"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors truncate">
                          {job.title}
                        </h3>
                        {job.hasApplied && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border border-[#34c759]/20">
                            Applied
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#86868b] font-medium">
                        {job.department && <span className="font-semibold text-[#1d1d1f] dark:text-white">{job.department}</span>}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#86868b]" />
                          {job.location || job.locationType || 'Remote'}
                        </span>
                        {job.experienceRequired && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#86868b]" />
                              {job.experienceRequired}
                            </span>
                          </>
                        )}
                        {job.salaryRange && (
                          <>
                            <span>•</span>
                            <span className="text-[#248a3d] dark:text-[#30d158] font-bold">
                              {job.salaryRange}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t border-black/[0.04] md:border-t-0">
                      <span className="px-2.5 py-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-xl text-[10px] font-bold uppercase tracking-wider">
                        {job.jobType}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center text-[#86868b] group-hover:text-[#0071e3] transition-colors">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* About Company Tab */
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight mb-2">About {company.name}</h2>
              <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed font-medium">
                {company.tagline || 'Leading technology organization actively expanding engineering, product, and operations capabilities.'}
              </p>
            </div>

            {company.coreValues && company.coreValues.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#86868b] mb-3">Core Values</h3>
                <div className="flex flex-wrap gap-2">
                  {company.coreValues.map((val, idx) => (
                    <span key={idx} className="px-3 py-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-full text-xs font-semibold text-[#1d1d1f] dark:text-white">
                      {val}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}