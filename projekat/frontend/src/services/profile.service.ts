import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import type { LanguageCode } from '@/lib/i18n';

import { getResponseData } from './errors';

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  language: LanguageCode;
  active: boolean;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  language: LanguageCode;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function getMyProfile(): Promise<UserProfile> {
  return getResponseData(
    () => api.get<UserProfile>(API_ENDPOINTS.PROFILE.ME),
    'Failed to load profile.',
  );
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<UserProfile> {
  return getResponseData(
    () => api.patch<UserProfile>(API_ENDPOINTS.PROFILE.ME, input),
    'Failed to update profile.',
  );
}

export async function changeMyPassword(input: ChangePasswordInput): Promise<void> {
  await getResponseData(
    () => api.post(API_ENDPOINTS.PROFILE.PASSWORD, input),
    'Failed to update password.',
  );
}
