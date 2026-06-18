'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Building2, 
  ArrowLeft, 
  CheckCircle2,
  AlertCircle,
  Globe,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';

export default function JobDetailsPage() {
  const { showToast } = useGlassToast();
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      checkApplicationStatus();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/public/${id}`);
      if (response.data.success) {
        setJob(response.data.data);
      }
    } catch (error) {
      console.error('Error loading job specifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await api.get('/jobseeker/applications');
      if (response.data.success) {
        const applied = response.data.data.some((app: any) => app.jobPostingId === id);
        setHasApplied(applied);
      }
    } catch (error) {
      console.error('Error tracking configuration states:', error);
    }
  };

  const handleDirectApply = async () => {
    try {
      setIsSubmitting(true);
      const resumeRes = await api.get('/jobseeker/resumes');
      if (!resumeRes.data.success || resumeRes.data.data.length === 0) {
        showToast('failed', 'Please upload or generate a primary resume on your profile menu before submitting.', 'danger');
        return;
      }

      const defaultResumeId = resumeRes.data.data[0].id;
      const formData = new FormData();
      formData.append('jobPostingId', id as string);
      formData.append('applyWithNew', 'false');
      formData.append('resumeId', defaultResumeId);

      const response = await api.post('/jobseeker/applications/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        showToast('applied', 'Application submitted successfully.', 'success');
        setHasApplied(true);
      }
    } catch (error: any) {
      console.error('Application transmission error:', error);
      showToast('failed', error.response?.data?.message || 'Failed to submit application.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysAgo = (date: string) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  // Helper helper engine to parse the Markdown content found in Screenshot 2026-06-01 at 10.57.47 AM.jpg
  const renderFormattedDescription = (text: string) => {
    if (!text) return <p className="text-zinc-500 text-xs">No detailed description specified.</p>;

    const lines = text.split('\n');
    let currentListItems: string[] = [];
    const elements: React.ReactNode[] = [];

    const flushList = (keyPrefix: string | number) => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-${keyPrefix}`} className="list-disc pl-5 space-y-2 mb-4 text-zinc-300 text-sm">
            {currentListItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        );
        currentListItems = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Identify Subheadings (e.g., ### **Key Responsibilities**)
      if (trimmed.startsWith('###')) {
        flushList(index);
        const cleanHeader = trimmed.replace(/###|\*\*/g, '').trim();
        elements.push(
          <h4 key={index} className="text-white font-semibold text-sm mt-6 mb-3 tracking-wide first:mt-0">
            {cleanHeader}
          </h4>
        );
      }
      // Identify Bullet Lists (e.g., * Implement Java-based...)
      else if (trimmed.startsWith('*')) {
        const cleanItem = trimmed.substring(1).trim();
        currentListItems.push(cleanItem);
      } 
      // Handle normal paragraphs / empty spaces
      else {
        if (trimmed === '') {
          flushList(index);
        } else {
          flushList(index);
          elements.push(
            <p key={index} className="text-zinc-300 text-sm leading-relaxed mb-4">
              {trimmed.replace(/\*\*/g, '')}
            </p>
          );
        }
      }
    });

    flushList('final');
    return <div className="space-y-1">{elements}</div>;
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border border-zinc-900 border-t-zinc-400 rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-[11px] font-medium tracking-wide">Loading specifications...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 font-sans max-w-sm mx-auto">
        <AlertCircle className="mx-auto text-zinc-700 mb-3" size={24} />
        <h3 className="text-sm font-semibold text-white">Position not found</h3>
        <p className="text-zinc-500 text-xs mt-1 mb-5">The requested job listing could not be queried or has expired.</p>
        <Link href="/dashboard/jobs" className="px-4 py-2 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition-all">
          Return to index
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-300 max-w-4xl mx-auto p-2 md:p-0 font-sans antialiased animate-fade-in">
      
      {/* Back Actions navigation */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          <span>Back to Directory</span>
        </button>
      </div>

      {/* Main Feature Header Card info */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-black/40">
        <div className="flex items-center gap-4 min-w-0">
          {job.company?.logoUrl ? (
            <img
              src={job.company.logoUrl}
              alt={job.company.name}
              className="w-14 h-14 rounded-2xl border border-zinc-900 object-cover shrink-0 shadow-inner"
            />
          ) : (
            <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-zinc-600" />
            </div>
          )}
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-lg font-bold text-white tracking-tight sm:text-xl truncate">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 font-medium">
              <span className="text-zinc-200 hover:underline cursor-pointer">{job.company?.name}</span>
              <span className="text-zinc-700">•</span>
              <span className="text-zinc-500 uppercase tracking-wider text-[10px]">{job.company?.industry || 'Technology'}</span>
            </div>
          </div>
        </div>

        {/* Embedded Actions */}
        <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t border-zinc-900 md:border-transparent">
          {hasApplied ? (
            <div className="w-full md:w-auto px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-inner">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Application Submitted</span>
            </div>
          ) : (
            <button
              onClick={handleDirectApply}
              disabled={isSubmitting}
              className="w-full md:w-auto px-6 py-2.5 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors disabled:opacity-30 shadow-lg shadow-white/5"
            >
              {isSubmitting ? 'Processing...' : 'Apply with default resume'}
            </button>
          )}
        </div>
      </div>

      {/* Split Details Section parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main descriptions layout body panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-sm">
            {/* Formatted description with layout parsing fixes applied natively */}
            {renderFormattedDescription(job.description)}

            {job.requirements && (
              <div className="mt-6 pt-6 border-t border-zinc-900">
                <h4 className="text-white font-semibold text-sm mb-3 tracking-wide">Target Profile Criteria</h4>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line font-normal">
                  {job.requirements}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Parameters details grid */}
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider border-b border-zinc-900 pb-2">Position Summary</h3>
            
            <div className="space-y-3.5 text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
                  <Briefcase size={14} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-zinc-500">Employment Model</p>
                  <p className="text-zinc-200 font-medium mt-0.5">{job.jobType}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
                  <Globe size={14} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-zinc-500">Workplace Setting</p>
                  <p className="text-zinc-200 font-medium mt-0.5">{job.locationType}</p>
                </div>
              </div>

              {job.location && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
                    <MapPin size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-semibold text-zinc-500">Location</p>
                    <p className="text-zinc-200 font-medium mt-0.5 truncate">{job.location}</p>
                  </div>
                </div>
              )}

              {job.salaryRange && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
                    <DollarSign size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-zinc-500">Compensation Offer</p>
                    <p className="text-zinc-200 font-medium mt-0.5">{job.salaryRange}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
                  <Clock size={14} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-zinc-500">Date Posted</p>
                  <p className="text-zinc-200 font-medium mt-0.5">{calculateDaysAgo(job.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Core Skills Parameters tag index list */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Required Core Capabilities</h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {job.requiredSkills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-850 text-zinc-350 text-[11px] font-medium rounded-lg shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verification Box Notice footer layout */}
          <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-4 flex gap-3">
            <ShieldCheck className="text-zinc-600 shrink-0 mt-0.5" size={15} />
            <div className="text-[11px] text-zinc-500 font-medium leading-relaxed">
              <p className="text-zinc-400 font-semibold mb-0.5">Verified Placement</p>
              <p>This assignment framework is verified to handle applications directly into internal dashboard matching metrics pools.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}