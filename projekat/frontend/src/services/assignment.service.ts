import { API_ENDPOINTS } from '@/constants';

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

/**
 * Assignment Service - API Client
 * Handles all servicer assignment API calls
 */

/**
 * Get available servicers for an intervention, sorted by workload
 */
export async function getAvailableServicers(
  interventionId: number,
): Promise<ServicerLoad[]> {
  const response = await fetch(
    `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments/available`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Failed to fetch available servicers (${response.status})`,
    );
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Get all assignments for an intervention
 */
export async function getInterventionAssignments(
  interventionId: number,
): Promise<AssignmentResponse[]> {
  const response = await fetch(
    `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Failed to fetch assignments (${response.status})`,
    );
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Assign servicers to an intervention
 */
export async function assignServicers(
  interventionId: number,
  userIds: number[],
): Promise<AssignmentResponse[]> {
  const response = await fetch(
    `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userIds }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Failed to assign servicers (${response.status})`,
    );
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Remove a servicer assignment
 */
export async function removeServicerAssignment(
  interventionId: number,
  userId: number,
): Promise<void> {
  const response = await fetch(
    `${API_ENDPOINTS.ASSIGNMENTS.BASE}/interventions/${interventionId}/assignments/${userId}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Failed to remove assignment (${response.status})`,
    );
  }
}
