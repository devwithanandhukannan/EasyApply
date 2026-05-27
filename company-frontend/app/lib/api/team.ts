import axios from '../axios';

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  rolesMask: number;       // Tracks backend structural permission bits
  globalRolesMask: number; // Synchronized global profile flag matrix
  status: string;
  joinedAt: string;
  avatar: string | null;
}

export const teamApi = {
  list: () => 
    axios.get<{ success: boolean; team: TeamMember[] }>('/company/team'),
    
  invite: (data: { email: string; roleType: string }) =>
    axios.post<{ success: boolean; message: string }>('/company/team/invite', data),
    
  updateRole: (memberId: string, newRolesMask: number) =>
    axios.put<{ success: boolean; message: string }>(`/company/team/${memberId}/role`, { newRolesMask }),
    
  remove: (memberId: string) => 
    axios.delete<{ success: boolean; message: string }>(`/company/team/${memberId}`),
};