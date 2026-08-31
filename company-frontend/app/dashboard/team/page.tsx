'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { teamApi, TeamMember, GranularPermissions } from '@/app/lib/api/team';
import { useAuth } from '@/app/contexts/AuthContext';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { 
  MoreHorizontal, 
  UserPlus, 
  Trash2, 
  Shield, 
  Mail, 
  Calendar, 
  X, 
  ChevronDown, 
  Loader2,
  Check,
  Lock,
  Sparkles,
  SlidersHorizontal,
  Briefcase,
  DoorOpen,
  Video,
  UserCheck,
  Search,
  FileText,
  Zap,
  Users,
  Eye,
  Edit3,
  Plus,
  Info,
} from 'lucide-react';
import CustomBusinessRequestModal from '@/app/components/CustomBusinessRequestModal';

// ─── BITWISE SYSTEM ROLE CONSTANTS ───────────────────────────────────────────
const ROLES = {
  BASE_USER: 1,
  COMPANY_ADMIN: 2,
  COMPANY_HR: 4,
  COMPANY_INTERVIEWER: 8,
  COMPANY_VIEWER: 16,
  COMPANY_CUSTOM: 32,
};


// ─── MODULE PERMISSION DEFINITIONS ───────────────────────────────────────────
interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  actions: { id: string; label: string; description: string }[];
}

const PERMISSION_MODULES: ModuleConfig[] = [
  {
    id: 'jobs',
    name: 'Job Postings',
    description: 'Create, edit, publish, and close job postings and candidate pipelines.',
    icon: Briefcase,
    actions: [
      { id: 'read', label: 'View', description: 'View active listings and applicants' },
      { id: 'create', label: 'Post Job', description: 'Create and publish new job postings' },
      { id: 'edit', label: 'Edit Job', description: 'Modify description, salary, status' },
      { id: 'delete', label: 'Archive / Delete', description: 'Close or archive job postings' },
    ],
  },
  {
    id: 'walkin',
    name: 'Walk-In Rooms',
    description: 'Instant queue management, live fast-track sifting, and queue priority controls.',
    icon: DoorOpen,
    actions: [
      { id: 'read', label: 'View', description: 'Inspect room queues and wait times' },
      { id: 'create', label: 'Create Room', description: 'Open new walk-in room code' },
      { id: 'manage', label: 'Manage Queue', description: 'Call next, pause, reorder queue' },
    ],
  },
  {
    id: 'interviews',
    name: 'Live Interviews',
    description: 'Technical evaluations, proctored LiveKit video sessions, and scorecard submission.',
    icon: Video,
    actions: [
      { id: 'read', label: 'View', description: 'View scheduled interview calendar' },
      { id: 'schedule', label: 'Schedule', description: 'Schedule new interview rounds' },
      { id: 'conduct', label: 'Conduct Live', description: 'Enter video room as interviewer' },
      { id: 'feedback', label: 'Submit Scorecard', description: 'Rate & submit candidate verdict' },
    ],
  },
  {
    id: 'talent_pool',
    name: 'Talent Pool CRM',
    description: 'Manage candidate stages, notes, and organizational talent pipelines.',
    icon: UserCheck,
    actions: [
      { id: 'read', label: 'View', description: 'Browse company candidate records' },
      { id: 'create', label: 'Add Candidate', description: 'Add seekers to talent pool' },
      { id: 'edit', label: 'Update Stage', description: 'Move candidate across pipeline' },
    ],
  },
  {
    id: 'discovery',
    name: 'Seeker Discovery',
    description: 'Direct candidate search across verified public job seeker profiles.',
    icon: Search,
    actions: [
      { id: 'read', label: 'Search', description: 'Search & view discoverable profiles' },
      { id: 'contact', label: 'Fast-Track Invite', description: 'Directly invite candidates to jobs' },
    ],
  },
  {
    id: 'offers',
    name: 'Offer Letters',
    description: 'Generate, customize, approve, and dispatch formal offer letters.',
    icon: FileText,
    actions: [
      { id: 'read', label: 'View', description: 'View drafted and dispatched offers' },
      { id: 'create', label: 'Draft Offer', description: 'Create new offer letter' },
      { id: 'edit', label: 'Edit Perks', description: 'Modify compensation & template' },
      { id: 'send', label: 'Send to Candidate', description: 'Authorize & dispatch legally' },
    ],
  },
  {
    id: 'spot_jobs',
    name: 'Spot Jobs',
    description: 'Instant urgent hiring broadcasts and micro-shifts.',
    icon: Zap,
    actions: [
      { id: 'read', label: 'View', description: 'View spot job broadcasts' },
      { id: 'create', label: 'Broadcast', description: 'Publish spot job shifts' },
      { id: 'manage', label: 'Accept / Sift', description: 'Approve instant worker bookings' },
    ],
  },
  {
    id: 'team',
    name: 'Team Workspace',
    description: 'Corporate user management and granular access control.',
    icon: Users,
    actions: [
      { id: 'read', label: 'View Members', description: 'View corporate team members' },
      { id: 'invite', label: 'Invite', description: 'Invite new coworkers' },
      { id: 'edit', label: 'Edit Permissions', description: 'Update roles and module access' },
      { id: 'delete', label: 'Revoke Access', description: 'Remove members from workspace' },
    ],
  },
];

