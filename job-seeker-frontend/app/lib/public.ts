import axios from 'axios';
import { getAccessToken } from './axios';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('dearresume.com')) {
      return 'https://api.dearresume.com/api';
    }
    if (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('easyapply')) {
      return 'https://easyapply-backend.stibelabs.workers.dev/api';
    }
  }
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
};

const API_URL = getApiUrl();

const publicAPI = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

publicAPI.interceptors.request.use(
  (config) => {
    config.baseURL = getApiUrl();
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
publicAPI.interceptors.response.use(
  (response) => response.data, // Automatically extract data
  (error) => {
    if (error.response?.status === 401) {
      console.log('Authentication required');
    }
    return Promise.reject(error);
  }
);

// Export API service methods
export const publicAPIService = {
  getCompanyProfile: async (identifier: string) => {
    try {
      const response = await publicAPI.get(`/public/companies/${identifier}`);
      return response;
    } catch (error) {
      console.error('Error fetching company profile:', error);
      throw error;
    }
  },
  
  getCompanyJobs: async (identifier: string) => {
    try {
      const response = await publicAPI.get(`/public/companies/${identifier}/jobs`);
      return response;
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      throw error;
    }
  },
  
  // Job Details - Fixed endpoint
  getJobDetails: async (jobId: string) => {
    try {
      const response = await publicAPI.get(`/public/${jobId}`);
      return response;
    } catch (error) {
      console.error('Error fetching job details:', error);
      throw error;
    }
  },

  // Get job details with company identifier
  getCompanyJobDetails: async (companyIdentifier: string, jobId: string) => {
    try {
      const response = await publicAPI.get(`/public/companies/${companyIdentifier}/jobs/${jobId}`);
      return response;
    } catch (error) {
      console.error('Error fetching company job details:', error);
      throw error;
    }
  },
  
  // Search jobs (This handles the /public/public endpoint parsing)
  searchJobs: async (params?: any) => {
    try {
      const response = await publicAPI.get('/public', { params });
      return response;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  },

  // Get all public companies
  getCompanies: async (params?: any) => {
    try {
      const response = await publicAPI.get('/public/companies', { params });
      return response;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },
};

// Export both the service and the axios instance
export { publicAPI };
export default publicAPIService;