// app/dashboard/jobs/page.tsx
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

  const getJobTypeColor = (type: string) => {
    const colors: any = {
      'Full-time': 'bg-green-500/10 text-green-500',
      'Part-time': 'bg-blue-500/10 text-blue-500',
      'Contract': 'bg-purple-500/10 text-purple-500',
      'Freelance': 'bg-orange-500/10 text-orange-500',
      'Spot': 'bg-pink-500/10 text-pink-500',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500';
  };

  const getLocationTypeIcon = (type: string) => {
    if (type === 'Remote') return '🌐';
    if (type === 'Hybrid') return '🏢';
    return '📍';
  };

  const calculateDaysAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Browse Jobs</h1>
          <p className="text-gray-500">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by job title, company, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black border border-[#2c2c2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
              className="px-4 py-3 bg-black border border-[#2c2c2e] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="all">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
              <option value="Spot">Spot</option>
            </select>

            <select
              value={filters.locationType}
              onChange={(e) => setFilters({ ...filters, locationType: e.target.value })}
              className="px-4 py-3 bg-black border border-[#2c2c2e] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="all">All Locations</option>
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="City name"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-black border border-[#2c2c2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading jobs...</p>
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-12 text-center">
          <Briefcase className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search or filters to find more opportunities
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilters({ jobType: 'all', locationType: 'all', location: '' });
            }}
            className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const hasApplied = appliedJobs.has(job.id);
              
              return (
                <div
                  key={job.id}
                  className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 hover:border-white transition-all group flex flex-col"
                >
                  {/* Company Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {job.company.logoUrl ? (
                        <img
                          src={job.company.logoUrl}
                          alt={job.company.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Building2 size={24} className="text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-medium">{job.company.name}</h3>
                        <p className="text-xs text-gray-500">{job.company.industry}</p>
                      </div>
                    </div>
                    {job.company.verificationBadge === 'verified' && (
                      <div className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs">
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  {/* Job Title */}
                  <Link href={`/dashboard/jobs/${job.id}`}>
                    <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-white/80 transition-colors cursor-pointer">
                      {job.title}
                    </h4>
                  </Link>

                  {/* Department */}
                  {job.department && (
                    <p className="text-sm text-gray-500 mb-4">{job.department}</p>
                  )}

                  {/* Job Details */}
                  <div className="space-y-2 mb-4 flex-1">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span className={`px-2 py-1 rounded text-xs ${getJobTypeColor(job.jobType)}`}>
                        {job.jobType}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">{getLocationTypeIcon(job.locationType)}</span>
                        {job.locationType}
                      </span>
                    </div>

                    {job.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <MapPin size={14} />
                        <span>{job.location}</span>
                      </div>
                    )}

                    {job.salaryRange && (
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <DollarSign size={14} />
                        <span>{job.salaryRange}</span>
                      </div>
                    )}

                    {job.experienceRequired && (
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Briefcase size={14} />
                        <span>{job.experienceRequired} experience</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requiredSkills.slice(0, 3).map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-black text-gray-400 text-xs rounded border border-[#2c2c2e]"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 3 && (
                        <span className="px-2 py-1 bg-black text-gray-400 text-xs rounded border border-[#2c2c2e]">
                          +{job.requiredSkills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer with Apply Button */}
                  <div className="pt-4 border-t border-[#2c2c2e] space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Clock size={12} />
                        <span>{calculateDaysAgo(job.createdAt)}</span>
                      </div>
                      <Link 
                        href={`/dashboard/jobs/${job.id}`}
                        className="flex items-center space-x-1 text-white hover:underline"
                      >
                        <span>View Details</span>
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                    
                    {hasApplied ? (
                      <button
                        disabled
                        className="w-full py-2.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl font-medium flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 size={16} />
                        <span>Applied</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleApplyClick(job, e)}
                        className="w-full py-2.5 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transition-colors"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Application Modal */}
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

// Application Modal Component
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#2c2c2e] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Apply to {job.company.name}</h2>
            <p className="text-gray-500 text-sm mt-1">{job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2c2c2e] rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Resume Selection Tabs */}
          <div className="flex space-x-2 bg-black rounded-xl p-1">
            <button
              onClick={() => setUploadNew(false)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !uploadNew
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Select Existing Resume
            </button>
            <button
              onClick={() => setUploadNew(true)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                uploadNew
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Upload New Resume
            </button>
          </div>

          {/* Select Existing Resume */}
          {!uploadNew && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 text-sm mt-2">Loading resumes...</p>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 bg-black rounded-xl border border-[#2c2c2e] p-6">
                  <FileText className="mx-auto mb-3 text-gray-600" size={40} />
                  <p className="text-gray-400 mb-4">No resumes found</p>
                  <button
                    onClick={() => setUploadNew(true)}
                    className="text-white hover:underline"
                  >
                    Upload a new resume
                  </button>
                </div>
              ) : (
                resumes.map((resume) => (
                  <label
                    key={resume.id}
                    className={`flex items-center space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedResumeId === resume.id
                        ? 'border-white bg-white/5'
                        : 'border-[#2c2c2e] hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resume"
                      value={resume.id}
                      checked={selectedResumeId === resume.id}
                      onChange={() => setSelectedResumeId(resume.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{resume.name}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-500">
                          {resume.source === 'uploaded' ? 'Uploaded' : 'Generated'}
                        </span>
                        {resume.atsScore && (
                          <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                            ATS: {resume.atsScore}%
                          </span>
                        )}
                      </div>
                    </div>
                    <CheckCircle2
                      className={selectedResumeId === resume.id ? 'text-white' : 'text-gray-600'}
                      size={20}
                    />
                  </label>
                ))
              )}
            </div>
          )}

          {/* Upload New Resume */}
          {uploadNew && (
            <div>
              <label className="block border-2 border-dashed border-[#2c2c2e] rounded-xl p-8 text-center hover:border-white transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {newResumeFile ? (
                  <div className="space-y-2">
                    <FileText className="mx-auto text-white" size={40} />
                    <p className="text-white font-medium">{newResumeFile.name}</p>
                    <p className="text-gray-500 text-sm">
                      {(newResumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setNewResumeFile(null);
                      }}
                      className="text-red-500 hover:text-red-400 text-sm"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto text-gray-600" size={40} />
                    <p className="text-white">Click to upload resume</p>
                    <p className="text-gray-500 text-sm">PDF or DOCX (Max 10MB)</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex space-x-3">
            <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Your resume will be analyzed</p>
              <p className="text-blue-400">
                We'll automatically match your resume against the job description to improve your chances.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2c2c2e] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#2c2c2e] text-white rounded-xl hover:bg-[#3c3c3e] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!uploadNew && !selectedResumeId) || (uploadNew && !newResumeFile)}
            className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}