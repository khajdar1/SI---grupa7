import type { InterventionStatus, Priority } from '@shared/enums';

import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { ServiceError, getErrorMessage } from './errors';
import type { ModuleShellResponse } from './types';

export interface InterventionFaultReportLink {
  id: number;
  description: string;
  reportedAt: string;
}

export interface InterventionListItem {
  id: string;
  title: string;
  name: string;
  description: string;
  location: string;
  categoryId: number;
  categoryName: string;
  companyId: number;
  companyName: string;
  priority: Priority;
  status: InterventionStatus;
  type: 'ISSUE' | 'PREVENTIVE';
  owner: string;
  createdAt: string;
  startedAt: string | null;
  dueAt: string | null;
  isOverdue?: boolean;
  faultReport: InterventionFaultReportLink | null;
  assignments?: Array<{
    id: number;
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
    };
    assignedAt: string;
  }>;
}

export interface InterventionFormPayload {
  name: string;
  description: string;
  location: string;
  startedAt?: string;
  dueAt?: string;
  faultReportId?: number | null;
  companyId?: number;
  categoryId?: number;
  priority: Priority;
}

export interface InterventionOption {
  id: number;
  name: string;
}

export interface InterventionFaultReportOption {
  id: number;
  description: string;
  location: string;
  reportedAt: string;
  company: InterventionOption;
  category: InterventionOption;
}

export interface InterventionOptions {
  companies: InterventionOption[];
  categories: InterventionOption[];
  faultReports: InterventionFaultReportOption[];
}

interface InterventionsResult {
  items: InterventionListItem[];
  moduleInfo: ModuleShellResponse | null;
}

function isInterventionListItem(payload: unknown): payload is InterventionListItem {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const maybe = payload as Record<string, unknown>;
  return (
    typeof maybe.id === 'string' &&
    typeof maybe.title === 'string' &&
    typeof maybe.name === 'string' &&
    typeof maybe.description === 'string' &&
    typeof maybe.location === 'string' &&
    typeof maybe.categoryId === 'number' &&
    typeof maybe.categoryName === 'string' &&
    typeof maybe.companyId === 'number' &&
    typeof maybe.companyName === 'string' &&
    typeof maybe.priority === 'string' &&
    typeof maybe.status === 'string' &&
    typeof maybe.type === 'string' &&
    typeof maybe.owner === 'string' &&
    (maybe.isOverdue === undefined || typeof maybe.isOverdue === 'boolean')
  );
}

function isModuleInfo(payload: unknown): payload is ModuleShellResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const maybe = payload as { module?: unknown; endpoints?: unknown };
  return typeof maybe.module === 'string' && Array.isArray(maybe.endpoints);
}

export interface InterventionDetail {
  id: number;
  name: string;
  description: string;
  location: string;
  priority: Priority;
  status: InterventionStatus;
  type: string;
  createdAt: string;
  startedAt: string | null;
  dueAt: string | null;
  category: { id: number; name: string };
  creator: { id: number; username: string };
  company: { id: number; name: string };
  faultReport: { id: number } | null;
  assignments?: Array<{
    id: number;
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
    };
    assignedAt: string;
  }>;
}

export async function getInterventionById(id: number): Promise<InterventionDetail> {
  try {
    const response = await api.get<InterventionDetail>(API_ENDPOINTS.INTERVENTIONS.BY_ID(id));
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load intervention.'), error);
  }
}

export async function getInterventions(): Promise<InterventionsResult> {
  try {
    const response = await api.get<unknown>(API_ENDPOINTS.INTERVENTIONS.BASE);

    if (Array.isArray(response.data)) {
      const items = response.data.filter(isInterventionListItem);
      return {
        items,
        moduleInfo: null,
      };
    }

    if (isModuleInfo(response.data)) {
      return {
        items: [],
        moduleInfo: {
          module: response.data.module,
          endpoints: response.data.endpoints.filter(
            (entry): entry is string => typeof entry === 'string',
          ),
        },
      };
    }

    return { items: [], moduleInfo: null };
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load interventions.'), error);
  }
}

export async function getInterventionOptions(): Promise<InterventionOptions> {
  try {
    const response = await api.get<InterventionOptions>(`${API_ENDPOINTS.INTERVENTIONS.BASE}/options`);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load intervention options.'), error);
  }
}

export async function createIntervention(payload: InterventionFormPayload): Promise<InterventionListItem> {
  try {
    const response = await api.post<InterventionListItem>(API_ENDPOINTS.INTERVENTIONS.BASE, payload);
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to create intervention.'), error);
  }
}

export async function updateIntervention(
  id: string,
  payload: InterventionFormPayload,
): Promise<InterventionListItem> {
  try {
    const response = await api.patch<InterventionListItem>(
      `${API_ENDPOINTS.INTERVENTIONS.BASE}/${id}`,
      payload,
    );
    return response.data;
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to update intervention.'), error);
  }
}
