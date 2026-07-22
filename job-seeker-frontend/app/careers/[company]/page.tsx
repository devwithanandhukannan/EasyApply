'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import publicAPIService from '@/app/lib/public';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  Building2, MapPin, Users, Briefcase, Globe, 
  CheckCircle, ExternalLink, Search, 
  Calendar, Clock, ChevronRight, Target,
  Check, Lock, ArrowLeft, ShieldCheck, HelpCircle, 
  Sparkles, Layers, DollarSign, Filter
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

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'about'>('jobs');

  useEffect(() => {
    if (!authLoading && companyIdentifier) {
      loadData();
    }
  }, [companyIdentifier, authLoading]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, departmentFilter, jobTypeFilter, locationTypeFilter, jobs]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, jobsRes] = await Promise.all([
        publicAPIService.getCompanyProfile(companyIdentifier),
        publicAPIService.getCompanyJobs(companyIdentifier)
      ]) as [any, any];

      if (profileRes.success) {
        setCompany(profileRes.data);
      }
      if (jobsRes.success) {
        setJobs(jobsRes.data);
        setFilteredJobs(jobsRes.data);
      }
    } catch (error: any) {
      console.error('Failed to load company data:', error);
      if (error.response?.status === 404) {
        setCompany(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = jobs;

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(job => job.department === departmentFilter);
    }

    if (jobTypeFilter) {
      filtered = filtered.filter(job => job.jobType === jobTypeFilter);
    }

    if (locationTypeFilter) {
      filtered = filtered.filter(job => job.locationType === locationTypeFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleJobClick = (jobId: string) => {
    router.push(`/careers/${companyIdentifier}/jobs/${jobId}`);
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig: any = {
      applied: { text: 'Applied', className: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
      screened: { text: 'Under Review', className: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
      technical_round: { text: 'Technical Round', className: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
      hr_round: { text: 'HR Round', className: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
      offer_sent: { text: 'Offer Sent', className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-semibold' },
      hired: { text: 'Hired', className: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 font-semibold' },
      rejected: { text: 'Not Selected', className: 'bg-zinc-800/80 border-zinc-700 text-zinc-400' }
    };

    const config = statusConfig[status || ''] || statusConfig.applied;

    return (
      <span className={`px-3 py-1.5 border rounded-xl text-xs font-medium backdrop-blur-md ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getDepartments = () => [...new Set(jobs.map(j => j.department).filter(Boolean))] as string[];
  const getJobTypes = () => [...new Set(jobs.map(j => j.jobType).filter(Boolean))] as string[];
  const getLocationTypes = () => [...new Set(jobs.map(j => j.locationType).filter(Boolean))] as string[];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" />
            <div className="absolute inset-0 border-2 border-t-emerald-500 rounded-full animate-spin" />
          </div>
          <p className="text-zinc-400 text-xs tracking-wider uppercase font-medium">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.05)_0%,transparent_60%)] pointer-events-none" />
        <div className="text-center max-w-md relative z-10">
          <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Building2 className="w-8 h-8 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Company Not Found</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">The requested company profile could not be found or may be private.</p>
          <button 
            onClick={() => router.push('/companies')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition font-semibold text-sm shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white antialiased font-sans overflow-hidden relative">
      
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08)_0%,transparent_60%)] pointer-events-none z-0" />

      {/* FIXED HERO HEADER */}
      <header className="flex-shrink-0 relative border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-xl z-10">
        <div className="max-w-7xl mx-auto px-6 pt-5 pb-0 space-y-4">
          
          {/* Back Button & Auth Notification Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <button
              onClick={() => router.push('/companies')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Companies</span>
            </button>

            {/* Auth status banner */}
            {!isAuthenticated ? (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-1.5 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Sign in to apply directly</span>
                </div>
                <button
                  onClick={() => router.push(`/login?redirect=/careers/${companyIdentifier}`)}
                  className="px-3 py-1 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg transition text-xs"
                >
                  Sign In
                </button>
              </div>
            ) : (
              user && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 text-xs text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Signed in as <strong className="text-white">{user.fullName || 'Candidate'}</strong></span>
                </div>
              )
            )}
          </div>

          {/* Company Brand Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-lg relative group">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover transition group-hover:scale-105 duration-300" />
              ) : (
                <Building2 className="w-8 h-8 text-zinc-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{company.name}</h1>
                {company.verificationBadge !== 'none' && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">Verified Company</span>
                  </div>
                )}
              </div>

              {company.tagline && (
                <p className="text-zinc-400 text-xs md:text-sm max-w-2xl truncate mb-3">{company.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{company.industry}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{company.size} employees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{company.activeJobsCount} Open Position{company.activeJobsCount !== 1 ? 's' : ''}</span>
                </div>
                {company.corporateLink && (
                  <a 
                    href={company.corporateLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-zinc-800/80 overflow-x-auto no-scrollbar">
            {[
              { id: 'jobs', label: 'Open Positions', count: jobs.length },
              { id: 'about', label: 'About Company' },
              { id: 'overview', label: 'Company Overview' }
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-semibold tracking-wide transition-all relative flex-shrink-0 border-b-2 -mb-[2px] ${
                    isSelected 
                      ? 'border-emerald-400 text-white font-bold' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label} 
                  {tab.count !== undefined && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </header>

      {/* SCROLLABLE MAIN BODY */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-6 py-6 overflow-hidden z-10">
        
        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div className="h-full flex flex-col md:flex-row gap-6 items-start overflow-hidden">
            
            {/* SEARCH & FILTERS SIDEBAR */}
            {jobs.length > 0 && (
              <div className="w-full md:w-64 flex-shrink-0 space-y-4 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <Filter className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Search Filters</span>
                  </div>
                  {(searchQuery || departmentFilter || jobTypeFilter || locationTypeFilter) && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setDepartmentFilter('');
                        setJobTypeFilter('');
                        setLocationTypeFilter('');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Search Jobs</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Role, keyword, skill..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition"
                    />
                  </div>
                </div>

                {getDepartments().length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Department</label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition"
                    >
                      <option value="">All Departments</option>
                      {getDepartments().map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {getJobTypes().length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Employment Type</label>
                    <select
                      value={jobTypeFilter}
                      onChange={(e) => setJobTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition"
                    >
                      <option value="">All Types</option>
                      {getJobTypes().map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}

                {getLocationTypes().length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Location</label>
                    <select
                      value={locationTypeFilter}
                      onChange={(e) => setLocationTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition"
                    >
                      <option value="">All Locations</option>
                      {getLocationTypes().map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-800/80 font-medium">
                  Showing {filteredJobs.length} position{filteredJobs.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* JOB CARDS LIST */}
            <div className="flex-1 w-full h-full overflow-y-auto pr-1 space-y-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {jobs.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
                  <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-zinc-300 mb-1">No Open Positions</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">This company currently has no active hiring positions.</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                  <HelpCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-xs text-zinc-400 mb-4">No jobs matching your selected search filters.</p>
                </div>
              ) : (
                filteredJobs.map(job => (
                  <div 
                    key={job.id}
                    onClick={() => handleJobClick(job.id)}
                    className="w-full bg-zinc-900/50 border border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-900/90 rounded-2xl p-5 md:p-6 transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-lg"
                  >
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <h3 className="text-base md:text-lg font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                          {job.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-[10px] text-zinc-300 font-semibold uppercase tracking-wider">
                            {job.jobType}
                          </span>
                          {job.locationType && (
                            <span className="px-2.5 py-0.5 bg-zinc-800/80 border border-zinc-700/80 rounded-lg text-[10px] text-zinc-300 font-semibold uppercase tracking-wider">
                              {job.locationType}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400 font-medium">
                        {job.department && (
                          <span className="flex items-center gap-1.5 text-zinc-300">
                            <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                            {job.department}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            {job.location}
                          </span>
                        )}
                        {job.experienceRequired && (
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {job.experienceRequired}
                          </span>
                        )}
                        {job.salaryRange && (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            {job.salaryRange}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-medium pt-2 border-t border-zinc-800/60">
                        <span>{job.openings} Opening{job.openings !== 1 ? 's' : ''}</span>
                        <span className="text-zinc-700">•</span>
                        <span>{job.applicationsCount} Applicant{job.applicationsCount !== 1 ? 's' : ''}</span>
                        {job.deadline && (
                          <>
                            <span className="text-zinc-700">•</span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-zinc-500" />
                              Closes {new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </>
                        )}
                        {job.hasApplied && job.appliedAt && (
                          <>
                            <span className="text-zinc-700">•</span>
                            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                              <Check className="w-3 h-3 text-emerald-400" />
                              Applied on {new Date(job.appliedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-zinc-800 sm:border-t-0 pt-3 sm:pt-0 flex-shrink-0">
                      {job.hasApplied ? (
                        getStatusBadge(job.applicationStatus)
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-emerald-400 text-black hover:text-black font-semibold text-xs rounded-xl transition-all shadow-md group-hover:scale-105">
                          <span>View Job</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABOUT COMPANY TAB */}
        {activeTab === 'about' && (
          <div className="h-full overflow-y-auto pr-1 space-y-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="max-w-4xl space-y-8">
              <div className="space-y-3">
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  About Us & Mission
                </h2>
                {company.tagline && (
                  <p className="text-zinc-300 text-sm leading-relaxed bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl shadow-lg">{company.tagline}</p>
                )}
              </div>
              
              {company.services && company.services.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-zinc-400">Services & Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {company.services.map((service, idx) => (
                      <span key={idx} className="px-3.5 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-medium shadow-sm">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {company.coreValues && company.coreValues.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-zinc-400">Core Values</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {company.coreValues.map((value, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl shadow-sm">
                        <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg mt-0.5">
                          <Target className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-zinc-300 text-xs font-medium leading-relaxed">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="h-full overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Company Overview</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-3 border-b border-zinc-800/80 font-medium">
                      <span className="text-zinc-400">Industry</span>
                      <span className="text-zinc-200">{company.industry}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-zinc-800/80 font-medium">
                      <span className="text-zinc-400">Company Size</span>
                      <span className="text-zinc-200">{company.size} employees</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-zinc-800/80 font-medium">
                      <span className="text-zinc-400">Active Hiring</span>
                      <span className="text-emerald-400 font-bold">{company.activeJobsCount} positions open</span>
                    </div>
                    <div className="flex justify-between py-3 font-medium">
                      <span className="text-zinc-400">Verification Status</span>
                      <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                {company.corporateLink && (
                  <a
                    href={company.corporateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl transition-all text-xs tracking-wide shadow-lg"
                  >
                    Visit Corporate Website
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}