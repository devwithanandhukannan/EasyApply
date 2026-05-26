import axios from '../axios';

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  avatar: string | null;
}

export const teamApi = {
  list: () => axios.get<{ success: boolean; team: TeamMember[] }>('/company/team'),
  invite: (data: { email: string; role: string; name?: string }) =>
    axios.post('/company/team/invite', data),
  updateRole: (memberId: string, role: string) =>
    axios.put(`/company/team/${memberId}/role`, { role }),
  remove: (memberId: string) => axios.delete(`/company/team/${memberId}`),
};