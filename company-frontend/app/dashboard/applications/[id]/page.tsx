'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Clock, User, Mail, Phone, MapPin, FileText, 
  Star, TrendingUp, CheckCircle, XCircle, AlertCircle, Clock as ClockIcon,
  ChevronRight, Edit3, Eye, Download, ExternalLink, Activity, MessageSquare
} from 'lucide-react';
import api from '@/app/lib/axios';
import FeedbackModal from '@/app/components/FeedbackModal';

interface JobSeekerProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  profilePhotoUrl: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  bio: string | null;
  availabilityStatus: string;
}

interface Resume {
  id: string;
  name: string;
  filePath: string;
  atsScore: number | null;
}

interface JobPosting {
  id: string;
  title: string;
  department: string | null;
  jobType: string;
  locationType: string;
  salaryRange: string | null;
  requiredSkills: any;
}

interface FeedbackEntry {
  id: string;
  interviewerId: string;
  technicalRating: number;
  communicationRating: number;
  problemSolvingRating: number;
  verdict: 'shortlist' | 'reject' | 'on_hold' | 'next_round';
  notes: string;
  createdAt: string;
  updatedAt: string;
  interviewer: {
    id: string;
    jobSeekerProfile: { fullName: string; email: string } | null;
  };
}

interface Interview {
  id: string;
  scheduledTime: string;
  durationMinutes: number;
  format: string;
  status: string;
  livekitRoomName: string;
  feedbacks: FeedbackEntry[];
  batch?: {
    interviewers: Array<{
      teamMemberId: string;
      teamMember: {
        id: string;
        user: { 
          id: string;
          jobSeekerProfile: { fullName: string; email: string } | null 
        };
      };
    }>;
  };
}

interface HistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  changedByType: string;
  notes: string | null;
  createdAt: string;
  metadata: any;
}

interface ActivityEntry {
  id: string;
  activityType: string;
  performedBy: string;
  metadata: any;
  createdAt: string;
}

