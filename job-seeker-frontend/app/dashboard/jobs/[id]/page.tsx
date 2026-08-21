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
  ShieldCheck,
  Upload,
  FileText,
  X,
  Bookmark
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { toggleSaveJob, getSavedJobIds } from '@/app/lib/jobApi';

export default function JobDetailsPage() {
  const { showToast } = useGlassToast();
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
      checkApplicationStatus();
      checkSavedStatus();
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

  const checkSavedStatus = async () => {
    try {
      const res = await getSavedJobIds();
      if (res?.success && Array.isArray(res.savedJobIds)) {
        setIsSaved(res.savedJobIds.includes(id as string));
      }
    } catch (error) {
      console.error('Error tracking saved status:', error);
    }
  };

  const handleToggleSave = async () => {
    if (!job) return;
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      const res = await toggleSaveJob(job.id);
      if (res?.success) {
        setIsSaved(res.isSaved);
        showToast(
          res.isSaved ? 'Job Saved' : 'Removed from Saved',
          res.isSaved ? `"${job.title}" saved to your bookmarks.` : `"${job.title}" removed from bookmarks.`,
          'success'
        );
      }
    } catch (err: any) {
      setIsSaved(prevSaved);
      showToast('Error', err.response?.data?.message || 'Failed to update saved job status', 'danger');
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

  const renderFormattedDescription = (text: string) => {
    if (!text) return <p className="text-[#86868b] text-xs">No detailed description specified.</p>;

    const lines = text.split('\n');
    let currentListItems: string[] = [];
    const elements: React.ReactNode[] = [];

    const flushList = (keyPrefix: string | number) => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-${keyPrefix}`} className="list-disc pl-5 space-y-2 mb-4 text-[#424245] dark:text-[#d2d2d7] text-sm">
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

      if (trimmed.startsWith('###')) {
        flushList(index);
        const cleanHeader = trimmed.replace(/###|\*\*/g, '').trim();
        elements.push(
          <h4 key={index} className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-sm mt-6 mb-3 tracking-tight first:mt-0">
            {cleanHeader}
          </h4>
        );
      } else if (trimmed.startsWith('*')) {
        const cleanItem = trimmed.substring(1).trim();
        currentListItems.push(cleanItem);
      } else {
        if (trimmed === '') {
          flushList(index);
        } else {
          flushList(index);
          elements.push(
            <p key={index} className="text-[#424245] dark:text-[#d2d2d7] text-sm leading-relaxed mb-4">
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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 max-w-sm mx-auto">
        <AlertCircle className="mx-auto text-[#86868b] mb-3" size={28} />
        <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Position not found</h3>
        <p className="text-[#86868b] text-xs mt-1 mb-5">The requested job listing could not be queried or has expired.</p>
        <Link href="/dashboard/jobs" className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] rounded-2xl text-xs font-semibold text-white transition-all shadow-xs">
          Return to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#1d1d1f] dark:text-[#f5f5f7] max-w-5xl mx-auto p-2 md:p-0 animate-fade-in">
      {/* Back Actions */}
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Directory</span>
        </button>
      </div>

      {/* Main Feature Header Card */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4 min-w-0">
          {job.company?.logoUrl ? (
            <img
              src={job.company.logoUrl}
              alt={job.company.name}
              className="w-16 h-16 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-[#0071e3]" />
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl text-[#1d1d1f] dark:text-[#f5f5f7] truncate">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#86868b] font-medium">
              <span className="text-[#0071e3] font-semibold">{job.company?.name}</span>
              <span>•</span>
              <span className="uppercase tracking-wider text-[10px] font-bold">{job.company?.industry || 'Technology'}</span>
              {job.disallowAiCv && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    <ShieldCheck size={12} />
                    <span>Verified PDF Upload Required</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Embedded Actions */}
        <div className="w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t border-black/[0.06] dark:border-white/[0.08] md:border-transparent flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleToggleSave}
            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
              isSaved
                ? 'bg-[#0071e3]/10 border-[#0071e3]/30 text-[#0071e3] shadow-xs'
                : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-white'
            }`}
          >
            <Bookmark size={15} className={isSaved ? 'fill-[#0071e3]' : ''} />
            <span>{isSaved ? 'Saved' : 'Save Job'}</span>
          </button>

          {hasApplied ? (
            <div className="flex-1 md:flex-initial px-5 py-3 bg-[#34c759]/10 border border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158] text-xs font-bold rounded-2xl flex items-center justify-center gap-2">
              <CheckCircle2 size={15} />
              <span>Application Submitted</span>
            </div>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="flex-1 md:flex-initial px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold rounded-2xl text-xs transition-all shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Apply for Position</span>
            </button>
          )}
        </div>
      </div>

      {/* Split Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main descriptions layout body panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            {renderFormattedDescription(job.description)}

            {job.requirements && (
              <div className="mt-8 pt-6 border-t border-black/[0.06] dark:border-white/[0.08]">
                <h4 className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-sm mb-3 tracking-tight">Target Profile Criteria</h4>
                <p className="text-[#424245] dark:text-[#d2d2d7] text-sm leading-relaxed whitespace-pre-line">
                  {job.requirements}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Parameters details */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <h3 className="text-xs font-bold uppercase text-[#86868b] tracking-wider border-b border-black/[0.06] dark:border-white/[0.08] pb-3">Position Summary</h3>
            
            <div className="space-y-4 text-xs text-[#86868b]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#0071e3]/10 text-[#0071e3] rounded-2xl">
                  <Briefcase size={15} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#86868b]">Employment Model</p>
                  <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mt-0.5">{job.jobType}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#0071e3]/10 text-[#0071e3] rounded-2xl">
                  <Globe size={15} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#86868b]">Workplace Setting</p>
                  <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mt-0.5">{job.locationType}</p>
                </div>
              </div>

              {job.location && (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0071e3]/10 text-[#0071e3] rounded-2xl">
                    <MapPin size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-[#86868b]">Location</p>
                    <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mt-0.5 truncate">{job.location}</p>
                  </div>
                </div>
              )}

              {job.salaryRange && (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0071e3]/10 text-[#0071e3] rounded-2xl">
                    <DollarSign size={15} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#86868b]">Compensation</p>
                    <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mt-0.5">{job.salaryRange}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#0071e3]/10 text-[#0071e3] rounded-2xl">
                  <Clock size={15} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#86868b]">Date Posted</p>
                  <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold mt-0.5">{calculateDaysAgo(job.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Core Skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <h3 className="text-xs font-bold uppercase text-[#86868b] tracking-wider">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {job.requiredSkills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] text-xs font-semibold rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verification Notice */}
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 flex gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <ShieldCheck className="text-[#0071e3] shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-[#86868b] leading-relaxed">
              <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold mb-0.5">Verified Corporate Listing</p>
              <p>This position is validated for corporate pipeline matching and real-time candidate evaluation.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplyModal && (
        <ApplicationModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            setHasApplied(true);
          }}
        />
      )}
    </div>
  );
}

// ─── LOCAL APPLICATION MODAL COMPONENT ────────────────────
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
        const list = response.data.data || [];
        setResumes(list);
        if (job?.disallowAiCv) {
          const firstUploaded = list.find((r: any) => r.source === 'uploaded');
          if (firstUploaded) {
            setSelectedResumeId(firstUploaded.id);
          } else {
            setUploadNew(true);
          }
        } else if (list.length > 0) {
          setSelectedResumeId(list[0].id);
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
      showToast('Document Missing', 'Please select a resume file to upload.', 'info');
      return;
    }

    if (!uploadNew && job?.disallowAiCv) {
      const selected = resumes.find((r) => r.id === selectedResumeId);
      if (selected && selected.source === 'built') {
        showToast(
          'Manual PDF Required',
          'This employer requires a manually uploaded PDF resume. Direct AI-generated resumes cannot be attached automatically. Please download your resume as PDF and upload the file.',
          'danger'
        );
        setUploadNew(true);
        return;
      }
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl text-[#1d1d1f] dark:text-[#f5f5f7]">
        <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-[#f2f2f7]/40 dark:bg-[#2c2c2e]/40">
          <div>
            <h2 className="text-base font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Submit Application</h2>
            <p className="text-xs text-[#86868b] mt-0.5 font-medium">{job.title} — {job.company.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Anti-AI CV Notice Banner */}
          {job.disallowAiCv && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 flex gap-2.5">
              <ShieldCheck className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                <p className="font-bold">Verified PDF Upload Required</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  This employer requires a manually uploaded PDF document. Direct platform-generated resumes cannot be attached automatically. If you built a resume, please download it as a PDF and upload the document below.
                </p>
              </div>
            </div>
          )}

          <div className="flex p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl">
            <button
              onClick={() => setUploadNew(false)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                !uploadNew ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs font-bold' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Saved Resumes
            </button>
            <button
              onClick={() => setUploadNew(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                uploadNew ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs font-bold' : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Upload Document
            </button>
          </div>

          {!uploadNew && (
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="w-5 h-5 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4">
                  <FileText className="mx-auto mb-2 text-[#86868b]" size={20} />
                  <p className="text-[#86868b] text-xs font-medium">No saved resumes found in your profile</p>
                </div>
              ) : (
                resumes.map((resume) => {
                  const isBlockedAi = job.disallowAiCv && resume.source === 'built';
                  return (
                    <label
                      key={resume.id}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isBlockedAi
                          ? 'opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed'
                          : selectedResumeId === resume.id
                          ? 'border-[#0071e3] bg-[#0071e3]/5 shadow-xs'
                          : 'border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7]/30 dark:bg-[#2c2c2e]/30 hover:border-black/[0.12] dark:hover:border-white/[0.15]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resume"
                        disabled={isBlockedAi}
                        value={resume.id}
                        checked={selectedResumeId === resume.id && !isBlockedAi}
                        onChange={() => !isBlockedAi && setSelectedResumeId(resume.id)}
                        className="accent-[#0071e3] w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold text-xs truncate">{resume.name}</h4>
                          {isBlockedAi && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                              PDF Upload Required
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#86868b] font-medium">
                          <span>{resume.source === 'uploaded' ? 'Uploaded PDF' : 'Generated Resume'}</span>
                          {resume.atsScore && (
                            <span className="text-[#0071e3] bg-[#0071e3]/10 px-2 py-0.5 rounded-full font-bold">Match: {resume.atsScore}%</span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          )}

          {uploadNew && (
            <div>
              <label className="block border-2 border-dashed border-black/[0.1] dark:border-white/[0.1] bg-[#f2f2f7]/40 dark:bg-[#2c2c2e]/40 hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] rounded-3xl p-6 text-center hover:border-[#0071e3] transition-all cursor-pointer">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                {newResumeFile ? (
                  <div className="space-y-2">
                    <FileText className="mx-auto text-[#0071e3]" size={28} />
                    <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-xs max-w-xs truncate mx-auto">{newResumeFile.name}</p>
                    <p className="text-[#86868b] text-[10px] uppercase font-bold tracking-wider">{(newResumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      onClick={(e) => { e.preventDefault(); setNewResumeFile(null); }}
                      className="text-[#ff3b30] text-xs font-semibold hover:underline pt-1 inline-block cursor-pointer"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Upload className="mx-auto text-[#0071e3]" size={24} />
                    <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold text-xs">Choose document from device</p>
                    <p className="text-[#86868b] text-[11px]">Supports PDF or DOCX formats up to 10MB</p>
                  </div>
                )}
              </label>
            </div>
          )}

          <div className="bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-3.5 flex gap-2.5">
            <AlertCircle className="text-[#86868b] shrink-0 mt-0.5" size={15} />
            <div className="text-xs text-[#86868b] font-medium leading-relaxed">
              <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold mb-0.5">Automated screening</p>
              <p>Your resume credentials will be analyzed by the platform parser to map matching qualification criteria for this role.</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2.5 bg-[#f2f2f7]/30 dark:bg-[#2c2c2e]/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!uploadNew && !selectedResumeId) || (uploadNew && !newResumeFile)}
            className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(0,113,227,0.25)] cursor-pointer"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
