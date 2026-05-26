// app/lib/jobApi.ts
import api from './axios';

// Public Jobs (no auth required)
export const getPublicJobs = async (params?: {
  search?: string;
  jobType?: string;
  locationType?: string;
  location?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/jobs', { params });
  return response.data;
};

export const getPublicJobDetails = async (id: string) => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

// My Applications (auth required)
export const getMyApplications = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/jobseeker/applications', { params });
  return response.data;
};

export const getApplicationDetails = async (id: string) => {
  const response = await api.get(`/jobseeker/applications/${id}`);
  return response.data;
};

export const applyToJob = async (data: {
  jobPostingId: string;
  resumeId?: string;
  applyWithNew?: string;
}) => {
  const formData = new FormData();
  formData.append('jobPostingId', data.jobPostingId);
  
  if (data.resumeId) {
    formData.append('resumeId', data.resumeId);
  }
  
  if (data.applyWithNew) {
    formData.append('applyWithNew', data.applyWithNew);
  }

  const response = await api.post('/jobseeker/applications/apply', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const applyToJobWithNewResume = async (
  jobPostingId: string,
  resumeFile: File
) => {
  const formData = new FormData();
  formData.append('jobPostingId', jobPostingId);
  formData.append('applyWithNew', 'true');
  formData.append('newResume', resumeFile);

  const response = await api.post('/jobseeker/applications/apply', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const withdrawApplication = async (id: string) => {
  const response = await api.delete(`/jobseeker/applications/${id}`);
  return response.data;
};

// Get my resumes for selection
export const getMyResumes = async () => {
  const response = await api.get('/jobseeker/resumes');
  return response.data;
};