import axios from 'axios';

let accessToken = '';

if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('companyToken') || localStorage.getItem('token') || '';
}

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('companyToken', token);
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('companyToken');
      localStorage.removeItem('token');
    }
  }
};

export const getAccessToken = () => {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('companyToken') || localStorage.getItem('token') || '';
  }
  return '';
};

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

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

// Request Interceptor: Attach the access token from memory or localStorage
api.interceptors.request.use(
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
      originalRequest?.url?.includes('/company/auth/reset-password') ||
      originalRequest?.url?.includes('/company/auth/login') ||
      originalRequest?.url?.includes('/company/auth/register')
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
        
        const newAccessToken = refreshResponse.data.accessToken || refreshResponse.data.token;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Do not aggressively clear token unless it fails repeatedly
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;