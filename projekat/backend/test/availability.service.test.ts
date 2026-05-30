import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AvailabilityForbiddenError,
  AvailabilityService,
  AvailabilityValidationError,
  type AvailabilityRepository,
  type UnavailabilityRecord,
} from '../src/modules/availability/availability.service';

const actor = { id: 10, username: 'servicer.one' };

function makeRecord(overrides: Partial<UnavailabilityRecord> = {}): UnavailabilityRecord {
  return {
    id: 1,
    userId: actor.id,
    startAt: new Date('2026-06-05T08:00:00.000Z'),
    endAt: new Date('2026-06-05T16:00:00.000Z'),
    reason: 'Medical appointment',
    canceledAt: null,
    createdAt: new Date('2026-06-01T08:00:00.000Z'),
    updatedAt: new Date('2026-06-01T08:00:00.000Z'),
    ...overrides,
  };
}

function makeRepository(overrides: Partial<AvailabilityRepository> = {}): AvailabilityRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeRecord()),
    listByUser: vi.fn().mockResolvedValue([makeRecord()]),
    create: vi.fn().mockImplementation((userId, input) => Promise.resolve(makeRecord({ userId, ...input }))),
    update: vi.fn().mockImplementation((id, input) => Promise.resolve(makeRecord({ id, ...input }))),
    cancel: vi.fn().mockImplementation((id, canceledAt) => Promise.resolve(makeRecord({ id, canceledAt }))),
    ...overrides,
  };
}

describe('AvailabilityService', () => {
  const auditLogger = { record: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T08:00:00.000Z'));
    auditLogger.record.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a future unavailability period for the authenticated servicer', async () => {
    const repository = makeRepository();
    const service = new AvailabilityService(repository, auditLogger);

    const result = await service.createMine(actor, {
      startAt: new Date('2026-06-05T08:00:00.000Z'),
      endAt: new Date('2026-06-05T16:00:00.000Z'),
      reason: 'Medical appointment',
    });

    expect(result.userId).toBe(actor.id);
    expect(repository.create).toHaveBeenCalledWith(actor.id, expect.any(Object));
    expect(auditLogger.record).toHaveBeenCalledWith(expect.objectContaining({
      action: 'SERVICER_UNAVAILABILITY_CREATED',
    }));
  });

  it('rejects periods where the end is before the start', async () => {
    const service = new AvailabilityService(makeRepository(), auditLogger);

    await expect(
      service.createMine(actor, {
        startAt: new Date('2026-06-05T16:00:00.000Z'),
        endAt: new Date('2026-06-05T08:00:00.000Z'),
        reason: 'Invalid',
      }),
    ).rejects.toBeInstanceOf(AvailabilityValidationError);
  });

  it('prevents a servicer from updating another servicer period', async () => {
    const service = new AvailabilityService(
      makeRepository({ findById: vi.fn().mockResolvedValue(makeRecord({ userId: 99 })) }),
      auditLogger,
    );

    await expect(
      service.updateMine(actor, 1, {
        startAt: new Date('2026-06-05T08:00:00.000Z'),
        endAt: new Date('2026-06-05T16:00:00.000Z'),
        reason: 'Training',
      }),
    ).rejects.toBeInstanceOf(AvailabilityForbiddenError);
  });
});
