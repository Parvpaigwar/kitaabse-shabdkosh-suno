import api, { APIResponse } from './api';

// Types
export interface SignupRequest {
  name: string;
  email: string;
}

export interface SignupResponse {
  email: string;
  message: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  password: string;
}

export interface VerifyOTPResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// API Functions

/**
 * User Signup
 * Register a new user account. An OTP will be sent to the provided email address for verification.
 */
export const signup = async (data: SignupRequest): Promise<APIResponse<SignupResponse>> => {
  const response = await api.post<APIResponse<SignupResponse>>('/api/users/signup/', data);
  return response.data;
};

/**
 * Verify OTP
 * Verify the OTP sent to user's email during signup. Upon successful verification, returns token.
 */
export const verifyOTP = async (data: VerifyOTPRequest): Promise<APIResponse<VerifyOTPResponse>> => {
  const response = await api.post<APIResponse<VerifyOTPResponse>>('/api/users/verify/', data);

  // Store token in localStorage upon successful verification
  if (response.data.status === 'PASS' && response.data.data.token) {
    localStorage.setItem('token', response.data.data.token);

    // Store user data
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }

  return response.data;
};

/**
 * User Login
 * Authenticate user and receive JWT token.
 */
export const login = async (data: LoginRequest): Promise<APIResponse<LoginResponse>> => {
  const response = await api.post<APIResponse<LoginResponse>>('/api/users/login/', data);

  // Store token in localStorage
  if (response.data.status === 'PASS' && response.data.data.token) {
    localStorage.setItem('token', response.data.data.token);

    // Store user data
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }

  return response.data;
};

/**
 * Logout
 * Clear token and user data from localStorage
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Get Current User
 * Retrieve user data from localStorage
 */
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Get current auth token
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};