interface OfferLetter {
  id: string;
  position: string;
  salary: number;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface ApplicationDetail {
  id: string;
  status: string;
  appliedAt: string;
  isStarred: boolean;
  priority: number | null;
  pipelineIndex: number;
  lastActivityAt: string;
  jobSeekerProfile: JobSeekerProfile;
  resume: Resume | null;
  jobPosting: JobPosting;
  interviews: Interview[];
  statusHistory: HistoryEntry[];
  activities: ActivityEntry[];
  offerLetters: OfferLetter[];
}

interface SessionInfo {
  userId: string;
  companyRoles: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  applied: { label: 'Applied', color: 'text-blue-400', bg: 'bg-blue-950/20 border-blue-900', icon: FileText },
  screened: { label: 'Screened', color: 'text-cyan-400', bg: 'bg-cyan-950/20 border-cyan-900', icon: CheckCircle },
  technical_round: { label: 'Technical Round', color: 'text-amber-400', bg: 'bg-amber-950/20 border-amber-900', icon: Activity },
  hr_round: { label: 'HR Round', color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900', icon: MessageSquare },
  offer_sent: { label: 'Offer Sent', color: 'text-green-400', bg: 'bg-green-950/20 border-green-900', icon: CheckCircle },
  hired: { label: 'Hired', color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-900', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-950/20 border-red-900', icon: XCircle },
};

const VERDICT_CONFIG = {
  shortlist: { label: 'Shortlisted', color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-900', icon: CheckCircle },
  next_round: { label: 'Next Round', color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-900', icon: ChevronRight },
  on_hold: { label: 'On Hold', color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-900', icon: ClockIcon },
  reject: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-950/30 border-red-900', icon: XCircle },
};

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'history'>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [myFeedbackForInterview, setMyFeedbackForInterview] = useState<FeedbackEntry | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sessionRes, appRes] = await Promise.all([
        api.get('/company/auth/session'),
        api.get(`/company/applications/${id}/detail`),
      ]);

      if (sessionRes.data.success) {
        setSession({
          userId: sessionRes.data.userId ?? '',
          companyRoles: sessionRes.data.companyRoles ?? 0,
        });
      }

      if (appRes.data.success) {
        setApplication(appRes.data.data);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleOpenFeedbackModal = (interviewId: string, existingFeedback: FeedbackEntry | null) => {
    setSelectedInterviewId(interviewId);
    setMyFeedbackForInterview(existingFeedback);
    setIsModalOpen(true);
  };

  const handleFeedbackSuccess = () => {
    loadData();
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-black font-mono">
        <p className="text-xs text-zinc-500 animate-pulse uppercase tracking-wider">Loading Application Details...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] font-mono text-center p-4">
        <XCircle className="w-8 h-8 text-zinc-700 mb-3" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Application Not Found</h3>
        <button onClick={() => router.back()} className="mt-4 text-xs text-white underline uppercase tracking-wide">
          Go Back
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[application.status] ?? STATUS_CONFIG.applied;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-black text-white font-mono p-4 pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-wide"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pipeline
          </button>
          
          <div className="flex items-center gap-2">
            {application.isStarred && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            )}
            {application.priority && (
              <span className="px-2 py-1 bg-red-950/40 border border-red-900 text-red-400 text-[10px] font-bold rounded uppercase">
                P{application.priority}
              </span>
            )}
          </div>
        </div>

        {/* Candidate Overview Card */}
        <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {application.jobSeekerProfile.profilePhotoUrl ? (
                <img
                  src={application.jobSeekerProfile.profilePhotoUrl}
                  alt={application.jobSeekerProfile.fullName}
                  className="w-16 h-16 rounded-full border-2 border-zinc-800 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center">
                  <User className="w-8 h-8 text-zinc-600" />
                </div>
              )}
              
              <div>
                <h1 className="text-xl font-bold text-white">{application.jobSeekerProfile.fullName}</h1>
                {application.jobSeekerProfile.bio && (
                  <p className="text-sm text-zinc-400 mt-0.5 line-clamp-1">{application.jobSeekerProfile.bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {application.jobSeekerProfile.email}
                  </div>
                  {application.jobSeekerProfile.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {application.jobSeekerProfile.phone}
                    </div>
                  )}
                  {application.jobSeekerProfile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {application.jobSeekerProfile.location}
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(application.jobSeekerProfile.linkedin || 
                  application.jobSeekerProfile.github || 
                  application.jobSeekerProfile.portfolio) && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {application.jobSeekerProfile.linkedin && (
                      <a
                        href={application.jobSeekerProfile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-blue-950/20 border border-blue-900 text-blue-400 hover:text-blue-300 rounded text-xs flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        LinkedIn
                      </a>
                    )}
                    {application.jobSeekerProfile.github && (
                      <a
                        href={application.jobSeekerProfile.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded text-xs flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        GitHub
                      </a>
                    )}
                    {application.jobSeekerProfile.portfolio && (
                      <a
                        href={application.jobSeekerProfile.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-purple-950/20 border border-purple-900 text-purple-400 hover:text-purple-300 rounded text-xs flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Portfolio
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={`px-4 py-2 border rounded-lg ${statusCfg.bg} flex items-center gap-2`}>
              <StatusIcon className={`w-4 h-4 ${statusCfg.color}`} />
              <span className={`text-xs font-bold uppercase ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
          </div>

          {/* Updated Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-900">
            <div>
              <span className="text-[10px] text-zinc-600 uppercase block mb-1">Applied For</span>
              <span className="text-sm text-white font-semibold">{application.jobPosting.title}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-600 uppercase block mb-1">Applied On</span>
              <span className="text-sm text-zinc-300">{new Date(application.appliedAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-600 uppercase block mb-1">ATS Score</span>
              <div className="flex items-center gap-2">
                {application.resume?.atsScore ? (
                  <>
                    <span className="text-sm font-bold text-white">{application.resume.atsScore}%</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </>
                ) : (
                  <span className="text-sm text-zinc-600">N/A</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-zinc-600 uppercase block mb-1">Availability</span>
              <span className={`text-xs font-bold uppercase ${
                application.jobSeekerProfile.availabilityStatus === 'available' 
                  ? 'text-emerald-400' 
                  : application.jobSeekerProfile.availabilityStatus === 'spot_available'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}>
                {application.jobSeekerProfile.availabilityStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Resume Section */}
          {application.resume && (
            <div className="pt-4 border-t border-zinc-900">
              <span className="text-[10px] text-zinc-600 uppercase block mb-2">Resume</span>
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-600" />
                  <span className="text-sm text-zinc-300">{application.resume.name}</span>
                </div>
                <a
                  href={application.resume.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-zinc-900 flex gap-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'interviews', label: `Interviews (${application.interviews.length})` },
            { key: 'history', label: `Timeline (${application.statusHistory.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? 'text-white border-b-2 border-white'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Job Details */}
            <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Job Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-zinc-600 block mb-1">Department</span>
                  <span className="text-white">{application.jobPosting.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-zinc-600 block mb-1">Job Type</span>
                  <span className="text-white uppercase">{application.jobPosting.jobType}</span>
                </div>
                <div>
                  <span className="text-zinc-600 block mb-1">Location Type</span>
                  <span className="text-white uppercase">{application.jobPosting.locationType}</span>
                </div>
                {application.jobPosting.salaryRange && (
                  <div>
                    <span className="text-zinc-600 block mb-1">Salary Range</span>
                    <span className="text-white">{application.jobPosting.salaryRange}</span>
                  </div>
                )}
              </div>
              {application.jobPosting.requiredSkills && (
                <div>
                  <span className="text-[10px] text-zinc-600 uppercase block mb-2">Required Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(application.jobPosting.requiredSkills) 
                      ? application.jobPosting.requiredSkills 
                      : []
                    ).map((skill: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] text-zinc-600 uppercase font-bold">Total Interviews</span>
                </div>
                <span className="text-2xl font-bold text-white">{application.interviews.length}</span>
              </div>
              <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-zinc-600 uppercase font-bold">Feedback Received</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  {application.interviews.reduce((acc, i) => acc + (i.feedbacks?.length || 0), 0)}
                </span>
              </div>
              <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] text-zinc-600 uppercase font-bold">Last Activity</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {new Date(application.lastActivityAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="space-y-4">
            {application.interviews.length === 0 ? (
              <div className="border border-dashed border-zinc-900 bg-zinc-950 p-12 rounded-xl text-center">
                <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-xs text-zinc-500">No interviews scheduled yet</p>
              </div>
            ) : (
              application.interviews.map((interview) => {
                const myFeedback = session 
                  ? interview.feedbacks?.find(f => f.interviewerId === session.userId) ?? null
                  : null;
                
                const totalInterviewers = interview.batch?.interviewers?.length || 0;
                const submittedCount = interview.feedbacks?.length || 0;
                const allSubmitted = submittedCount >= totalInterviewers && totalInterviewers > 0;

                return (
                  <div key={interview.id} className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-4">
                    {/* Interview Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-zinc-600" />
                          <span className="text-sm font-semibold text-white">
                            {new Date(interview.scheduledTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span>{interview.durationMinutes} minutes</span>
                          <span>•</span>
                          <span className="uppercase">{interview.format}</span>
                          <span>•</span>
                          <span className="uppercase">{interview.status.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase ${
                          allSubmitted 
                            ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' 
                            : 'bg-amber-950/20 border-amber-900 text-amber-400'
                        }`}>
                          {submittedCount}/{totalInterviewers} Feedback
                        </span>

                        <button
                          onClick={() => handleOpenFeedbackModal(interview.id, myFeedback)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border ${
                            myFeedback
                              ? 'bg-amber-950/20 border-amber-900/60 text-amber-400 hover:bg-amber-950/40'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {myFeedback ? <Edit3 className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                          {myFeedback ? 'Update Feedback' : 'Submit Feedback'}
                        </button>

                        <a
                          href={`/meet/${interview.id}?role=company`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Panel Members */}
                    {interview.batch?.interviewers && interview.batch.interviewers.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Panel Members</h4>
                        <div className="flex flex-wrap gap-2">
                          {interview.batch.interviewers.map((iv) => {
                            const name = iv.teamMember?.user?.jobSeekerProfile?.fullName ?? 'Unknown';
                            const hasSubmitted = interview.feedbacks?.some(
                              f => f.interviewerId === iv.teamMember?.id || f.interviewerId === iv.teamMemberId
                            );
                            
                            return (
                              <div 
                                key={iv.teamMemberId}
                                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                                  hasSubmitted
                                    ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                                }`}
                              >
                                {hasSubmitted ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <ClockIcon className="w-3 h-3" />
                                )}
                                {name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Feedback Entries */}
                    {interview.feedbacks && interview.feedbacks.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-zinc-900">
                        <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Submitted Feedback</h4>
                        {interview.feedbacks.map((fb) => {
                          const vcfg = VERDICT_CONFIG[fb.verdict];
                          const VerdictIcon = vcfg.icon;
                          const isOwnFeedback = session?.userId === fb.interviewerId;
                          const avgRating = ((fb.technicalRating + fb.communicationRating + fb.problemSolvingRating) / 3).toFixed(1);

                          return (
                            <div 
                              key={fb.id} 
                              className={`border rounded-lg overflow-hidden ${vcfg.bg} ${
                                isOwnFeedback ? 'ring-2 ring-zinc-700' : ''
                              }`}
                            >
                              <div className="p-4 bg-black/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    <span className="text-xs font-bold text-zinc-400">
                                      {fb.interviewer?.jobSeekerProfile?.fullName?.charAt(0) || 'I'}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-zinc-200">
                                        {fb.interviewer?.jobSeekerProfile?.fullName || 'Unknown'}
                                      </span>
                                      {isOwnFeedback && (
                                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-[9px] text-white uppercase font-bold">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                      <span className="text-xs font-bold text-white">{avgRating}</span>
                                      <span className="text-[10px] text-zinc-600">/5.0</span>
                                    </div>
                                  </div>
                                </div>

                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${vcfg.bg} ${vcfg.color}`}>
                                  <VerdictIcon className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold uppercase">{vcfg.label}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-0.5 bg-zinc-900/50">
                                {[
                                  { label: 'Technical', val: fb.technicalRating },
                                  { label: 'Communication', val: fb.communicationRating },
                                  { label: 'Problem Solving', val: fb.problemSolvingRating },
                                ].map((m) => (
                                  <div key={m.label} className="bg-black/40 p-3 text-center">
                                    <div className="text-lg font-bold text-white">{m.val}</div>
                                    <div className="text-[9px] text-zinc-600 uppercase">{m.label}</div>
                                  </div>
                                ))}
                              </div>

                              {fb.notes && (
                                <div className="p-4 bg-black/30">
                                  <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Notes</div>
                                  <p className="text-xs text-zinc-400 leading-relaxed">{fb.notes}</p>
                                </div>
                              )}

                              <div className="p-3 bg-black/20 border-t border-zinc-900/50 text-[10px] text-zinc-600">
                                Updated: {new Date(fb.updatedAt).toLocaleString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {application.statusHistory.length === 0 ? (
              <div className="border border-dashed border-zinc-900 bg-zinc-950 p-12 rounded-xl text-center">
                <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-xs text-zinc-500">No history records found</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-900" />

                {application.statusHistory.map((entry, idx) => {
                  const fromStatusCfg = entry.fromStatus ? STATUS_CONFIG[entry.fromStatus] : null;
                  const toStatusCfg = STATUS_CONFIG[entry.toStatus];

                  return (
                    <div key={entry.id} className="relative pl-16 pb-8">
                      {/* Timeline Dot */}
                      <div className="absolute left-4 top-1 w-5 h-5 rounded-full bg-zinc-950 border-2 border-zinc-700 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-zinc-600" />
                      </div>

                      <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {fromStatusCfg && (
                            <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${fromStatusCfg.bg} ${fromStatusCfg.color}`}>
                              {fromStatusCfg.label}
                            </span>
                          )}
                          {fromStatusCfg && <ChevronRight className="w-3 h-3 text-zinc-700" />}
                          <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${toStatusCfg.bg} ${toStatusCfg.color}`}>
                            {toStatusCfg.label}
                          </span>
                        </div>

                        {entry.notes && (
                          <p className="text-xs text-zinc-400 leading-relaxed">{entry.notes}</p>
                        )}

                        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                          <details className="text-xs">
                            <summary className="text-zinc-600 cursor-pointer hover:text-zinc-400">
                              Technical Metadata
                            </summary>
                            <pre className="mt-2 p-2 bg-black border border-zinc-900 rounded text-[10px] text-zinc-500 overflow-x-auto">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </details>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-zinc-600 pt-2 border-t border-zinc-900">
                          <span>Changed by: {entry.changedBy}</span>
                          <span>•</span>
                          <span>{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {selectedInterviewId && (
        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInterviewId(null);
            setMyFeedbackForInterview(null);
          }}
          interviewId={selectedInterviewId}
          existingFeedback={myFeedbackForInterview}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
}