import { InterventionStatus, Priority } from '@prisma/client';

const MS_PER_HOUR = 1000 * 60 * 60;

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

export interface IManagementRepository {
  countInterventionsByStatuses(statuses: readonly InterventionStatus[]): Promise<number>;
  getResolutionRecords(): Promise<ResolutionRecord[]>;
  getInterventionCountsByPriorityAndStatus(): Promise<PriorityStatusCount[]>;
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
}
