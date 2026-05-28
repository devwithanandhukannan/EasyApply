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
  FileDown
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';
import OfferResponseModal from '@/app/components/OfferResponseModal';
import RescheduleInterviewModal from '@/app/components/RescheduleInterviewModal';

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
    location: string;
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
  const [applications, setApplications] = useState<ApplicationTrackItem[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationTrackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedApp, setSelectedApp] = useState<ApplicationTrackItem | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);

  // New modal states
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [selectedInterviewTime, setSelectedInterviewTime] = useState<string>('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    handleSearchAndFilter();
  }, [searchQuery, statusFilter, applications]);

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
      alert('Failed to save notes');
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
        alert('Application withdrawn successfully');
        await fetchApplications();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to withdraw application');
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
      alert('Failed to download resume');
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
      case 'applied': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'screened': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'technical_round': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hr_round': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'offer_sent': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'hired': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'withdrawn': return 'bg-zinc-500/10 text-zinc-500 border-zinc-800';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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
    <div className="space-y-6 font-mono max-w-7xl mx-auto p-4 text-zinc-300">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 uppercase">Application Tracker Matrix</h1>
        <p className="text-zinc-500 text-xs tracking-wider">COMPREHENSIVE WORKFLOW MONITORING SYSTEM</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total</p>
          <p className="text-2xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Applied</p>
          <p className="text-2xl font-semibold text-blue-500">{stats.applied}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">In Process</p>
          <p className="text-2xl font-semibold text-yellow-500">{stats.activeRounds}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Offers/Hired</p>
          <p className="text-2xl font-semibold text-emerald-500">{stats.offers}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Withdrawn/End</p>
          <p className="text-2xl font-semibold text-red-500">{stats.rejected}</p>
        </div>
      </div>

      {/* Search/Filter */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black border border-[#2c2c2e] rounded-lg text-white text-xs focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-black border border-[#2c2c2e] rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-500"
          >
            <option value="all">ALL STATUSES</option>
            <option value="applied">APPLIED</option>
            <option value="screened">SCREENED</option>
            <option value="technical_round">TECHNICAL ROUND</option>
            <option value="hr_round">HR ROUND</option>
            <option value="offer_sent">OFFER SENT</option>
            <option value="hired">HIRED</option>
            <option value="rejected">REJECTED</option>
            <option value="withdrawn">WITHDRAWN</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-900 rounded-xl">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-zinc-600 text-xs tracking-widest uppercase font-bold">Loading...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-12 text-center">
          <Briefcase className="mx-auto mb-3 text-zinc-700" size={40} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-1">No Applications Found</h3>
          <p className="text-zinc-500 text-xs mb-5">
            {searchQuery || statusFilter !== 'all' ? 'No matching applications' : 'Start applying to jobs'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/dashboard/jobs"
              className="inline-block px-5 py-2 bg-white text-black font-bold uppercase text-[11px] rounded hover:bg-zinc-200 transition-colors tracking-wider"
            >
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          
          {/* Application List */}
          <div className="w-full lg:w-5/12 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            {filteredApplications.map((app) => (
              <div
                key={app.applicationId}
                onClick={() => handleSelectApplication(app)}
                className={`bg-[#1c1c1e] border rounded-xl p-4 cursor-pointer transition-all relative ${
                  selectedApp?.applicationId === app.applicationId
                    ? 'border-zinc-500 shadow-md bg-zinc-950/60'
                    : 'border-[#2c2c2e] hover:border-zinc-700 hover:bg-zinc-950/20'
                }`}
              >
                {/* Quick Actions Menu */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenuOpen(actionMenuOpen === app.applicationId ? null : app.applicationId);
                    }}
                    className="p-1 hover:bg-zinc-900 rounded"
                  >
                    <MoreVertical size={14} className="text-zinc-600" />
                  </button>
                  
                  {actionMenuOpen === app.applicationId && (
                    <div className="absolute right-0 mt-1 bg-black border border-zinc-800 rounded-lg shadow-xl z-10 min-w-[160px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadResume(app.resumeUsed.id, app.resumeUsed.name);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-2"
                      >
                        <Download size={12} />
                        Download Resume
                      </button>
                      {app.canWithdraw && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithdraw(app.applicationId);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 flex items-center gap-2"
                        >
                          <Trash2 size={12} />
                          Withdraw
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start space-x-3">
                  {app.companyDetails.logoUrl ? (
                    <img
                      src={app.companyDetails.logoUrl}
                      alt={app.companyDetails.name}
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-800"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-zinc-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="text-sm font-bold text-white truncate uppercase tracking-tight">
                      {app.jobDetails.title}
                    </h4>
                    <p className="text-zinc-500 text-xs mt-0.5 truncate uppercase tracking-tight">{app.companyDetails.name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2c2c2e]/60">
                  <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStatusColor(app.liveStatusBadge)}`}>
                    {getStatusIcon(app.liveStatusBadge)}
                    <span>{app.liveStatusBadge.replace('_', ' ')}</span>
                  </span>
                  <div className="flex items-center space-x-1 text-[10px] text-zinc-600 font-medium">
                    <Clock size={10} />
                    <span>{calculateDaysAgo(app.appliedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="w-full lg:w-7/12 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-5 space-y-6 lg:sticky lg:top-4">
            {selectedApp ? (
              <>
                {/* Header */}
                <div className="border-b border-[#2c2c2e] pb-4 flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold bg-black px-2 py-0.5 border border-zinc-900 rounded">
                      ID: {selectedApp.applicationId.slice(0, 8)}
                    </span>
                    <h2 className="text-lg font-bold text-white uppercase tracking-tight mt-2">
                      {selectedApp.jobDetails.title}
                    </h2>
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                      {selectedApp.companyDetails.name} | {selectedApp.jobDetails.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportApplicationData}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-800 bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white rounded text-[10px] font-bold uppercase tracking-widest transition-all"
                      title="Export Application Data"
                    >
                      <FileDown size={12} />
                      EXPORT
                    </button>

                    {selectedApp.canWithdraw && (
                      <button
                        onClick={() => handleWithdraw(selectedApp.applicationId)}
                        disabled={processingWithdrawal !== null}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-800 bg-black hover:bg-red-950/20 text-zinc-500 hover:text-red-400 hover:border-red-900/40 rounded text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        <Trash2 size={12} />
                        {processingWithdrawal === selectedApp.applicationId ? 'PROCESSING...' : 'WITHDRAW'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Offer Response Section */}
                {selectedApp.activeOffer && (
                  <div className="p-3.5 border border-indigo-900 bg-indigo-950/10 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-indigo-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={14} /> Offer Letter Received
                        </h5>
                        <p className="text-[10px] text-indigo-300/60 mt-0.5">
                          Sent: {new Date(selectedApp.activeOffer.sentAt).toLocaleDateString()} — Status: {selectedApp.activeOffer.status.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={selectedApp.activeOffer.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-indigo-900/40 hover:bg-indigo-900 border border-indigo-800 text-indigo-200 rounded text-[10px] uppercase font-bold tracking-widest transition-colors"
                      >
                        <FileText size={12} />
                        View Offer
                      </a>

                      {selectedApp.activeOffer.status === 'sent' && (
                        <button
                          onClick={() => setOfferModalOpen(true)}
                          className="flex-1 px-3 py-1.5 bg-white hover:bg-zinc-200 text-black rounded text-[10px] uppercase font-bold tracking-widest transition-colors"
                        >
                          Respond to Offer
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Resume Download */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDownloadResume(selectedApp.resumeUsed.id, selectedApp.resumeUsed.name)}
                    className="p-3 bg-black border border-[#2c2c2e] rounded-lg flex items-center space-x-3 hover:bg-zinc-950 transition-colors"
                  >
                    <Download size={16} className="text-zinc-600 flex-shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black">Resume Used</p>
                      <p className="text-zinc-300 text-xs truncate mt-0.5">{selectedApp.resumeUsed.name}</p>
                    </div>
                  </button>
                  
                  <div className="p-3 bg-black border border-[#2c2c2e] rounded-lg flex items-center space-x-3">
                    <Clock size={16} className="text-zinc-600 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-black">Last Updated</p>
                      <p className="text-zinc-300 text-xs mt-0.5">{new Date(selectedApp.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    <Layers size={12} className="text-zinc-600" /> Application Timeline
                  </h3>
                  
                  <div className="border border-[#2c2c2e] rounded-lg bg-black/40 p-4 relative space-y-4">
                    <div className="absolute top-4 bottom-4 left-6 border-l border-[#2c2c2e] z-0"></div>

                    {selectedApp.timelineView.map((log, idx) => (
                      <div key={idx} className="flex gap-4 relative z-10 items-start">
                        <div className="w-4 h-4 rounded-full border border-[#2c2c2e] bg-black flex items-center justify-center flex-shrink-0 mt-0.5 text-[8px] text-zinc-600 font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-white text-xs font-bold uppercase tracking-wide">
                              {log.stage ? log.stage.replace(/_/g, ' ') : 'PENDING'}
                            </span>
                            <span className="text-[9px] text-zinc-600 font-medium">
                              {new Date(log.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                            {log.notes || 'No notes'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interviews */}
                {selectedApp.interviewHistory.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                      <Video size={12} className="text-zinc-600" /> Interview Schedule
                    </h3>

                    <div className="space-y-2.5">
                      {selectedApp.interviewHistory.map((interview) => (
                        <div key={interview.interviewId} className="border border-[#2c2c2e] bg-black/30 rounded-lg p-3.5 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-zinc-200 text-xs font-bold uppercase tracking-tight">
                                {interview.format.toUpperCase()}
                              </p>
                              <p className="text-zinc-600 text-[10px] mt-0.5">
                                {new Date(interview.scheduledTime).toLocaleString()} ({interview.durationMinutes} Min)
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
                                  className="px-2 py-1 border border-zinc-800 bg-black hover:bg-zinc-900 text-zinc-400 hover:text-white rounded text-[9px] uppercase font-bold tracking-wide transition-colors flex items-center gap-1"
                                >
                                  <RefreshCw size={10} />
                                  Reschedule
                                </button>
                              )}

                              {interview.joinLink ? (
                                <Link
                                  href={`/meet/${interview.interviewId}`}
                                  className="px-3 py-1 bg-white hover:bg-zinc-200 text-black rounded text-[10px] uppercase font-black tracking-widest transition-all"
                                >
                                  Join
                                </Link>
                              ) : (
                                <span className="px-2 py-0.5 border border-zinc-800 bg-black text-zinc-500 text-[9px] uppercase font-bold tracking-wide rounded">
                                  {interview.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>

                          {interview.companyFeedback.length > 0 && (
                            <div className="pt-2 border-t border-[#2c2c2e] space-y-2">
                              <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black">Company Feedback</p>
                              {interview.companyFeedback.map((fb, fidx) => (
                                <div key={fidx} className="bg-black border border-zinc-900 p-2.5 rounded text-[10px] space-y-1">
                                  <div className="flex items-center justify-between text-zinc-400">
                                    <span className="font-bold text-zinc-300 uppercase">Verdict: {fb.verdict}</span>
                                    <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-zinc-500 italic">"{fb.notes}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Private Notes */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    <Edit3 size={12} className="text-zinc-600" /> Private Notes
                  </h3>

                  <div className="space-y-2">
                    <textarea
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Add private notes about this application..."
                      className="w-full min-h-[75px] text-xs bg-black border border-[#2c2c2e] rounded-lg p-3 text-zinc-300 placeholder-zinc-700 font-mono focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleUpdateNotes}
                        disabled={savingNotes}
                        className="px-3 py-1.5 bg-[#2c2c2e] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded text-[10px] uppercase font-bold tracking-widest transition-all disabled:opacity-50"
                      >
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-24 text-center text-zinc-600 flex flex-col items-center justify-center">
                <Info size={18} className="text-zinc-800 mb-1" />
                <p className="text-[10px] uppercase font-bold tracking-widest">Select an application to view details</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modals */}
      {selectedApp?.activeOffer && (
        <OfferResponseModal
          isOpen={offerModalOpen}
          onClose={() => setOfferModalOpen(false)}
          offerId={selectedApp.activeOffer.id}
          position={selectedApp.activeOffer.position}
          companyName={selectedApp.companyDetails.name}
          onSuccess={fetchApplications}
        />
      )}

      {selectedInterviewId && (
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