'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Mail, Phone, MapPin, Download, User,
  Code2, Briefcase, GraduationCap, FileText, UserPlus, Star, Tag, AlertCircle
} from 'lucide-react';
import api from '@/app/lib/axios';
import AddToTalentPoolModal from '@/app/components/AddToTalentPoolModal';
import { useAuth } from '@/app/contexts/AuthContext';

export default function ApplicationDetailsPage() {
  const { isAdmin, isHR } = useAuth();
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;

  const [appData, setAppData] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarLoading, setIsStarLoading] = useState(false);
  const [poolModalOpen, setPoolModalOpen] = useState(false);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
      fetchTimeline();
    }
  }, [applicationId]);

  const fetchApplicationDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/company/selection/applications/${applicationId}`);
      if (response.data.success) {
        setAppData(response.data.data);
      }
    } catch (error) {
      console.error('Fetch application error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await api.get(`/company/selection/applications/${applicationId}/timeline`);
      if (response.data.success) {
        setTimeline(response.data.data);
      }
    } catch (error) {
      console.error('Fetch timeline error:', error);
    }
  };

  const handleToggleStar = async () => {
    if (!appData) return;
    setIsStarLoading(true);
    try {
      await api.post('/company/selection/bulk/star', {
        applicationIds: [applicationId],
        starred: !appData.isStarred
      });
      // Refresh to pull updated CRM state
      await fetchApplicationDetails();
    } catch (error) {
      console.error('Toggle star error:', error);
    } finally {
      setIsStarLoading(false);
    }
  };

  const handleDownloadResume = () => {
    if (appData?.resume?.filePath) {
      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${appData.resume.filePath}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <p className="text-xs text-zinc-500 animate-pulse font-mono">Loading telemetry details...</p>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <p className="text-xs text-zinc-500 font-mono">Application profile data not found</p>
      </div>
    );
  }

  const application = appData;
  const candidate = appData.jobSeekerProfile || {};
  const job = appData.jobPosting || {};
  const appliedResume = appData.resume || {};
  const resumeContent = appliedResume.content || {};
  const resumeDetails = (typeof resumeContent === 'object' && resumeContent.parsedData) || {};

  return (
    <div className="space-y-6 text-white font-mono max-w-6xl mx-auto w-full p-4 selection:bg-zinc-800">
      
      {/* Header Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-tight text-white uppercase flex items-center gap-2">
            {candidate.fullName || 'Candidate'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Applied Pipeline: <span className="text-zinc-300">{job.title || 'Job'}</span> • {new Date(application.appliedAt).toLocaleDateString()}
          </p>
        </div>

        {(isAdmin || isHR) && (
          <div className="flex items-center gap-2">
            {/* Star Candidate Action */}
            <button
              onClick={handleToggleStar}
              disabled={isStarLoading}
              className={`p-2 border rounded-lg transition-colors ${
                appData.isStarred 
                  ? 'border-amber-500/30 bg-amber-950/20 text-amber-400 hover:bg-amber-950/40' 
                  : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
              }`}
              title={appData.isStarred ? "Unstar Candidate" : "Star Candidate"}
            >
              <Star className={`w-4 h-4 ${appData.isStarred ? 'fill-current' : ''}`} />
            </button>

            {/* Add to Talent Pool Action */}
            <button
              onClick={() => setPoolModalOpen(true)}
              className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-white rounded-lg transition-colors flex items-center gap-2 text-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add to Pool</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Information Bar */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Core Profile Card */}
          <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-4">
              {candidate.profilePhotoUrl ? (
                <img 
                  src={candidate.profilePhotoUrl}
                  alt={candidate.fullName}
                  className="w-14 h-14 rounded-md border border-zinc-800 object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <User className="w-6 h-6 text-zinc-600" />
                </div>
              )}
              
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white tracking-wide">{candidate.fullName}</h3>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] border font-bold uppercase tracking-wider ${
                  application.status === 'hired' ? 'bg-emerald-950/40 border-emerald-900 text-emerald-400' :
                  application.status === 'rejected' ? 'bg-red-950/40 border-red-900 text-red-400' :
                  'bg-blue-950/40 border-blue-900 text-blue-400'
                }`}>
                  {application.status}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-900 text-xs">
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-zinc-400 truncate break-all">{candidate.email}</span>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-zinc-400">{candidate.phone}</span>
                </div>
              )}
              {candidate.location && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-zinc-400">{candidate.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resume Diagnostics */}
          <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Resume Telemetry</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded bg-zinc-900/40 border border-zinc-900">
                <span className="text-xs text-zinc-400">ATS Match Rating</span>
                <span className={`text-sm font-bold ${
                  (appliedResume.atsScore || 0) >= 80 ? 'text-emerald-400' :
                  (appliedResume.atsScore || 0) >= 60 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {appliedResume.atsScore || 0}%
                </span>
              </div>
              <button
                onClick={handleDownloadResume}
                disabled={!appliedResume.filePath}
                className="w-full px-3 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white rounded-lg text-xs transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Download System File
              </button>
            </div>
          </div>

          {/* CRM Indicators / Meta */}
          <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">CRM Matrix</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Tier Priority</span>
                {application.priority ? (
                  <span className={`px-2 py-0.5 border rounded font-bold ${
                    application.priority === 1 ? 'bg-red-950/40 border-red-900 text-red-400' :
                    application.priority === 2 ? 'bg-amber-950/40 border-amber-900 text-amber-400' :
                    'bg-blue-950/40 border-blue-900 text-blue-400'
                  }`}>
                    P{application.priority}
                  </span>
                ) : (
                  <span className="text-zinc-600">Unassigned</span>
                )}
              </div>

              {application.tags?.length > 0 && (
                <div className="pt-2.5 border-t border-zinc-900">
                  <div className="flex flex-wrap gap-1">
                    {application.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-zinc-600" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Information Panels */}
        <div className="lg:col-span-2 space-y-4">
          {/* Activity Lifecycle Timeline */}
          {timeline?.statusHistory?.length > 0 && (
            <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Application Timeline</h4>
              <div className="space-y-3">
                {timeline.statusHistory.map((entry: any, index: number) => (
                  <div key={entry.id} className="flex gap-4 relative">
                    {index !== timeline.statusHistory.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-px bg-zinc-900" />
                    )}
                    <div className="shrink-0 w-4 h-4 rounded-full bg-zinc-900 border-2 border-zinc-700 relative z-10 mt-1" />
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white capitalize">
                            {entry.toStatus?.replace(/_/g, ' ') || 'Unknown'}
                          </p>
                          {entry.notes && <p className="text-xs text-zinc-500">{entry.notes}</p>}
                        </div>
                        <span className="text-xs text-zinc-600 shrink-0">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engine Parsed Skills */}
          {resumeDetails.skills?.length > 0 && (
            <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-zinc-500" /> Technical Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {resumeDetails.skills.map((skill: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs hover:border-zinc-700 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience Array */}
          {resumeDetails.experience?.length > 0 && (
            <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-zinc-500" /> Professional Experience
              </h4>
              <div className="space-y-4">
                {resumeDetails.experience.map((exp: any, index: number) => (
                  <div key={index} className="border-l border-zinc-900 pl-4 space-y-1 relative">
                    <div className="absolute w-2 h-2 rounded-full bg-zinc-700 left-[-4.5px] top-1.5" />
                    <div className="flex flex-wrap justify-between items-baseline gap-2">
                      <h5 className="text-sm font-bold text-white">{exp.role || exp.title}</h5>
                      <span className="text-xs text-zinc-500 font-medium">
                        {exp.startDate} — {exp.endDate || 'Present'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">
                      {exp.company} {exp.location && <span className="text-zinc-600">({exp.location})</span>}
                    </p>
                    {exp.description && <p className="text-xs text-zinc-500 pt-1 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Block */}
          {resumeDetails.education?.length > 0 && (
            <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-zinc-500" /> Education History
              </h4>
              <div className="space-y-3">
                {resumeDetails.education.map((edu: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-zinc-900/40 pb-2 last:border-0 last:pb-0">
                    <div>
                      <h5 className="font-bold text-zinc-300">{edu.degree || edu.field}</h5>
                      <p className="text-zinc-500 text-[11px] mt-0.5">
                        {edu.institution} {edu.location && `• ${edu.location}`}
                      </p>
                    </div>
                    <span className="text-zinc-600 shrink-0 font-medium">
                      {edu.startYear} — {edu.endYear}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default State Fallback */}
          {!resumeDetails.skills && !resumeDetails.experience && !resumeDetails.education && (
            <div className="border border-dashed border-zinc-900 bg-zinc-950 rounded-xl p-12 text-center">
              <FileText className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
              <p className="text-xs text-zinc-600">No structured parser matrices found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Talent Pool Sync Management Modal */}
      {poolModalOpen && (
  <AddToTalentPoolModal
    open={poolModalOpen}
    onClose={() => setPoolModalOpen(false)}
    // Change candidate.id to application.jobSeekerProfileId to ensure it's never null
    jobSeekerProfileId={application.jobSeekerProfileId || candidate.id} 
    candidateName={candidate.fullName || 'Candidate'}
  />
)}
    </div>
  );
}