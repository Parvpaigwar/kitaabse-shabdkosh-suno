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
}

export interface VerifyOTPResponse {
  email: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_verified: boolean;
  joined_at: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
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
 * Verify the OTP sent to user's email during signup.
 */
export const verifyOTP = async (data: VerifyOTPRequest): Promise<APIResponse<VerifyOTPResponse>> => {
  const response = await api.post<APIResponse<VerifyOTPResponse>>('/api/users/verify/', data);
  return response.data;
};

/**
 * User Login
 * Authenticate user and receive JWT access and refresh tokens.
 */
export const login = async (data: LoginRequest): Promise<APIResponse<LoginResponse>> => {
  const response = await api.post<APIResponse<LoginResponse>>('/api/users/login/', data);

  // Store tokens in localStorage
  if (response.data.status === 'PASS' && response.data.data.tokens) {
    localStorage.setItem('accessToken', response.data.data.tokens.access);
    localStorage.setItem('refreshToken', response.data.data.tokens.refresh);

    // Store user data
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }

  return response.data;
};

/**
 * Logout
 * Clear tokens and user data from localStorage
 */
export const logout = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
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
  const token = localStorage.getItem('accessToken');
  return !!token;
};
