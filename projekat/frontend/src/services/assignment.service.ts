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

async function getAssignmentList<T>(
  request: () => Promise<{ data: AssignmentListPayload<T> }>,
  fallbackMessage: string,
): Promise<T[]> {
  const data = await getResponseData(request, fallbackMessage);
  return data.data || [];
}

export async function getAvailableServicers(
  interventionId: number,
): Promise<ServicerLoad[]> {
  return getAssignmentList<ServicerLoad>(
    () => api.get<AssignmentListPayload<ServicerLoad>>(
      `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments/available`,
    ),
    'Failed to fetch available servicers.',
  );
}

export async function getInterventionAssignments(
  interventionId: number,
): Promise<AssignmentResponse[]> {
  return getAssignmentList<AssignmentResponse>(
    () => api.get<AssignmentListPayload<AssignmentResponse>>(
      `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments`,
    ),
    'Failed to fetch assignments.',
  );
}

export async function assignServicers(
  interventionId: number,
  userIds: number[],
): Promise<AssignmentResponse[]> {
  return getAssignmentList<AssignmentResponse>(
    () => api.post<AssignmentListPayload<AssignmentResponse>>(
      `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments`,
      { userIds },
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
