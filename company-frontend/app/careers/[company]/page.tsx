'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { publicAPI } from '@/app/lib/api/public';
import { usePublicAuth } from '@/app/contexts/PublicAuthContext';
import { 
  Building2, MapPin, Users, Briefcase, Globe, 
  CheckCircle, Play, ExternalLink, Search, 
  Calendar, Clock, ChevronRight, Award, Target,
  Check, Lock
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
  const { isAuthenticated, user, loading: authLoading } = usePublicAuth();
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
    if (!authLoading) {
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
        publicAPI.getCompanyProfile(companyIdentifier),
        publicAPI.getCompanyJobs(companyIdentifier)
      ]);

      if (profileRes.success) setCompany(profileRes.data);
      if (jobsRes.success) setJobs(jobsRes.data);
    } catch (error) {
      console.error('Failed to load company data:', error);
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

  const handleJobClick = (jobId: string, hasApplied: boolean) => {
    router.push(`/careers/${companyIdentifier}/jobs/${jobId}`);
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig: any = {
      applied: { text: 'Applied', className: 'bg-blue-950/40 border-blue-900/60 text-blue-400' },
      screened: { text: 'Under Review', className: 'bg-purple-950/40 border-purple-900/60 text-purple-400' },
      technical_round: { text: 'Technical Round', className: 'bg-amber-950/40 border-amber-900/60 text-amber-400' },
      hr_round: { text: 'HR Round', className: 'bg-orange-950/40 border-orange-900/60 text-orange-400' },
      offer_sent: { text: 'Offer Sent', className: 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' },
      hired: { text: 'Hired', className: 'bg-green-950/40 border-green-900/60 text-green-400' },
      rejected: { text: 'Not Selected', className: 'bg-red-950/40 border-red-900/60 text-red-400' }
    };

    const config = statusConfig[status || ''] || statusConfig.applied;

    return (
      <span className={`px-2.5 py-1 border rounded-lg text-xs font-medium uppercase tracking-wider ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getDepartments = () => [...new Set(jobs.map(j => j.department).filter(Boolean))];
  const getJobTypes = () => [...new Set(jobs.map(j => j.jobType))];
  const getLocationTypes = () => [...new Set(jobs.map(j => j.locationType).filter(Boolean))];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading company profile...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Company Not Found</h1>
          <p className="text-zinc-500 mb-4">The company you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push('/companies')}
            className="px-4 py-2 bg-white text-zinc-950 rounded-lg hover:bg-zinc-200"
          >
            Browse Companies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* HERO HEADER */}
      <header className="relative border-b border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          
          {/* Auth Status Banner */}
          {!isAuthenticated && (
            <div className="mb-6 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-zinc-500" />
                <div>
                  <p className="text-sm font-medium text-zinc-200">Sign in to apply for jobs</p>
                  <p className="text-xs text-zinc-500">Track your applications and get personalized recommendations</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-white text-zinc-950 rounded-lg hover:bg-zinc-200 transition text-sm font-medium"
              >
                Sign In
              </button>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="mb-6 bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-200">Signed in as {user.fullName}</p>
                <p className="text-xs text-emerald-400/70">Ready to apply for positions</p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-900 border-2 border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-12 h-12 md:w-16 md:h-16 text-zinc-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{company.name}</h1>
                {company.verificationBadge !== 'none' && (
                  <div className="px-2 py-1 bg-emerald-950/40 border border-emerald-900/60 rounded-lg flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">Verified</span>
                  </div>
                )}
              </div>

              {company.tagline && (
                <p className="text-zinc-400 text-lg mb-4">{company.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>{company.industry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{company.size} employees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{company.activeJobsCount} open positions</span>
                </div>
                {company.corporateLink && (
                  <a 
                    href={company.corporateLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-zinc-400 hover:text-white transition"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 border-b border-zinc-900">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-6 py-3 text-sm font-medium transition relative ${
                activeTab === 'jobs' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Open Positions
              {activeTab === 'jobs' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-3 text-sm font-medium transition relative ${
                activeTab === 'about' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              About Us
              {activeTab === 'about' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium transition relative ${
                activeTab === 'overview' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Overview
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* JOBS TAB */}
        {activeTab === 'jobs' && (
          <div>
            {/* Search & Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search positions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                  />
                </div>
                
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="">All Departments</option>
                  {getDepartments().map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="">All Job Types</option>
                  {getJobTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  value={locationTypeFilter}
                  onChange={(e) => setLocationTypeFilter(e.target.value)}
                  className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
                >
                  <option value="">All Locations</option>
                  {getLocationTypes().map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-zinc-500">
                Showing {filteredJobs.length} of {jobs.length} positions
              </div>
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/30 border border-zinc-900 rounded-xl">
                  <Briefcase className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No positions found matching your criteria.</p>
                </div>
              ) : (
                filteredJobs.map(job => (
                  <div 
                    key={job.id}
                    onClick={() => handleJobClick(job.id, job.hasApplied)}
                    className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-900/60 hover:border-zinc-700 transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white group-hover:text-zinc-100 transition flex-1">
                            {job.title}
                          </h3>
                          
                          {/* Application Status Badge */}
                          {job.hasApplied ? (
                            <div className="flex items-center gap-2">
                              {getStatusBadge(job.applicationStatus)}
                            </div>
                          ) : (
                            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition flex-shrink-0" />
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 mb-3">
                          {job.department && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {job.department}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {job.location}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs">
                            {job.jobType}
                          </span>
                          {job.locationType && (
                            <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs">
                              {job.locationType}
                            </span>
                          )}
                          {job.experienceRequired && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {job.experienceRequired}
                            </span>
                          )}
                        </div>

                        {job.salaryRange && (
                          <div className="text-sm text-emerald-400 font-medium mb-2">
                            {job.salaryRange}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-zinc-600">
                          <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{job.applicationsCount} applicants</span>
                          {job.deadline && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Apply by {new Date(job.deadline).toLocaleDateString()}
                              </span>
                            </>
                          )}
                          {job.hasApplied && job.appliedAt && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-emerald-500">
                                <Check className="w-3 h-3" />
                                Applied {new Date(job.appliedAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ABOUT TAB - Keep existing implementation */}
        {activeTab === 'about' && (
          <div className="space-y-12">
            {/* ... existing about tab code ... */}
          </div>
        )}

        {/* OVERVIEW TAB - Keep existing implementation */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ... existing overview tab code ... */}
          </div>
        )}
      </main>
    </div>
  );
}