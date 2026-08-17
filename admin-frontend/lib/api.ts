import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.interviewer.stibe.in/api';

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
