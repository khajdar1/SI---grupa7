import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getCategories } from './categories.service';
import { ServiceError, getErrorMessage } from './errors';
import { getModuleShell } from './module-shell.service';
import { getSlaConfigurations } from './sla.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
}

interface DashboardStat {
  title: string;
  value: number | string;
}

interface DashboardSnapshot {
  stats: DashboardStat[];
  activity: string[];
}

function isForbiddenError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const details = (error as { details?: unknown }).details;
  if (typeof details !== 'object' || details === null) {
    return false;
  }

  return (details as { response?: { status?: number } }).response?.status === 403;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  try {
    const [categories, slaConfigsResult, health, interventionsModule] = await Promise.all([
      getCategories(),
      getSlaConfigurations().catch((error) => {
        if (isForbiddenError(error)) {
          return null;
        }

        throw error;
      }),
      api.get<HealthResponse>(API_ENDPOINTS.HEALTH.BASE),
      getModuleShell(API_ENDPOINTS.INTERVENTIONS.BASE),
    ]);

    const activeCategories = categories.filter((category) => category.active).length;
    const inactiveCategories = categories.length - activeCategories;

    const stats: DashboardStat[] = [
      { title: 'Active categories', value: activeCategories },
      { title: 'Inactive categories', value: inactiveCategories },
      { title: 'SLA profiles', value: slaConfigsResult?.length ?? 'Admin only' },
      { title: 'API status', value: health.data.status.toUpperCase() },
    ];

    const activity = (interventionsModule?.endpoints ?? []).map(
      (endpoint) => `Interventions module exposes ${endpoint}`,
    );

    return {
      stats,
      activity,
    };
  } catch (error) {
    throw new ServiceError(
      getErrorMessage(error, 'Failed to load dashboard snapshot.'),
      error,
    );
  }
}

export type { DashboardSnapshot, DashboardStat };
