import axios from 'axios';

let accessToken = '';

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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