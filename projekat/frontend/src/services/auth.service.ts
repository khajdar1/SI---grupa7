import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type { LanguageCode } from '@/lib/i18n';

import { getResponseData, withServiceError } from './errors';

interface LoginInput {
  username: string;
  password: string;
}

interface LoginUser {
  id: number;
  username: string;
  email: string;
  language?: LanguageCode;
  role?: string;
  [key: string]: unknown;
}

interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: LoginUser;
}

interface RegisterInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
}

interface LogoutInput {
  token: string;
  refreshToken?: string | null;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  return getResponseData(
    () => api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, input),
    'Login failed. Please check your credentials.',
  );
}

export async function register(input: RegisterInput): Promise<void> {
  return withServiceError(
    async () => {
      await api.post(API_ENDPOINTS.AUTH.REGISTER, input);
    },
    'Registration failed. Please try again.',
  );
}

export async function logout(input: LogoutInput): Promise<void> {
  return withServiceError(
    async () => {
      await api.post(
        API_ENDPOINTS.AUTH.LOGOUT,
        { refreshToken: input.refreshToken },
        { headers: { Authorization: `Bearer ${input.token}` } },
      );
    },
    'Logout request failed.',
  );
}

export async function requestPasswordReset(email: string): Promise<void> {
  return withServiceError(
    async () => {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email });
    },
    'Failed to request reset. Please try again later.',
  );
}

export async function confirmPasswordReset(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<void> {
  return withServiceError(
    async () => {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD_CONFIRM, input);
    },
    'Failed to reset password. Please request a new reset link.',
  );
}

export type { LoginResponse, RegisterInput, LoginInput, LoginUser };
