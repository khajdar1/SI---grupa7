import { InterventionStatus, ReportStatus } from '@prisma/client';
import { describe, expect, test, vi } from 'vitest';

import { ForbiddenError, NotFoundError } from '../src/shared/errors';
import {
  ReportService,
  REPORT_ALLOWED_STATUSES,
  type CreateReportInput,
  type IReportRepository,
  type InterventionStatusRecord,
  type ReportRecord,
} from '../src/services/reports.service';

const MOCK_AUTHOR = {
  id: 10,
  firstName: 'Amir',
  lastName: 'Servis',
  username: 'amir.servis',
};

function makeReport(overrides: Partial<ReportRecord> = {}): ReportRecord {
  return {
    id: 1,
    interventionId: 42,
    authorId: MOCK_AUTHOR.id,
    description: 'Replaced the faulty component.',
    material: null,
    notes: null,
    reportDate: new Date('2026-01-15T10:00:00Z'),
    status: ReportStatus.DRAFT,
    isRecommended: false,
    recommendedAt: null,
    recommendedById: null,
    author: MOCK_AUTHOR,
    ...overrides,
  };
}

function makeIntervention(
  status: InterventionStatus = InterventionStatus.IN_PROGRESS,
): InterventionStatusRecord {
  return { id: 42, status };
}

function makeValidInput(overrides: Partial<CreateReportInput> = {}): CreateReportInput {
  return {
    description: 'Replaced the faulty component.',
    material: null,
    notes: null,
    ...overrides,
  };
}

function makeRepository(overrides: Partial<IReportRepository> = {}): IReportRepository {
  return {
    findInterventionById: vi.fn().mockResolvedValue(makeIntervention()),
    findByInterventionId: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    isUserAssignedToIntervention: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(makeReport()),
    update: vi.fn().mockResolvedValue(makeReport()),
    finalizeReport: vi.fn().mockResolvedValue(makeReport({ status: ReportStatus.FINALIZED })),
    setRecommendation: vi.fn().mockResolvedValue(
      makeReport({
        status: ReportStatus.FINALIZED,
        isRecommended: true,
        recommendedAt: new Date('2026-01-16T10:00:00Z'),
        recommendedById: 11,
      }),
    ),
    ...overrides,
  };
}

describe('REPORT_ALLOWED_STATUSES', () => {
  test('allows IN_PROGRESS status', () => {
    expect(REPORT_ALLOWED_STATUSES.has(InterventionStatus.IN_PROGRESS)).toBe(true);
  });

  test('allows RESOLVED status', () => {
    expect(REPORT_ALLOWED_STATUSES.has(InterventionStatus.RESOLVED)).toBe(true);
  });

  test('does not allow NEW status', () => {
    expect(REPORT_ALLOWED_STATUSES.has(InterventionStatus.NEW)).toBe(false);
  });

  test('does not allow ASSIGNED status', () => {
    expect(REPORT_ALLOWED_STATUSES.has(InterventionStatus.ASSIGNED)).toBe(false);
  });

  test('does not allow CANCELLED status', () => {
    expect(REPORT_ALLOWED_STATUSES.has(InterventionStatus.CANCELLED)).toBe(false);
  });
});

