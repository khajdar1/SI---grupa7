import { InterventionStatus, Priority } from '@prisma/client';
import { describe, expect, test, vi } from 'vitest';

import {
  ACTIVE_STATUSES,
  COMPLETED_STATUS,
  ManagementService,
  PRIORITY_DISPLAY_ORDER,
  type IManagementRepository,
  type PriorityStatusCount,
  type ResolutionRecord,
  type ReportMaterialRow,       
} from '../src/modules/management/management.service';

function makeRepository(overrides: Partial<IManagementRepository> = {}): IManagementRepository {
  return {
    countInterventionsByStatuses: vi.fn().mockResolvedValue(0),
    getResolutionRecords: vi.fn().mockResolvedValue([]),
    getInterventionCountsByPriorityAndStatus: vi.fn().mockResolvedValue([]),
    getReportsWithMaterials: vi.fn().mockResolvedValue([]),   // ← dodaj ovo
    ...overrides,
  };
}

function makeResolutionRecord(createdAt: Date, resolvedAt: Date): ResolutionRecord {
  return {
    changedAt: resolvedAt,
    intervention: { createdAt },
  };
}

function makePriorityStatusCount(
  priority: Priority,
  status: InterventionStatus,
  count: number,
): PriorityStatusCount {
  return { priority, status, _count: { _all: count } };
}

describe('ACTIVE_STATUSES', () => {
  test('includes NEW', () => {
    expect(ACTIVE_STATUSES).toContain(InterventionStatus.NEW);
  });

  test('includes ASSIGNED', () => {
    expect(ACTIVE_STATUSES).toContain(InterventionStatus.ASSIGNED);
  });

  test('includes IN_PROGRESS', () => {
    expect(ACTIVE_STATUSES).toContain(InterventionStatus.IN_PROGRESS);
  });

  test('does not include RESOLVED', () => {
    expect(ACTIVE_STATUSES).not.toContain(InterventionStatus.RESOLVED);
  });

  test('does not include CANCELLED', () => {
    expect(ACTIVE_STATUSES).not.toContain(InterventionStatus.CANCELLED);
  });

  test('does not include REJECTED', () => {
    expect(ACTIVE_STATUSES).not.toContain(InterventionStatus.REJECTED);
  });
});

describe('COMPLETED_STATUS', () => {
  test('is RESOLVED', () => {
    expect(COMPLETED_STATUS).toBe(InterventionStatus.RESOLVED);
  });
});

describe('PRIORITY_DISPLAY_ORDER', () => {
  test('starts with CRITICAL', () => {
    expect(PRIORITY_DISPLAY_ORDER[0]).toBe(Priority.CRITICAL);
  });

  test('ends with LOW', () => {
    expect(PRIORITY_DISPLAY_ORDER[PRIORITY_DISPLAY_ORDER.length - 1]).toBe(Priority.LOW);
  });

  test('contains all four priorities', () => {
    expect(PRIORITY_DISPLAY_ORDER).toHaveLength(4);
    expect(PRIORITY_DISPLAY_ORDER).toContain(Priority.HIGH);
    expect(PRIORITY_DISPLAY_ORDER).toContain(Priority.MEDIUM);
  });
});

