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
      return {
        items: [],
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
