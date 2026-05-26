'use client';

import { useEffect, useState, useRef } from 'react';
import { teamApi, TeamMember } from '@/app/lib/api/team';
import { useAuth } from '@/app/contexts/AuthContext';
import { MoreHorizontal, UserPlus, Trash2, Shield, Mail, Calendar, X, ChevronDown } from 'lucide-react';

// ─── INLINE PREMIUM MINI BUTTON ──────────────────────────────────────────────
interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  children: React.ReactNode;
}

const CustomButton = ({ variant = 'default', size = 'default', className = '', children, ...props }: CustomButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    default: 'bg-white text-black hover:bg-zinc-200 rounded-xl font-bold text-xs',
    ghost: 'hover:bg-zinc-900/50 text-zinc-400 hover:text-white rounded-lg',
    outline: 'border border-zinc-800/80 bg-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg',
  };

  const sizes = {
    default: 'h-9 px-4',
    sm: 'h-8 px-3 text-xs',
    icon: 'h-7 w-7 p-0',
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

// ─── INLINE MONOSPACE SELECT DROPDOWN (BYPASSES SHADCN PRIMITIVE) ────────────
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
    <div ref={containerRef} className="relative w-full font-mono text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 h-9 flex items-center justify-between text-left focus:outline-none focus:border-zinc-700 transition-colors"
      >
        <span>{selectedOption ? selectedOption.label : 'Select role...'}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 p-1 divide-y divide-zinc-800/40">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onValueChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors text-zinc-300 hover:bg-zinc-800 hover:text-white ${
                value === opt.value ? 'bg-zinc-800/60 text-white font-semibold' : ''
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

// ─── INLINE TEAM ROW MODULE (CROP PROOF / EXPANDABLE DESIGN) ─────────────────
interface TeamRowProps {
  member: TeamMember;
  getRoleBadge: (role: string) => React.ReactNode;
  handleRoleChange: (id: string, role: string) => void;
  handleRemove: (id: string, name: string) => void;
}

const TeamRow = ({ member, getRoleBadge, handleRoleChange, handleRemove }: TeamRowProps) => {
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <tr className={`border-b border-zinc-900/40 transition-colors ${panelOpen ? 'bg-zinc-900/20' : 'hover:bg-zinc-900/10'}`}>
        <td className="px-4 py-3.5 flex items-center gap-3">
          <div className="h-9 w-9 border border-zinc-800 rounded-xl bg-zinc-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-zinc-400 text-xs font-mono font-bold">
                {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-white">{member.name}</div>
            <div className="text-[11px] text-zinc-500 font-mono tracking-tight">{member.email}</div>
          </div>
        </td>
        
        <td className="px-4 py-3.5 align-middle">
          {getRoleBadge(member.role)}
        </td>
        
        <td className="px-4 py-3.5 font-mono text-xs text-zinc-400 align-middle">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-zinc-600" />
            <span>{new Date(member.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </td>
        
        <td className="px-4 py-3.5 text-right align-middle">
          <CustomButton 
            variant={panelOpen ? 'default' : 'outline'} 
            size="icon" 
            onClick={() => setPanelOpen(!panelOpen)}
            className="transition-transform duration-150"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </CustomButton>
        </td>
      </tr>

      {/* ─── INLINE SUBMENU DRAW PANEL (IMPOSSIBLE TO OVERFLOW CLIP) ─── */}
      {panelOpen && (
        <tr>
          <td colSpan={4} className="bg-zinc-950/80 border-b border-zinc-900 px-4 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-wider text-[10px]">
                <Shield className="h-3 w-3" /> Control Action Stream:
              </div>
              
              <div className="flex items-center gap-2">
                {member.role !== 'admin' && member.role !== 'company_admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { handleRoleChange(member.id, 'hr_manager'); setPanelOpen(false); }}
                      className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      Make HR
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleRoleChange(member.id, 'interviewer'); setPanelOpen(false); }}
                      className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      Make Interviewer
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleRoleChange(member.id, 'viewer'); setPanelOpen(false); }}
                      className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      Make Viewer
                    </button>
                  </>
                )}
                
                <button
                  type="button"
                  onClick={() => { handleRemove(member.id, member.name); setPanelOpen(false); }}
                  className="px-2.5 py-1 rounded-lg border border-red-950/60 bg-red-950/20 hover:bg-red-950/40 text-red-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Revoke Access
                </button>
                
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white rounded transition-colors ml-1"
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

// ─── MAIN TEAM PAGE CONFIGURATION ────────────────────────────────────────────
export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('hr_manager');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await teamApi.list();
      setMembers(res.data.team);
    } catch (error) {
      alert('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) {
      alert('Email is required');
      return;
    }
    setSubmitting(true);
    try {
      await teamApi.invite({ email: inviteEmail, role: inviteRole });
      alert(`Invitation successfully sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('hr_manager');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Invitation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await teamApi.updateRole(memberId, newRole);
      alert('Workspace permissions updated');
      fetchTeam();
    } catch (error) {
      alert('Failed to update team member role');
    }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Revoke workspace privileges for ${name}?`)) return;
    try {
      await teamApi.remove(memberId);
      alert('Member removed from team');
      fetchTeam();
    } catch (error) {
      alert('Failed to remove member');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-950/40 border-purple-900 text-purple-400',
      company_admin: 'bg-purple-950/40 border-purple-900 text-purple-400',
      hr_manager: 'bg-blue-950/40 border-blue-900 text-blue-400',
      company_hr: 'bg-blue-950/40 border-blue-900 text-blue-400',
      interviewer: 'bg-emerald-950/40 border-emerald-900 text-emerald-400',
      viewer: 'bg-zinc-900 border-zinc-800 text-zinc-400',
    };
    
    const displayLabel = role.replace('company_', '').replace('_', ' ');
    
    return (
      <span className={`px-2 py-0.5 border text-[10px] uppercase tracking-wider font-mono font-medium rounded-md ${styles[role] || 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
        {displayLabel}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-[#0a0a0a]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-[#0a0a0a] text-white space-y-6 max-w-7xl mx-auto w-full relative">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Team Management</h1>
          <p className="text-xs text-zinc-400 mt-1">Provision corporate user access controls, manage department roles, and track invitation links.</p>
        </div>
        
        <CustomButton 
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite Member
        </CustomButton>
      </div>

      {/* Corporate Table Architecture */}
      {members.length === 0 ? (
        <div className="border border-dashed border-zinc-900 bg-zinc-950/20 p-12 rounded-2xl text-center">
          <p className="text-xs text-zinc-500 font-mono">No registered team members linked to this corporate workspace identifier.</p>
        </div>
      ) : (
        <div className="border border-zinc-900 bg-zinc-950/40 rounded-2xl shadow-xl">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[600px]">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-900 font-mono text-[11px] text-zinc-500">
                  <th className="font-medium h-10 px-4">Workspace Member</th>
                  <th className="font-medium h-10 px-4">System Role</th>
                  <th className="font-medium h-10 px-4">Affiliation Date</th>
                  <th className="font-medium h-10 px-4 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
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
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
            onClick={() => setInviteOpen(false)}
          />
          
          <div className="relative bg-zinc-950 border border-zinc-900 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <button 
              type="button"
              onClick={() => setInviteOpen(false)}
              className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-900 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1 pr-6">
              <h2 className="text-sm font-semibold tracking-tight text-white">Invite a Team Member</h2>
              <p className="text-[11px] text-zinc-500 font-mono">DISPATCH SECURE CORPORATE ALIGNMENT LINK</p>
            </div>
            
            <div className="space-y-4 pt-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full h-9 bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-lg pl-9 pr-3 text-xs focus:outline-none focus:border-zinc-700 font-mono transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Workspace Role</label>
                <CustomSelect 
                  value={inviteRole} 
                  onValueChange={setInviteRole} 
                  options={[
                    { value: 'hr_manager', label: 'HR Manager' },
                    { value: 'interviewer', label: 'Interviewer' },
                    { value: 'viewer', label: 'Viewer (Read-only)' }
                  ]}
                />
                <p className="text-[11px] text-zinc-500 leading-normal pt-1">
                  HR Managers can post jobs and manage candidate streams. Interviewers can execute assigned evaluations. Viewers have absolute read-only metrics access.
                </p>
              </div>
              
              <button 
                type="button"
                onClick={handleInvite} 
                disabled={submitting || !inviteEmail} 
                className="w-full bg-zinc-100 text-black hover:bg-white text-xs font-bold rounded-xl h-9 transition-all mt-2 disabled:pointer-events-none disabled:opacity-50 focus:outline-none"
              >
                {submitting ? 'Processing Transaction...' : 'Send Corporate Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}