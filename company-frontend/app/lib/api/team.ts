import axios from '../axios';

export interface GranularPermissions {
  [module: string]: string[];
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  rolesMask: number;
  globalRolesMask: number;
  status: string;
  joinedAt: string;
  avatar: string | null;
  permissions?: GranularPermissions | null;
  tags?: string[];
}

export const teamApi = {
  list: () => 
    axios.get<{ success: boolean; team: TeamMember[]; tags?: string[] }>('/company/team'),
    
  invite: (data: { email: string; roleType: string; permissions?: GranularPermissions; tags?: string[] }) =>
    axios.post<{ success: boolean; message: string }>('/company/team/invite', data),
    
  updateRole: (memberId: string, payload: { newRolesMask?: number; permissions?: GranularPermissions; tags?: string[] }) =>
    axios.put<{ success: boolean; message: string }>(`/company/team/${memberId}/role`, payload),
    
  remove: (memberId: string) => 
    axios.delete<{ success: boolean; message: string }>(`/company/team/${memberId}`),

  resendInvite: (memberId: string) =>
    axios.post<{ success: boolean; message: string; inviteToken?: string }>(`/company/team/${memberId}/resend-invite`),
};