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
} from '../src/modules/management/management.service';

function makeRepository(overrides: Partial<IManagementRepository> = {}): IManagementRepository {
  return {
    countInterventionsByStatuses: vi.fn().mockResolvedValue(0),
    getResolutionRecords: vi.fn().mockResolvedValue([]),
    getInterventionCountsByPriorityAndStatus: vi.fn().mockResolvedValue([]),
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

    expect(countFn).toHaveBeenCalledTimes(2); // active + completed
    expect(resolutionFn).toHaveBeenCalledTimes(1);
    expect(priorityFn).toHaveBeenCalledTimes(1);
  });
});
