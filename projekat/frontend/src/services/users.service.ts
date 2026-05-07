import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData, withServiceError } from './errors';

export const MANAGED_USER_ROLES = [
  'KORISNIK',
  'SERVISER',
  'KOORDINATOR',
  'MENADZMENT',
  'ADMIN',
] as const;

export type ManagedUserRole = (typeof MANAGED_USER_ROLES)[number];

export interface ManagedUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: ManagedUserRole | null;
  active: boolean;
  companyId: number | null;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManagedUserInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: ManagedUserRole;
  companyId: number | null;
}

export interface UpdateManagedUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: ManagedUserRole;
  companyId?: number | null;
}

export async function getUsers(): Promise<ManagedUser[]> {
  return getResponseData(
    () => api.get<ManagedUser[]>(API_ENDPOINTS.USERS.BASE),
    'Failed to load users.',
  );
}

export async function createUser(input: CreateManagedUserInput): Promise<ManagedUser> {
  return getResponseData(
    () => api.post<ManagedUser>(API_ENDPOINTS.USERS.BASE, input),
    'Failed to create user.',
  );
}

export async function updateUser(id: number, input: UpdateManagedUserInput): Promise<ManagedUser> {
  return getResponseData(
    () => api.patch<ManagedUser>(API_ENDPOINTS.USERS.BY_ID(id), input),
    'Failed to update user.',
  );
}

export async function activateUser(id: number): Promise<ManagedUser> {
  return getResponseData(
    () => api.patch<ManagedUser>(API_ENDPOINTS.USERS.ACTIVATE(id)),
    'Failed to reactivate user.',
  );
}

export async function deactivateUser(id: number): Promise<ManagedUser> {
  return getResponseData(
    () => api.patch<ManagedUser>(API_ENDPOINTS.USERS.DEACTIVATE(id)),
    'Failed to deactivate user.',
  );
}

export async function deleteUser(id: number): Promise<void> {
  return withServiceError(
    async () => {
      await api.delete(API_ENDPOINTS.USERS.BY_ID(id));
    },
    'Failed to delete user.',
  );
}
