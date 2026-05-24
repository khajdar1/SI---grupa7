import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData, withServiceError } from './errors';

export interface BlockedUserInfo {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export interface CoordinatorInfo {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export interface BlockRecord {
  id: number;
  userId: number;
  companyId: number;
  coordinatorId: number;
  reason: string;
  blockedAt: string;
  blockedUser: BlockedUserInfo;
  coordinator: CoordinatorInfo;
}

export interface BlockUserPayload {
  username: string;
  reason: string;
}

export async function getBlockedUsers(): Promise<BlockRecord[]> {
  return getResponseData(
    () => api.get<BlockRecord[]>(API_ENDPOINTS.BLOCKING.BASE),
    'Failed to load blocked users.',
  );
}

export async function blockUser(payload: BlockUserPayload): Promise<BlockRecord> {
  return getResponseData(
    () => api.post<BlockRecord>(API_ENDPOINTS.BLOCKING.BASE, payload),
    'Failed to block user.',
  );
}

export async function unblockUser(blockId: number): Promise<void> {
  return withServiceError(
    () => api.patch(API_ENDPOINTS.BLOCKING.UNBLOCK(blockId)),
    'Failed to unblock user.',
  );
}
