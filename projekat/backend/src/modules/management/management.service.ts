import { InterventionStatus, Priority } from '@prisma/client';

import { parseMaterialItems, type MaterialItem } from '../../shared/material-item';

const MS_PER_HOUR = 1_000 * 60 * 60;
const TOP_MATERIALS_LIMIT = 15;

export const ACTIVE_STATUSES: readonly InterventionStatus[] = [
  InterventionStatus.NEW,
  InterventionStatus.ASSIGNED,
  InterventionStatus.IN_PROGRESS,
];

export const COMPLETED_STATUS = InterventionStatus.RESOLVED;

export const PRIORITY_DISPLAY_ORDER: readonly Priority[] = [
  Priority.CRITICAL,
  Priority.HIGH,
  Priority.MEDIUM,
  Priority.LOW,
];
export interface ResolutionRecord {
  changedAt: Date;
  intervention: { createdAt: Date };
}

export interface PriorityStatusCount {
  priority: Priority;
  status: InterventionStatus;
  _count: { _all: number };
}

export interface PriorityDistributionRow {
  readonly priority: Priority;
  readonly total: number;
  readonly active: number;
  readonly completed: number;
}

export interface ManagementDashboardStats {
  readonly activeCount: number;
  readonly completedCount: number;
  readonly averageResolutionHours: number | null;
  readonly priorityDistribution: PriorityDistributionRow[];
}

export interface GetMaterialsReportParams {
  from?: Date;
  to?: Date;
  companyId?: number;
  categoryId?: number;
}
export interface ReportMaterialRow {
  material: string | null;
  reportDate: Date;
  intervention: {
    companyId: number;
    company: { name: string };
  };
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


export interface IManagementRepository {
  countInterventionsByStatuses(statuses: readonly InterventionStatus[]): Promise<number>;
  getResolutionRecords(): Promise<ResolutionRecord[]>;
  getInterventionCountsByPriorityAndStatus(): Promise<PriorityStatusCount[]>;
  getReportsWithMaterials(params: GetMaterialsReportParams): Promise<ReportMaterialRow[]>;
}

function computeAverageResolutionHours(records: ResolutionRecord[]): number | null {
  if (records.length === 0) return null;
  const totalMs = records.reduce((sum, record) => {
    const durationMs = record.changedAt.getTime() - record.intervention.createdAt.getTime();
    return sum + Math.max(0, durationMs);
  }, 0);
  return totalMs / records.length / MS_PER_HOUR;
}

function buildPriorityDistribution(counts: PriorityStatusCount[]): PriorityDistributionRow[] {
  const activeStatusSet = new Set<InterventionStatus>(ACTIVE_STATUSES);
  return PRIORITY_DISPLAY_ORDER.map((priority) => {
    const rows = counts.filter((row) => row.priority === priority);
    const total = rows.reduce((sum, row) => sum + row._count._all, 0);
    const active = rows
      .filter((row) => activeStatusSet.has(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);
    const completed = rows
      .filter((row) => row.status === COMPLETED_STATUS)
      .reduce((sum, row) => sum + row._count._all, 0);
    return { priority, total, active, completed };
  });
}

function aggregateMaterials(rows: ReportMaterialRow[]): MaterialsReport {
  const topMaterialsMap = new Map<string, { totalQuantity: number; reportCount: number }>();
  const periodMap = new Map<string, { totalQuantity: number; distinctMaterials: Set<string> }>();
  const companyMap = new Map<number, { companyName: string; totalQuantity: number }>();

  let totalReportsWithMaterials = 0;
  let totalQuantity = 0;

  for (const row of rows) {
    const items: MaterialItem[] = parseMaterialItems(row.material);
    if (!items.length) continue;

    totalReportsWithMaterials++;

    const period = row.reportDate.toISOString().slice(0, 7);
    const { companyId } = row.intervention;
    const companyName = row.intervention.company.name;

    for (const item of items) {
      totalQuantity += item.quantity;

      const existing = topMaterialsMap.get(item.name) ?? { totalQuantity: 0, reportCount: 0 };
      topMaterialsMap.set(item.name, {
        totalQuantity: existing.totalQuantity + item.quantity,
        reportCount: existing.reportCount + 1,
      });

      const periodData = periodMap.get(period) ?? {
        totalQuantity: 0,
        distinctMaterials: new Set<string>(),
      };
      periodData.totalQuantity += item.quantity;
      periodData.distinctMaterials.add(item.name);
      periodMap.set(period, periodData);

      const companyData = companyMap.get(companyId) ?? { companyName, totalQuantity: 0 };
      companyMap.set(companyId, {
        companyName,
        totalQuantity: companyData.totalQuantity + item.quantity,
      });
    }
  }

  const topMaterials: TopMaterial[] = [...topMaterialsMap.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, TOP_MATERIALS_LIMIT);

  const byPeriod: PeriodMaterialUsage[] = [...periodMap.entries()]
    .map(([per, data]) => ({
      period: per,
      totalQuantity: data.totalQuantity,
      distinctMaterials: data.distinctMaterials.size,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const byCompany: CompanyMaterialUsage[] = [...companyMap.entries()]
    .map(([cId, data]) => ({ companyId: cId, ...data }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  return {
    topMaterials,
    byPeriod,
    byCompany,
    totalReportsWithMaterials,
    totalQuantity,
    totalDistinctMaterials: topMaterialsMap.size,
  };
}

export class ManagementService {
  constructor(private readonly repository: IManagementRepository) {}

  async getDashboardStats(): Promise<ManagementDashboardStats> {
    const [activeCount, completedCount, resolutionRecords, priorityStatusCounts] =
      await Promise.all([
        this.repository.countInterventionsByStatuses(ACTIVE_STATUSES),
        this.repository.countInterventionsByStatuses([COMPLETED_STATUS]),
        this.repository.getResolutionRecords(),
        this.repository.getInterventionCountsByPriorityAndStatus(),
      ]);

    return {
      activeCount,
      completedCount,
      averageResolutionHours: computeAverageResolutionHours(resolutionRecords),
      priorityDistribution: buildPriorityDistribution(priorityStatusCounts),
    };
  }

  async getMaterialsReport(params: GetMaterialsReportParams): Promise<MaterialsReport> {
    const rows = await this.repository.getReportsWithMaterials(params);
    return aggregateMaterials(rows);
  }
}