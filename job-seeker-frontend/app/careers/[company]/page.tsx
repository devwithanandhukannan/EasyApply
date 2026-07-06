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
  Sparkles, Layers, DollarSign
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
      applied: { text: 'Applied', className: 'bg-blue-50 border-blue-100 text-blue-700' },
      screened: { text: 'Under Review', className: 'bg-purple-50 border-purple-100 text-purple-700' },
      technical_round: { text: 'Technical Round', className: 'bg-amber-50 border-amber-100 text-amber-700' },
      hr_round: { text: 'HR Round', className: 'bg-orange-50 border-orange-100 text-orange-700' },
      offer_sent: { text: 'Offer Sent', className: 'bg-emerald-50 border-emerald-100 text-emerald-700 font-semibold ring-1 ring-emerald-500/30' },
      hired: { text: 'Hired', className: 'bg-green-50 border-green-200 text-green-700 font-semibold' },
      rejected: { text: 'Not Selected', className: 'bg-gray-50/80 border-gray-200 text-gray-500' }
    };

    const config = statusConfig[status || ''] || statusConfig.applied;

    return (
      <span className={`px-3 py-1.5 border rounded-xl text-[11px] font-semibold tracking-wide backdrop-blur-md ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getDepartments = () => [...new Set(jobs.map(j => j.department).filter(Boolean))] as string[];
  const getJobTypes = () => [...new Set(jobs.map(j => j.jobType).filter(Boolean))] as string[];
  const getLocationTypes = () => [...new Set(jobs.map(j => j.locationType).filter(Boolean))] as string[];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(243,244,246,0.8)_0%,transparent_70%)]" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 text-xs tracking-widest uppercase font-medium">Syncing profile data...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.05)_0%,transparent_50%)]" />
        <div className="text-center max-w-sm relative z-10">
          <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Company Workspace Not Found</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">The route directory might have changed or this business hub dashboard is temporarily set to private.</p>
          <button 
            onClick={() => router.push('/companies')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition font-medium text-sm shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Corporate Index
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900 antialiased font-sans overflow-hidden">
      
      {/* FIXED HERO HEADER */}
      <header className="flex-shrink-0 relative border-b border-gray-200 bg-gray-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(243,244,246,0.6)_0%,transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 pt-5 pb-0 space-y-4">
          
          {/* PREMIUM BACK BUTTON ACTION ENTRY */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/companies')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white backdrop-blur-md border border-gray-200 hover:border-gray-300 rounded-xl text-[11px] font-semibold tracking-wider text-gray-500 hover:text-gray-800 transition-all shadow-md group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" />
              
            </button>
          </div>

          {/* Auth Notifications */}
          {!isAuthenticated && (
            <div className="bg-white/50 backdrop-blur-md border border-gray-200/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm group">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-gray-50/80 rounded-xl border border-gray-200 text-gray-500">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 tracking-tight">Personalized Applications System Offline</p>
                  <p className="text-xs text-gray-400">Authenticate your engineer profile to access direct job pipelines.</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/login?redirect=/careers/${companyIdentifier}`)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition text-xs font-bold tracking-tight shadow-md"
              >
                Sign In to Pipeline
              </button>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="bg-emerald-50/50 backdrop-blur-md border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 tracking-tight">Pipeline Authenticated</p>
                  <p className="text-xs text-gray-400">Session verified for <span className="text-emerald-400 font-medium">{user.fullName || 'your account'}</span>.</p>
                </div>
              </div>
              <span className="hidden sm:inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}

          {/* Company Branding Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-5">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm relative group">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover relative z-0 transition group-hover:scale-105 duration-300" />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400 relative z-0" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">{company.name}</h1>
                {company.verificationBadge !== 'none' && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Verified Hub</span>
                  </div>
                )}
              </div>

              {company.tagline && (
                <p className="text-gray-500 text-xs md:text-sm max-w-2xl truncate mb-3 font-normal">{company.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-500 font-medium">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-gray-400" />
                  <span>{company.industry}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-gray-400" />
                  <span>{company.size} Team Members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-gray-400" />
                  <span>{company.activeJobsCount} Active Tracks</span>
                </div>
                {company.corporateLink && (
                  <a 
                    href={company.corporateLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors border-b border-gray-200 hover:border-zinc-500 pb-0.5"
                  >
                    <Globe className="w-3 h-3 text-gray-400" />
                    <span>HQ Portal</span>
                    <ExternalLink className="w-2.5 h-2.5 text-gray-300" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Sub Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
            {[
              { id: 'jobs', label: 'Open Openings', count: jobs.length },
              { id: 'about', label: 'Company Profile' },
              { id: 'overview', label: 'Hub Intelligence' }
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-[11px] uppercase tracking-wider font-semibold transition-all relative flex-shrink-0 border-b-2 -mb-[2px] ${
                    isSelected 
                      ? 'border-white text-gray-900 font-bold' 
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab.label} {tab.count !== undefined && <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${isSelected ? 'bg-gray-100 text-gray-800' : 'bg-gray-50/80 text-gray-400'}`}>{tab.count}</span>}
                </button>
              );
            })}
          </div>

        </div>
      </header>

      {/* VIEWPORT BOUNDED SCROLLABLE MAIN LAYOUT */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-6 py-6 overflow-hidden">
        
        {/* JOBS DASHBOARD */}
        {activeTab === 'jobs' && (
          <div className="h-full flex flex-col md:flex-row gap-6 items-start overflow-hidden">
            
            {/* FIXED SIDEBAR FILTERS */}
            {jobs.length > 0 && (
              <div className="w-full md:w-64 flex-shrink-0 space-y-4 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <h2 className="text-xs uppercase font-bold tracking-widest text-gray-400">Search Filters</h2>
                  {(searchQuery || departmentFilter || jobTypeFilter || locationTypeFilter) && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setDepartmentFilter('');
                        setJobTypeFilter('');
                        setLocationTypeFilter('');
                      }}
                      className="text-[11px] text-gray-500 hover:text-gray-800 transition underline underline-offset-4"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Keyword Lookup</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Role, tech stack..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-zinc-600 focus:outline-none focus:border-gray-300 focus:bg-gray-50/80 transition"
                    />
                  </div>
                </div>

                {getDepartments().length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Department</label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-300 focus:bg-gray-50/80 transition"
                    >
                      <option value="">All Scopes</option>
                      {getDepartments().map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {getJobTypes().length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Employment Model</label>
                    <select
                      value={jobTypeFilter}
                      onChange={(e) => setJobTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-300 focus:bg-gray-50/80 transition"
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
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Physical Location</label>
                    <select
                      value={locationTypeFilter}
                      onChange={(e) => setLocationTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-300 focus:bg-gray-50/80 transition"
                    >
                      <option value="">All Vectors</option>
                      {getLocationTypes().map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="text-[11px] text-gray-400 pt-1 font-medium tracking-wide">
                  Matching Index: {filteredJobs.length} nodes
                </div>
              </div>
            )}

            {/* FULL WIDTH SCROLLABLE JOB CONTAINER */}
            <div className="flex-1 w-full h-full overflow-y-auto pr-1 space-y-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {jobs.length === 0 ? (
                <div className="text-center py-16 bg-white/80 backdrop-blur-md border border-dashed border-gray-200 rounded-2xl">
                  <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3.5" />
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Quiet Pipeline</h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">This workspace isn't accepting direct applications right now.</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-16 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl">
                  <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3.5" />
                  <p className="text-xs text-gray-400 mb-4">No structural matches found inside the current parameters.</p>
                </div>
              ) : (
                filteredJobs.map(job => (
                  <div 
                    key={job.id}
                    onClick={() => handleJobClick(job.id)}
                    className="w-full bg-white/80 backdrop-blur-md border border-gray-200 hover:border-gray-300 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-transparent group-hover:bg-zinc-400 transition-colors" />

                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight group-hover:text-gray-900 transition-colors">
                          {job.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-0.5 bg-gray-50/80 border border-gray-200 rounded-lg text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                            {job.jobType}
                          </span>
                          {job.locationType && (
                            <span className="px-2.5 py-0.5 bg-gray-50/80 border border-gray-200 rounded-lg text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                              {job.locationType}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 font-medium">
                        {job.department && (
                          <span className="flex items-center gap-1.5 text-gray-700">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            {job.department}
                          </span>
                        )}
                        {job.location && (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {job.location}
                          </span>
                        )}
                        {job.experienceRequired && (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {job.experienceRequired}
                          </span>
                        )}
                        {job.salaryRange && (
                          <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            {job.salaryRange}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 font-medium pt-1 border-t border-gray-100">
                        <span>Allocated Positions: {job.openings}</span>
                        <span className="text-gray-300">•</span>
                        <span>{job.applicationsCount} Processing</span>
                        {job.deadline && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              Closing {new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </>
                        )}
                        {job.hasApplied && job.appliedAt && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <Check className="w-3 h-3 text-emerald-500" />
                              Transmitted {new Date(job.appliedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-gray-200 sm:border-t-0 pt-3 sm:pt-0 flex-shrink-0">
                      {job.hasApplied ? (
                        getStatusBadge(job.applicationStatus)
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-gray-900 group-hover:bg-gray-100/60 group-hover:border-gray-300 transition-all ml-auto sm:ml-0 shadow-inner">
                          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STATIC TAB DESIGNS */}
        {activeTab === 'about' && (
          <div className="h-full overflow-y-auto pr-1 space-y-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="max-w-3xl space-y-8">
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-400" />
                  Operational Mission
                </h2>
                {company.tagline && (
                  <p className="text-gray-500 text-sm leading-relaxed font-normal bg-white/80 backdrop-blur-md border border-gray-200 p-5 rounded-2xl shadow-sm">{company.tagline}</p>
                )}
              </div>
              
              {company.services && company.services.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-gray-400">Core Services Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {company.services.map((service, idx) => (
                      <span key={idx} className="px-3 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl text-xs text-gray-700 font-semibold hover:border-gray-300 transition duration-150 shadow-md">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {company.coreValues && company.coreValues.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-bold tracking-widest text-gray-400">Corporate Anchors</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {company.coreValues.map((value, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl shadow-md">
                        <div className="p-1.5 bg-gray-50/80 border border-gray-200 text-gray-500 rounded-lg mt-0.5">
                          <Target className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-gray-700 text-xs font-medium leading-relaxed">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="h-full overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider text-gray-400">Node Properties</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-3.5 border-b border-gray-200 font-medium">
                      <span className="text-gray-400">Industrial Core</span>
                      <span className="text-gray-800">{company.industry}</span>
                    </div>
                    <div className="flex justify-between py-3.5 border-b border-gray-200 font-medium">
                      <span className="text-gray-400">Scale Factor</span>
                      <span className="text-gray-800">{company.size} personnel</span>
                    </div>
                    <div className="flex justify-between py-3.5 border-b border-gray-200 font-medium">
                      <span className="text-gray-400">Active Pipelines</span>
                      <span className="text-gray-800 font-bold">{company.activeJobsCount} tracks open</span>
                    </div>
                    <div className="flex justify-between py-3.5 font-medium">
                      <span className="text-gray-400">Registry Clearance</span>
                      <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        {company.verificationBadge}
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
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 bg-white hover:bg-gray-800 text-gray-800 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition-all font-semibold text-xs tracking-wide uppercase shadow-sm"
                  >
                    Request External Gateway
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
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