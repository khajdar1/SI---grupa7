import { api } from '@/lib/api';

import { withServiceError } from './errors';
import type { ModuleShellResponse } from './types';

function isModuleShellResponse(payload: unknown): payload is ModuleShellResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const maybe = payload as { module?: unknown; endpoints?: unknown };
  return typeof maybe.module === 'string' && Array.isArray(maybe.endpoints);
}

export function toModuleShellResponse(payload: unknown): ModuleShellResponse | null {
  if (!isModuleShellResponse(payload)) {
    return null;
  }

  return {
    module: payload.module,
    endpoints: payload.endpoints.filter(
      (entry): entry is string => typeof entry === 'string',
    ),
  };
}

export async function getModuleShell(endpoint: string): Promise<ModuleShellResponse | null> {
  return withServiceError(async () => {
    const response = await api.get<unknown>(endpoint);
    return toModuleShellResponse(response.data);
  }, 'Failed to load module data.');
}
