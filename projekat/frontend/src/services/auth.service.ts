import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { ServiceError, getErrorMessage } from './errors';

interface LoginInput {
  username: string;
  password: string;
}

interface LoginUser {
  id: number;
  username: string;
  email: string;
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
  companyId: number;
  password: string;
}

interface LogoutInput {
  token: string;
  refreshToken?: string | null;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  try {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, input);
    return response.data;
  } catch (error) {
    throw new ServiceError(
      getErrorMessage(error, 'Login failed. Please check your credentials.'),
      error,
    );
  }
}

export async function register(input: RegisterInput): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.AUTH.REGISTER, input);
  } catch (error) {
    throw new ServiceError(
      getErrorMessage(error, 'Registration failed. Please try again.'),
      error,
    );
  }
}

export async function logout(input: LogoutInput): Promise<void> {
  try {
    await api.post(
      API_ENDPOINTS.AUTH.LOGOUT,
      { refreshToken: input.refreshToken },
      { headers: { Authorization: `Bearer ${input.token}` } },
    );
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Logout request failed.'), error);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email });
  } catch (error) {
    throw new ServiceError(
      getErrorMessage(error, 'Failed to request reset. Please try again later.'),
      error,
    );
  }
}

export type { LoginResponse, RegisterInput, LoginInput, LoginUser };
