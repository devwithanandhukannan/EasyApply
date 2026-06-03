// app/lib/public.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const publicAPI = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  // Add this method inside your publicAPIService object
  getCurrentUser: async () => {
    try {
      const response = await publicAPI.get('/public/auth/me');
      return response; // This interceptor automatically maps payload to response.data
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
  
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
  
  // Search jobs
  searchJobs: async (params?: any) => {
    try {
      const response = await publicAPI.get('/public/search', { params });
      return response;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  },
  
  // Check authentication
  checkAuth: async () => {
    try {
      const response = await publicAPI.get('/public/auth/me');
      return response;
    } catch (error) {
      console.error('Error checking auth:', error);
      throw error;
    }
  },
};

// Export both the service and the axios instance
export { publicAPI };
export default publicAPIService;