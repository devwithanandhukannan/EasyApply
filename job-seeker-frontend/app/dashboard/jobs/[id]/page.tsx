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
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';

export default function JobDetailsPage() {
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
      const response = await api.get(`/jobs/${id}`);
      if (response.data.success) {
        setJob(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
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
      console.error('Error checking application status:', error);
    }
  };

  const handleDirectApply = async () => {
    try {
      setIsSubmitting(true);
      // Fetches user's first available default resume to use for direct apply click
      const resumeRes = await api.get('/jobseeker/resumes');
      if (!resumeRes.data.success || resumeRes.data.data.length === 0) {
        alert('Please upload or generate a resume in your profile layout before deployment.');
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
        alert('Application payload synchronized successfully!');
        setHasApplied(true);
      }
    } catch (error: any) {
      console.error('Application error:', error);
      alert(error.response?.data?.message || 'Failed to sync execution payload');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysAgo = (date: string) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'TODAY';
    if (days === 1) return 'YESTERDAY';
    return `${days} DAYS AGO`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 font-mono">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border border-zinc-800 border-t-white rounded-full animate-spin"></div>
          <p className="text-zinc-600 text-[10px] tracking-widest uppercase">Parsing Meta Stream...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 font-mono max-w-md mx-auto">
        <AlertCircle className="mx-auto text-zinc-700 mb-2" size={24} />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Node Context Inaccessible</h3>
        <p className="text-zinc-600 text-[11px] mt-1 uppercase mb-4">The targeted record identifier could not be queried.</p>
        <Link href="/dashboard/jobs" className="text-white text-xs underline uppercase tracking-wide">
          Return to index
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono text-zinc-300 max-w-4xl mx-auto p-4 md:p-0">
      {/* Return Controls */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-zinc-500 hover:text-white transition-colors text-xs uppercase font-bold tracking-wider"
        >
          <ArrowLeft size={14} />
          <span>Back to Registry Stream</span>
        </button>
      </div>

      {/* Corporate Meta Grid Header Block */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4 min-w-0">
          {job.company?.logoUrl ? (
            <img
              src={job.company.logoUrl}
              alt={job.company.name}
              className="w-14 h-14 rounded border border-zinc-800 object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0">
              <Building2 size={24} className="text-zinc-600" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-0.5">
              {job.department || 'GENERAL ENGINEERING'}
            </span>
            <h1 className="text-base font-bold text-white uppercase tracking-tight truncate">
              {job.title}
            </h1>
            <p className="text-xs text-zinc-400 font-medium uppercase mt-0.5">
              {job.company?.name} <span className="text-zinc-600">//</span> {job.company?.industry || 'Core Systems'}
            </p>
          </div>
        </div>

        {/* Action Dispatcher State Engine */}
        <div className="w-full md:w-auto flex-shrink-0">
          {hasApplied ? (
            <div className="w-full md:w-auto px-6 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2">
              <CheckCircle2 size={14} className="text-zinc-600" />
              <span>Deployment Complete</span>
            </div>
          ) : (
            <button
              onClick={handleDirectApply}
              disabled={isSubmitting}
              className="w-full md:w-auto px-6 py-2.5 bg-white text-black rounded text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors disabled:opacity-30"
            >
              {isSubmitting ? 'Syncing...' : 'Deploy Direct Payload'}
            </button>
          )}
        </div>
      </div>

      {/* Target Parameters Framework Details Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mb-1">Execution Tier</p>
          <p className="text-white text-xs font-bold uppercase">{job.jobType || 'N/A'}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mb-1">Ecosystem Environment</p>
          <p className="text-white text-xs font-bold uppercase">{job.locationType || 'N/A'}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mb-1">Compensation Range</p>
          <p className="text-white text-xs font-bold uppercase tracking-tight">{job.salaryRange || ' undisclosed'}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mb-1">Pipeline Timeline</p>
          <p className="text-zinc-400 text-xs font-bold uppercase">{calculateDaysAgo(job.createdAt)}</p>
        </div>
      </div>

      {/* Structural Allocation Specifications Meta Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Core Description Main Parsing Output Terminal */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
            <h3 className="text-white text-xs uppercase font-bold tracking-wider mb-4 border-b border-zinc-900 pb-2">
              Operational Protocol Description
            </h3>
            <div className="text-zinc-400 text-xs leading-relaxed space-y-4 tracking-normal">
              {(job?.description || '').split('\n\n').map((paragraph: string, pIdx: number) => {
                const line = paragraph.trim();
                if (!line) return null;

                // Parse Headers (e.g., ### Role Overview)
                if (line.startsWith('###')) {
                  return (
                    <h4 key={pIdx} className="text-white text-xs font-bold uppercase tracking-wide pt-3 pb-1">
                      {line.replace(/^###\s*/, '')}
                    </h4>
                  );
                }

                // Parse Unordered Token Arrays Lists (e.g., * Line content text strings)
                if (line.startsWith('*')) {
                  const listItems = paragraph.split('\n').map((item) => item.trim().replace(/^\*\s*/, ''));
                  return (
                    <ul key={pIdx} className="space-y-2 my-2 list-none pl-1">
                      {listItems.map((item, lIdx) => {
                        const parts = item.split(/\*\*([\s\S]*?)\*\*/g);
                        return (
                          <li key={lIdx} className="flex items-start text-zinc-400">
                            <span className="text-zinc-600 mr-2 flex-shrink-0">▪</span>
                            <span>
                              {parts.map((part, partIdx) => 
                                partIdx % 2 === 1 ? <strong key={partIdx} className="text-white font-bold">{part}</strong> : part
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  );
                }

                // Default Paragraph Text Nodes handling inline bold structures
                const inlineParts = line.split(/\*\*([\s\S]*?)\*\*/g);
                return (
                  <p key={pIdx} className="text-zinc-400 leading-relaxed">
                    {inlineParts.map((part, partIdx) => 
                      partIdx % 2 === 1 ? <strong key={partIdx} className="text-white font-bold">{part}</strong> : part
                    )}
                  </p>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Complementary Context Arrays Metadata Parameters Column */}
        <div className="space-y-4">
          {/* Positional Coordinate Matrix Card */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-3.5">
            <h4 className="text-white text-[11px] uppercase font-bold tracking-widest border-b border-zinc-900 pb-1.5">
              System Parameters
            </h4>
            
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] text-zinc-600 block uppercase font-bold">Terminal Region</span>
                <span className="text-zinc-300 font-medium uppercase">{job.location || 'Distributed Matrix'}</span>
              </div>
              
              <div>
                <span className="text-[10px] text-zinc-600 block uppercase font-bold">Experience Matrix Threshold</span>
                <span className="text-zinc-300 font-medium uppercase">{job.experienceRequired || 'All Tiers Verified'}</span>
              </div>
            </div>
          </div>

          {/* Required Skills Registry Tag Allocation Block */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4">
              <h4 className="text-white text-[11px] uppercase font-bold tracking-widest border-b border-zinc-900 pb-1.5 mb-3">
                Required Prerequisite Stacks
              </h4>
              <div className="flex flex-wrap gap-1">
                {job.requiredSkills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-black border border-zinc-900 text-zinc-400 rounded text-[10px] uppercase font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}