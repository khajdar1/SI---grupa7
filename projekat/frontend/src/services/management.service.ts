import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData } from './errors';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriorityDistributionRow {
  priority: Priority;
  total: number;
  active: number;
  completed: number;
}

export interface ManagementDashboardStats {
  activeCount: number;
  completedCount: number;
  averageResolutionHours: number | null;
  priorityDistribution: PriorityDistributionRow[];
}

export async function getManagementDashboard(): Promise<ManagementDashboardStats> {
  return getResponseData(
    () => api.get<ManagementDashboardStats>(API_ENDPOINTS.MANAGEMENT.DASHBOARD),
    'Failed to load the management dashboard.',
  );
}
