'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import publicAPIService from '@/app/lib/public';
import { usePublicAuth } from '@/app/contexts/PublicAuthContext';
import { 
  Building2, MapPin, Briefcase, Clock, DollarSign, 
  Calendar, Users, ChevronLeft, CheckCircle, ExternalLink,
  Check, AlertCircle, Lock, Sparkles
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && jobId) {
      loadJobDetails();
    }
  }, [jobId, authLoading]);

  const loadJobDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await publicAPIService.getJobDetails(jobId);
      if (res.success) {
        setJob(res.data);
      } else {
        setError('Failed to load job details');
      }
    } catch (error: any) {
      console.error('Failed to load job:', error);
      setError(error.response?.data?.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/careers/${companyIdentifier}/jobs/${jobId}`);
      return;
    }
    router.push(`/dashboard/jobs/${jobId}`);
  };

  // Safe client-side Markdown helper to catch string format variants visible in Screenshot 2026-06-02 at 11.49.01 AM.jpg
  const renderFormattedDescription = (rawText: string) => {
    if (!rawText) return null;
    
    // If it already looks like real HTML elements, return safely
    if (rawText.includes('<p>') || rawText.includes('<div>') || rawText.includes('<br>')) {
      return <div dangerouslySetInnerHTML={{ __html: rawText }} />;
    }

    // Split text sections by Markdown headings
    const parts = rawText.split(/(###\s*\*\*.*?\*\*|###\s*.*?\n)/g);

    return (
      <div className="space-y-5 text-zinc-900 text-sm leading-relaxed font-normal">
        {parts.map((part, index) => {
          const cleanPart = part.trim();
          if (!cleanPart) return null;

          // Check if section matches a markdown title token
          if (cleanPart.startsWith('###')) {
            const titleText = cleanPart.replace(/###|\*\*/g, '').trim();
            return (
              <h3 key={index} className="text-zinc-950 font-bold text-base tracking-tight pt-2 first:pt-0">
                {titleText}
              </h3>
            );
          }

          // Check if segment features unformatted asterisk bullet delimiters
          if (cleanPart.includes('*')) {
            const lines = cleanPart.split(/(?=\s\*\s|\n\*\s)/g);
            const paragraphText = lines[0].trim().startsWith('*') ? '' : lines[0];
            const bulletItems = lines.filter(line => line.trim().startsWith('*'));

            return (
              <div key={index} className="space-y-3">
                {paragraphText && <p>{paragraphText.replace(/^\*/, '').trim()}</p>}
                <ul className="list-disc pl-5 space-y-2 text-zinc-800">
                  {bulletItems.map((bullet, bIdx) => (
                    <li key={bIdx} className="pl-1">
                      {bullet.replace(/^\s*\*\s*/, '').trim()}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          return <p key={index}>{cleanPart}</p>;
        })}
      </div>
    );
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm">Loading tracks node...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Job Not Found</h1>
          <p className="text-zinc-500 mb-6">
            {error || 'This position may no longer be available or has been removed.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => router.back()}
              className="px-6 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl hover:bg-zinc-800 transition font-semibold text-sm"
            >
              Go Back
            </button>
            <button 
              onClick={() => router.push('/dashboard/jobs')}
              className="px-6 py-3 bg-white text-zinc-950 rounded-xl hover:bg-zinc-200 transition font-semibold text-sm"
            >
              Browse Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const skills = job.requiredSkills?.skills || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans">
      
      {/* Header Pipeline */}
      <header className="border-b border-zinc-900/60 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button
            onClick={() => router.push(`/careers/${companyIdentifier}`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6 text-xs font-semibold uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {job.company.name} Hub
          </button>

          {/* Application Status Banner */}
          {job.hasApplied && isAuthenticated && (
            <div className="mb-6 bg-emerald-500/[0.02] backdrop-blur-md border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-200 tracking-tight">
                  Application Transmitted on {new Date(job.appliedAt!).toLocaleDateString()}
                </p>
                <p className="text-xs text-emerald-400 font-medium mt-0.5">
                  Pipeline Vector: <span className="underline decoration-emerald-500/30 underline-offset-2">{job.applicationStatus?.replace(/_/g, ' ').toUpperCase()}</span>
                </p>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="mb-6 bg-zinc-900/20 backdrop-blur-md border border-zinc-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-zinc-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200 tracking-tight">Sign in to apply for this job</p>
                  <p className="text-xs text-zinc-500">Track your application parameters and get infrastructure deployment updates.</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/login?redirect=/careers/${companyIdentifier}/jobs/${jobId}`)}
                className="w-full sm:w-auto px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl font-bold text-xs tracking-tight transition shadow-md whitespace-nowrap"
              >
                Sign In
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Company Logo Container */}
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xl">
              {job.company.logoUrl ? (
                <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-7 h-7 text-zinc-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{job.title}</h1>
                {job.company.verificationBadge !== 'none' && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Verified Hub</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-400 font-medium">
                <button 
                  onClick={() => router.push(`/careers/${companyIdentifier}`)}
                  className="font-bold text-zinc-300 hover:text-white transition underline underline-offset-4 decoration-zinc-800 hover:decoration-zinc-400"
                >
                  {job.company.name}
                </button>
                {job.department && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-zinc-600" />
                    {job.department}
                  </span>
                )}
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-600" />
                    {job.location}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  {job.jobType}
                </span>
                {job.locationType && (
                  <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                    {job.locationType}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Hub Contents */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Block - Interactive white glass reader */}
          <div className="lg:col-span-2 space-y-8">
            
            <section className="space-y-4">
              <h2 className="text-xs uppercase font-bold tracking-widest text-zinc-500">Job Description</h2>
              
              {/* WHITE GLASS CONTAINER WITH RICH TEXT RESOLVER */}
              <div className="w-full bg-white border border-zinc-200 shadow-[0_4px_24px_rgba(255,255,255,0.02)] rounded-2xl p-6 md:p-8">
                {renderFormattedDescription(job.description)}
              </div>
            </section>

            {/* Required Tech Skills Panel */}
            {skills.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs uppercase font-bold tracking-widest text-zinc-500">Core Parameters Required</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, idx: number) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-zinc-300 font-semibold shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Control Panels */}
          <div className="space-y-5">
            
            {/* Direct Link Action Hub */}
            {job.hasApplied && isAuthenticated ? (
              <div className="w-full p-5 bg-zinc-950/40 backdrop-blur-md border border-zinc-900 rounded-2xl text-center shadow-xl">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                  <Check className="w-4 h-4" />
                  <span>Pipeline Active</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  Submitted {new Date(job.appliedAt!).toLocaleDateString()}
                </p>
                <button
                  onClick={() => router.push('/dashboard/applications')}
                  className="mt-4 text-xs font-semibold text-zinc-400 hover:text-white underline underline-offset-4 decoration-zinc-800 transition"
                >
                  Inspect Transmission Status
                </button>
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                className={`w-full px-5 py-4 rounded-2xl font-bold tracking-wide text-xs uppercase transition flex items-center justify-center gap-2 shadow-xl ${
                  isAuthenticated
                    ? 'bg-zinc-100 hover:bg-white text-zinc-950'
                    : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                {!isAuthenticated && <Lock className="w-3.5 h-3.5" />}
                {isAuthenticated ? 'Deploy Application' : 'Authenticate to Apply'}
              </button>
            )}

            {/* Micro Details Metrics Card */}
            <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900/60 pb-2">
                Job Information
              </h3>

              <div className="space-y-1 text-xs font-medium">
                {job.salaryRange && (
                  <div className="flex items-start gap-3 py-2.5 border-b border-zinc-900">
                    <DollarSign className="w-4 h-4 text-zinc-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider mb-0.5">Salary Range</div>
                      <div className="text-emerald-400 font-bold">{job.salaryRange}</div>
                    </div>
                  </div>
                )}

                {job.experienceRequired && (
                  <div className="flex items-start gap-3 py-2.5 border-b border-zinc-900">
                    <Clock className="w-4 h-4 text-zinc-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider mb-0.5">Experience Vector</div>
                      <div className="text-zinc-200">{job.experienceRequired}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 py-2.5 border-b border-zinc-900">
                  <Users className="w-4 h-4 text-zinc-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider mb-0.5">Openings Allocated</div>
                    <div className="text-zinc-200">{job.openings} position{job.openings > 1 ? 's' : ''}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2.5 border-b border-zinc-900">
                  <Users className="w-4 h-4 text-zinc-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider mb-0.5">Active Applicants</div>
                    <div className="text-zinc-200">{job.applicationsCount} nodes processing</div>
                  </div>
                </div>

                {job.deadline && (
                  <div className="flex items-start gap-3 py-2.5">
                    <Calendar className="w-4 h-4 text-zinc-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider mb-0.5">Pipeline Close</div>
                      <div className="text-zinc-200">
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

            {/* Corporate Hub Panel */}
            <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-900 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-bold text-zinc-200 mb-2 tracking-tight flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
                About {job.company.name}
              </h3>
              
              {job.company.tagline && (
                <p className="text-xs text-zinc-400 leading-relaxed font-normal mb-4">{job.company.tagline}</p>
              )}

              <div className="space-y-2 text-[11px] text-zinc-500 font-medium mb-4">
                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span>Industry Core</span>
                  <span className="text-zinc-300">{job.company.industry}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>Scale Factor</span>
                  <span className="text-zinc-300">{job.company.size}</span>
                </div>
              </div>

              <button
                onClick={() => router.push(`/careers/${companyIdentifier}`)}
                className="w-full px-4 py-2.5 bg-zinc-900/40 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-900 transition text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                Inspect Core Hub Profile
                <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}