describe('ReportService.getByInterventionId', () => {
  test('returns null when intervention exists but has no report', async () => {
    const repo = makeRepository({ findByInterventionId: vi.fn().mockResolvedValue(null) });
    const service = new ReportService(repo);

    const result = await service.getByInterventionId(42);

    expect(result).toBeNull();
    expect(repo.findInterventionById).toHaveBeenCalledWith(42);
  });

  test('returns the report when it exists', async () => {
    const report = makeReport();
    const repo = makeRepository({ findByInterventionId: vi.fn().mockResolvedValue(report) });
    const service = new ReportService(repo);

    expect(await service.getByInterventionId(42)).toEqual(report);
  });

  test('throws NotFoundError when intervention does not exist', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(null),
    });
    const service = new ReportService(repo);

    await expect(service.getByInterventionId(999)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ReportService.create', () => {
  test('creates a report successfully for IN_PROGRESS intervention', async () => {
    const report = makeReport();
    const repo = makeRepository({ create: vi.fn().mockResolvedValue(report) });
    const service = new ReportService(repo);

    const result = await service.create(42, MOCK_AUTHOR.id, makeValidInput());

    expect(result).toEqual(report);
    expect(repo.create).toHaveBeenCalledWith(42, MOCK_AUTHOR.id, makeValidInput());
  });

  test('creates a report successfully for RESOLVED intervention', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(
        makeIntervention(InterventionStatus.RESOLVED),
      ),
      create: vi.fn().mockResolvedValue(makeReport()),
    });
    const service = new ReportService(repo);

    await expect(service.create(42, MOCK_AUTHOR.id, makeValidInput())).resolves.toBeDefined();
  });

  test('throws ForbiddenError when intervention is in NEW status', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(makeIntervention(InterventionStatus.NEW)),
    });

    await expect(
      new ReportService(repo).create(42, MOCK_AUTHOR.id, makeValidInput()),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('throws ForbiddenError when intervention is in ASSIGNED status', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(
        makeIntervention(InterventionStatus.ASSIGNED),
      ),
    });

    await expect(
      new ReportService(repo).create(42, MOCK_AUTHOR.id, makeValidInput()),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('throws ForbiddenError when intervention is in CANCELLED status', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(
        makeIntervention(InterventionStatus.CANCELLED),
      ),
    });

    await expect(
      new ReportService(repo).create(42, MOCK_AUTHOR.id, makeValidInput()),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('throws NotFoundError when intervention does not exist', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(null),
    });

    await expect(
      new ReportService(repo).create(999, MOCK_AUTHOR.id, makeValidInput()),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('throws ForbiddenError when a report already exists for the intervention', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(makeReport()),
    });

    await expect(
      new ReportService(repo).create(42, MOCK_AUTHOR.id, makeValidInput()),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('does not call create when report already exists', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(makeReport()),
    });
    const service = new ReportService(repo);

    await service.create(42, MOCK_AUTHOR.id, makeValidInput()).catch(() => undefined);

    expect(repo.create).not.toHaveBeenCalled();
  });

  test('throws ForbiddenError when author is not assigned to the intervention', async () => {
    const repo = makeRepository({
      isUserAssignedToIntervention: vi.fn().mockResolvedValue(false),
    });

    await expect(
      new ReportService(repo).create(42, MOCK_AUTHOR.id, makeValidInput()),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('does not call create when author is not assigned', async () => {
    const repo = makeRepository({
      isUserAssignedToIntervention: vi.fn().mockResolvedValue(false),
    });
    const service = new ReportService(repo);

    await service.create(42, MOCK_AUTHOR.id, makeValidInput()).catch(() => undefined);

    expect(repo.create).not.toHaveBeenCalled();
  });

  test('stores optional fields when provided', async () => {
    const input: CreateReportInput = {
      description: 'Full repair done.',
      material: 'Pipe, wrench',
      notes: 'Recommend follow-up in 30 days.',
    };
    const report = makeReport({ ...input });
    const repo = makeRepository({ create: vi.fn().mockResolvedValue(report) });

    const result = await new ReportService(repo).create(42, MOCK_AUTHOR.id, input);

    expect(result.material).toBe(input.material);
    expect(result.notes).toBe(input.notes);
  });

  test('passes null for optional fields when not provided', async () => {
    const input = makeValidInput({ material: null, notes: null });
    const repo = makeRepository();

    await new ReportService(repo).create(42, MOCK_AUTHOR.id, input);

    expect(repo.create).toHaveBeenCalledWith(
      42,
      MOCK_AUTHOR.id,
      expect.objectContaining({ material: null, notes: null }),
    );
  });
});

describe('ReportService.update', () => {
  test('updates an existing report successfully', async () => {
    const updated = makeReport({ description: 'Updated description.' });
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(makeReport()),
      update: vi.fn().mockResolvedValue(updated),
    });

    const result = await new ReportService(repo).update(42, MOCK_AUTHOR.id, {
      description: 'Updated description.',
    });

    expect(result.description).toBe('Updated description.');
    expect(repo.update).toHaveBeenCalledWith(makeReport().id, {
      description: 'Updated description.',
    });
  });

  test('throws NotFoundError when intervention does not exist', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(null),
    });

    await expect(
      new ReportService(repo).update(999, MOCK_AUTHOR.id, { description: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('throws ForbiddenError when intervention status does not allow updates', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(makeIntervention(InterventionStatus.NEW)),
      findByInterventionId: vi.fn().mockResolvedValue(makeReport()),
    });

    await expect(
      new ReportService(repo).update(42, MOCK_AUTHOR.id, { description: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('throws NotFoundError when no report exists for the intervention', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(null),
    });

    await expect(
      new ReportService(repo).update(42, MOCK_AUTHOR.id, { description: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('throws ForbiddenError when report is already finalized', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(
        makeReport({ status: ReportStatus.FINALIZED }),
      ),
    });

    await expect(
      new ReportService(repo).update(42, MOCK_AUTHOR.id, { description: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('does not call repository update when report is finalized', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(
        makeReport({ status: ReportStatus.FINALIZED }),
      ),
    });
    const service = new ReportService(repo);

    await service.update(42, MOCK_AUTHOR.id, { description: 'x' }).catch(() => undefined);

    expect(repo.update).not.toHaveBeenCalled();
  });

  test('throws ForbiddenError when updater is not assigned to the intervention', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(makeReport()),
      isUserAssignedToIntervention: vi.fn().mockResolvedValue(false),
    });

    await expect(
      new ReportService(repo).update(42, MOCK_AUTHOR.id, { description: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('does not call repository update when updater is not assigned', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(makeReport()),
      isUserAssignedToIntervention: vi.fn().mockResolvedValue(false),
    });
    const service = new ReportService(repo);

    await service.update(42, MOCK_AUTHOR.id, { description: 'x' }).catch(() => undefined);

    expect(repo.update).not.toHaveBeenCalled();
  });

  test('allows partial update with only description', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(makeReport()),
      update: vi.fn().mockResolvedValue(makeReport({ description: 'New desc.' })),
    });

    await new ReportService(repo).update(42, MOCK_AUTHOR.id, { description: 'New desc.' });

    expect(repo.update).toHaveBeenCalledWith(1, { description: 'New desc.' });
  });

  test('allows nullifying optional fields', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(makeReport()),
      update: vi.fn().mockResolvedValue(makeReport({ notes: null })),
    });

    await new ReportService(repo).update(42, MOCK_AUTHOR.id, { notes: null });

    expect(repo.update).toHaveBeenCalledWith(1, { notes: null });
  });
});

