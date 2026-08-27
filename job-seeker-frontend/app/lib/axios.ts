import axios from 'axios';

let accessToken = '';

if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('seeker_access_token') || '';
}

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('seeker_access_token', token);
    } else {
      localStorage.removeItem('seeker_access_token');
    }
  }
};

export const getAccessToken = () => {
  return accessToken;
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

// Request interceptor – attach Bearer token if present
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiUrl();
    const token = accessToken || (typeof window !== 'undefined' ? (localStorage.getItem('seeker_access_token') || localStorage.getItem('token')) : '');
    if (token) {
      if (config.headers && typeof (config.headers as any).set === 'function') {
        if (!(config.headers as any).has('Authorization')) {
          (config.headers as any).set('Authorization', `Bearer ${token}`);
        }
      } else {
        config.headers = config.headers || {};
        if (!config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight refresh token queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor – on 401 try to refresh the token safely
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'] || error.response.data?.retryAfter;
      console.warn(`[RateLimit] 429 Too Many Requests. Retry after ${retryAfter || 'a few'} seconds.`, error.response.data?.message);
      return Promise.reject(error);
    }

    // Skip retry on auth and profile creation endpoints to prevent infinite refresh loops or token clearing
    if (
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/') ||
      originalRequest.url?.includes('/login')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (refreshResponse?.data?.success && refreshResponse?.data?.accessToken) {
          const newToken = refreshResponse.data.accessToken;
          setAccessToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          throw new Error('No new access token returned');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Only remove token if not on public/login screens
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          setAccessToken('');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;