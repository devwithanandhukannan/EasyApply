'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/app/lib/axios';
import { 
  Building2, Search, CheckCircle, Briefcase, 
  MapPin, Clock, DollarSign, ChevronRight, Layers, Tag 
} from 'lucide-react';

interface CompanyContext {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string;
  size: string;
  verificationBadge: string;
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
  company: CompanyContext;
  _count?: {
    applications: number;
  };
}

export default function JobsDirectory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  
  // Custom Filter Vectors
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [verifiedCompaniesOnly, setVerifiedCompaniesOnly] = useState(false);

  useEffect(() => {
    loadPublicJobs();
  }, []);

  useEffect(() => {
    applyFiltersPipeline();
  }, [searchQuery, departmentFilter, jobTypeFilter, verifiedCompaniesOnly, jobs]);

  const loadPublicJobs = async () => {
    setLoading(true);
    try {
      // Hitting your updated comprehensive endpoint
      const res = await axios.get('/public/public');
      if (res.data.success) {
        setJobs(res.data.data || []);
      }
    } catch (error) {
      console.error('Failed to resolve public jobs pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersPipeline = () => {
    let filtered = jobs;
    const now = new Date();

    // 1. Dynamic Check: Drop past deadline rows automatically from current search view
    filtered = filtered.filter(job => {
      if (!job.deadline) return true;
      return new Date(job.deadline) >= now;
    });

    // 2. Verified Filter Vector
    if (verifiedCompaniesOnly) {
      filtered = filtered.filter(job => job.company?.verificationBadge === 'verified');
    }

    // 3. Dropdown Selection Parameters
    if (departmentFilter) {
      filtered = filtered.filter(job => job.department === departmentFilter);
    }

    if (jobTypeFilter) {
      filtered = filtered.filter(job => job.jobType === jobTypeFilter);
    }

    // 4. Global Keyword Matching (Title, Company, Location, Department, or Skills)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => {
        const titleMatch = job.title.toLowerCase().includes(query);
        const companyMatch = job.company?.name.toLowerCase().includes(query) || false;
        const locationMatch = job.location?.toLowerCase().includes(query) || false;
        const deptMatch = job.department?.toLowerCase().includes(query) || false;
        
        let skillsMatch = false;
        if (Array.isArray(job.requiredSkills)) {
          skillsMatch = job.requiredSkills.some(skill => 
            String(skill).toLowerCase().includes(query)
          );
        }

        return titleMatch || companyMatch || locationMatch || deptMatch || skillsMatch;
      });
    }

    setFilteredJobs(filtered);
  };

  const getUniqueDepartments = () => [...new Set(jobs.map(j => j.department).filter(Boolean))];
  const getUniqueJobTypes = () => [...new Set(jobs.map(j => j.jobType).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(39,39,42,0.2)_0%,transparent_70%)]" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="w-10 h-10 border-2 border-zinc-800 border-t-zinc-200 rounded-full animate-spin" />
          <p className="text-zinc-400 text-xs tracking-widest uppercase font-medium">Syncing Global Openings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans">
      
      {/* HERO HEADER */}
      <header className="relative border-b border-zinc-900/60 bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(39,39,42,0.15)_0%,transparent_50%)] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">Explore Openings</h1>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl font-normal leading-relaxed">
            Discover active job positions, technology pipelines, and verified career tracks open across the landscape.
          </p>
        </div>
      </header>

      {/* FILTER SYSTEM */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        
        <div className="mb-8 bg-zinc-950/40 backdrop-blur-md border border-zinc-900 rounded-2xl p-4 md:p-5 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Search jobs by title, company, skills, or workspace keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900/60 transition"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900/60 transition"
            >
              <option value="">All Departments</option>
              {getUniqueDepartments().map(dept => (
                <option key={dept} value={dept || ''}>{dept}</option>
              ))}
            </select>

            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="px-3 py-2.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900/60 transition"
            >
              <option value="">All Arrangements</option>
              {getUniqueJobTypes().map(type => (
                <option key={type} value={type || ''}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-900/40">
            <label className="flex items-center gap-2.5 text-xs font-medium text-zinc-400 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={verifiedCompaniesOnly}
                onChange={(e) => setVerifiedCompaniesOnly(e.target.checked)}
                className="w-4 h-4 rounded-md bg-zinc-900 border-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 checked:bg-zinc-100 transition"
              />
              <span className="group-hover:text-zinc-300 transition-colors">Show verified companies only</span>
            </label>

            <div className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              Registry Match: {filteredJobs.length} positions open
            </div>
          </div>
        </div>

        {/* FULL WIDTH STACKED JOB ROW ENTRIES */}
        <div className="space-y-3.5">
          {filteredJobs.map(job => (
            <div
              key={job.id}
              onClick={() => router.push(`/careers/${job.companyId}/jobs/${job.id}`)}
              className="w-full bg-zinc-950/40 backdrop-blur-md border border-zinc-900/80 hover:border-zinc-700/80 rounded-2xl p-5 hover:bg-zinc-900/20 transition-all duration-300 cursor-pointer group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl"
            >
              {/* Left Subtle Highlight Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-transparent group-hover:bg-zinc-500 transition-colors" />

              {/* Job Branding and Stack Details */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                
                {/* Clickable Area for Company Profile specifically */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents clicking the logo from going to the job page
                    router.push(`/careers/${job.companyId}`);
                  }}
                  className="w-14 h-14 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/60 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md hover:border-zinc-600 transition"
                  title="Inspect Core Hub Profile"
                >
                  {job.company?.logoUrl ? (
                    <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-zinc-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-zinc-100 tracking-tight group-hover:text-white transition-colors truncate">
                      {job.title}
                    </h3>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/careers/${job.companyId}`);
                      }}
                      className="text-[11px] text-zinc-400 font-semibold bg-zinc-900/60 px-2 py-0.5 rounded-md border border-zinc-800 hover:text-white hover:bg-zinc-800 transition"
                    >
                      {job.company?.name || 'Unknown Company'}
                    </button>

                    {job.company?.verificationBadge === 'verified' && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {/* Metadata Indicators Row */}
                  <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-zinc-400 font-medium">
                    {job.department && (
                      <span className="text-zinc-500 font-medium">{job.department}</span>
                    )}
                    <span className="text-zinc-800">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-600" />
                      {job.location || job.locationType || 'Remote'}
                    </span>
                    {job.experienceRequired && (
                      <>
                        <span className="text-zinc-800">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-600" />
                          {job.experienceRequired}
                        </span>
                      </>
                    )}
                    {job.salaryRange && (
                      <>
                        <span className="text-zinc-800">•</span>
                        <span className="flex items-center gap-1 text-emerald-500/90 font-semibold">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          {job.salaryRange}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Render Core Skills Layer */}
                  {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {job.requiredSkills.map((skill: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900/40 border border-zinc-800/40 rounded-md text-[10px] text-zinc-400 font-mono">
                          <Tag className="w-2.5 h-2.5 text-zinc-600" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Layout Traversal Indicator */}
              <div className="flex items-center justify-between md:justify-end gap-6 border-t border-zinc-900/40 md:border-t-0 pt-3 md:pt-0 flex-shrink-0">
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                  <div className="flex flex-col items-start md:items-end gap-1">
                    <span className="px-2.5 py-1 bg-zinc-900/40 border border-zinc-900 shadow-sm rounded-lg text-zinc-300 text-[10px] font-bold tracking-wider uppercase">
                      {job.jobType}
                    </span>
                    {job.deadline && (
                      <span className="text-[10px] text-zinc-500">
                        Until: {new Date(job.deadline).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-center text-zinc-500 group-hover:text-zinc-100 group-hover:bg-zinc-800/60 group-hover:border-zinc-600 transition-all shadow-inner">
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* EMPTY STATE COMPONENT */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-16 bg-zinc-950/40 backdrop-blur-md border border-dashed border-zinc-800/60 rounded-2xl mt-4">
            <Layers className="w-10 h-10 text-zinc-700 mx-auto mb-3.5" />
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">No Active Positions Match</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">Try clear-resetting search configurations or adjustment criteria vectors.</p>
          </div>
        )}
      </main>
    </div>
  );
}