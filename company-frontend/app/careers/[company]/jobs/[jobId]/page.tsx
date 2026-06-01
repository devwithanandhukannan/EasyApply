'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { publicAPI } from '@/app/lib/api/public';
import { usePublicAuth } from '@/app/contexts/PublicAuthContext';
import { 
  Building2, MapPin, Briefcase, Clock, DollarSign, 
  Calendar, Users, ChevronLeft, CheckCircle, ExternalLink,
  Check, AlertCircle, Lock
} from 'lucide-react';

interface JobDetails {
  id: string;
  title: string;
  department: string | null;
  description: string;
  jobType: string;
  locationType: string | null;
  location: string | null;
  experienceRequired: string | null;
  requiredSkills: any;
  salaryRange: string | null;
  deadline: string | null;
  openings: number;
  status: string;
  createdAt: string;
  applicationsCount: number;
  hasApplied: boolean;
  applicationStatus: string | null;
  appliedAt: string | null;
  company: {
    id: string;
    name: string;
    logoUrl: string | null;
    industry: string;
    size: string;
    tagline: string | null;
    verificationBadge: string;
  };
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = usePublicAuth();
  const companyIdentifier = params.company as string;
  const jobId = params.jobId as string;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetails | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadJobDetails();
    }
  }, [jobId, authLoading]);

  const loadJobDetails = async () => {
    setLoading(true);
    try {
      const res = await publicAPI.getJobDetails(jobId);
      if (res.success) {
        setJob(res.data);
      }
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/careers/${companyIdentifier}/jobs/${jobId}`);
      return;
    }
    router.push(`/jobs/${jobId}/apply`);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
          <p className="text-zinc-500 mb-4">This position may no longer be available.</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-white text-zinc-950 rounded-lg hover:bg-zinc-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const skills = job.requiredSkills?.skills || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to careers
          </button>

          {/* Application Status Banner */}
          {job.hasApplied && (
            <div className="mb-6 bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-200">
                  You applied for this position on {new Date(job.appliedAt!).toLocaleDateString()}
                </p>
                <p className="text-xs text-emerald-400/70">
                  Status: <span className="font-semibold">{job.applicationStatus?.replace(/_/g, ' ').toUpperCase()}</span>
                </p>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="mb-6 bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-zinc-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200">Sign in to apply for this job</p>
                <p className="text-xs text-zinc-500">Track your application and get updates</p>
              </div>
              <button
                onClick={() => router.push(`/login?redirect=/careers/${companyIdentifier}/jobs/${jobId}`)}
                className="px-4 py-2 bg-white text-zinc-950 rounded-lg hover:bg-zinc-200 text-sm font-medium"
              >
                Sign In
              </button>
            </div>
          )}

          <div className="flex items-start gap-6">
            {/* Company Logo */}
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
              {job.company.logoUrl ? (
                <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-zinc-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{job.title}</h1>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span className="font-medium text-white">{job.company.name}</span>
                    {job.company.verificationBadge !== 'none' && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                {job.department && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {job.department}
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                )}
                <div className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs">
                  {job.jobType}
                </div>
                {job.locationType && (
                  <div className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs">
                    {job.locationType}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Description */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <div 
                className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </section>

            {/* Required Skills */}
            {skills.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, idx: number) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Job Info & Apply */}
          <div className="space-y-6">
            
            {/* Apply Button */}
            {job.hasApplied ? (
              <div className="w-full px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold mb-1">
                  <Check className="w-5 h-5" />
                  <span>Application Submitted</span>
                </div>
                <p className="text-xs text-zinc-500">
                  {new Date(job.appliedAt!).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                disabled={!isAuthenticated}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  isAuthenticated
                    ? 'bg-white text-zinc-950 hover:bg-zinc-200'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {!isAuthenticated && <Lock className="w-4 h-4" />}
                {isAuthenticated ? 'Apply Now' : 'Sign In to Apply'}
              </button>
            )}

            {/* Job Info Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider">
                Job Information
              </h3>

              <div className="space-y-3 text-sm">
                {job.salaryRange && (
                  <div className="flex items-start gap-3 py-2 border-b border-zinc-900">
                    <DollarSign className="w-4 h-4 text-zinc-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-zinc-500 text-xs mb-1">Salary Range</div>
                      <div className="text-zinc-200 font-medium">{job.salaryRange}</div>
                    </div>
                  </div>
                )}

                {job.experienceRequired && (
                  <div className="flex items-start gap-3 py-2 border-b border-zinc-900">
                    <Clock className="w-4 h-4 text-zinc-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-zinc-500 text-xs mb-1">Experience</div>
                      <div className="text-zinc-200 font-medium">{job.experienceRequired}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 py-2 border-b border-zinc-900">
                  <Users className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-zinc-500 text-xs mb-1">Openings</div>
                    <div className="text-zinc-200 font-medium">{job.openings} position{job.openings > 1 ? 's' : ''}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2 border-b border-zinc-900">
                  <Users className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-zinc-500 text-xs mb-1">Applicants</div>
                    <div className="text-zinc-200 font-medium">{job.applicationsCount}</div>
                  </div>
                </div>

                {job.deadline && (
                  <div className="flex items-start gap-3 py-2">
                    <Calendar className="w-4 h-4 text-zinc-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-zinc-500 text-xs mb-1">Application Deadline</div>
                      <div className="text-zinc-200 font-medium">
                        {new Date(job.deadline).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">About {job.company.name}</h3>
              
              {job.company.tagline && (
                <p className="text-sm text-zinc-400 mb-4">{job.company.tagline}</p>
              )}

              <div className="space-y-2 text-sm text-zinc-500 mb-4">
                <div className="flex justify-between">
                  <span>Industry</span>
                  <span className="text-zinc-300">{job.company.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span>Company Size</span>
                  <span className="text-zinc-300">{job.company.size}</span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/careers/${companyIdentifier}`)}
                className="w-full px-4 py-2 border border-zinc-800 rounded-lg hover:bg-zinc-900 transition text-sm flex items-center justify-center gap-2"
              >
                View Company Profile
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}