describe('ManagementService.getDashboardStats', () => {
  test('returns active count from repository', async () => {
    const repo = makeRepository({
      countInterventionsByStatuses: vi.fn().mockImplementation((statuses) =>
        Promise.resolve(statuses.includes(InterventionStatus.RESOLVED) ? 0 : 7),
      ),
    });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    expect(stats.activeCount).toBe(7);
  });

  test('returns completed count from repository', async () => {
    const repo = makeRepository({
      countInterventionsByStatuses: vi.fn().mockImplementation((statuses) =>
        Promise.resolve(statuses.includes(InterventionStatus.RESOLVED) ? 42 : 0),
      ),
    });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    expect(stats.completedCount).toBe(42);
  });

  test('calls countInterventionsByStatuses with ACTIVE_STATUSES for active count', async () => {
    const countFn = vi.fn().mockResolvedValue(0);
    const repo = makeRepository({ countInterventionsByStatuses: countFn });
    const service = new ManagementService(repo);

    await service.getDashboardStats();

    const calls = countFn.mock.calls.map((c) => c[0] as InterventionStatus[]);
    const activeCall = calls.find((statuses) => statuses.includes(InterventionStatus.NEW));
    expect(activeCall).toBeDefined();
    expect(activeCall).toContain(InterventionStatus.ASSIGNED);
    expect(activeCall).toContain(InterventionStatus.IN_PROGRESS);
  });

  test('calls countInterventionsByStatuses with [RESOLVED] for completed count', async () => {
    const countFn = vi.fn().mockResolvedValue(0);
    const repo = makeRepository({ countInterventionsByStatuses: countFn });
    const service = new ManagementService(repo);

    await service.getDashboardStats();

    const calls = countFn.mock.calls.map((c) => c[0] as InterventionStatus[]);
    const completedCall = calls.find(
      (statuses) => statuses.length === 1 && statuses[0] === InterventionStatus.RESOLVED,
    );
    expect(completedCall).toBeDefined();
  });

  test('returns null averageResolutionHours when no resolved interventions exist', async () => {
    const repo = makeRepository({ getResolutionRecords: vi.fn().mockResolvedValue([]) });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    expect(stats.averageResolutionHours).toBeNull();
  });

  test('computes averageResolutionHours correctly for a single intervention', async () => {
    const createdAt = new Date('2026-01-01T08:00:00Z');
    const resolvedAt = new Date('2026-01-01T12:00:00Z'); // 4 hours later
    const repo = makeRepository({
      getResolutionRecords: vi.fn().mockResolvedValue([makeResolutionRecord(createdAt, resolvedAt)]),
    });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    expect(stats.averageResolutionHours).toBe(4);
  });

  test('computes averageResolutionHours correctly for multiple interventions', async () => {
    const base = new Date('2026-01-01T00:00:00Z');
    const twoHoursLater = new Date('2026-01-01T02:00:00Z');
    const sixHoursLater = new Date('2026-01-01T06:00:00Z');
    const repo = makeRepository({
      getResolutionRecords: vi.fn().mockResolvedValue([
        makeResolutionRecord(base, twoHoursLater),
        makeResolutionRecord(base, sixHoursLater),
      ]),
    });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    expect(stats.averageResolutionHours).toBe(4); // (2 + 6) / 2
  });

  test('clamps negative durations to zero when resolved before created (data anomaly)', async () => {
    const createdAt = new Date('2026-01-01T12:00:00Z');
    const resolvedAt = new Date('2026-01-01T08:00:00Z'); // before created
    const repo = makeRepository({
      getResolutionRecords: vi.fn().mockResolvedValue([makeResolutionRecord(createdAt, resolvedAt)]),
    });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    expect(stats.averageResolutionHours).toBe(0);
  });

  test('returns priority distribution with all four priorities', async () => {
    const repo = makeRepository();
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    const priorities = stats.priorityDistribution.map((row) => row.priority);
    expect(priorities).toContain(Priority.CRITICAL);
    expect(priorities).toContain(Priority.HIGH);
    expect(priorities).toContain(Priority.MEDIUM);
    expect(priorities).toContain(Priority.LOW);
    expect(stats.priorityDistribution).toHaveLength(4);
  });

  test('priority distribution follows CRITICAL → HIGH → MEDIUM → LOW order', async () => {
    const repo = makeRepository();
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    const priorities = stats.priorityDistribution.map((row) => row.priority);
    expect(priorities).toEqual([Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW]);
  });

  test('correctly counts active and completed per priority', async () => {
    const repo = makeRepository({
      getInterventionCountsByPriorityAndStatus: vi.fn().mockResolvedValue([
        makePriorityStatusCount(Priority.HIGH, InterventionStatus.NEW, 3),
        makePriorityStatusCount(Priority.HIGH, InterventionStatus.IN_PROGRESS, 2),
        makePriorityStatusCount(Priority.HIGH, InterventionStatus.RESOLVED, 5),
        makePriorityStatusCount(Priority.HIGH, InterventionStatus.CANCELLED, 1),
      ]),
    });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    const highRow = stats.priorityDistribution.find((r) => r.priority === Priority.HIGH);
    expect(highRow?.total).toBe(11);
    expect(highRow?.active).toBe(5);  // NEW(3) + IN_PROGRESS(2)
    expect(highRow?.completed).toBe(5); // RESOLVED(5)
  });

  test('ASSIGNED status is counted as active in priority distribution', async () => {
    const repo = makeRepository({
      getInterventionCountsByPriorityAndStatus: vi.fn().mockResolvedValue([
        makePriorityStatusCount(Priority.LOW, InterventionStatus.ASSIGNED, 4),
      ]),
    });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    const lowRow = stats.priorityDistribution.find((r) => r.priority === Priority.LOW);
    expect(lowRow?.active).toBe(4);
  });

  test('CANCELLED interventions are not counted as active or completed', async () => {
    const repo = makeRepository({
      getInterventionCountsByPriorityAndStatus: vi.fn().mockResolvedValue([
        makePriorityStatusCount(Priority.MEDIUM, InterventionStatus.CANCELLED, 3),
        makePriorityStatusCount(Priority.MEDIUM, InterventionStatus.REJECTED, 2),
      ]),
    });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    const medRow = stats.priorityDistribution.find((r) => r.priority === Priority.MEDIUM);
    expect(medRow?.active).toBe(0);
    expect(medRow?.completed).toBe(0);
    expect(medRow?.total).toBe(5);
  });

  test('returns zero totals for priorities with no interventions', async () => {
    const repo = makeRepository({
      getInterventionCountsByPriorityAndStatus: vi.fn().mockResolvedValue([
        makePriorityStatusCount(Priority.CRITICAL, InterventionStatus.NEW, 1),
      ]),
    });
    const service = new ManagementService(repo);

    const stats = await service.getDashboardStats();

    const lowRow = stats.priorityDistribution.find((r) => r.priority === Priority.LOW);
    expect(lowRow?.total).toBe(0);
    expect(lowRow?.active).toBe(0);
    expect(lowRow?.completed).toBe(0);
  });

  test('fetches all data sources in parallel (all repository methods called once)', async () => {
    const countFn = vi.fn().mockResolvedValue(0);
    const resolutionFn = vi.fn().mockResolvedValue([]);
    const priorityFn = vi.fn().mockResolvedValue([]);
    const repo = makeRepository({
      countInterventionsByStatuses: countFn,
      getResolutionRecords: resolutionFn,
      getInterventionCountsByPriorityAndStatus: priorityFn,
    });
    const service = new ManagementService(repo);

    await service.getDashboardStats();

    expect(countFn).toHaveBeenCalledTimes(2); 
    expect(resolutionFn).toHaveBeenCalledTimes(1);
    expect(priorityFn).toHaveBeenCalledTimes(1);
  });
});

