'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, Users, CheckCircle2, Search, Layers } from 'lucide-react';
import api from '@/app/lib/axios';
import { teamApi, TeamMember } from '@/app/lib/api/team';

interface ScheduleInterviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  selectedApplicationIds: string[];
  initialTargetStatus?: string;
  onSuccess: () => void;
}

const ROLES = {
  COMPANY_ADMIN: 2,
  COMPANY_HR: 4,
  COMPANY_INTERVIEWER: 8,
  COMPANY_VIEWER: 16,
};

export default function ScheduleInterviewsModal({
  isOpen,
  onClose,
  jobId,
  selectedApplicationIds,
  initialTargetStatus,
  onSuccess,
}: ScheduleInterviewsModalProps) {
  const [minDateString, setMinDateString] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('10:00');
  const [slotDuration, setSlotDuration] = useState('30');
  const [interviewFormat, setInterviewFormat] = useState('video');
  const [targetStatus, setTargetStatus] = useState(initialTargetStatus ?? 'technical_round');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    if (initialTargetStatus) {
      setTargetStatus(initialTargetStatus);
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    setMinDateString(formattedDate);
    setCustomDate(formattedDate);
    setError('');
    setSelectedInterviewerIds([]);
    setSearchQuery('');

    const fetchTeamData = async () => {
      try {
        setLoadingTeam(true);
        const res = await teamApi.list();
        setTeamMembers(res.data?.team || []);
      } catch (err) {
        console.error('Failed to resolve panel team structure mapping:', err);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchTeamData();
  }, [isOpen, initialTargetStatus]);

  if (!isOpen) return null;

  const getRoleLabel = (mask: number) => {
    if ((mask & ROLES.COMPANY_ADMIN) === ROLES.COMPANY_ADMIN) return 'Admin';
    if ((mask & ROLES.COMPANY_HR) === ROLES.COMPANY_HR) return 'HR';
    if ((mask & ROLES.COMPANY_INTERVIEWER) === ROLES.COMPANY_INTERVIEWER) return 'Interviewer';
    return 'Viewer';
  };

  const filteredTeamMembers = teamMembers.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleInterviewer = (id: string) => {
    setSelectedInterviewerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllTeam = () => {
    const filteredIds = filteredTeamMembers.map((m) => m.id);
    const allFilteredSelected = filteredIds.every((id) => selectedInterviewerIds.includes(id));
    if (allFilteredSelected) {
      setSelectedInterviewerIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedInterviewerIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedInterviewerIds.length === 0) {
      setError('Please assign at least one workspace panel interviewer to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      const combinedDateTime = new Date(`${customDate}T${customTime}:00`);

      if (combinedDateTime.getTime() < Date.now()) {
        setError('Selected execution window cannot target a timeline point in the past.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        jobPostingId: jobId,
        startTime: combinedDateTime.toISOString(),
        slotDuration: parseInt(slotDuration, 10),
        interviewFormat: interviewFormat.toUpperCase(),
        interviewerIds: selectedInterviewerIds,
        selectedApplicationIds,
        targetStatus,
      };

      const response = await api.post('/company/interviews/bulk-schedule', payload);
      if (response.data.success) {
        onSuccess();
      } else {
        setError(response.data.message || 'Failed to initialize booking session sequence.');
      }
    } catch (err: any) {
      console.error('Error dispatching bulk scheduling payload:', err);
      setError(err.response?.data?.message || 'Failed to complete pipeline block execution routine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetLabel = targetStatus === 'hr_round' ? 'HR Round' : 'Technical Round';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 font-mono text-xs">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
          <div>
            <h3 className="text-sm font-semibold text-white">Batch Interview Config</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Configuring <span className="text-white font-medium">{targetLabel}</span> for{' '}
              {selectedApplicationIds.length} candidate{selectedApplicationIds.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white rounded-lg transition-colors" type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Date & Time */}
          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-zinc-400">Initial Batch Launch Window</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={minDateString}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 [color-scheme:dark] cursor-pointer"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 [color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Duration & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Slot Duration</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
                >
                  <option value="15">15 Min</option>
                  <option value="30">30 Min</option>
                  <option value="45">45 Min</option>
                  <option value="60">60 Min</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Channel Format</label>
              <div className="relative">
                <Video className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <select
                  value={interviewFormat}
                  onChange={(e) => setInterviewFormat(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
                >
                  <option value="video">WebRTC Video</option>
                  <option value="coding_test">Coding Stack</option>
                  <option value="mixed">Mixed Lab</option>
                </select>
              </div>
            </div>
          </div>

          {/* Target Stage */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">Target Pipeline Stage</label>
            <div className="relative">
              <Layers className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
              >
                <option value="technical_round">Technical Round</option>
                <option value="hr_round">HR Round</option>
              </select>
            </div>
          </div>

          {/* Interviewer Assignment */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-zinc-500" />
                <span>Panel Assignee ({filteredTeamMembers.length})</span>
              </label>
              {filteredTeamMembers.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllTeam}
                  className="text-[10px] text-zinc-400 hover:text-white transition-colors border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  {filteredTeamMembers.map((m) => m.id).every((id) => selectedInterviewerIds.includes(id))
                    ? 'Clear Filtered'
                    : 'Select Filtered'}
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter panel members by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-900 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-800"
              />
            </div>

            {loadingTeam ? (
              <div className="py-6 text-center text-zinc-600 animate-pulse border border-zinc-900 bg-black/40 rounded-xl">
                Resolving dynamic panel rosters...
              </div>
            ) : filteredTeamMembers.length === 0 ? (
              <div className="p-4 border border-dashed border-zinc-900 text-zinc-600 rounded-xl text-center font-mono text-[11px]">
                No matching team members discovered.
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto border border-zinc-900 bg-black rounded-xl p-1 divide-y divide-zinc-900 space-y-0.5 custom-scrollbar">
                {filteredTeamMembers.map((member) => {
                  const isChecked = selectedInterviewerIds.includes(member.id);
                  const roleLabel = getRoleLabel(member.rolesMask);
                  return (
                    <div
                      key={member.id}
                      onClick={() => handleToggleInterviewer(member.id)}
                      className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                        isChecked ? 'bg-zinc-900/40' : 'hover:bg-zinc-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 max-w-[80%]">
                        <div className="h-6 w-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-500 text-[10px] uppercase flex-shrink-0 overflow-hidden">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            <span>{member.name?.charAt(0)}</span>
                          )}
                        </div>
                        <div className="truncate space-y-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-zinc-200 truncate font-medium">{member.name}</p>
                            <span className={`px-1.5 py-0.5 text-[9px] uppercase font-semibold rounded tracking-wide border flex-shrink-0 ${
                              roleLabel === 'Admin' ? 'bg-purple-950/30 text-purple-400 border-purple-900/50' :
                              roleLabel === 'HR' ? 'bg-blue-950/30 text-blue-400 border-blue-900/50' :
                              roleLabel === 'Interviewer' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' :
                              'bg-zinc-900 text-zinc-500 border-zinc-800'
                            }`}>
                              {roleLabel}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-600 truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="pr-1 flex items-center">
                        {isChecked ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <div className="h-3.5 w-3.5 border border-zinc-800 rounded-full" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-medium">
              {selectedInterviewerIds.length} host{selectedInterviewerIds.length !== 1 ? 's' : ''} allocated
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                {isSubmitting ? 'Generating Slots...' : 'Confirm Pipeline Allocation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}