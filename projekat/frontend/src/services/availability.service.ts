import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData } from './errors';

export interface UnavailabilityPeriod {
  id: number;
  userId: number;
  startAt: string;
  endAt: string;
  reason: string;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnavailabilityPayload {
  startAt: string;
  endAt: string;
  reason: string;
}

export async function getMyUnavailability(): Promise<UnavailabilityPeriod[]> {
  return getResponseData(
    () => api.get<UnavailabilityPeriod[]>(API_ENDPOINTS.AVAILABILITY.ME),
    'Failed to load availability.',
  );
}

export async function createUnavailability(
  payload: UnavailabilityPayload,
): Promise<UnavailabilityPeriod> {
  return getResponseData(
    () => api.post<UnavailabilityPeriod>(API_ENDPOINTS.AVAILABILITY.ME, payload),
    'Failed to save unavailability period.',
  );
}

export async function updateUnavailability(
  id: number,
  payload: UnavailabilityPayload,
): Promise<UnavailabilityPeriod> {
  return getResponseData(
    () => api.patch<UnavailabilityPeriod>(API_ENDPOINTS.AVAILABILITY.BY_ID(id), payload),
    'Failed to update unavailability period.',
  );
}

export async function cancelUnavailability(id: number): Promise<UnavailabilityPeriod> {
  return getResponseData(
    () => api.delete<UnavailabilityPeriod>(API_ENDPOINTS.AVAILABILITY.BY_ID(id)),
    'Failed to cancel unavailability period.',
  );
}