// Preset Templates
const PRESET_TEMPLATES: Record<string, { label: string; roleType: string; bitwise: number; permissions: GranularPermissions }> = {
  admin: {
    label: 'Company Administrator',
    roleType: 'admin',
    bitwise: ROLES.COMPANY_ADMIN,
    permissions: {
      jobs: ['read', 'create', 'edit', 'delete'],
      walkin: ['read', 'create', 'manage'],
      interviews: ['read', 'schedule', 'conduct', 'feedback'],
      talent_pool: ['read', 'create', 'edit'],
      discovery: ['read', 'contact'],
      offers: ['read', 'create', 'edit', 'send'],
      spot_jobs: ['read', 'create', 'manage'],
      team: ['read', 'invite', 'edit', 'delete'],
    },
  },
  hr: {
    label: 'HR & Talent Manager',
    roleType: 'hr',
    bitwise: ROLES.COMPANY_HR,
    permissions: {
      jobs: ['read', 'create', 'edit'],
      walkin: ['read', 'manage'],
      interviews: ['read', 'schedule', 'conduct', 'feedback'],
      talent_pool: ['read', 'create', 'edit'],
      discovery: ['read', 'contact'],
      offers: ['read', 'create', 'edit', 'send'],
      spot_jobs: ['read', 'create', 'manage'],
      team: ['read', 'invite'],
    },
  },
  interviewer: {
    label: 'Technical Interviewer',
    roleType: 'interviewer',
    bitwise: ROLES.COMPANY_INTERVIEWER,
    permissions: {
      jobs: ['read'],
      walkin: ['read'],
      interviews: ['read', 'conduct', 'feedback'],
      talent_pool: ['read'],
      discovery: ['read'],
      offers: ['read'],
      spot_jobs: ['read'],
      team: ['read'],
    },
  },
  recruiter: {
    label: 'Talent Recruiter',
    roleType: 'hr',
    bitwise: ROLES.COMPANY_HR,
    permissions: {
      jobs: ['read', 'create', 'edit'],
      walkin: ['read'],
      interviews: ['read', 'schedule'],
      talent_pool: ['read', 'create', 'edit'],
      discovery: ['read', 'contact'],
      offers: ['read', 'create'],
      spot_jobs: ['read'],
      team: ['read'],
    },
  },
  viewer: {
    label: 'Read-Only Viewer',
    roleType: 'viewer',
    bitwise: ROLES.COMPANY_VIEWER,
    permissions: {
      jobs: ['read'],
      walkin: ['read'],
      interviews: ['read'],
      talent_pool: ['read'],
      discovery: ['read'],
      offers: ['read'],
      spot_jobs: ['read'],
      team: ['read'],
    },
  },
  custom: {
    label: 'Custom Permissions Matrix',
    roleType: 'custom',
    bitwise: ROLES.COMPANY_CUSTOM,
    permissions: {
      jobs: ['read'],
      walkin: ['read'],
      interviews: ['read', 'conduct'],
      talent_pool: ['read'],
      discovery: ['read'],
      offers: ['read'],
      spot_jobs: ['read'],
      team: ['read'],
    },
  },

};

