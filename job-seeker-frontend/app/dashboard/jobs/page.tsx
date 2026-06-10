// app/dashboard/jobs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Lock
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';

export default function JobsPage() {
  const router = useRouter();
  const { showToast } = useGlassToast();

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

  // Fetch data when page, drop-down filters, or location string changes
  useEffect(() => {
    fetchJobs();
  }, [page, filters]);

  // Fetch data when user stops writing or clears the search query input box
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      // Reset to page 1 whenever search keyword updates to prevent pagination overflow
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
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12', // Sets limit parameter to match 12 per page
        ...(searchQuery.trim() && { search: searchQuery.trim() }), // Matches backend req.query.search
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
    } catch (error: any) {
      console.error('Error fetching positions:', error);
      // Optional authentication middleware allows requests, but intercept 401/500 faults gracefully
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

  const handleApplyClick = (job: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationModal(false);
    setSelectedJob(null);
    fetchJobs(); 
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-zinc-500 mb-6">Please sign in to view and apply for jobs</p>
          <button
            onClick={() => router.push('/login?redirect=/dashboard/jobs')}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-300 max-w-7xl mx-auto p-2 md:p-0 font-sans antialiased">
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-xl font-bold text-white tracking-tight sm:text-2xl">Explore Vacancies</h1>
        <p className="text-zinc-500 text-xs sm:text-sm mt-0.5 font-medium">
          Find matching positions across various roles and tech stacks
        </p>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-zinc-950 border border-zinc-900/80 rounded-xl p-4 shadow-xl shadow-black/20">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
            <input
              type="text"
              placeholder="Search by title, description or roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/40 border border-zinc-900 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
              className="px-3 py-2 bg-zinc-900/40 border border-zinc-900 rounded-xl text-xs text-zinc-400 focus:outline-none focus:border-zinc-800"
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
              className="px-3 py-2 bg-zinc-900/40 border border-zinc-900 rounded-xl text-xs text-zinc-400 focus:outline-none focus:border-zinc-800"
            >
              <option value="all">All Environments</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
              <input
                type="text"
                placeholder="Preferred location..."
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900/40 border border-zinc-900 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-800"
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border border-zinc-900 border-t-zinc-400 rounded-full animate-spin"></div>
            <p className="text-zinc-500 text-[11px] tracking-wide font-medium">Loading records...</p>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 text-center max-w-md mx-auto">
          <Briefcase className="mx-auto mb-3 text-zinc-700" size={24} />
          <h3 className="text-sm font-semibold text-white mb-1">No vacancies found</h3>
          <p className="text-zinc-500 text-xs mb-4">No current listings match your specific filtration criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilters({ jobType: 'all', locationType: 'all', location: '' });
            }}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const hasApplied = job.hasApplied === true;
              
              return (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="bg-zinc-950 border border-zinc-900/80 rounded-2xl p-5 hover:border-zinc-800 transition-all flex flex-col group relative"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {job.company.logoUrl ? (
                        <img
                          src={job.company.logoUrl}
                          alt={job.company.name}
                          className="w-9 h-9 rounded-xl border border-zinc-900 object-cover shrink-0 shadow-inner"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                          <Building2 size={15} className="text-zinc-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-zinc-200 text-xs font-bold truncate group-hover:text-white transition-colors">{job.company.name}</h3>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5 uppercase tracking-wide font-medium">{job.company.industry || 'Technology'}</p>
                      </div>
                    </div>
                    {job.company.verificationBadge === 'verified' && (
                      <span className="shrink-0 text-[9px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="mb-1">
                    <h4 className="text-sm font-bold text-zinc-100 tracking-tight group-hover:text-white truncate">
                      {job.title}
                    </h4>
                    {job.department && (
                      <p className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase mt-0.5">{job.department}</p>
                    )}
                  </div>

                  <div className="space-y-2 text-xs my-4 flex-1 text-zinc-400">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg">
                        {job.jobType}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-zinc-600" />
                        {job.locationType}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-zinc-500">
                      {job.location && (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin size={12} className="text-zinc-700" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      )}
                      {job.salaryRange && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={12} className="text-zinc-700" />
                          <span>{job.salaryRange}</span>
                        </div>
                      )}
                      {job.experienceRequired && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase size={12} className="text-zinc-700" />
                          <span>{job.experienceRequired} experience</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.requiredSkills.slice(0, 2).map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-zinc-900/40 text-zinc-400 text-[10px] rounded-md border border-zinc-900/60 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-zinc-900/20 text-zinc-600 text-[10px] font-bold">
                          +{job.requiredSkills.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t border-zinc-900/80 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock size={11} className="text-zinc-700" />
                        <span>{calculateDaysAgo(job.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-zinc-400 group-hover:text-white transition-colors font-medium">
                        <span>View position</span>
                        <ChevronRight size={13} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                    
                    {hasApplied ? (
                      <button
                        disabled
                        onClick={(e) => e.preventDefault()}
                        className="w-full py-2 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed shadow-inner"
                      >
                        <CheckCircle2 size={13} className="text-zinc-600" />
                        <span>{formatStatusLabel(job.applicationStatus)}</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleApplyClick(job, e)}
                        className="w-full py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
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
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs font-medium text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed hover:border-zinc-800 transition-colors"
              >
                Previous
              </button>
              <span className="text-zinc-600 text-xs font-medium tracking-wide">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs font-medium text-zinc-400 disabled:opacity-20 disabled:cursor-not-allowed hover:border-zinc-800 transition-colors"
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
      showToast('Document Missing', 'Please select a valid document archive.', 'info');
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
          `Successfully applied for ${job.title} at ${job.company.name}.`,
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
        <div className="p-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Submit Application</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">{job.title} — {job.company.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex p-1 bg-zinc-900/60 border border-zinc-900 rounded-xl">
            <button
              onClick={() => setUploadNew(false)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !uploadNew ? 'bg-zinc-950 text-white border border-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Saved Resumes
            </button>
            <button
              onClick={() => setUploadNew(true)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                uploadNew ? 'bg-zinc-950 text-white border border-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Upload Document
            </button>
          </div>

          {!uploadNew && (
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="w-4 h-4 border border-zinc-900 border-t-zinc-400 rounded-full animate-spin mx-auto"></div>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 bg-zinc-900/10 border border-zinc-900 rounded-xl p-4">
                  <FileText className="mx-auto mb-2 text-zinc-700" size={20} />
                  <p className="text-zinc-500 text-xs font-medium">No saved resumes found in profile account</p>
                </div>
              ) : (
                resumes.map((resume) => (
                  <label
                    key={resume.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedResumeId === resume.id
                        ? 'border-zinc-700 bg-zinc-900/40 shadow-inner'
                        : 'border-zinc-900 bg-transparent hover:border-zinc-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={resume.id}
                      checked={selectedResumeId === resume.id}
                      onChange={() => setSelectedResumeId(resume.id)}
                      className="accent-white w-3.5 h-3.5 text-zinc-950"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-zinc-200 font-semibold text-xs truncate">{resume.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-medium">
                        <span>{resume.source === 'uploaded' ? 'Uploaded PDF' : 'Generated Document'}</span>
                        {resume.atsScore && (
                          <span className="text-zinc-400 bg-zinc-900 px-1.5 py-0.2 border border-zinc-800 rounded-md">Match: {resume.atsScore}%</span>
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
              <label className="block border border-dashed border-zinc-900 bg-zinc-900/10 hover:bg-zinc-900/20 rounded-xl p-6 text-center hover:border-zinc-700 transition-all cursor-pointer">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                {newResumeFile ? (
                  <div className="space-y-2">
                    <FileText className="mx-auto text-zinc-300 animate-pulse" size={24} />
                    <p className="text-zinc-200 font-semibold text-xs max-w-xs truncate mx-auto">{newResumeFile.name}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">{(newResumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      onClick={(e) => { e.preventDefault(); setNewResumeFile(null); }}
                      className="text-red-400 text-[11px] font-medium hover:underline pt-1 inline-block"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Upload className="mx-auto text-zinc-600" size={20} />
                    <p className="text-zinc-300 font-medium text-xs">Choose document archive</p>
                    <p className="text-zinc-600 text-[10px]">Supports PDF or DOCX formats up to 10MB</p>
                  </div>
                )}
              </label>
            </div>
          )}

          <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 flex gap-2.5">
            <AlertCircle className="text-zinc-600 shrink-0 mt-0.5" size={14} />
            <div className="text-[11px] text-zinc-500 font-medium leading-relaxed">
              <p className="text-zinc-400 font-semibold mb-0.5">Automated screening note</p>
              <p>Your resume credentials will be reviewed by the internal system parser to map keyword matching states before HR notifications open.</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-900 flex items-center justify-end gap-2 bg-zinc-900/20">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!uploadNew && !selectedResumeId) || (uploadNew && !newResumeFile)}
            className="px-4 py-1.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}