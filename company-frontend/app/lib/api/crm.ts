import api from '../axios';

// ── Talent Pools ────────────────────────────────────────────────────

export const getTalentPools = () =>
  api.get('/crm/talent-pools');

export const createTalentPool = (data: { name: string; description?: string }) =>
  api.post('/crm/talent-pools', data);

export const updateTalentPool = (id: string, data: { name?: string; description?: string }) =>
  api.patch(`/crm/talent-pools/${id}`, data);

export const deleteTalentPool = (id: string) =>
  api.delete(`/crm/talent-pools/${id}`);

export const getTalentPoolMembers = (id: string) =>
  api.get(`/crm/talent-pools/${id}/members`);

export const addTalentPoolMembers = (id: string, jobSeekerProfileIds: string[]) =>
  api.post(`/crm/talent-pools/${id}/members`, { jobSeekerProfileIds });

export const removeTalentPoolMember = (poolId: string, memberId: string) =>
  api.delete(`/crm/talent-pools/${poolId}/members/${memberId}`);

// ── CRM Candidates ──────────────────────────────────────────────────

export const getCrmCandidates = (params?: Record<string, any>) =>
  api.get('/crm/candidates', { params });

export const addCrmCandidate = (data: {
  jobSeekerProfileId: string;
  source?: string;
  tags?: string[];
  crmNotes?: string;
}) => api.post('/crm/candidates', data);

export const updateCrmCandidate = (id: string, data: Record<string, any>) =>
  api.patch(`/crm/candidates/${id}`, data);

export const removeCrmCandidate = (id: string) =>
  api.delete(`/crm/candidates/${id}`);

export const logCrmInteraction = (id: string, data: {
  activityType: string;
  note?: string;
  metadata?: Record<string, any>;
}) => api.post(`/crm/candidates/${id}/interactions`, data);