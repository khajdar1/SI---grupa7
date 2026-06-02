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
export interface TopMaterial {
  name: string;
  totalQuantity: number;
  reportCount: number;
}

export interface PeriodMaterialUsage {
  period: string;
  totalQuantity: number;
  distinctMaterials: number;
}

export interface CompanyMaterialUsage {
  companyId: number;
  companyName: string;
  totalQuantity: number;
}

export interface MaterialsReport {
  topMaterials: TopMaterial[];
  byPeriod: PeriodMaterialUsage[];
  byCompany: CompanyMaterialUsage[];
  totalReportsWithMaterials: number;
  totalQuantity: number;
  totalDistinctMaterials: number;
}

export interface MaterialsReportParams {
  from?: string; 
  to?: string;
  companyId?: number;
  categoryId?: number;
}

export async function getManagementDashboard(): Promise<ManagementDashboardStats> {
  return getResponseData(
    () => api.get<ManagementDashboardStats>(API_ENDPOINTS.MANAGEMENT.DASHBOARD),
    'Failed to load the management dashboard.',
  );
}

export async function getMaterialsReport(
  params: MaterialsReportParams = {},
): Promise<MaterialsReport> {
  const query = new URLSearchParams();
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.companyId !== undefined) query.set('companyId', String(params.companyId));
  if (params.categoryId !== undefined) query.set('categoryId', String(params.categoryId));

  const url = `${API_ENDPOINTS.MANAGEMENT.MATERIALS}${query.toString() ? `?${query.toString()}` : ''}`;

  return getResponseData(
    () => api.get<MaterialsReport>(url),
    'Failed to load the materials report.',
  );
}