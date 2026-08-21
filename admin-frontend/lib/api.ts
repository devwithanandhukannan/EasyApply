import axios from 'axios';

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

const api = axios.create({ baseURL: API_URL, withCredentials: true });

// Attach admin token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
