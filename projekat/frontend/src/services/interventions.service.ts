import type { InterventionStatus, Priority } from '@shared/enums';

import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { ServiceError, getErrorMessage } from './errors';
import type { ModuleShellResponse } from './types';

export interface InterventionListItem {
  id: string;
  title: string;
  categoryName: string;
  priority: Priority;
  status: InterventionStatus;
  owner: string;
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
    typeof maybe.categoryName === 'string' &&
    typeof maybe.priority === 'string' &&
    typeof maybe.status === 'string' &&
    typeof maybe.owner === 'string'
  );
}

function isModuleInfo(payload: unknown): payload is ModuleShellResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const maybe = payload as { module?: unknown; endpoints?: unknown };
  return typeof maybe.module === 'string' && Array.isArray(maybe.endpoints);
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