describe('ReportService.finalize', () => {
  test('finalizes a draft report successfully', async () => {
    const finalizedReport = makeReport({ status: ReportStatus.FINALIZED });
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(makeReport()),
      finalizeReport: vi.fn().mockResolvedValue(finalizedReport),
    });

    const result = await new ReportService(repo).finalize(42);

    expect(result.status).toBe(ReportStatus.FINALIZED);
    expect(repo.finalizeReport).toHaveBeenCalledWith(makeReport().id);
  });

  test('returns existing report without calling finalizeReport when already finalized', async () => {
    const alreadyFinalized = makeReport({ status: ReportStatus.FINALIZED });
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(alreadyFinalized),
    });

    const result = await new ReportService(repo).finalize(42);

    expect(result.status).toBe(ReportStatus.FINALIZED);
    expect(repo.finalizeReport).not.toHaveBeenCalled();
  });

  test('throws NotFoundError when intervention does not exist', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(null),
    });

    await expect(new ReportService(repo).finalize(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  test('throws NotFoundError when no report exists for the intervention', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(null),
    });

    await expect(new ReportService(repo).finalize(42)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ReportService.setRecommendation', () => {
  test('marks a finalized report as recommended', async () => {
    const finalized = makeReport({ status: ReportStatus.FINALIZED });
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(finalized),
    });

    const result = await new ReportService(repo).setRecommendation(42, 11, true);

    expect(result.isRecommended).toBe(true);
    expect(repo.setRecommendation).toHaveBeenCalledWith(finalized.id, true, 11);
  });

  test('removes recommendation from a finalized report', async () => {
    const finalized = makeReport({
      status: ReportStatus.FINALIZED,
      isRecommended: true,
      recommendedAt: new Date('2026-01-16T10:00:00Z'),
      recommendedById: 11,
    });
    const updated = makeReport({
      status: ReportStatus.FINALIZED,
      isRecommended: false,
      recommendedAt: null,
      recommendedById: null,
    });
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(finalized),
      setRecommendation: vi.fn().mockResolvedValue(updated),
    });

    const result = await new ReportService(repo).setRecommendation(42, 11, false);

    expect(result.isRecommended).toBe(false);
    expect(repo.setRecommendation).toHaveBeenCalledWith(finalized.id, false, 11);
  });

  test('throws NotFoundError when intervention does not exist', async () => {
    const repo = makeRepository({
      findInterventionById: vi.fn().mockResolvedValue(null),
    });

    await expect(
      new ReportService(repo).setRecommendation(999, 11, true),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('throws NotFoundError when report does not exist', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(null),
    });

    await expect(
      new ReportService(repo).setRecommendation(42, 11, true),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('throws ForbiddenError for draft reports', async () => {
    const repo = makeRepository({
      findByInterventionId: vi.fn().mockResolvedValue(makeReport({ status: ReportStatus.DRAFT })),
    });

    await expect(
      new ReportService(repo).setRecommendation(42, 11, true),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repo.setRecommendation).not.toHaveBeenCalled();
  });
});
