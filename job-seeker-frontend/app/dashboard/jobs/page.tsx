'use client';

import { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    locationType: 'all',
    location: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
    fetchMyApplications();
  }, [page, filters]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, jobs]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(filters.jobType !== 'all' && { jobType: filters.jobType }),
        ...(filters.locationType !== 'all' && { locationType: filters.locationType }),
        ...(filters.location && { location: filters.location }),
      });

      const response = await api.get(`/jobs?${params}`);
      
      if (response.data.success) {
        setJobs(response.data.data);
        setFilteredJobs(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const response = await api.get('/jobseeker/applications');
      if (response.data.success) {
        const jobIds = new Set(response.data.data.map((app: any) => app.jobPostingId));
        setAppliedJobs(jobIds);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const filtered = jobs.filter(job =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredJobs(filtered);
  };

  const handleApplyClick = (job: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationModal(false);
    setAppliedJobs(prev => new Set([...prev, selectedJob.id]));
    setSelectedJob(null);
  };

  const getLocationTypeIcon = (type: string) => {
    if (type === 'Remote') return '🌐';
    if (type === 'Hybrid') return '🏢';
    return '📍';
  };

  const calculateDaysAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'TODAY';
    if (days === 1) return 'YESTERDAY';
    return `${days} DAYS AGO`;
  };

  return (
    <div className="space-y-5 font-mono text-zinc-300 max-w-7xl mx-auto p-4 md:p-0">
      {/* Page Title Context */}
      <div>
        <h1 className="text-xl font-bold text-white uppercase tracking-wider">Browse Index Metrics</h1>
        <p className="text-zinc-600 text-[11px] uppercase tracking-tight mt-0.5">
          {filteredJobs.length} Node Pipeline Position{filteredJobs.length !== 1 ? 's' : ''} Online
        </p>
      </div>

      {/* Query Search Matrix Filters Panel */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4">
        <div className="space-y-3">
          {/* Input Interface */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
            <input
              type="text"
              placeholder="QUERY JOB TITLE, ENTERPRISE ENTITY, OR ORG DEPT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-zinc-900 rounded-lg text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 uppercase"
            />
          </div>

          {/* Selector Drops Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
              className="px-3 py-2 bg-black border border-zinc-900 rounded-lg text-xs text-zinc-400 focus:outline-none focus:border-zinc-700 uppercase"
            >
              <option value="all">All Job Tiers</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
              <option value="Spot">Spot</option>
            </select>

            <select
              value={filters.locationType}
              onChange={(e) => setFilters({ ...filters, locationType: e.target.value })}
              className="px-3 py-2 bg-black border border-zinc-900 rounded-lg text-xs text-zinc-400 focus:outline-none focus:border-zinc-700 uppercase"
            >
              <option value="all">All Ecosystems</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
              <input
                type="text"
                placeholder="REGIONAL BOUND"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full pl-9 pr-4 py-2 bg-black border border-zinc-900 rounded-lg text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Allocation Blocks */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-6 h-6 border border-zinc-800 border-t-white rounded-full animate-spin"></div>
            <p className="text-zinc-600 text-[10px] tracking-widest uppercase">Fetching Stream...</p>
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-12 text-center max-w-xl mx-auto">
          <Briefcase className="mx-auto mb-3 text-zinc-700" size={28} />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Zero Node Matches</h3>
          <p className="text-zinc-600 text-[11px] mb-4 uppercase">No current records conform to active search coordinates.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilters({ jobType: 'all', locationType: 'all', location: '' });
            }}
            className="px-4 py-2 bg-zinc-900 text-white rounded text-xs font-bold uppercase tracking-wide border border-zinc-800 hover:border-zinc-600 transition-colors"
          >
            Reset Matrix Parameters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => {
              const hasApplied = appliedJobs.has(job.id);
              
              return (
                <Link
                  key={job.id}
                  href={`/dashboard/jobs/${job.id}`}
                  className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 hover:border-zinc-700 transition-all flex flex-col group relative cursor-pointer"
                >
                  {/* Card Header Metadata Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      {job.company.logoUrl ? (
                        <img
                          src={job.company.logoUrl}
                          alt={job.company.name}
                          className="w-9 h-9 rounded border border-zinc-900 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0">
                          <Building2 size={16} className="text-zinc-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-white text-xs font-bold truncate uppercase tracking-tight">{job.company.name}</h3>
                        <p className="text-[10px] text-zinc-600 truncate uppercase mt-0.5">{job.company.industry || 'Tech Sector'}</p>
                      </div>
                    </div>
                    {job.company.verificationBadge === 'verified' && (
                      <div className="bg-zinc-900 text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-tighter flex-shrink-0">
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Core Job Header Position */}
                  <div className="mb-1">
                    <h4 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors truncate uppercase">
                      {job.title}
                    </h4>
                  </div>

                  {/* Operational Department Tag */}
                  {job.department && (
                    <p className="text-[10px] text-zinc-500 uppercase tracking-tight mb-3 font-semibold">{job.department}</p>
                  )}

                  {/* Technical Specifications Blocks */}
                  <div className="space-y-1.5 text-[11px] mb-4 flex-1 text-zinc-500">
                    <div className="flex items-center space-x-2">
                      <span className="text-zinc-300 font-bold uppercase text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                        {job.jobType}
                      </span>
                      <span className="flex items-center text-zinc-400 font-medium uppercase">
                        <span className="mr-1">{getLocationTypeIcon(job.locationType)}</span>
                        {job.locationType}
                      </span>
                    </div>

                    {job.location && (
                      <div className="flex items-center space-x-1.5 truncate uppercase">
                        <MapPin size={11} className="text-zinc-700" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}

                    {job.salaryRange && (
                      <div className="flex items-center space-x-1.5 uppercase">
                        <DollarSign size={11} className="text-zinc-700" />
                        <span>{job.salaryRange}</span>
                      </div>
                    )}

                    {job.experienceRequired && (
                      <div className="flex items-center space-x-1.5 uppercase">
                        <Briefcase size={11} className="text-zinc-700" />
                        <span>{job.experienceRequired} EXP</span>
                      </div>
                    )}
                  </div>

                  {/* Embedded Technical Skills Arrays */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.requiredSkills.slice(0, 2).map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-black text-zinc-400 text-[10px] rounded border border-zinc-900 uppercase font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-black text-zinc-500 text-[10px] rounded border border-zinc-900 font-bold">
                          +{job.requiredSkills.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Core Card Bottom Footer Controls */}
                  <div className="pt-3 border-t border-zinc-900 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-600">
                      <div className="flex items-center space-x-1 uppercase">
                        <Clock size={10} />
                        <span>{calculateDaysAgo(job.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-0.5 text-zinc-400 group-hover:text-white transition-colors uppercase font-bold text-[9px] tracking-wide">
                        <span>Inspect Node</span>
                        <ChevronRight size={12} />
                      </div>
                    </div>
                    
                    {hasApplied ? (
                      <button
                        disabled
                        onClick={(e) => e.preventDefault()}
                        className="w-full py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-not-allowed"
                      >
                        <CheckCircle2 size={12} className="text-zinc-600" />
                        <span>Deployment Complete</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleApplyClick(job, e)}
                        className="w-full py-1.5 bg-white text-black rounded text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                      >
                        Apply Payload
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Interface Pagination Array Node Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-1 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-xs text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed uppercase font-bold hover:border-zinc-800 transition-colors"
              >
                Prev Block
              </button>
              <span className="px-3 py-1.5 text-zinc-600 text-xs">
                BLOCK {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded text-xs text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed uppercase font-bold hover:border-zinc-800 transition-colors"
              >
                Next Block
              </button>
            </div>
          )}
        </>
      )}

      {/* Embedded Transmit Modal Core Entry */}
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

// ─── LOCAL APPLICATION INJECTED MODAL SUBSYSTEM COMPONENT ───
function ApplicationModal({
  job,
  onClose,
  onSuccess,
}: {
  job: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        alert('Only PDF and DOCX files are allowed');
        return;
      }
      setNewResumeFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!uploadNew && !selectedResumeId) {
      alert('Please select a resume');
      return;
    }

    if (uploadNew && !newResumeFile) {
      alert('Please upload a resume');
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
        alert('Application submitted successfully!');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Application error:', error);
      alert(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-black border border-zinc-900 rounded-xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950">
          <div>
            <h2 className="text-xs uppercase font-bold tracking-widest text-white">Transmit Payload Credentials</h2>
            <p className="text-[10px] text-zinc-500 uppercase mt-0.5 tracking-tight">target: {job.company.name} // {job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-900 rounded transition-colors text-zinc-500 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Selection Pipeline Data Blocks */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex p-1 bg-zinc-950 border border-zinc-900 rounded-lg">
            <button
              onClick={() => setUploadNew(false)}
              className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-all ${
                !uploadNew
                  ? 'bg-zinc-900 text-white border border-zinc-800'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              Registry Records
            </button>
            <button
              onClick={() => setUploadNew(true)}
              className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-all ${
                uploadNew
                  ? 'bg-zinc-900 text-white border border-zinc-800'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              External Ingestion
            </button>
          </div>

          {/* Local Existing Registries */}
          {!uploadNew && (
            <div className="space-y-1.5">
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="w-4 h-4 border border-zinc-800 border-t-white rounded-full animate-spin mx-auto"></div>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-6 bg-zinc-950 border border-zinc-900 rounded-lg p-4">
                  <FileText className="mx-auto mb-2 text-zinc-700" size={20} />
                  <p className="text-zinc-500 text-[10px] uppercase font-bold">No Local Registry Files Identified</p>
                </div>
              ) : (
                resumes.map((resume) => (
                  <label
                    key={resume.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedResumeId === resume.id
                        ? 'border-zinc-600 bg-zinc-950'
                        : 'border-zinc-900 bg-black hover:border-zinc-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={resume.id}
                      checked={selectedResumeId === resume.id}
                      onChange={() => setSelectedResumeId(resume.id)}
                      className="accent-white w-3.5 h-3.5"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-zinc-300 font-bold text-xs truncate uppercase tracking-tight">{resume.name}</h4>
                      <div className="flex items-center space-x-2 mt-0.5 text-[9px] uppercase tracking-tighter text-zinc-500">
                        <span>{resume.source === 'uploaded' ? 'Static Context' : 'Model Output'}</span>
                        {resume.atsScore && (
                          <span className="text-zinc-400 bg-zinc-900 px-1 border border-zinc-800 rounded">ATS: {resume.atsScore}%</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          {/* Upload New Data Payload */}
          {uploadNew && (
            <div>
              <label className="block border border-dashed border-zinc-900 bg-zinc-950/40 rounded-lg p-6 text-center hover:border-zinc-700 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {newResumeFile ? (
                  <div className="space-y-1.5">
                    <FileText className="mx-auto text-white" size={24} />
                    <p className="text-white font-bold text-xs max-w-xs truncate mx-auto uppercase tracking-tight">{newResumeFile.name}</p>
                    <p className="text-zinc-600 text-[9px]">{(newResumeFile.size / 1024 / 1024).toFixed(2)} MB ARCHIVE</p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setNewResumeFile(null);
                      }}
                      className="text-red-400 text-[10px] uppercase font-bold underline underline-offset-2 pt-1 inline-block"
                    >
                      Clear File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Upload className="mx-auto text-zinc-700" size={22} />
                    <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Stream Upload Socket</p>
                    <p className="text-zinc-600 text-[9px] uppercase">PDF, DOCX Tiers (MAX 10MB CAP)</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Evaluation Block Notice */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-3 flex space-x-2.5">
            <AlertCircle className="text-zinc-600 flex-shrink-0 mt-0.5" size={14} />
            <div className="text-[10px] text-zinc-500 uppercase tracking-tight font-medium leading-normal">
              <p className="text-zinc-400 font-bold tracking-wider mb-0.5">Automated Parser Query</p>
              <p>Injected structures deploy through compilation checks to track compatibility scores before record storage indexing routines execution.</p>
            </div>
          </div>
        </div>

        {/* Modal Base Triggers */}
        <div className="p-3.5 border-t border-zinc-900 flex items-center justify-end space-x-1.5 bg-zinc-950">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] uppercase font-bold tracking-wider transition-colors"
          >
            Abort Channel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!uploadNew && !selectedResumeId) || (uploadNew && !newResumeFile)}
            className="px-4 py-1.5 bg-white text-black rounded text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Syncing...' : 'Deploy Payload'}
          </button>
        </div>
      </div>
    </div>
  );
}