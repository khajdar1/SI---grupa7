import { type Priority } from '@shared/enums';

import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { ServiceError, getErrorMessage } from './errors';

export interface SlaConfiguration {
  id: number;
  priority: Priority;
  deadlineHours: number;
  updatedAt: string;
}

interface UpdateSlaPayload {
  configurations: Array<{ priority: Priority; deadlineHours: number }>;
}

export async function getSlaConfigurations(): Promise<SlaConfiguration[]> {
  try {
    const response = await api.get<SlaConfiguration[]>(API_ENDPOINTS.SLA.BASE);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load SLA configurations.'), error);
  }
}

export async function updateSlaConfigurations(
  payload: UpdateSlaPayload,
): Promise<SlaConfiguration[]> {
  try {
    const response = await api.put<SlaConfiguration[]>(API_ENDPOINTS.SLA.BASE, payload);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to update SLA configuration.'), error);
  }
}
