// app/lib/api/public.ts
import axios from '@/app/lib/axios';

export const publicAPI = {
  // Get all companies
  async getAllCompanies(params?: { 
    industry?: string; 
    size?: string; 
    search?: string; 
    verified?: boolean 
  }) {
    const res = await axios.get('/public/companies', { params });
    return res.data;
  },

  // Get company profile by slug or ID
  async getCompanyProfile(identifier: string) {
    const res = await axios.get(`/public/companies/${identifier}`);
    return res.data;
  },

  // Get company jobs with application status
  async getCompanyJobs(identifier: string, params?: {
    department?: string;
    jobType?: string;
    locationType?: string;
    search?: string;
  }) {
    const res = await axios.get(`/public/companies/${identifier}/jobs`, { params });
    return res.data;
  },

  // Get job details with application status
  async getJobDetails(jobId: string) {
    const res = await axios.get(`/public/jobs/${jobId}`);
    return res.data;
  },

  // Search all jobs
  async searchJobs(params?: {
    search?: string;
    jobType?: string;
    locationType?: string;
    location?: string;
    experienceRequired?: string;
    page?: number;
    limit?: number;
  }) {
    const res = await axios.get('/public/jobs', { params });
    return res.data;
  },

  // Get current user session
  async getCurrentUser() {
    try {
      const res = await axios.get('/public/auth/me');
      return res.data;
    } catch {
      return { success: true, isAuthenticated: false, user: null };
    }
  }
};