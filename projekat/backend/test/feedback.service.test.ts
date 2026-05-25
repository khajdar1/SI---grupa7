import { InterventionStatus } from '@prisma/client';
import { describe, expect, test, vi } from 'vitest';

import {
  FeedbackService,
  type FeedbackInterventionRecord,
  type FeedbackRecord,
  type FeedbackRepository,
} from '../src/modules/feedback/feedback.service';
import { ConflictError, ForbiddenError, NotFoundError } from '../src/shared/errors';

const REPORTER_ID = 11;
const COORDINATOR_ID = 3;

function makeIntervention(
  overrides: Partial<FeedbackInterventionRecord> = {},
): FeedbackInterventionRecord {
  return {
    id: 42,
    status: InterventionStatus.RESOLVED,
    faultReport: { userId: REPORTER_ID },
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<FeedbackRecord> = {}): FeedbackRecord {
  return {
    id: 1,
    interventionId: 42,
    userId: REPORTER_ID,
    rating: 5,
    comment: 'Very professional service.',
    createdAt: new Date('2026-05-22T12:00:00.000Z'),
    user: {
      id: REPORTER_ID,
      firstName: 'Amina',
      lastName: 'Korisnik',
      username: 'amina.korisnik',
    },
    ...overrides,
  };
}

function makeRepository(overrides: Partial<FeedbackRepository> = {}): FeedbackRepository {
  return {
    findInterventionById: vi.fn().mockResolvedValue(makeIntervention()),
    findByInterventionId: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeFeedback()),
    ...overrides,
  };
}

describe('FeedbackService.create', () => {
  test('allows the reporting user to submit feedback for a resolved intervention', async () => {
    const repo = makeRepository();
    const service = new FeedbackService(repo);

    const result = await service.create(42, REPORTER_ID, {
      rating: 5,
      comment: 'Great work.',
    });

    expect(result.rating).toBe(5);
    expect(repo.create).toHaveBeenCalledWith(42, REPORTER_ID, {
      rating: 5,
      comment: 'Great work.',
    });
  });

  test('rejects feedback when intervention is not resolved', async () => {
    const service = new FeedbackService(
      makeRepository({
        findInterventionById: vi.fn().mockResolvedValue(
          makeIntervention({ status: InterventionStatus.IN_PROGRESS }),
        ),
      }),
    );

    await expect(
      service.create(42, REPORTER_ID, { rating: 4, comment: null }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('rejects feedback from a user who did not report the fault', async () => {
    const service = new FeedbackService(makeRepository());

    await expect(
      service.create(42, 99, { rating: 4, comment: null }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('rejects duplicate feedback for the same intervention', async () => {
    const service = new FeedbackService(
      makeRepository({
        findByInterventionId: vi.fn().mockResolvedValue(makeFeedback()),
      }),
    );

    await expect(
      service.create(42, REPORTER_ID, { rating: 4, comment: null }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test('throws NotFoundError when intervention does not exist', async () => {
    const service = new FeedbackService(
      makeRepository({
        findInterventionById: vi.fn().mockResolvedValue(null),
      }),
    );

    await expect(
      service.create(999, REPORTER_ID, { rating: 4, comment: null }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('FeedbackService.getByInterventionId', () => {
  test('allows coordinator or admin viewer to read feedback', async () => {
    const feedback = makeFeedback();
    const service = new FeedbackService(
      makeRepository({
        findByInterventionId: vi.fn().mockResolvedValue(feedback),
      }),
    );

    await expect(
      service.getByInterventionId(42, {
        userId: COORDINATOR_ID,
        canManageFeedback: true,
      }),
    ).resolves.toEqual(feedback);
  });

  test('allows reporting user to read their own feedback state', async () => {
    const feedback = makeFeedback();
    const service = new FeedbackService(
      makeRepository({
        findByInterventionId: vi.fn().mockResolvedValue(feedback),
      }),
    );

    await expect(
      service.getByInterventionId(42, {
        userId: REPORTER_ID,
        canManageFeedback: false,
      }),
    ).resolves.toEqual(feedback);
  });

  test('does not expose feedback to another regular user', async () => {
    const service = new FeedbackService(
      makeRepository({
        findByInterventionId: vi.fn().mockResolvedValue(makeFeedback()),
      }),
    );

    await expect(
      service.getByInterventionId(42, {
        userId: 77,
        canManageFeedback: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
