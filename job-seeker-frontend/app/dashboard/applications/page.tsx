'use client';

import { useState, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  Clock,
  Calendar,
  MapPin,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  Video,
  Layers,
  Edit3,
  ExternalLink,
  Info,
  Download,
  MoreVertical,
  RefreshCw,
  FileDown,
  Filter,
  TrendingUp,
  CheckCircle,
  UserCheck,
  XOctagon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import OfferResponseModal from '@/app/components/OfferResponseModal';
import RescheduleInterviewModal from '@/app/components/RescheduleInterviewModal';
import SalaryBenchmarkingModal from '@/app/components/SalaryBenchmarkingModal';
import { useGlassToast } from '@/app/components/GlassToastContainer';

interface TimelineEvent {
  stage: string;
  date: string;
  notes: string;
}

interface InterviewLog {
  interviewId: string;
  scheduledTime: string;
  durationMinutes: number;
  format: string;
  status: string;
  livekitRoomName: string;
  joinLink: string | null;
  companyFeedback: Array<{
    verdict: string;
    notes: string;
    createdAt: string;
  }>;
}

interface ApplicationTrackItem {
  applicationId: string;
  liveStatusBadge: string;
  isWithdrawn: boolean;
  currentStage: string;
  pipelineIndex: number;
  candidateNotes: string;
  appliedAt: string;
  updatedAt: string;
  jobDetails: {
    id: string;
    title: string;
    department: string;
    jobType: string;
    locationType?: string;
    location: string;
    experienceRequired?: string;
    compensationContext?: string;
  };
  companyDetails: {
    name: string;
    logoUrl: string | null;
    industry: string;
  };
  resumeUsed: {
    id: string;
    name: string;
    downloadPath: string | null;
  };
  timelineView: TimelineEvent[];
  interviewHistory: InterviewLog[];
  activeOffer: {
    id: string;
    status: string;
    filePath: string;
    sentAt: string;
    position: string;
  } | null;
  canWithdraw: boolean;
}

export default function ApplicationsPage() {
  const { showToast } = useGlassToast();
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationTrackItem[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationTrackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedApp, setSelectedApp] = useState<ApplicationTrackItem | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [selectedInterviewTime, setSelectedInterviewTime] = useState<string>('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [downloadingOffer, setDownloadingOffer] = useState<boolean>(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    handleSearchAndFilter();
  }, [searchQuery, statusFilter, applications]);

  const handleSalaryBenchmarking = () => {
    if (!selectedApp) return;
    setSalaryModalOpen(true);
  };

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/jobseeker/applications/tracker/timeline');
      if (response.data.success) {
        const backendData = response.data.data;
        setApplications(backendData);
        setFilteredApplications(backendData);

        if (backendData.length > 0) {
          const currentSelection = selectedApp
            ? backendData.find((a: ApplicationTrackItem) => a.applicationId === selectedApp.applicationId) || backendData[0]
            : backendData[0];
          setSelectedApp(currentSelection);
          setEditingNotes(currentSelection.candidateNotes || '');
        }
      }
    } catch (error: any) {
      console.error('Error loading applications:', error);
      showToast('Error', 'Failed to retrieve application tracking timeline.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAndFilter = () => {
    let result = [...applications];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.jobDetails.title.toLowerCase().includes(q) ||
          app.companyDetails.name.toLowerCase().includes(q) ||
          app.jobDetails.location.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((app) => {
        if (statusFilter === 'applied') return app.currentStage.toLowerCase() === 'applied' && !app.isWithdrawn;
        if (statusFilter === 'screened') return app.currentStage.toLowerCase() === 'screened' && !app.isWithdrawn;
        if (statusFilter === 'technical_round') return app.currentStage.toLowerCase() === 'technical_round' && !app.isWithdrawn;
        if (statusFilter === 'hr_round') return app.currentStage.toLowerCase() === 'hr_round' && !app.isWithdrawn;
        if (statusFilter === 'offer_sent') return app.currentStage.toLowerCase() === 'offer_sent';
        if (statusFilter === 'hired') return app.currentStage.toLowerCase() === 'hired';
        if (statusFilter === 'rejected') return app.currentStage.toLowerCase() === 'rejected';
        if (statusFilter === 'withdrawn') return app.isWithdrawn;
        return true;
      });
    }

    setFilteredApplications(result);
    if (result.length > 0 && !result.some((a) => a.applicationId === selectedApp?.applicationId)) {
      setSelectedApp(result[0]);
      setEditingNotes(result[0].candidateNotes || '');
    }
  };

  const handleSelectApplication = (app: ApplicationTrackItem) => {
    setSelectedApp(app);
    setEditingNotes(app.candidateNotes || '');
    setActionMenuOpen(null);
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be reversed.')) {
      return;
    }

    try {
      setProcessingWithdrawal(applicationId);
      const response = await api.post(`/jobseeker/applications/${applicationId}/withdraw`);
      if (response.data.success) {
        showToast('Application Withdrawn', 'Application has been withdrawn successfully.', 'info');
        fetchApplications();
      }
    } catch (error: any) {
      console.error('Withdraw error:', error);
      showToast('Error', error.response?.data?.message || 'Failed to withdraw application.', 'danger');
    } finally {
      setProcessingWithdrawal(null);
      setActionMenuOpen(null);
    }
  };

  const handleDownloadResume = async (resumeId: string, resumeName: string) => {
    try {
      const response = await api.get(`/jobseeker/resumes/${resumeId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resumeName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      showToast('failed', 'Failed to download resume', 'danger');
    }
  };

  const handleDownloadOffer = async (offerId: string, companyName: string, roleName: string) => {
    try {
      setDownloadingOffer(true);
      const response = await api.get(`/jobseeker/offers/${offerId}/download`, {
        responseType: 'blob'
      });
      
      const fileBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeCompanyName = companyName.replace(/\s+/g, '_');
      const safeRoleName = roleName.replace(/\s+/g, '_');
      link.setAttribute('download', `Offer_Letter_${safeCompanyName}_${safeRoleName}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Offer download failed:', error);
      showToast('failed', 'Failed to download offer letter documentation.', 'danger');
    } finally {
      setDownloadingOffer(false);
    }
  };

  const handleExportApplicationData = () => {
    if (!selectedApp) return;
    const exportData = {
      application: selectedApp,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `application-${selectedApp.applicationId}.json`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied': return 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20';
      case 'screened': return 'bg-[#af52de]/10 text-[#af52de] border-[#af52de]/20';
      case 'technical_round': return 'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20';
      case 'hr_round': return 'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20';
      case 'offer_sent': return 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border-[#34c759]/30';
      case 'hired': return 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border-[#34c759]/30';
      case 'rejected': return 'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20';
      case 'withdrawn': return 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] border-black/[0.04] dark:border-white/[0.06]';
      default: return 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] border-black/[0.04] dark:border-white/[0.06]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hired':
      case 'offer_sent':
        return <CheckCircle2 size={13} />;
      case 'rejected':
      case 'withdrawn':
        return <XCircle size={13} />;
      case 'technical_round':
      case 'hr_round':
        return <Video size={13} />;
      default:
        return <Clock size={13} />;
    }
  };

  const calculateDaysAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.currentStage.toLowerCase() === 'applied' && !a.isWithdrawn).length,
    activeRounds: applications.filter(a => ['screened', 'technical_round', 'hr_round'].includes(a.currentStage.toLowerCase()) && !a.isWithdrawn).length,
    offers: applications.filter(a => a.currentStage.toLowerCase() === 'offer_sent' || a.currentStage.toLowerCase() === 'hired').length,
    rejected: applications.filter(a => a.isWithdrawn || a.currentStage.toLowerCase() === 'rejected').length,
  };

  return (
    <div className="space-y-6 w-full max-w-full text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Applications</h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-0.5 font-medium">Track and manage all your job applications in one place</p>
        </div>
        <button
          onClick={fetchApplications}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className="text-[#0071e3]" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold text-[#86868b] uppercase tracking-wider">Total</p>
            <Briefcase size={16} className="text-[#86868b]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] dark:text-white mt-1.5">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold text-[#86868b] uppercase tracking-wider">Applied</p>
            <CheckCircle size={16} className="text-[#0071e3]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#0071e3] mt-1.5">{stats.applied}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold text-[#86868b] uppercase tracking-wider">In Progress</p>
            <TrendingUp size={16} className="text-[#ff9500]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#ff9500] mt-1.5">{stats.activeRounds}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold text-[#86868b] uppercase tracking-wider">Offers / Hired</p>
            <UserCheck size={16} className="text-[#34c759]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#34c759] mt-1.5">{stats.offers}</p>
        </div>
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold text-[#86868b] uppercase tracking-wider">Rejected</p>
            <XOctagon size={16} className="text-[#ff3b30]" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#ff3b30] mt-1.5">{stats.rejected}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" size={15} />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] font-medium focus:outline-none focus:border-[#0071e3]"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] appearance-none focus:outline-none focus:border-[#0071e3] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="screened">Screened</option>
              <option value="technical_round">Technical Round</option>
              <option value="hr_round">HR Round</option>
              <option value="offer_sent">Offer Sent</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" size={14} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="w-6 h-6 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-[#86868b] font-medium">Loading your applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-12 text-center shadow-xs max-w-md mx-auto">
          <Briefcase className="mx-auto mb-3 text-[#86868b]" size={36} />
          <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white mb-1">No applications found</h3>
          <p className="text-xs text-[#86868b] mb-5">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter to see more results'
              : "You haven't applied to any jobs yet"}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-2xl shadow-[0_4px_14px_rgba(0,113,227,0.25)] transition"
            >
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Application List */}
          <div className="w-full lg:w-5/12 space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
            {filteredApplications.map((app) => (
              <div
                key={app.applicationId}
                onClick={() => handleSelectApplication(app)}
                className={`bg-white dark:bg-[#1c1c1e] rounded-3xl border p-5 cursor-pointer transition-all ${
                  selectedApp?.applicationId === app.applicationId
                    ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20 shadow-md'
                    : 'border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-3">
                    {app.companyDetails.logoUrl ? (
                      <img
                        src={app.companyDetails.logoUrl}
                        alt={app.companyDetails.name}
                        className="w-10 h-10 rounded-2xl object-cover border border-black/[0.06] dark:border-white/[0.08] shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-[#0071e3]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-white truncate">{app.jobDetails.title}</h4>
                      <p className="text-xs text-[#86868b] font-medium mt-0.5 truncate">{app.companyDetails.name}</p>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-[#86868b]">
                        <MapPin size={12} />
                        <span className="truncate">{app.jobDetails.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(actionMenuOpen === app.applicationId ? null : app.applicationId);
                      }}
                      className="p-1.5 hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] rounded-xl transition-colors cursor-pointer text-[#86868b]"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {actionMenuOpen === app.applicationId && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl z-10 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadResume(app.resumeUsed.id, app.resumeUsed.name);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-[#1d1d1f] dark:text-white hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] flex items-center gap-2 cursor-pointer"
                        >
                          <Download size={13} className="text-[#0071e3]" />
                          Download Resume
                        </button>
                        {app.canWithdraw && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWithdraw(app.applicationId);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/10 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 size={13} />
                            Withdraw Application
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold border capitalize ${getStatusColor(app.liveStatusBadge)}`}>
                    {getStatusIcon(app.liveStatusBadge)}
                    <span>{app.liveStatusBadge.replace(/_/g, ' ')}</span>
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-[#86868b] font-medium">
                    <Clock size={12} />
                    <span>{calculateDaysAgo(app.appliedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="w-full lg:w-7/12 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 space-y-6 lg:sticky lg:top-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            {selectedApp ? (
              <>
                {/* Header */}
                <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-4 flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#86868b] bg-[#f2f2f7] dark:bg-[#2c2c2e] px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      ID: {selectedApp.applicationId.slice(0, 8)}
                    </span>
                    <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white mt-2">
                      {selectedApp.jobDetails.title}
                    </h2>
                    <p className="text-xs font-semibold text-[#86868b] mt-0.5">
                      {selectedApp.companyDetails.name} • {selectedApp.jobDetails.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleSalaryBenchmarking}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#34c759] bg-[#34c759]/10 border border-[#34c759]/20 rounded-2xl hover:bg-[#34c759]/20 transition-colors cursor-pointer"
                    >
                      <TrendingUp size={13} />
                      Salary Benchmarking
                    </button>

                    <button
                      onClick={handleExportApplicationData}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1d1d1f] dark:text-white bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl hover:bg-[#e5e5ea] transition-colors cursor-pointer"
                    >
                      <FileDown size={13} className="text-[#0071e3]" />
                      Export
                    </button>

                    {selectedApp.canWithdraw && (
                      <button
                        onClick={() => handleWithdraw(selectedApp.applicationId)}
                        disabled={processingWithdrawal !== null}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#ff3b30] bg-[#ff3b30]/10 border border-[#ff3b30]/20 rounded-2xl hover:bg-[#ff3b30]/20 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        {processingWithdrawal === selectedApp.applicationId ? 'Processing...' : 'Withdraw'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Offer Response Section */}
                {selectedApp.activeOffer && (
                  <div className="p-4 border border-[#34c759]/30 bg-[#34c759]/5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#34c759]" />
                      <h5 className="font-bold text-xs text-[#248a3d] dark:text-[#30d158]">Offer Letter Received</h5>
                    </div>
                    <p className="text-xs text-[#86868b]">
                      Sent: {new Date(selectedApp.activeOffer.sentAt).toLocaleDateString()} — Status: {selectedApp.activeOffer.status.toUpperCase()}
                    </p>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleDownloadOffer(selectedApp.activeOffer!.id, selectedApp.companyDetails.name, selectedApp.jobDetails.title)}
                        disabled={downloadingOffer}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-white text-xs font-bold rounded-2xl hover:bg-[#f2f2f7] disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        <FileText size={13} className="text-[#0071e3]" />
                        {downloadingOffer ? 'Downloading...' : 'Download Offer'}
                      </button>
                      {selectedApp.activeOffer.status === 'sent' && (
                        <button
                          onClick={() => setOfferModalOpen(true)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-2xl shadow-[0_4px_14px_rgba(0,113,227,0.25)] cursor-pointer"
                        >
                          Respond to Offer
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Insights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl">
                    <p className="text-[10px] text-[#86868b] uppercase font-bold tracking-wider">Experience</p>
                    <p className="text-xs font-bold text-[#1d1d1f] dark:text-white mt-1">
                      {selectedApp.jobDetails.experienceRequired || 'Not specified'}
                    </p>
                  </div>
                  <div className="p-3.5 bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl">
                    <p className="text-[10px] text-[#86868b] uppercase font-bold tracking-wider">Work Setting</p>
                    <p className="text-xs font-bold text-[#1d1d1f] dark:text-white mt-1">
                      {selectedApp.jobDetails.locationType || 'On-site'}
                    </p>
                  </div>
                  <div className="p-3.5 bg-[#34c759]/10 border border-[#34c759]/20 rounded-2xl">
                    <p className="text-[10px] text-[#34c759] uppercase font-bold tracking-wider">Compensation</p>
                    <p className="text-xs font-bold text-[#248a3d] dark:text-[#30d158] mt-1">
                      {selectedApp.jobDetails.compensationContext || 'Disclosed later'}
                    </p>
                  </div>
                </div>

                {/* Resume & Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDownloadResume(selectedApp.resumeUsed.id, selectedApp.resumeUsed.name)}
                    className="flex items-center gap-3 p-3.5 bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl hover:bg-[#f2f2f7] transition-colors cursor-pointer"
                  >
                    <Download size={16} className="text-[#0071e3]" />
                    <div className="text-left min-w-0">
                      <p className="text-[10px] text-[#86868b] uppercase font-bold tracking-wider">Resume Used</p>
                      <p className="text-xs font-bold text-[#1d1d1f] dark:text-white truncate">{selectedApp.resumeUsed.name}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 p-3.5 bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl">
                    <Clock size={16} className="text-[#86868b]" />
                    <div>
                      <p className="text-[10px] text-[#86868b] uppercase font-bold tracking-wider">Last Updated</p>
                      <p className="text-xs font-bold text-[#1d1d1f] dark:text-white">{new Date(selectedApp.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] dark:text-white flex items-center gap-2">
                    <Layers size={14} className="text-[#0071e3]" />
                    Application Timeline
                  </h3>
                  <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 bg-[#f2f2f7]/30 dark:bg-[#2c2c2e]/30 space-y-4">
                    {selectedApp.timelineView.map((log, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="relative flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0071e3] mt-1.5"></div>
                          {idx !== selectedApp.timelineView.length - 1 && (
                            <div className="w-px h-full bg-black/[0.08] dark:bg-white/[0.1] absolute top-4 bottom-0"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#1d1d1f] dark:text-white capitalize">
                              {log.stage ? log.stage.replace(/_/g, ' ') : 'Pending'}
                            </span>
                            <span className="text-[10px] text-[#86868b] font-medium">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-[#86868b] mt-0.5 font-medium">{log.notes || 'No notes recorded'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interviews */}
                {selectedApp.interviewHistory.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1d1d1f] dark:text-white flex items-center gap-2">
                      <Video size={14} className="text-[#af52de]" />
                      Interview Schedule
                    </h3>
                    <div className="space-y-2.5">
                      {selectedApp.interviewHistory.map((interview) => (
                        <div key={interview.interviewId} className="border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-4 bg-[#f2f2f7]/40 dark:bg-[#2c2c2e]/40">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-xs text-[#1d1d1f] dark:text-white">{interview.format.toUpperCase()}</p>
                              <p className="text-xs text-[#86868b] mt-0.5 font-medium">
                                {new Date(interview.scheduledTime).toLocaleString()} ({interview.durationMinutes} min)
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {interview.status === 'scheduled' && (
                                <button
                                  onClick={() => {
                                    setSelectedInterviewId(interview.interviewId);
                                    setSelectedInterviewTime(interview.scheduledTime);
                                    setRescheduleModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1d1d1f] dark:text-white bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl hover:bg-[#f2f2f7] cursor-pointer shadow-xs"
                                >
                                  <RefreshCw size={12} className="text-[#ff9500]" />
                                  Reschedule
                                </button>
                              )}
                              {interview.joinLink ? (
                                <Link
                                  href={`/meet/${interview.interviewId}`}
                                  className="inline-flex items-center px-4 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-xl shadow-xs"
                                >
                                  Join
                                </Link>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold text-[#86868b] bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-lg uppercase">
                                  {interview.status.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Modals List */}
      {salaryModalOpen && selectedApp && (
        <SalaryBenchmarkingModal
          isOpen={salaryModalOpen}
          onClose={() => setSalaryModalOpen(false)}
          title={selectedApp.jobDetails.title}
          location={selectedApp.jobDetails.location}
          experience={selectedApp.jobDetails.experienceRequired || '1-2 Years'}
          offeredSalary={selectedApp.jobDetails.compensationContext}
        />
      )}

      {offerModalOpen && selectedApp?.activeOffer && (
        <OfferResponseModal
          isOpen={offerModalOpen}
          onClose={() => setOfferModalOpen(false)}
          offerId={selectedApp.activeOffer.id}
          position={selectedApp.jobDetails.title}
          companyName={selectedApp.companyDetails.name}
          onSuccess={fetchApplications}
        />
      )}

      {rescheduleModalOpen && selectedInterviewId && (
        <RescheduleInterviewModal
          isOpen={rescheduleModalOpen}
          onClose={() => {
            setRescheduleModalOpen(false);
            setSelectedInterviewId(null);
          }}
          interviewId={selectedInterviewId}
          currentTime={selectedInterviewTime}
          onSuccess={fetchApplications}
        />
      )}
    </div>
  );
}