// ─── COLOR PALETTE FOR CUSTOM TAGS ──────────────────────────────────────────
const TAG_COLOR_PALETTES = [
  { bg: 'bg-blue-500/10 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500/25', dot: 'bg-blue-500' },
  { bg: 'bg-purple-500/10 dark:bg-purple-500/15', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500/25', dot: 'bg-purple-500' },
  { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/25', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-500/10 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500/25', dot: 'bg-amber-500' },
  { bg: 'bg-rose-500/10 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500/25', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-500/10 dark:bg-cyan-500/15', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-500/25', dot: 'bg-cyan-500' },
  { bg: 'bg-indigo-500/10 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500/25', dot: 'bg-indigo-500' },
  { bg: 'bg-teal-500/10 dark:bg-teal-500/15', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-500/25', dot: 'bg-teal-500' },
];

function getTagStyle(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTES.length;
  return TAG_COLOR_PALETTES[index];
}

const DEFAULT_STARTER_TAGS = [
  'Engineering',
  'Frontend',
  'Backend',
  'Design',
  'Product',
  'HR & Talent',
  'Leadership',
  'Operations',
  'Recruiting Squad',
  'APAC Team',
];

export default function TeamPage() {
  const { showToast } = useGlassToast();
  const { user, company, isAdmin, can, isViewer } = useAuth();
  const canManageTeam = isAdmin || can('team', 'manage') || can('team', 'invite') || can('team', 'create') || can('team', 'edit');

  const [members, setMembers] = useState<TeamMember[]>([]);

  const [companyTags, setCompanyTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Invite & Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('hr');
  const [customPermissions, setCustomPermissions] = useState<GranularPermissions>(
    PRESET_TEMPLATES.hr.permissions
  );
  const [submitting, setSubmitting] = useState(false);

  const maxTeamMembers = company?.subscription?.plan?.maxTeamMembers ?? 1;
  const isTeamLocked = members.length >= maxTeamMembers;

  const handleResendInvite = async (member: TeamMember) => {
    setResendingId(member.id);
    try {
      const res = await teamApi.resendInvite(member.id);
      showToast('Invitation Dispatched', res.data.message || `Invite email resent to ${member.email}`, 'success');
    } catch (err: any) {
      showToast('Dispatch Failed', err.response?.data?.message || 'Failed to resend invitation email', 'danger');
    } finally {
      setResendingId(null);
    }
  };


  const fetchTeam = async () => {
    try {
      const res = await teamApi.list();
      const teamList = res.data?.team || [];
      setMembers(teamList);
      
      // Aggregate tags from response or from list
      const aggregatedTags = res.data?.tags && res.data.tags.length > 0 
        ? res.data.tags 
        : Array.from(new Set(teamList.flatMap((m) => m.tags || [])));
      setCompanyTags(aggregatedTags);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  // Compute all available tags (existing in company + starter defaults)
  const availableSuggestionTags = useMemo(() => {
    const combined = Array.from(new Set([...companyTags, ...DEFAULT_STARTER_TAGS]));
    return combined.filter((t) => !formTags.includes(t));
  }, [companyTags, formTags]);

  // Filtered members list based on search, active tag filter, and status filter
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Status match
      const isPending = (m.status || 'pending').toLowerCase() === 'pending';
      if (statusFilter === 'ACTIVE' && isPending) return false;
      if (statusFilter === 'PENDING' && !isPending) return false;

      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        m.name?.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(query)));

      // Tag filter match
      const matchesTag = !activeTagFilter || (m.tags && m.tags.includes(activeTagFilter));

      return matchesSearch && matchesTag;
    });
  }, [members, searchQuery, activeTagFilter, statusFilter]);

  // Compute status counts
  const activeCount = useMemo(() => members.filter(m => (m.status || '').toLowerCase() === 'active').length, [members]);
  const pendingCount = useMemo(() => members.filter(m => (m.status || 'pending').toLowerCase() === 'pending').length, [members]);

  // Compute tag counts for the filter bar
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      (m.tags || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [members]);

  // Handle opening Invite Modal
  const handleOpenInvite = () => {
    if (isTeamLocked) {
      showToast(
        'Team Limit Reached',
        `Your current plan allows up to ${maxTeamMembers} team member(s). Upgrade or request a custom plan to add more.`,
        'info'
      );
      setRequestModalOpen(true);
      return;
    }
    setEditingMember(null);
    setFormEmail('');
    setFormTags([]);
    setTagInput('');
    setSelectedPreset('hr');
    setCustomPermissions(PRESET_TEMPLATES.hr.permissions);
    setIsModalOpen(true);
  };

  // Handle opening Edit Permissions Modal
  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormEmail(member.email);
    setFormTags(member.tags || []);
    setTagInput('');

    // Determine matching preset or custom
    let presetKey = 'custom';
    if (member.permissions) {
      for (const [key, preset] of Object.entries(PRESET_TEMPLATES)) {
        if (key !== 'custom' && JSON.stringify(preset.permissions) === JSON.stringify(member.permissions)) {
          presetKey = key;
          break;
        }
      }
    } else {
      if ((member.rolesMask & ROLES.COMPANY_ADMIN) === ROLES.COMPANY_ADMIN) presetKey = 'admin';
      else if ((member.rolesMask & ROLES.COMPANY_HR) === ROLES.COMPANY_HR) presetKey = 'hr';
      else if ((member.rolesMask & ROLES.COMPANY_INTERVIEWER) === ROLES.COMPANY_INTERVIEWER) presetKey = 'interviewer';
      else presetKey = 'viewer';
    }

    setSelectedPreset(presetKey);
    setCustomPermissions(member.permissions || PRESET_TEMPLATES[presetKey]?.permissions || PRESET_TEMPLATES.hr.permissions);
    setIsModalOpen(true);
  };

  // Tag manipulation helpers
  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim().replace(/^#/, '');
    if (!clean) return;
    if (!formTags.includes(clean)) {
      setFormTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  // Handle preset change
  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (PRESET_TEMPLATES[presetKey]) {
      setCustomPermissions(PRESET_TEMPLATES[presetKey].permissions);
    }
  };

  // Toggle single action permission
  const handleToggleAction = (moduleId: string, actionId: string) => {
    setSelectedPreset('custom');
    setCustomPermissions((prev) => {
      const current = prev[moduleId] || [];
      const updated = current.includes(actionId)
        ? current.filter((a) => a !== actionId)
        : [...current, actionId];

      return {
        ...prev,
        [moduleId]: updated,
      };
    });
  };

  // Toggle all actions in module
  const handleToggleModuleAll = (moduleId: string, actions: { id: string }[]) => {
    setSelectedPreset('custom');
    setCustomPermissions((prev) => {
      const current = prev[moduleId] || [];
      const allActionIds = actions.map((a) => a.id);
      const isAllSelected = allActionIds.every((id) => current.includes(id));

      return {
        ...prev,
        [moduleId]: isAllSelected ? ['read'] : allActionIds,
      };
    });
  };

  // Save permissions & tags (Invite or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember && !formEmail.trim()) {
      showToast('Validation Error', 'Team member email is required', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      let bitwiseMask = PRESET_TEMPLATES[selectedPreset]?.bitwise || ROLES.COMPANY_HR;

      if (editingMember) {
        // Update existing member permissions & tags
        await teamApi.updateRole(editingMember.id, {
          newRolesMask: bitwiseMask,
          permissions: customPermissions,
          tags: formTags,
        });
        showToast('Success', `Updated details for ${editingMember.name || editingMember.email}`, 'success');
      } else {
        // Invite new member with dynamic permissions & tags
        const roleTypeToSend = PRESET_TEMPLATES[selectedPreset]?.roleType || 'hr';
        await teamApi.invite({
          email: formEmail.trim(),
          roleType: roleTypeToSend,
          permissions: customPermissions,
          tags: formTags,
        });
        showToast('Success', `Invitation email dispatched to ${formEmail}`, 'success');
      }

      setIsModalOpen(false);
      fetchTeam();
    } catch (error: any) {
      showToast('Operation Failed', error.response?.data?.message || 'Failed to update member', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Revoke workspace access and permissions for ${name}?`)) return;
    try {
      await teamApi.remove(memberId);
      showToast('Success', 'Member access revoked successfully', 'success');
      fetchTeam();
    } catch (error) {
      showToast('Error', 'Failed to revoke member access', 'danger');
    }
  };

  const getStatusBadge = (member: TeamMember) => {
    const isPending = (member.status || 'pending').toLowerCase() === 'pending';
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>Pending Invite</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        <span>Active</span>
      </span>
    );
  };

  const getRoleBadge = (member: TeamMember) => {
    const mask = member.rolesMask;

    if ((mask & ROLES.COMPANY_ADMIN) === ROLES.COMPANY_ADMIN) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full bg-[#af52de]/10 border border-[#af52de]/20 text-[#af52de]">
          <Shield size={11} />
          <span>Admin</span>
        </span>
      );
    }
    if (member.permissions) {
      const moduleCount = Object.keys(member.permissions).filter((k) => (member.permissions![k] || []).length > 0).length;
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3]">
          <SlidersHorizontal size={11} />
          <span>Custom ({moduleCount} Modules)</span>
        </span>
      );
    }
    if ((mask & ROLES.COMPANY_HR) === ROLES.COMPANY_HR) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3]">
          HR Manager
        </span>
      );
    }
    if ((mask & ROLES.COMPANY_INTERVIEWER) === ROLES.COMPANY_INTERVIEWER) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full bg-[#34c759]/10 border border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158]">
          Interviewer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] text-[#86868b]">
        Viewer
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  const allAvailableTags = Object.keys(tagCounts);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
              Team &amp; Access Controls
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#86868b] dark:text-slate-400 mt-1 font-medium">
            Organize team members with custom tags, assign role permissions, and manage granular workspace access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-xs font-bold text-[#86868b] flex items-center gap-1.5">
            <Lock size={13} className="text-[#0071e3]" />
            <span>
              Seats: {members.length} / {maxTeamMembers}
            </span>
          </div>

          {canManageTeam && (
            <button
              onClick={handleOpenInvite}
              className="px-4 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] hover:from-[#0062c4] hover:to-[#1d4ed8] text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <UserPlus size={15} />
              <span>Invite Member &amp; Set Permissions</span>
            </button>
          )}
        </div>
      </div>


      {/* ── FILTER & TAGS TOOLBAR ───────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" size={15} />
            <input
              type="text"
              placeholder="Search member, email, or custom tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-zinc-900 dark:hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="text-xs text-[#86868b] font-medium flex items-center gap-2 shrink-0">
            <span>Showing {filteredMembers.length} of {members.length} team members</span>
          </div>
        </div>

        {/* Status and Tag Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none flex-wrap">
          {/* Status Filters */}
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'ALL' && activeTagFilter === null
                ? 'bg-[#0071e3] text-white shadow-xs'
                : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white border border-black/[0.04] dark:border-white/[0.06]'
            }`}
          >
            <span>All Members</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'ALL' && activeTagFilter === null ? 'bg-white/20 text-white' : 'bg-black/[0.06] dark:bg-white/10'}`}>
              {members.length}
            </span>
          </button>

          <button
            onClick={() => { setStatusFilter('ACTIVE'); setActiveTagFilter(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white border border-black/[0.04] dark:border-white/[0.06]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-black/[0.06] dark:bg-white/10'}`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => { setStatusFilter('PENDING'); setActiveTagFilter(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white border border-black/[0.04] dark:border-white/[0.06]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Pending Invite</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-black/[0.06] dark:bg-white/10'}`}>
              {pendingCount}
            </span>
          </button>

          <div className="h-4 w-[1px] bg-black/[0.08] dark:bg-white/[0.1] mx-1" />

          {/* Tag filters */}
          {allAvailableTags.map((tag) => {
            const isSelected = activeTagFilter === tag;
            const style = getTagStyle(tag);
            return (
              <button
                key={tag}
                onClick={() => { setActiveTagFilter(isSelected ? null : tag); setStatusFilter('ALL'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? `${style.bg} ${style.text} ${style.border} ring-2 ring-[#0071e3]/30`
                    : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] border-black/[0.04] dark:border-white/[0.06] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                <span>{tag}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/[0.06] dark:bg-white/10">
                  {tagCounts[tag]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TEAM MEMBER LIST TABLE ─────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#18181a] text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
                <th className="px-6 py-3.5">Workspace Member</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Assigned Role &amp; Capabilities</th>
                <th className="px-6 py-3.5">Team / Custom Tags</th>
                <th className="px-6 py-3.5">Joined Date</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-[#86868b]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users size={28} className="text-[#86868b]/40" />
                      <p className="font-semibold">No team members match the selected filter or search.</p>
                      {(activeTagFilter || statusFilter !== 'ALL') && (
                        <button
                          onClick={() => { setActiveTagFilter(null); setStatusFilter('ALL'); }}
                          className="text-[#0071e3] hover:underline font-bold mt-1 cursor-pointer"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isPending = (member.status || 'pending').toLowerCase() === 'pending';
                  return (
                    <tr key={member.id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="h-10 w-10 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[#0071e3] text-sm font-bold">
                              {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
                            {member.name || 'Team Member'}
                          </div>
                          <div className="text-[11px] text-[#86868b]">{member.email}</div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle">
                        {getStatusBadge(member)}
                      </td>

                      <td className="px-6 py-4 align-middle">
                        {getRoleBadge(member)}
                      </td>

                      {/* Custom Tags Column */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                          {member.tags && member.tags.length > 0 ? (
                            member.tags.map((tag) => {
                              const style = getTagStyle(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => setActiveTagFilter(tag)}
                                  title={`Filter by ${tag}`}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 hover:scale-105 ${style.bg} ${style.text} ${style.border}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                  <span>{tag}</span>
                                </button>
                              );
                            })
                          ) : canManageTeam ? (
                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="text-[11px] text-[#86868b] hover:text-[#0071e3] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                            >
                              <Plus size={12} />
                              <span>Add Tag</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#86868b] italic">None</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-[#86868b] align-middle font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#0071e3]" />
                          <span>
                            {member.joinedAt
                              ? new Date(member.joinedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Pending'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {canManageTeam ? (
                            <>
                              {isPending && (
                                <button
                                  onClick={() => handleResendInvite(member)}
                                  disabled={resendingId === member.id}
                                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  title="Resend invitation email"
                                >
                                  {resendingId === member.id ? (
                                    <Loader2 size={12} className="animate-spin text-amber-500" />
                                  ) : (
                                    <Mail size={12} className="text-amber-500" />
                                  )}
                                  <span>{resendingId === member.id ? 'Sending...' : 'Resend Invite'}</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEdit(member)}
                                className="px-3 py-1.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <SlidersHorizontal size={13} className="text-[#0071e3]" />
                                <span>Edit</span>
                              </button>

                              {isAdmin && (
                                <button
                                  onClick={() => handleRemove(member.id, member.name || member.email)}
                                  className="p-1.5 text-[#86868b] hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                                  title="Revoke access"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-[#86868b] px-2.5 py-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]">
                              Read Only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── GRANULAR PERMISSION & TAG MATRIX MODAL (INVITE & EDIT) ────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0071e3] text-white flex items-center justify-center shadow-xs">
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1d1d1f] dark:text-white">
                    {editingMember ? `Edit Member: ${editingMember.name || editingMember.email}` : 'Invite Member & Assign Access Permissions'}
                  </h3>
                  <p className="text-xs text-[#86868b]">
                    Set custom team tags, assign presets, and configure granular permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSave} className="space-y-5 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {!editingMember && (
                <div>
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-1.5">
                    Member Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                  />
                </div>
              )}

              {/* ── CUSTOM TAGS & TEAM GROUPING SECTION ── */}
              <div className="p-4 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">
                    Custom Tags &amp; Team Grouping
                  </label>
                  <span className="text-[11px] text-[#86868b]">
                    e.g. Engineering, APAC Hiring, Core Team
                  </span>
                </div>

                {/* Active Selected Tags */}
                {formTags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {formTags.map((tag) => {
                      const style = getTagStyle(tag);
                      return (
                        <span
                          key={tag}
                          className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-xs ${style.bg} ${style.text} ${style.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Input with Add button */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Type a custom tag name and press Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="w-full px-4 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    disabled={!tagInput.trim()}
                    className="px-3.5 py-2 bg-[#0071e3] hover:bg-[#0062c4] disabled:opacity-40 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Tag</span>
                  </button>
                </div>

                {/* Workspace Tag Suggestions (Reusable tags) */}
                {availableSuggestionTags.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-semibold text-[#86868b] flex items-center gap-1">
                      <Sparkles size={12} className="text-[#0071e3]" />
                      <span>Click to reuse existing / suggested tags:</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {availableSuggestionTags.map((tag) => {
                        const style = getTagStyle(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleAddTag(tag)}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white dark:bg-[#1c1c1e] hover:bg-black/[0.04] dark:hover:bg-white/10 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={11} className="text-[#0071e3]" />
                            <span>{tag}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Role Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                  Role Preset Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(PRESET_TEMPLATES).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetSelect(key)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        selectedPreset === key
                          ? 'border-[#0071e3] bg-[#0071e3]/10 dark:bg-[#0071e3]/20 shadow-xs'
                          : 'border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#1d1d1f] dark:text-white">
                          {preset.label}
                        </span>
                        {selectedPreset === key && (
                          <Check size={14} className="text-[#0071e3]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Module Matrix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
                    Granular Access Matrix ({PERMISSION_MODULES.length} Modules)
                  </label>
                  <span className="text-[11px] text-[#0071e3] font-semibold">
                    Toggle individual capabilities below
                  </span>
                </div>

                <div className="space-y-2.5">
                  {PERMISSION_MODULES.map((module) => {
                    const ModuleIcon = module.icon;
                    const activeActions = customPermissions[module.id] || [];
                    const allSelected = module.actions.every((a) => activeActions.includes(a.id));

                    return (
                      <div
                        key={module.id}
                        className="p-3.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#0071e3]/15 text-[#0071e3] flex items-center justify-center">
                              <ModuleIcon size={13} />
                            </div>
                            <span className="font-bold text-xs text-[#1d1d1f] dark:text-white">
                              {module.name}
                            </span>
                            <span className="text-[11px] text-[#86868b] hidden sm:inline">
                              &bull; {module.description}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(module.id, module.actions)}
                            className="text-[10px] font-bold text-[#0071e3] hover:underline cursor-pointer"
                          >
                            {allSelected ? 'Reset to View Only' : 'Select All Rights'}
                          </button>
                        </div>

                        {/* Action Chips Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {module.actions.map((act) => {
                            const isGranted = activeActions.includes(act.id);

                            return (
                              <button
                                key={act.id}
                                type="button"
                                onClick={() => handleToggleAction(module.id, act.id)}
                                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                                  isGranted
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                                    : 'bg-white dark:bg-[#1c1c1e] border-black/[0.04] dark:border-white/[0.06] text-[#86868b] opacity-60 hover:opacity-100'
                                }`}
                              >
                                <div>
                                  <span className="block text-xs leading-tight">
                                    {act.label}
                                  </span>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-md flex items-center justify-center ${
                                    isGranted ? 'bg-emerald-500 text-white' : 'border border-black/[0.2] dark:border-white/[0.2]'
                                  }`}
                                >
                                  {isGranted && <Check size={11} strokeWidth={3} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-2xl text-xs font-semibold hover:bg-[#e5e5ea] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer hover:opacity-95 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  <span>{editingMember ? 'Save Permissions & Tags' : 'Dispatch Invite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Upgrade Request Modal */}
      {requestModalOpen && (
        <CustomBusinessRequestModal
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
        />
      )}
    </div>
  );
}