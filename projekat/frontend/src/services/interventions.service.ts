import type { InterventionStatus, Priority } from '@shared/enums';

import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData, withServiceError } from './errors';
import { toModuleShellResponse } from './module-shell.service';
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

export interface InterventionDetail {
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
  type: string;
  owner: string;
  ownerId?: number;
  createdAt: string;
  startedAt: string | null;
  dueAt: string | null;
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
  return getResponseData(
    () => api.get<InterventionDetail>(API_ENDPOINTS.INTERVENTIONS.BY_ID(id)),
    'Failed to load intervention.',
  );
}

export async function getInterventions(): Promise<InterventionsResult> {
  return withServiceError(async () => {
    const response = await api.get<unknown>(API_ENDPOINTS.INTERVENTIONS.BASE);

    if (Array.isArray(response.data)) {
      const items = response.data.filter(isInterventionListItem);
      return {
        items,
        moduleInfo: null,
      };
    }

    const moduleInfo = toModuleShellResponse(response.data);

    if (moduleInfo) {
      return {
        items: [],
        moduleInfo,
      };
    }

    return { items: [], moduleInfo: null };
  }, 'Failed to load interventions.');
}

export async function getInterventionOptions(): Promise<InterventionOptions> {
  return getResponseData(
    () => api.get<InterventionOptions>(`${API_ENDPOINTS.INTERVENTIONS.BASE}/options`),
    'Failed to load intervention options.',
  );
}

export async function createIntervention(payload: InterventionFormPayload): Promise<InterventionListItem> {
  return getResponseData(
    () => api.post<InterventionListItem>(API_ENDPOINTS.INTERVENTIONS.BASE, payload),
    'Failed to create intervention.',
  );
}

export async function updateIntervention(
  id: string,
  payload: InterventionFormPayload,
): Promise<InterventionListItem> {
  return getResponseData(
    () => api.patch<InterventionListItem>(
      `${API_ENDPOINTS.INTERVENTIONS.BASE}/${id}`,
      payload,
    ),
    'Failed to update intervention.',
  );
}

export async function updateInterventionStatus(
  id: string | number,
  status: InterventionStatus,
): Promise<InterventionDetail> {
  return getResponseData(
    () => api.patch<InterventionDetail>(
      `${API_ENDPOINTS.INTERVENTIONS.BY_ID(id)}/status`,
      { status },
    ),
    'Failed to update intervention status.',
  );
}
