import axios from 'axios';

let accessToken = '';

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('easyapply'))) {
    return 'https://easyapply-backend.stibelabs.workers.dev/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

// Request Interceptor: Attach the in-memory access token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized via Refresh Token
api.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    // Skip retry on public/session endpoints to avoid unnecessary refresh requests
    if (
      originalRequest?.url?.includes('/company/auth/session') || 
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/company/auth/forgot-password') ||
      originalRequest?.url?.includes('/company/auth/reset-password')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'] || error.response.data?.retryAfter;
      console.warn(`[RateLimit] 429 Too Many Requests. Retry after ${retryAfter || 'a few'} seconds.`, error.response.data?.message);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const newAccessToken = refreshResponse.data.accessToken;
        setAccessToken(newAccessToken);
        
        // Update authorization header for the original request retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(''); // Clear token on failure
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;