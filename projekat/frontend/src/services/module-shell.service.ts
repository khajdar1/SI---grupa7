import { api } from '@/lib/api';

import { ServiceError, getErrorMessage } from './errors';
import type { ModuleShellResponse } from './types';

function isModuleShellResponse(payload: unknown): payload is ModuleShellResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const maybe = payload as { module?: unknown; endpoints?: unknown };
  return typeof maybe.module === 'string' && Array.isArray(maybe.endpoints);
}

export async function getModuleShell(endpoint: string): Promise<ModuleShellResponse | null> {
  try {
    const response = await api.get<unknown>(endpoint);

    if (!isModuleShellResponse(response.data)) {
      return null;
    }

    return {
      module: response.data.module,
      endpoints: response.data.endpoints.filter(
        (entry): entry is string => typeof entry === 'string',
      ),
    };
  } catch (error) {
    throw new ServiceError(getErrorMessage(error, 'Failed to load module data.'), error);
  }
}