function mat(items: { name: string; quantity: number; note?: string | null }[]): string {
  return JSON.stringify(
    items.map((i) => ({ name: i.name, quantity: i.quantity, note: i.note ?? null })),
  );
}

function makeReportMaterialRow(overrides: {
  material?: string | null;
  reportDate?: Date;
  companyId?: number;
  companyName?: string;
}): ReportMaterialRow {
  return {
    material: overrides.material ?? null,
    reportDate: overrides.reportDate ?? new Date('2026-01-15T00:00:00Z'),
    intervention: {
      companyId: overrides.companyId ?? 1,
      company: { name: overrides.companyName ?? 'Test d.o.o.' },
    },
  };
}

describe('ManagementService.getMaterialsReport', () => {
  test('returns empty report when no rows exist', async () => {
    const repo = makeRepository();
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.topMaterials).toHaveLength(0);
    expect(report.byPeriod).toHaveLength(0);
    expect(report.byCompany).toHaveLength(0);
    expect(report.totalReportsWithMaterials).toBe(0);
    expect(report.totalQuantity).toBe(0);
    expect(report.totalDistinctMaterials).toBe(0);
  });

  test('skips rows with null material', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([makeReportMaterialRow({ material: null })]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.totalReportsWithMaterials).toBe(0);
    expect(report.totalQuantity).toBe(0);
  });

  test('counts totalReportsWithMaterials correctly', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 1 }]) }),
        makeReportMaterialRow({ material: mat([{ name: 'gasket', quantity: 4 }]) }),
        makeReportMaterialRow({ material: null }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.totalReportsWithMaterials).toBe(2);
  });

  test('sums totalQuantity across all items', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 3 }, { name: 'bolt', quantity: 8 }]) }),
        makeReportMaterialRow({ material: mat([{ name: 'gasket', quantity: 4 }]) }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.totalQuantity).toBe(15);
  });

  test('counts totalDistinctMaterials correctly', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 1 }, { name: 'bolt', quantity: 2 }]) }),
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 1 }, { name: 'gasket', quantity: 1 }]) }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.totalDistinctMaterials).toBe(3); 
  });

  test('topMaterials are sorted by totalQuantity descending', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'bolt', quantity: 2 }]) }),
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 10 }]) }),
        makeReportMaterialRow({ material: mat([{ name: 'gasket', quantity: 5 }]) }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.topMaterials.map((m) => m.name)).toEqual(['pump', 'gasket', 'bolt']);
  });

  test('topMaterials aggregates quantity for the same material across reports', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 3 }]) }),
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 7 }]) }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.topMaterials[0].name).toBe('pump');
    expect(report.topMaterials[0].totalQuantity).toBe(10);
    expect(report.topMaterials[0].reportCount).toBe(2);
  });

  test('topMaterials list is limited to 15 entries', async () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ name: `mat-${i}`, quantity: i + 1 }));
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat(items) }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.topMaterials.length).toBeLessThanOrEqual(15);
  });

  test('byPeriod groups rows by YYYY-MM period', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 2 }]), reportDate: new Date('2026-01-10') }),
        makeReportMaterialRow({ material: mat([{ name: 'bolt', quantity: 5 }]), reportDate: new Date('2026-01-25') }),
        makeReportMaterialRow({ material: mat([{ name: 'gasket', quantity: 1 }]), reportDate: new Date('2026-02-05') }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    const jan = report.byPeriod.find((p) => p.period === '2026-01');
    const feb = report.byPeriod.find((p) => p.period === '2026-02');
    expect(jan?.totalQuantity).toBe(7);
    expect(feb?.totalQuantity).toBe(1);
  });

  test('byPeriod periods are sorted chronologically', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 1 }]), reportDate: new Date('2026-03-01') }),
        makeReportMaterialRow({ material: mat([{ name: 'bolt', quantity: 1 }]), reportDate: new Date('2026-01-01') }),
        makeReportMaterialRow({ material: mat([{ name: 'gasket', quantity: 1 }]), reportDate: new Date('2026-02-01') }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.byPeriod.map((p) => p.period)).toEqual(['2026-01', '2026-02', '2026-03']);
  });

  test('byPeriod tracks distinctMaterials per period', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({
          material: mat([{ name: 'pump', quantity: 1 }, { name: 'bolt', quantity: 1 }]),
          reportDate: new Date('2026-01-10'),
        }),
        makeReportMaterialRow({
          material: mat([{ name: 'pump', quantity: 2 }]),
          reportDate: new Date('2026-01-20'),
        }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    const jan = report.byPeriod.find((p) => p.period === '2026-01');
    expect(jan?.distinctMaterials).toBe(2); 
  });

  test('byCompany groups rows by companyId', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 3 }]), companyId: 1, companyName: 'Firma A' }),
        makeReportMaterialRow({ material: mat([{ name: 'bolt', quantity: 7 }]), companyId: 2, companyName: 'Firma B' }),
        makeReportMaterialRow({ material: mat([{ name: 'gasket', quantity: 2 }]), companyId: 1, companyName: 'Firma A' }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    const firmaA = report.byCompany.find((c) => c.companyId === 1);
    expect(firmaA?.companyName).toBe('Firma A');
    expect(firmaA?.totalQuantity).toBe(5);
  });

  test('byCompany is sorted by totalQuantity descending', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'bolt', quantity: 2 }]), companyId: 1, companyName: 'Firma A' }),
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 10 }]), companyId: 2, companyName: 'Firma B' }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    expect(report.byCompany[0].companyId).toBe(2);
    expect(report.byCompany[1].companyId).toBe(1);
  });

  test('calls getReportsWithMaterials with provided params', async () => {
    const getReportsWithMaterials = vi.fn().mockResolvedValue([]);
    const repo = makeRepository({ getReportsWithMaterials });
    const service = new ManagementService(repo);

    const params = { from: new Date('2026-01-01'), to: new Date('2026-01-31'), companyId: 5, categoryId: 3 };
    await service.getMaterialsReport(params);

    expect(getReportsWithMaterials).toHaveBeenCalledWith(params);
  });

  test('calls getReportsWithMaterials exactly once', async () => {
    const getReportsWithMaterials = vi.fn().mockResolvedValue([]);
    const repo = makeRepository({ getReportsWithMaterials });
    const service = new ManagementService(repo);

    await service.getMaterialsReport({});

    expect(getReportsWithMaterials).toHaveBeenCalledTimes(1);
  });

  test('report does not include any price or cost fields', async () => {
    const repo = makeRepository({
      getReportsWithMaterials: vi.fn().mockResolvedValue([
        makeReportMaterialRow({ material: mat([{ name: 'pump', quantity: 1 }]) }),
      ]),
    });
    const service = new ManagementService(repo);

    const report = await service.getMaterialsReport({});

    const reportStr = JSON.stringify(report);
    expect(reportStr).not.toMatch(/price/i);
    expect(reportStr).not.toMatch(/cost/i);
    expect(reportStr).not.toMatch(/cijena/i);
    expect(reportStr).not.toMatch(/faktur/i);
  });
});
