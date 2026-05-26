// app/dashboard/jobs/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Calendar,
  Users,
  Target,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchJobDetails();
      checkApplicationStatus();
    }
  }, [params.id]);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/jobs/${params.id}`);
      if (response.data.success) {
        setJob(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      alert('Failed to load job details');
      router.push('/dashboard/jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await api.get('/jobseeker/applications');
      const applications = response.data.data || [];
      const existingApp = applications.find((app: any) => app.jobPostingId === params.id);
      if (existingApp) {
        setHasApplied(true);
        setApplicationId(existingApp.id);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const getJobTypeColor = (type: string) => {
    const colors: any = {
      'Full-time': 'bg-green-500/10 text-green-500 border-green-500/20',
      'Part-time': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'Contract': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'Freelance': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'Spot': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const getLocationTypeIcon = (type: string) => {
    if (type === 'Remote') return '🌐';
    if (type === 'Hybrid') return '🏢';
    return '📍';
  };

  const calculateDaysAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Posted today';
    if (days === 1) return 'Posted yesterday';
    return `Posted ${days} days ago`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `Check out this job at ${job.company.name}`,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Briefcase className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Job not found</h3>
          <p className="text-gray-500 mb-6">This job posting may have been removed</p>
          <Link
            href="/dashboard/jobs"
            className="inline-block px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button and Share */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Jobs</span>
        </Link>
        <button
          onClick={handleShare}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl text-gray-400 hover:text-white hover:border-white transition-all"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
          <div className="flex items-start space-x-4 flex-1">
            {job.company.logoUrl ? (
              <img
                src={job.company.logoUrl}
                alt={job.company.name}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 size={40} className="text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-white mb-2 break-words">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-gray-400 mb-2">
                <span className="text-lg">{job.company.name}</span>
                {job.company.verificationBadge === 'verified' && (
                  <span className="inline-flex items-center bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg text-xs border border-blue-500/20">
                    <CheckCircle2 size={12} className="mr-1" />
                    Verified Company
                  </span>
                )}
              </div>
              {job.department && (
                <p className="text-gray-500">{job.department}</p>
              )}
              <p className="text-sm text-gray-600 mt-2">{calculateDaysAgo(job.createdAt)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            {hasApplied ? (
              <div className="space-y-2">
                <div className="px-6 py-3 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl font-medium text-center flex items-center justify-center space-x-2">
                  <CheckCircle2 size={20} />
                  <span>Application Submitted</span>
                </div>
                <Link
                  href={`/dashboard/applications/${applicationId}`}
                  className="inline-flex items-center justify-center space-x-2 px-6 py-2 bg-[#2c2c2e] text-white rounded-xl hover:bg-[#3c3c3e] transition-colors text-sm"
                >
                  <span>View Application Status</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setShowApplicationModal(true)}
                className="px-8 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transition-colors text-lg"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black rounded-xl p-4">
            <div className="flex items-center space-x-2 text-gray-500 mb-2">
              <Clock size={16} />
              <span className="text-xs">Job Type</span>
            </div>
            <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium border ${getJobTypeColor(job.jobType)}`}>
              {job.jobType}
            </span>
          </div>

          <div className="bg-black rounded-xl p-4">
            <div className="flex items-center space-x-2 text-gray-500 mb-2">
              <MapPin size={16} />
              <span className="text-xs">Work Mode</span>
            </div>
            <p className="text-white font-medium flex items-center">
              <span className="mr-2">{getLocationTypeIcon(job.locationType)}</span>
              {job.locationType}
            </p>
          </div>

          {job.salaryRange ? (
            <div className="bg-black rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-500 mb-2">
                <DollarSign size={16} />
                <span className="text-xs">Salary Range</span>
              </div>
              <p className="text-white font-medium">{job.salaryRange}</p>
            </div>
          ) : (
            <div className="bg-black rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-500 mb-2">
                <DollarSign size={16} />
                <span className="text-xs">Salary</span>
              </div>
              <p className="text-white font-medium">Not disclosed</p>
            </div>
          )}

          <div className="bg-black rounded-xl p-4">
            <div className="flex items-center space-x-2 text-gray-500 mb-2">
              <Users size={16} />
              <span className="text-xs">Openings</span>
            </div>
            <p className="text-white font-medium">{job.openings} position{job.openings > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Additional Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {job.location && (
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="text-gray-400" size={20} />
              <h3 className="text-white font-medium">Office Location</h3>
            </div>
            <p className="text-gray-400">{job.location}</p>
          </div>
        )}

        {job.experienceRequired && (
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Briefcase className="text-gray-400" size={20} />
              <h3 className="text-white font-medium">Experience Required</h3>
            </div>
            <p className="text-gray-400">{job.experienceRequired}</p>
          </div>
        )}

        {job.deadline && (
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="text-gray-400" size={20} />
              <h3 className="text-white font-medium">Application Deadline</h3>
            </div>
            <p className="text-gray-400">
              {new Date(job.deadline).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Required Skills */}
      {job.requiredSkills && job.requiredSkills.length > 0 && (
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="text-gray-400" size={20} />
            <h3 className="text-white font-medium text-lg">Required Skills</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {job.requiredSkills.map((skill: string, idx: number) => (
              <span
                key={idx}
                className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Job Description */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
        <h3 className="text-white font-medium text-lg mb-4">Job Description</h3>
        <div
          className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed"
          dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }}
        />
      </div>

      {/* Company Info */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
        <h3 className="text-white font-medium text-lg mb-4 flex items-center space-x-2">
          <Building2 size={20} />
          <span>About {job.company.name}</span>
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-black rounded-xl">
              <span className="text-gray-500">Industry</span>
              <span className="text-white font-medium">{job.company.industry}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black rounded-xl">
              <span className="text-gray-500">Company Size</span>
              <span className="text-white font-medium">{job.company.size}</span>
            </div>
          </div>
          {job._count && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="text-blue-500" size={20} />
                <span className="text-blue-300">Active applicants for this role</span>
              </div>
              <span className="text-blue-500 font-semibold text-lg">{job._count.applications}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      {!hasApplied && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Ready to Apply?</h3>
          <p className="text-gray-400 mb-6">
            Submit your application now and take the next step in your career
          </p>
          <button
            onClick={() => setShowApplicationModal(true)}
            className="px-8 py-3 bg-white text-black rounded-xl font-medium hover:bg-gray-100 transition-colors text-lg"
          >
            Apply for this Position
          </button>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && (
        <ApplicationModal
          job={job}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={() => {
            setShowApplicationModal(false);
            setHasApplied(true);
            checkApplicationStatus();
          }}
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
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                !uploadNew
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Select Existing Resume
            </button>
            <button
              onClick={() => setUploadNew(true)}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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
                      className="w-5 h-5"
                    />
                    <FileText className="text-gray-400" size={24} />
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{resume.name}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-500">
                          {resume.source === 'uploaded' ? '📄 Uploaded' : '✨ Generated'}
                        </span>
                        {resume.atsScore && (
                          <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded border border-green-500/20">
                            ATS Score: {resume.atsScore}%
                          </span>
                        )}
                      </div>
                    </div>
                    <CheckCircle2
                      className={selectedResumeId === resume.id ? 'text-white' : 'text-gray-600'}
                      size={24}
                    />
                  </label>
                ))
              )}
            </div>
          )}

          {/* Upload New Resume */}
          {uploadNew && (
            <div>
              <label className="block border-2 border-dashed border-[#2c2c2e] rounded-xl p-10 text-center hover:border-white transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {newResumeFile ? (
                  <div className="space-y-3">
                    <FileText className="mx-auto text-white" size={48} />
                    <p className="text-white font-medium text-lg">{newResumeFile.name}</p>
                    <p className="text-gray-500 text-sm">
                      {(newResumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setNewResumeFile(null);
                      }}
                      className="text-red-500 hover:text-red-400 text-sm font-medium"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="mx-auto text-gray-600" size={48} />
                    <p className="text-white font-medium">Click to upload resume</p>
                    <p className="text-gray-500 text-sm">PDF or DOCX (Max 10MB)</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex space-x-3">
            <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">Your resume will be analyzed</p>
              <p className="text-blue-400">
                We'll automatically match your resume against the job description to improve your chances of getting shortlisted.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2c2c2e] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#2c2c2e] text-white rounded-xl hover:bg-[#3c3c3e] transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!uploadNew && !selectedResumeId) || (uploadNew && !newResumeFile)}
            className="px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </span>
            ) : (
              'Submit Application'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}