import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const BASE_URL = 'https://kiaatbse-backend.onrender.com';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle token expiration or invalid token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Dispatch custom event to trigger auth modal
      const event = new CustomEvent('auth:required');
      window.dispatchEvent(event);
    }

    return Promise.reject(error);
  }
);

export default api;

// Standard API response types
export interface APIResponse<T = any> {
  data: T;
  status: 'PASS' | 'FAIL';
  http_code: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
