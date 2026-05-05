import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { ServiceError, getErrorMessage } from './errors';

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
  try {
    const response = await api.get<ManagedUser[]>(API_ENDPOINTS.USERS.BASE);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load users.'), error);
  }
}

export async function createUser(input: CreateManagedUserInput): Promise<ManagedUser> {
  try {
    const response = await api.post<ManagedUser>(API_ENDPOINTS.USERS.BASE, input);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to create user.'), error);
  }
}

export async function updateUser(id: number, input: UpdateManagedUserInput): Promise<ManagedUser> {
  try {
    const response = await api.patch<ManagedUser>(API_ENDPOINTS.USERS.BY_ID(id), input);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to update user.'), error);
  }
}

export async function activateUser(id: number): Promise<ManagedUser> {
  try {
    const response = await api.patch<ManagedUser>(API_ENDPOINTS.USERS.ACTIVATE(id));
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to reactivate user.'), error);
  }
}

export async function deactivateUser(id: number): Promise<ManagedUser> {
  try {
    const response = await api.patch<ManagedUser>(API_ENDPOINTS.USERS.DEACTIVATE(id));
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to deactivate user.'), error);
  }
}

export async function deleteUser(id: number): Promise<void> {
  try {
    await api.delete(API_ENDPOINTS.USERS.BY_ID(id));
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to delete user.'), error);
  }
}
