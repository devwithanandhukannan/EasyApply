'use client';

import { useEffect, useState, useRef } from 'react';
import { teamApi } from '@/app/lib/api/team';
import { useAuth } from '@/app/contexts/AuthContext';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { MoreHorizontal, UserPlus, Trash2, Shield, Mail, Calendar, X, ChevronDown, Loader2 } from 'lucide-react';

// ─── BITWISE SYSTEM ROLE CONSTANTS ───────────────────────────────────────────
const ROLES = {
  BASE_USER: 1,
  COMPANY_ADMIN: 2,
  COMPANY_HR: 4,
  COMPANY_INTERVIEWER: 8,
  COMPANY_VIEWER: 16,
};

// ─── INLINE PREMIUM MINI BUTTON ──────────────────────────────────────────────
interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  children: React.ReactNode;
}

const CustomButton = ({ variant = 'default', size = 'default', className = '', children, ...props }: CustomButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
  
  const variants = {
    default: 'bg-[#0071e3] text-white hover:bg-[#0077ed] rounded-2xl text-xs shadow-[0_2px_8px_rgba(0,113,227,0.25)]',
    ghost: 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white rounded-2xl',
    outline: 'border border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-2xl',
  };

  const sizes = {
    default: 'h-10 px-4',
    sm: 'h-8 px-3 text-xs',
    icon: 'h-8 w-8 p-0',
  };

  return (
    <button
      type="button"
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// ─── INLINE SELECT DROPDOWN ──────────────────────────────────────────────────
interface CustomSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  options: { value: string; label: string }[];
}

const CustomSelect = ({ value, onValueChange, options }: CustomSelectProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative w-full text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-2xl px-4 h-10 flex items-center justify-between text-left focus:outline-none focus:border-[#0071e3] transition-colors cursor-pointer"
      >
        <span className="font-semibold">{selectedOption ? selectedOption.label : 'Select role...'}</span>
        <ChevronDown className={`h-4 w-4 text-[#86868b] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute w-full mt-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl z-50 p-1.5 space-y-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onValueChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 rounded-xl transition-colors text-xs font-semibold cursor-pointer ${
                value === opt.value 
                  ? 'bg-[#0071e3] text-white' 
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── INLINE TEAM ROW MODULE ──────────────────────────────────────────────────
interface TeamRowProps {
  member: any;
  getRoleBadge: (role: number | string) => React.ReactNode;
  handleRoleChange: (id: string, mask: number) => void;
  handleRemove: (id: string, name: string) => void;
}

const TeamRow = ({ member, getRoleBadge, handleRoleChange, handleRemove }: TeamRowProps) => {
  const [panelOpen, setPanelOpen] = useState(false);

  const currentRoleValue = typeof member.rolesMask === 'number' 
    ? member.rolesMask 
    : (typeof member.roleMask === 'number' ? member.roleMask : ROLES.COMPANY_VIEWER);

  return (
    <>
      <tr className={`border-b border-black/[0.04] dark:border-white/[0.06] transition-colors ${panelOpen ? 'bg-black/[0.02] dark:bg-white/[0.02]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}`}>
        <td className="px-5 py-4 flex items-center gap-3">
          <div className="h-9 w-9 border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] flex-shrink-0 flex items-center justify-center overflow-hidden">
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[#0071e3] text-xs font-bold">
                {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">{member.name || 'Pending Member'}</div>
            <div className="text-[11px] text-[#86868b]">{member.email}</div>
          </div>
        </td>
        
        <td className="px-5 py-4 align-middle">
          {getRoleBadge(currentRoleValue)}
        </td>
        
        <td className="px-5 py-4 text-xs text-[#86868b] align-middle">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#86868b]" />
            <span>
              {member.joinedAt || member.createdAt
                ? new Date(member.joinedAt || member.createdAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Pending Link'
              }
            </span>
          </div>
        </td>
        
        <td className="px-5 py-4 text-right align-middle">
          <CustomButton 
            variant={panelOpen ? 'default' : 'outline'} 
            size="icon" 
            onClick={() => setPanelOpen(!panelOpen)}
            className="transition-transform duration-150"
          >
            <MoreHorizontal className="h-4 w-4" />
          </CustomButton>
        </td>
      </tr>

      {/* ─── INLINE SUBMENU DRAW PANEL ─── */}
      {panelOpen && (
        <tr>
          <td colSpan={4} className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border-b border-black/[0.06] dark:border-white/[0.08] px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#86868b] font-bold uppercase tracking-wider text-[10px]">
                <Shield className="h-3.5 w-3.5 text-[#0071e3]" /> Control Action Stream:
              </div>
              
              <div className="flex items-center gap-2">
                {(currentRoleValue & ROLES.COMPANY_ADMIN) !== ROLES.COMPANY_ADMIN && (
                  <>
                    <button
                      type="button"
                      onClick={() => { handleRoleChange(member.id, ROLES.BASE_USER + ROLES.COMPANY_HR); setPanelOpen(false); }}
                      className="px-3 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] hover:bg-[#0071e3] text-[#1d1d1f] dark:text-[#f5f5f7] hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Make HR
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleRoleChange(member.id, ROLES.BASE_USER + ROLES.COMPANY_INTERVIEWER); setPanelOpen(false); }}
                      className="px-3 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] hover:bg-[#0071e3] text-[#1d1d1f] dark:text-[#f5f5f7] hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Make Interviewer
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleRoleChange(member.id, ROLES.BASE_USER + ROLES.COMPANY_VIEWER); setPanelOpen(false); }}
                      className="px-3 py-1.5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] hover:bg-[#0071e3] text-[#1d1d1f] dark:text-[#f5f5f7] hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Make Viewer
                    </button>
                  </>
                )}
                
                <button
                  type="button"
                  onClick={() => { handleRemove(member.id, member.name || 'this member'); setPanelOpen(false); }}
                  className="px-3 py-1.5 rounded-xl border border-[#ff3b30]/20 bg-[#ff3b30]/10 hover:bg-[#ff3b30] text-[#ff3b30] hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Revoke Access
                </button>
                
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="w-7 h-7 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors ml-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

import CustomBusinessRequestModal from '@/app/components/CustomBusinessRequestModal';
import { Lock, Sparkles } from 'lucide-react';

// ─── MAIN TEAM PAGE CONFIGURATION ────────────────────────────────────────────
export default function TeamPage() {
  const { showToast } = useGlassToast();
  const { user, company } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('hr');
  const [submitting, setSubmitting] = useState(false);

  const maxTeamMembers = company?.subscription?.plan?.maxTeamMembers ?? 1;
  const isTeamLocked = members.length >= maxTeamMembers;

  const fetchTeam = async () => {
    try {
      const res = await teamApi.list();
      setMembers(res.data?.team || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleOpenInvite = () => {
    if (isTeamLocked) {
      showToast('Team Limit Reached', `Your current plan allows up to ${maxTeamMembers} team member(s). Request a custom plan to add more.`, 'info');
      setRequestModalOpen(true);
      return;
    }
    setInviteOpen(true);
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      showToast('Validation Error', 'Email is required', 'danger');
      return;
    }
    setSubmitting(true);
    try {
      await teamApi.invite({ email: inviteEmail, roleType: inviteRole });
      showToast('Success', `Invitation successfully sent to ${inviteEmail}`, 'success');
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('hr');
      fetchTeam();
    } catch (error: any) {
      showToast('Invitation Failed', error.response?.data?.message || 'Invitation failed', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, calculatedMask: number) => {
    try {
      await teamApi.updateRole(memberId, calculatedMask);
      showToast('Success', 'Workspace permissions updated successfully', 'success');
      fetchTeam();
    } catch (error) {
      showToast('Error', 'Failed to update team member role', 'danger');
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Revoke workspace privileges for ${name}?`)) return;
    try {
      await teamApi.remove(memberId);
      showToast('Success', 'Member removed from team', 'success');
      fetchTeam();
    } catch (error) {
      showToast('Error', 'Failed to remove member', 'danger');
    }
  };

  const getRoleBadge = (roleValue: number | string) => {
    let mask = ROLES.COMPANY_VIEWER;
    
    if (typeof roleValue === 'number') {
      mask = roleValue;
    } else if (typeof roleValue === 'string') {
      const clean = roleValue.toLowerCase();
      if (clean.includes('admin')) mask = ROLES.COMPANY_ADMIN;
      else if (clean.includes('hr')) mask = ROLES.COMPANY_HR;
      else if (clean.includes('interviewer')) mask = ROLES.COMPANY_INTERVIEWER;
    }

    if ((mask & ROLES.COMPANY_ADMIN) === ROLES.COMPANY_ADMIN) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full bg-[#af52de]/10 border border-[#af52de]/20 text-[#af52de]">
          Admin
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full relative">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Team Management</h1>
          <p className="text-sm text-[#86868b] mt-1 font-medium">Provision corporate user access controls, manage department roles, and track invitation links.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold text-[#86868b]">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Seats: {members.length} / {maxTeamMembers} {maxTeamMembers <= 1 ? '(Free Tier)' : ''}</span>
          </div>

          <CustomButton 
            onClick={handleOpenInvite}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </CustomButton>
        </div>
      </div>

      {/* Corporate Table Architecture */}
      {members.length === 0 ? (
        <div className="border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-12 rounded-3xl text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <p className="text-sm text-[#86868b]">No registered team members linked to this corporate workspace.</p>
        </div>
      ) : (
        <div className="border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[600px]">
              <thead>
                <tr className="bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50 border-b border-black/[0.06] dark:border-white/[0.08] text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                  <th className="h-11 px-5">Workspace Member</th>
                  <th className="h-11 px-5">System Role</th>
                  <th className="h-11 px-5">Affiliation Date</th>
                  <th className="h-11 px-5 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {members.map((member) => (
                  <TeamRow 
                    key={member.id}
                    member={member}
                    getRoleBadge={getRoleBadge}
                    handleRoleChange={handleRoleChange}
                    handleRemove={handleRemove}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── NATIVE MINIMALIST MODAL OVERLAY ─────────────────────────────────── */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity" 
            onClick={() => setInviteOpen(false)}
          />
          
          <div className="relative bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <button 
              type="button"
              onClick={() => setInviteOpen(false)}
              className="absolute right-5 top-5 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1 pr-8">
              <h2 className="text-lg font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Invite a Team Member</h2>
              <p className="text-xs text-[#86868b]">Dispatch secure corporate alignment link to new collaborator</p>
            </div>
            
            <div className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#86868b]">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#86868b]" />
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full h-10 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] rounded-2xl pl-10 pr-4 text-xs focus:outline-none focus:border-[#0071e3] font-medium transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#86868b]">Workspace Role</label>
                <CustomSelect 
                  value={inviteRole} 
                  onValueChange={setInviteRole} 
                  options={[
                    { value: 'hr', label: 'HR Manager' },
                    { value: 'interviewer', label: 'Interviewer' },
                    { value: 'viewer', label: 'Viewer (Read-only)' }
                  ]}
                />
                <p className="text-[11px] text-[#86868b] leading-normal pt-1">
                  HR Managers can post jobs and manage candidate streams. Interviewers can execute evaluations. Viewers have read-only access.
                </p>
              </div>
              
              <button 
                type="button"
                onClick={handleInvite} 
                disabled={submitting || !inviteEmail} 
                className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-2xl h-10 transition-all mt-2 disabled:pointer-events-none disabled:opacity-50 focus:outline-none shadow-[0_2px_8px_rgba(0,113,227,0.25)] cursor-pointer"
              >
                {submitting ? 'Sending Invitation...' : 'Send Corporate Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Business Plan Request Modal */}
      <CustomBusinessRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
    </div>
  );
}