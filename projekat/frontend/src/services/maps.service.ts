import type { InterventionStatus, Priority } from '@shared/enums';

import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData } from './errors';

export interface MapInterventionAssignment {
  id: number;
  userId: number;
  label: string;
  username: string;
}

export interface MapIntervention {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  priority: Priority;
  priorityColor: string;
  status: InterventionStatus;
  startedAt: string | null;
  dueAt: string | null;
  categoryId: number;
  categoryName: string;
  companyId: number;
  companyName: string;
  assignments: MapInterventionAssignment[];
}

export interface MapInterventionsResponse {
  items: MapIntervention[];
}

export interface MapInterventionQuery {
  status?: string;
  servicerId?: string;
}

export async function getMapInterventions(
  query: MapInterventionQuery = {},
): Promise<MapInterventionsResponse> {
  const params = new URLSearchParams();
  if (query.status) {
    params.set('status', query.status);
  }
  if (query.servicerId) {
    params.set('servicerId', query.servicerId);
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';

  return getResponseData(
    () => api.get<MapInterventionsResponse>(`${API_ENDPOINTS.MAPS.INTERVENTIONS}${suffix}`),
    'Failed to load map interventions.',
  );
}
