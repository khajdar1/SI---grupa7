import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData, withServiceError } from './errors';

export interface ServicerLoad {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  active: boolean;
  activeInterventionCount: number;
  sameCompany?: boolean;
  unavailable?: boolean;
  unavailableReason?: string | null;
  unavailableFrom?: string | null;
  unavailableTo?: string | null;
}

export interface AssignmentResponse {
  id: number;
  interventionId: number;
  userId: number;
  assignedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  };
}

interface AssignmentListPayload<T> {
  data?: T[];
}

function normalizeAssignmentList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (typeof payload === 'object' && payload !== null) {
    const data = (payload as AssignmentListPayload<T>).data;
    return Array.isArray(data) ? data : [];
  }

  return [];
}

async function getAssignmentList<T>(
  request: () => Promise<{ data: unknown }>,
  fallbackMessage: string,
): Promise<T[]> {
  const payload = await getResponseData(request, fallbackMessage);
  return normalizeAssignmentList<T>(payload);
}

export async function getAvailableServicers(
  interventionId: number,
): Promise<ServicerLoad[]> {
  return getAssignmentList<ServicerLoad>(
    () => api.get(
      `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments/available`,
    ),
    'Failed to fetch available servicers.',
  );
}

export async function getInterventionAssignments(
  interventionId: number,
): Promise<AssignmentResponse[]> {
  return getAssignmentList<AssignmentResponse>(
    () => api.get(
      `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments`,
    ),
    'Failed to fetch assignments.',
  );
}

export async function assignServicers(
  interventionId: number,
  userIds: number[],
  unavailableOverrideReason?: string,
): Promise<AssignmentResponse[]> {
  return getAssignmentList<AssignmentResponse>(
    () => api.post(
      `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments`,
      { userIds, unavailableOverrideReason },
    ),
    'Failed to assign servicers.',
  );
}

export async function removeServicerAssignment(
  interventionId: number,
  userId: number,
): Promise<void> {
  await withServiceError(
    async () => {
      await api.delete(
        `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments/${userId}`,
      );
    },
    'Failed to remove assignment.',
  );
}

export const removeServicer = removeServicerAssignment;
