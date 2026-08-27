'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Clock, DollarSign, Users, Calendar,
  Edit, Trash2, Building2, Target, ChevronRight,
  Sparkles, UserCheck, UserX, Eye, BarChart3,
  CheckSquare, Square, Check, Filter, X, MoveHorizontal,
  Briefcase
} from 'lucide-react';
import api from '@/app/lib/axios';
import JobPostingModal from '@/app/components/JobPostingModal';
import AIFilterModal from '@/app/components/AIFilterModal';
import ScheduleInterviewsModal from '@/app/components/ScheduleInterviewsModal';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { useAuth } from '@/app/contexts/AuthContext';

const STATUS_STYLES: Record<string, string> = {
  active:          'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border-[#34c759]/20',
  closed:          'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20',
  draft:           'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20',
  applied:         'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20',
  screened:        'bg-[#5856d6]/10 text-[#5856d6] border-[#5856d6]/20',
  technical_round: 'bg-[#af52de]/10 text-[#af52de] border-[#af52de]/20',
  hr_round:        'bg-[#30b0c7]/10 text-[#30b0c7] border-[#30b0c7]/20',
  offer_sent:      'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20',
  hired:           'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border-[#34c759]/20',
  rejected:        'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20',
};

const STAGE_COLUMNS = [
  { key: 'applied', label: 'Applied', color: '#0071e3' },
  { key: 'screened', label: 'Screened', color: '#5856d6' },
  { key: 'technical_round', label: 'Technical Round', color: '#af52de' },
  { key: 'hr_round', label: 'HR Round', color: '#30b0c7' },
  { key: 'offer_sent', label: 'Offer Sent', color: '#ff9500' },
  { key: 'hired', label: 'Hired', color: '#34c759' },
  { key: 'rejected', label: 'Rejected', color: '#ff3b30' }
];

