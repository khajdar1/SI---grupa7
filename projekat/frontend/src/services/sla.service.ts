import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import { PRIORITY, type Priority } from '@shared/enums';

import { getResponseData } from './errors';

export interface SlaConfiguration {
  id: number;
  priority: Priority;
  deadlineHours: number;
  updatedAt: string;
}

export interface SlaUpdateData {
  priority: Priority;
  deadlineHours: number;
}

/**
 * Service for managing SLA configurations
 */
export async function getSlaConfigurations(): Promise<SlaConfiguration[]> {
  return getResponseData(
    () => api.get<SlaConfiguration[]>(API_ENDPOINTS.SLA.BASE),
    'Failed to load SLA configurations.',
  );
}

/**
 * Update multiple SLA configurations at once
 */
export async function updateSlaConfigurations(updates: SlaUpdateData[]): Promise<SlaConfiguration[]> {
  return getResponseData(
    () => api.patch<SlaConfiguration[]>(API_ENDPOINTS.SLA.BASE, {
      configurations: updates,
    }),
    'Failed to update SLA configurations.',
  );
}

/**
 * Helper to get the human readable priority label in Bosnian
 */
export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case PRIORITY.CRITICAL:
      return 'Hitan';
    case PRIORITY.HIGH:
      return 'Visok';
    case PRIORITY.MEDIUM:
      return 'Normalan';
    case PRIORITY.LOW:
      return 'Nizak';
    default:
      return priority;
  }
}
