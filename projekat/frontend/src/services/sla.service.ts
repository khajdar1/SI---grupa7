import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';
import { PRIORITY, type Priority } from '@shared/enums';

import { ServiceError, getErrorMessage } from './errors';

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
  try {
    const response = await api.get<SlaConfiguration[]>(API_ENDPOINTS.SLA.BASE);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load SLA configurations.'), error);
  }
}

/**
 * Update multiple SLA configurations at once
 */
export async function updateSlaConfigurations(updates: SlaUpdateData[]): Promise<SlaConfiguration[]> {
  try {
    const response = await api.patch<SlaConfiguration[]>(API_ENDPOINTS.SLA.BASE, updates);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to update SLA configurations.'), error);
  }
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