export default function JobDetailsPage() {
  const { isAdmin, isHR } = useAuth();
  const { showToast } = useGlassToast();
  const params = useParams();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'details' | 'applicants'>('details');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [aiFilterOpen, setAiFilterOpen] = useState(false);
  
  // Filter state
  const [minAtsScore, setMinAtsScore] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection & batch
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const [jobId, setJobId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.split('/dashboard/jobs/')[1]?.split('/')[0];
      if (match && match !== 'default') return decodeURIComponent(match);
    }
    return (Array.isArray(params.id) ? params.id[0] : params.id) || '';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.split('/dashboard/jobs/')[1]?.split('/')[0];
      if (match && match !== 'default') {
        setJobId(decodeURIComponent(match));
        return;
      }
    }
    if (params.id && params.id !== 'default') {
      setJobId(Array.isArray(params.id) ? params.id[0] : params.id);
    }
  }, [params.id]);

  useEffect(() => {
    if (jobId && jobId !== 'default') {
      initPageData(jobId);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId && jobId !== 'default' && !isLoading) {
      fetchApplications(jobId);
    }
  }, [statusFilter]);

  const initPageData = async (targetId?: string) => {
    const idToUse = targetId || jobId;
    if (!idToUse || idToUse === 'default') return;
    try {
      setIsLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        api.get(`/company/jobs/${idToUse}`),
        api.get(`/company/jobs/${idToUse}/applications`)
      ]);
      setJob(jobRes.data?.job || jobRes.data?.data);
      setApplications(appsRes.data?.applications || appsRes.data?.data || []);
    } catch {
      router.push('/dashboard/jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async (targetId?: string) => {
    const idToUse = targetId || jobId;
    if (!idToUse || idToUse === 'default') return;
    try {
      setAppsLoading(true);
      const url = statusFilter === 'all'
        ? `/company/jobs/${idToUse}/applications`
        : `/company/jobs/${idToUse}/applications?status=${statusFilter}`;
      const r = await api.get(url);
      setApplications(r.data?.applications || r.data?.data || []);
      setSelectedApplicationIds([]);
    } catch (e) {
      console.error(e);
    } finally {
      setAppsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      setIsDeleting(true);
      await api.delete(`/company/jobs/${params.id}`);
      router.push('/dashboard/jobs');
    } catch { showToast('failed', 'Failed to delete job.', 'danger'); }
    finally { setIsDeleting(false); }
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, appId: string, sourceStatus: string) => {
    e.dataTransfer.setData('applicationId', appId);
    e.dataTransfer.setData('sourceStatus', sourceStatus);
  };

  const handleDrop = async (e: React.DragEvent, destinationStatus: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('applicationId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    if (!appId || sourceStatus === destinationStatus) return;

    setApplications(prev => prev.map(app =>
      (app.applicationId === appId || app.id === appId) ? { ...app, status: destinationStatus } : app
    ));

    try {
      await api.patch('/kanban/move-card', {
        applicationId: appId,
        jobPostingId: params.id,
        sourceStatus,
        destinationStatus,
        newIndex: 0
      });
    } catch (err) {
      console.error('Failed to move card', err);
      fetchApplications();
    }
  };

  // Filter applicants
  const displayedApplications = applications.filter((app: any) => {
    const matchesAts = (app.resume?.atsScore ?? 0) >= minAtsScore;
    const profile = app.candidate || app.jobSeekerProfile || {};
    const matchesSearch = !searchQuery ? true : (
      profile.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchesAts && matchesSearch;
  });

  const getKanbanColumnsData = () => {
    const board: Record<string, any[]> = {
      applied: [], screened: [], technical_round: [], hr_round: [], offer_sent: [], hired: [], rejected: []
    };
    displayedApplications.forEach(app => {
      if (board[app.status]) board[app.status].push(app);
    });
    return board;
  };

  const toggleSelectCandidate = (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedApplicationIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const toggleSelectAllVisible = () => {
    if (selectedApplicationIds.length === displayedApplications.length) {
      setSelectedApplicationIds([]);
    } else {
      setSelectedApplicationIds(displayedApplications.map((app: any) => app.applicationId || app.id));
    }
  };

  const handleBulkSchedulingSuccess = () => {
    setScheduleModalOpen(false);
    setSelectedApplicationIds([]);
    fetchApplications();
  };

  const renderFormattedDescription = (text: string) => {
    if (!text) return <p className="text-[#86868b] text-xs">No detailed description specified.</p>;

    const parseInline = (lineText: string) => {
      const parts = lineText.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-[#1d1d1f] dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
    };

    const lines = text.split('\n');
    let currentListItems: React.ReactNode[] = [];
    const elements: React.ReactNode[] = [];

    const flushList = (keyPrefix: string | number) => {
      if (currentListItems.length > 0) {
        elements.push(
          <ul key={`list-${keyPrefix}`} className="list-disc pl-5 space-y-2 mb-4 text-[#424245] dark:text-[#d2d2d7] text-sm marker:text-[#0071e3]">
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

      if (trimmed.startsWith('#')) {
        flushList(index);
        const cleanHeader = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
        elements.push(
          <h4 key={index} className="text-[#1d1d1f] dark:text-white font-extrabold text-sm sm:text-base mt-6 mb-3 tracking-tight first:mt-0 flex items-center gap-2">
            <span>{cleanHeader}</span>
          </h4>
        );
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('*')) {
        const cleanItem = trimmed.replace(/^[\*\-•]\s*/, '').trim();
        currentListItems.push(parseInline(cleanItem));
      } else if (/^\d+\.\s/.test(trimmed)) {
        flushList(index);
        const cleanItem = trimmed.replace(/^\d+\.\s*/, '').trim();
        elements.push(
          <div key={index} className="flex items-start gap-2.5 mb-2 text-sm text-[#424245] dark:text-[#d2d2d7]">
            <span className="font-bold text-[#0071e3] shrink-0">{trimmed.match(/^\d+\./)?.[0]}</span>
            <span className="leading-relaxed">{parseInline(cleanItem)}</span>
          </div>
        );
      } else if (trimmed === '') {
        flushList(index);
      } else {
        flushList(index);
        elements.push(
          <p key={index} className="text-[#424245] dark:text-[#d2d2d7] text-sm leading-relaxed mb-4 font-normal">
            {parseInline(trimmed)}
          </p>
        );
      }
    });

    flushList('final');
    return <div className="space-y-1">{elements}</div>;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-black/[0.1] border-t-[#0071e3]" />
    </div>
  );
  if (!job) return null;

  const totalApps = applications.length;
  const kanbanData = getKanbanColumnsData();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top back button */}
      <div>
        <button
          onClick={() => router.push('/dashboard/jobs')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition shadow-xs cursor-pointer"
        >
          <ArrowLeft size={14} className="text-[#86868b]" />
          <span>Back to Jobs</span>
        </button>
      </div>

      {/* Job header card */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#86868b]">
              {job.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#86868b]" /> {job.department}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#86868b]" /> Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${STATUS_STYLES[job.status] || STATUS_STYLES.active}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            {(isAdmin || isHR) && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="p-2 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] rounded-2xl text-[#1d1d1f] dark:text-white border border-black/[0.04] transition cursor-pointer"
                  title="Edit Job"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 rounded-2xl text-[#ff3b30] border border-[#ff3b30]/20 transition disabled:opacity-40 cursor-pointer"
                  title="Delete Job"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-3 bg-[#f8f8fa] dark:bg-[#2c2c2e] p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1c1c1e] flex items-center justify-center text-[#0071e3] shadow-xs shrink-0">
              <Briefcase size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Job Type</p>
              <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">{job.jobType}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#f8f8fa] dark:bg-[#2c2c2e] p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1c1c1e] flex items-center justify-center text-[#5856d6] shadow-xs shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Location</p>
              <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">{job.locationType}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#f8f8fa] dark:bg-[#2c2c2e] p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1c1c1e] flex items-center justify-center text-[#ff9500] shadow-xs shrink-0">
              <Users size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Openings</p>
              <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">{job.openings} open</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#f8f8fa] dark:bg-[#2c2c2e] p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1c1c1e] flex items-center justify-center text-[#248a3d] dark:text-[#30d158] shadow-xs shrink-0">
              <BarChart3 size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">Applicants</p>
              <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">{totalApps} total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            Job Details
          </button>
          
          <button
            onClick={() => setActiveTab('applicants')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'applicants'
                ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs'
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            <span>Applicants</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0071e3]/10 text-[#0071e3]">
              {totalApps}
            </span>
          </button>
        </div>
        
        {activeTab === 'applicants' && (
          <div className="flex items-center p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              Kanban
            </button>
          </div>
        )}
      </div>

      {/* Details Tab View */}
      {activeTab === 'details' && (
        <div className="space-y-5">
          { (job.location || job.experienceRequired || job.salaryRange) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {job.location && (
                <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                  <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">City / Region</p>
                  <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">{job.location}</p>
                </div>
              )}
              {job.experienceRequired && (
                <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                  <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">Experience Required</p>
                  <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">{job.experienceRequired}</p>
                </div>
              )}
              {job.salaryRange && (
                <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                  <p className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">Salary Range</p>
                  <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">{job.salaryRange}</p>
                </div>
              )}
            </div>
          )}

          {job.requiredSkills?.length > 0 && (
            <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-2 mb-4">
                <Target size={16} className="text-[#0071e3]" />
                <h3 className="font-bold text-[#1d1d1f] dark:text-white text-sm">Required Skills &amp; Stack</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((s: string, i: number) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-xl text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-3 text-sm">Job Description</h3>
            {renderFormattedDescription(job.description)}
          </div>
        </div>
      )}

      {/* Applicants Tab View */}
      {activeTab === 'applicants' && (
        <div className="space-y-5">
          
          {/* Stage filter pills */}
          <div className="flex flex-wrap gap-2">
            {['all','applied','screened','technical_round','hr_round','offer_sent','hired','rejected'].map(s => {
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0071e3] text-white shadow-[0_4px_14px_rgba(0,113,227,0.25)]'
                      : 'bg-white dark:bg-[#1c1c1e] hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
                  }`}
                >
                  {s === 'all' ? 'All Stages' : s.replace('_', ' ')}
                </button>
              );
            })}
          </div>

          {/* Filter bar toggle & AI button */}
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition shadow-xs cursor-pointer"
            >
              <Filter size={14} className="text-[#86868b]" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
            {(isAdmin || isHR) && (
              <button
                onClick={() => setAiFilterOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] rounded-2xl text-xs font-bold text-white shadow-[0_4px_14px_rgba(0,113,227,0.25)] transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                <span>AI Match</span>
              </button>
            )}
          </div>

          {/* Advanced filters (collapsible) */}
          {showFilters && (
            <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                  Search by name, email or skill
                </label>
                <input
                  type="text"
                  placeholder="e.g., John, frontend, react..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-[#1d1d1f] dark:text-white font-medium placeholder:text-[#86868b] focus:border-[#0071e3] outline-none"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Minimum ATS Score</label>
                  <span className="text-xs font-bold text-[#0071e3]">{minAtsScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minAtsScore}
                  onChange={(e) => setMinAtsScore(Number(e.target.value))}
                  className="w-full accent-[#0071e3] bg-[#f2f2f7] dark:bg-[#2c2c2e] h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Batch actions bar (only when selected) */}
          {selectedApplicationIds.length > 0 && (
            <div className="bg-[#0071e3]/10 border border-[#0071e3]/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#0071e3]">
                {selectedApplicationIds.length} candidate(s) selected
              </span>
              <button
                onClick={() => setScheduleModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-2xl shadow-[0_4px_14px_rgba(0,113,227,0.25)] transition-all cursor-pointer"
              >
                <Calendar size={14} />
                <span>Schedule Batch Call</span>
              </button>
            </div>
          )}

          {/* Loading / Empty states */}
          {appsLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-black/[0.1] border-t-[#0071e3]" />
            </div>
          ) : displayedApplications.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center text-[#86868b] mx-auto">
                <Users size={28} />
              </div>
              <div>
                <p className="text-base font-bold text-[#1d1d1f] dark:text-white">No candidates match current criteria</p>
                <p className="text-xs text-[#86868b] font-medium mt-0.5">Adjust filters or search query to view candidates</p>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            /* List View */
            <div className="space-y-3">
              {displayedApplications.length > 1 && (
                <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl px-4 py-2.5 flex justify-between items-center text-xs font-semibold border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
                  {(isAdmin || isHR) ? (
                    <button
                      onClick={toggleSelectAllVisible}
                      className="flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer"
                    >
                      {selectedApplicationIds.length === displayedApplications.length ? (
                        <CheckSquare size={16} className="text-[#0071e3]" />
                      ) : (
                        <Square size={16} />
                      )}
                      <span>{selectedApplicationIds.length === displayedApplications.length ? 'Deselect all' : 'Select all'}</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  <span className="text-[#86868b]">{displayedApplications.length} of {totalApps} shown</span>
                </div>
              )}
              <div className="space-y-2.5">
                {displayedApplications.map((app: any) => {
                  const targetId = app.applicationId || app.id;
                  const isSelected = selectedApplicationIds.includes(targetId);
                  const profile = app.candidate || app.jobSeekerProfile || {};
                  return (
                    <div
                      key={targetId}
                      onClick={() => router.push(`/dashboard/jobs/${params.id}/applicants/${targetId}`)}
                      className={`bg-white dark:bg-[#1c1c1e] border rounded-2xl p-4 cursor-pointer transition-all group flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-[#0071e3]/30 ${
                        isSelected ? 'border-[#0071e3] bg-[#0071e3]/5' : 'border-black/[0.06] dark:border-white/[0.08]'
                      }`}
                    >
                      {(isAdmin || isHR) && (
                        <div onClick={(e) => toggleSelectCandidate(targetId, e)} className="shrink-0 cursor-pointer">
                          {isSelected ? (
                            <div className="w-4 h-4 rounded-md bg-[#0071e3] flex items-center justify-center text-white">
                              <Check size={12} />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-md border border-black/[0.2] dark:border-white/[0.2] group-hover:border-[#0071e3]" />
                          )}
                        </div>
                      )}
                      <div className="h-10 w-10 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-[#1d1d1f] dark:text-white font-bold text-sm shrink-0">
                        {profile.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-bold text-[#1d1d1f] dark:text-white text-sm">{profile.fullName}</p>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_STYLES[app.status] || ''}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[#86868b] text-xs font-medium truncate">{profile.email}</p>
                      </div>
                      {app.resume?.atsScore != null && (
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">ATS Score</p>
                          <p className={`text-sm font-bold ${
                            app.resume.atsScore >= 70 ? 'text-[#248a3d] dark:text-[#30d158]' :
                            app.resume.atsScore >= 40 ? 'text-[#ff9500]' : 'text-[#ff3b30]'
                          }`}>{app.resume.atsScore}%</p>
                        </div>
                      )}
                      <ChevronRight size={16} className="text-[#86868b] group-hover:text-[#1d1d1f] dark:group-hover:text-white transition shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Kanban Board */
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
              {STAGE_COLUMNS.map(col => {
                const columnCards = kanbanData[col.key] || [];
                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => (isAdmin || isHR) && e.preventDefault()}
                    onDrop={(e) => (isAdmin || isHR) && handleDrop(e, col.key)}
                    className="w-80 bg-[#f8f8fa] dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl flex flex-col shrink-0 max-h-[70vh] shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
                  >
                    <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center rounded-t-3xl">
                      <span className="font-bold text-xs text-[#1d1d1f] dark:text-white uppercase tracking-wider">{col.label}</span>
                      <span className="bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] px-2.5 py-0.5 rounded-full text-xs font-bold text-[#86868b] shadow-xs">
                        {columnCards.length}
                      </span>
                    </div>
                    <div className="p-3 space-y-2.5 overflow-y-auto flex-1 min-h-[200px]">
                      {columnCards.length === 0 ? (
                        <div className="py-10 text-center text-[#86868b] text-xs font-medium border border-dashed border-black/[0.08] dark:border-white/[0.1] rounded-2xl">
                          Drop candidates here
                        </div>
                      ) : (
                        columnCards.map(card => {
                          const cardId = card.applicationId || card.id;
                          const profile = card.jobSeekerProfile || card.candidate || {};
                          return (
                            <div
                              key={cardId}
                              draggable={isAdmin || isHR}
                              onDragStart={(e) => (isAdmin || isHR) ? handleDragStart(e, cardId, col.key) : e.preventDefault()}
                              onClick={() => router.push(`/dashboard/jobs/${params.id}/applicants/${cardId}`)}
                              className="p-3.5 bg-white dark:bg-[#2c2c2e] hover:shadow-md border border-black/[0.06] dark:border-white/[0.08] rounded-2xl cursor-grab active:cursor-grabbing transition-all group"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <p className="font-bold text-[#1d1d1f] dark:text-white text-xs truncate">{profile.fullName || 'Anonymous'}</p>
                                {card.resume?.atsScore != null && (
                                  <span className={`text-[10px] font-bold ${
                                    card.resume.atsScore >= 70 ? 'text-[#248a3d] dark:text-[#30d158]' :
                                    card.resume.atsScore >= 40 ? 'text-[#ff9500]' : 'text-[#ff3b30]'
                                  }`}>{card.resume.atsScore}%</span>
                                )}
                              </div>
                              <p className="text-[#86868b] text-[11px] font-medium truncate mt-0.5">{profile.email}</p>
                              {profile.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2.5">
                                  {profile.skills.slice(0, 2).map((sk: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-[#f2f2f7] dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-[#f5f5f7] text-[10px] font-semibold rounded-lg">
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals Container */}
      <JobPostingModal isOpen={editOpen} onClose={() => setEditOpen(false)} onSuccess={() => { initPageData(); setEditOpen(false); }} editJob={job} />
      <AIFilterModal isOpen={aiFilterOpen} onClose={() => setAiFilterOpen(false)} jobId={jobId} jobTitle={job?.title || ''} />
      <ScheduleInterviewsModal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} jobId={jobId} selectedApplicationIds={selectedApplicationIds} onSuccess={handleBulkSchedulingSuccess} />
    </div>
  );
}
