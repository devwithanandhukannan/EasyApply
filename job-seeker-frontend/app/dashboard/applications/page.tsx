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
    } catch (error) {
      console.error('Error fetching applications tracker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAndFilter = () => {
    let result = [...applications];

    if (statusFilter !== 'all') {
      result = result.filter(app => app.liveStatusBadge.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const targetQuery = searchQuery.toLowerCase();
      result = result.filter(app =>
        app.jobDetails.title.toLowerCase().includes(targetQuery) ||
        app.companyDetails.name.toLowerCase().includes(targetQuery)
      );
    }

    setFilteredApplications(result);
  };

  const handleSelectApplication = (app: ApplicationTrackItem) => {
    setSelectedApp(app);
    setEditingNotes(app.candidateNotes || '');
    setActionMenuOpen(null);
  };

  const handleUpdateNotes = async () => {
    if (!selectedApp) return;
    try {
      setSavingNotes(true);
      const response = await api.patch(`/jobseeker/applications/${selectedApp.applicationId}/notes`, {
        notes: editingNotes
      });
      if (response.data.success) {
        setApplications(prev => prev.map(item =>
          item.applicationId === selectedApp.applicationId
            ? { ...item, candidateNotes: editingNotes }
            : item
        ));
        setSelectedApp(prev => prev ? { ...prev, candidateNotes: editingNotes } : null);
      }
    } catch (err) {
      showToast('failed', 'Failed to save notes', 'danger');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;

    try {
      setProcessingWithdrawal(id);
      const response = await api.post(`/jobseeker/applications/${id}/withdraw`);
      if (response.data.success) {
        showToast('withdrawn', 'Application withdrawn successfully', 'success');
        await fetchApplications();
      }
    } catch (error: any) {
      showToast('failed', error.response?.data?.error || 'Failed to withdraw application', 'danger');
    } finally {
      setProcessingWithdrawal(null);
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
      // Fetches direct file buffer using internal dynamic endpoints
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
      case 'applied': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'screened': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'technical_round': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'hr_round': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'offer_sent': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'hired': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'withdrawn': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hired':
      case 'offer_sent':
        return <CheckCircle2 size={14} />;
      case 'rejected':
      case 'withdrawn':
        return <XCircle size={14} />;
      case 'technical_round':
      case 'hr_round':
        return <Video size={14} />;
      default:
        return <Clock size={14} />;
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 bg-black min-h-screen text-zinc-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Applications</h1>
          <p className="text-sm text-zinc-500 mt-1">Track and manage all your job applications in one place</p>
        </div>
        <button
          onClick={fetchApplications}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total</p>
            <Briefcase size={18} className="text-zinc-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Applied</p>
            <CheckCircle size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">{stats.applied}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">In Progress</p>
            <TrendingUp size={18} className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-400 mt-2">{stats.activeRounds}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Offers / Hired</p>
            <UserCheck size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{stats.offers}</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Withdrawn / Rejected</p>
            <XOctagon size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2">{stats.rejected}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-zinc-200 appearance-none focus:outline-none focus:ring-2 focus:ring-zinc-600"
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
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="w-8 h-8 border-3 border-zinc-700 border-t-white rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-zinc-500">Loading your applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-12 text-center">
          <Briefcase className="mx-auto mb-3 text-zinc-700" size={48} />
          <h3 className="text-lg font-medium text-white mb-1">No applications found</h3>
          <p className="text-sm text-zinc-500 mb-5">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter to see more results'
              : "You haven't applied to any jobs yet"}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/dashboard/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg shadow-sm hover:bg-zinc-200 transition-colors"
            >
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Application List */}
          <div className="w-full lg:w-5/12 space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
            {filteredApplications.map((app) => (
              <div
                key={app.applicationId}
                onClick={() => handleSelectApplication(app)}
                className={`bg-zinc-900 rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedApp?.applicationId === app.applicationId
                    ? 'border-zinc-500 ring-2 ring-zinc-700 shadow-md'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    {app.companyDetails.logoUrl ? (
                      <img
                        src={app.companyDetails.logoUrl}
                        alt={app.companyDetails.name}
                        className="w-10 h-10 rounded-lg object-cover bg-black border border-zinc-800 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-black border border-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={18} className="text-zinc-500" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-base font-semibold text-white">{app.jobDetails.title}</h4>
                      <p className="text-sm text-zinc-400 mt-0.5">{app.companyDetails.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        <MapPin size={12} />
                        <span>{app.jobDetails.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuOpen(actionMenuOpen === app.applicationId ? null : app.applicationId);
                      }}
                      className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors"
                    >
                      <MoreVertical size={16} className="text-zinc-500" />
                    </button>

                    {actionMenuOpen === app.applicationId && (
                      <div className="absolute right-0 mt-1 w-48 bg-black border border-zinc-800 rounded-lg shadow-lg z-10 py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadResume(app.resumeUsed.id, app.resumeUsed.name);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 flex items-center gap-2"
                        >
                          <Download size={14} />
                          Download Resume
                        </button>
                        {app.canWithdraw && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWithdraw(app.applicationId);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Withdraw Application
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.liveStatusBadge)}`}>
                    {getStatusIcon(app.liveStatusBadge)}
                    <span>{app.liveStatusBadge.replace(/_/g, ' ')}</span>
                  </span>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock size={12} />
                    <span>{calculateDaysAgo(app.appliedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="w-full lg:w-7/12 bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-6 lg:sticky lg:top-6 shadow-sm">
            {selectedApp ? (
              <>
                {/* Header */}
                <div className="border-b border-zinc-800 pb-4 flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <span className="text-xs font-mono text-zinc-500 bg-black px-2 py-0.5 rounded border border-zinc-800">
                      ID: {selectedApp.applicationId.slice(0, 8)}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-2">
                      {selectedApp.jobDetails.title}
                    </h2>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {selectedApp.companyDetails.name} • {selectedApp.jobDetails.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSalaryBenchmarking}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-black border border-zinc-800 rounded-lg hover:bg-zinc-900 hover:border-emerald-900/50 transition-colors"
                    >
                      <TrendingUp size={14} />
                      Salary Benchmarking
                    </button>

                    <button
                      onClick={handleExportApplicationData}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-black border border-zinc-800 rounded-lg hover:bg-zinc-900"
                    >
                      <FileDown size={14} />
                      Export
                    </button>

                    {selectedApp.canWithdraw && (
                      <button
                        onClick={() => handleWithdraw(selectedApp.applicationId)}
                        disabled={processingWithdrawal !== null}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-black border border-red-900/50 rounded-lg hover:bg-red-950/30 hover:border-red-800/50"
                      >
                        <Trash2 size={14} />
                        {processingWithdrawal === selectedApp.applicationId ? 'Processing...' : 'Withdraw'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Offer Response Section */}
                {selectedApp.activeOffer && (
                  <div className="p-4 border border-indigo-900/50 bg-indigo-950/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-indigo-400" />
                      <h5 className="font-semibold text-indigo-300">Offer Letter Received</h5>
                    </div>
                    <p className="text-xs text-indigo-300/70">
                      Sent: {new Date(selectedApp.activeOffer.sentAt).toLocaleDateString()} — Status: {selectedApp.activeOffer.status.toUpperCase()}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDownloadOffer(selectedApp.activeOffer!.id, selectedApp.companyDetails.name, selectedApp.jobDetails.title)}
                        disabled={downloadingOffer}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-black border border-indigo-800 text-indigo-300 text-sm font-medium rounded-lg hover:bg-indigo-950/40 disabled:opacity-50"
                      >
                        <FileText size={14} />
                        {downloadingOffer ? 'Downloading...' : 'Download Offer'}
                      </button>
                      {selectedApp.activeOffer.status === 'sent' && (
                        <button
                          onClick={() => setOfferModalOpen(true)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                        >
                          Respond to Offer
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Job & Salary Benchmarking Insights Meta Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-black border border-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500 uppercase font-medium">Experience Level</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {selectedApp.jobDetails.experienceRequired || 'Not specified'}
                    </p>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500 uppercase font-medium">Work Setting</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {selectedApp.jobDetails.locationType || 'On-site'}
                    </p>
                  </div>
                  <div className="p-3 bg-black border border-zinc-800 rounded-lg border-emerald-900/30 bg-emerald-950/5">
                    <p className="text-xs text-emerald-500 uppercase font-medium flex items-center gap-1">
                      Compensation
                    </p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">
                      {selectedApp.jobDetails.compensationContext || 'Disclosed later'}
                    </p>
                  </div>
                </div>

                {/* Resume & Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDownloadResume(selectedApp.resumeUsed.id, selectedApp.resumeUsed.name)}
                    className="flex items-center gap-3 p-3 bg-black border border-zinc-800 rounded-lg hover:bg-zinc-900 transition-colors"
                  >
                    <Download size={18} className="text-zinc-500" />
                    <div className="text-left">
                      <p className="text-xs text-zinc-500 uppercase font-medium">Resume Used</p>
                      <p className="text-sm font-medium text-zinc-300 truncate">{selectedApp.resumeUsed.name}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 p-3 bg-black border border-zinc-800 rounded-lg">
                    <Clock size={18} className="text-zinc-500" />
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-medium">Last Updated</p>
                      <p className="text-sm font-medium text-zinc-300">{new Date(selectedApp.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers size={16} className="text-zinc-500" />
                    Application Timeline
                  </h3>
                  <div className="border border-zinc-800 rounded-xl p-4 bg-black/40 space-y-4">
                    {selectedApp.timelineView.map((log, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="relative flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>
                          {idx !== selectedApp.timelineView.length - 1 && (
                            <div className="w-px h-full bg-zinc-800 absolute top-4 bottom-0"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium text-white">
                              {log.stage ? log.stage.replace(/_/g, ' ') : 'Pending'}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">{log.notes || 'No notes provided'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interviews */}
                {selectedApp.interviewHistory.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Video size={16} className="text-zinc-500" />
                      Interview Schedule
                    </h3>
                    <div className="space-y-3">
                      {selectedApp.interviewHistory.map((interview) => (
                        <div key={interview.interviewId} className="border border-zinc-800 rounded-xl p-4 bg-black">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">{interview.format.toUpperCase()}</p>
                              <p className="text-sm text-zinc-400 mt-0.5">
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-md hover:bg-zinc-700"
                                >
                                  <RefreshCw size={12} />
                                  Reschedule
                                </button>
                              )}
                              {interview.joinLink ? (
                                <Link
                                  href={`/meet/${interview.interviewId}`}
                                  className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700"
                                >
                                  Join
                                </Link>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 rounded-md">
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