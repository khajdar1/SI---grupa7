import express from 'express';
import type { AddressInfo } from 'node:net';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InterventionStatus } from '@prisma/client';

const {
  interventionFindUniqueMock,
  feedbackFindUniqueMock,
  feedbackCreateMock,
} = vi.hoisted(() => ({
  interventionFindUniqueMock: vi.fn(),
  feedbackFindUniqueMock: vi.fn(),
  feedbackCreateMock: vi.fn(),
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    intervention: {
      findUnique: interventionFindUniqueMock,
    },
    feedback: {
      findUnique: feedbackFindUniqueMock,
      create: feedbackCreateMock,
    },
  },
}));

import feedbackRouter from '../src/modules/feedback/feedback.route';
import { AppError } from '../src/shared/errors';

type HttpMethod = 'GET' | 'POST';

function makeFeedback(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    interventionId: 42,
    userId: 10,
    rating: 5,
    comment: 'Great service.',
    createdAt: new Date('2026-05-22T12:00:00.000Z'),
    user: {
      id: 10,
      firstName: 'Amina',
      lastName: 'Korisnik',
      username: 'amina.korisnik',
    },
    ...overrides,
  };
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = {
      id: 'kc-user-001',
      localUserId: Number(req.header('x-test-local-user-id') ?? '10'),
      username: req.header('x-test-username') ?? 'amina.korisnik',
      roles: (req.header('x-test-roles') ?? 'Korisnik')
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean),
    };
    next();
  });
  app.use('/feedback', feedbackRouter);
  app.use(
    (
      error: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            ...(error.fields ? { fields: error.fields } : {}),
          },
          path: req.originalUrl,
        });
      }

      return res.status(500).json({ message: 'Unexpected test error' });
    },
  );

  return app;
}

async function request(
  method: HttpMethod,
  path: string,
  options: { body?: unknown; roles?: string[]; localUserId?: number } = {},
) {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-test-roles': (options.roles ?? ['Korisnik']).join(','),
        'x-test-local-user-id': String(options.localUserId ?? 10),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();

    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe('feedback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    interventionFindUniqueMock.mockResolvedValue({
      id: 42,
      status: InterventionStatus.RESOLVED,
      faultReport: { userId: 10 },
    });
    feedbackFindUniqueMock.mockResolvedValue(null);
    feedbackCreateMock.mockResolvedValue(makeFeedback());
  });

  it('creates feedback for the reporting user', async () => {
    const response = await request('POST', '/feedback/42', {
      body: { rating: 5, comment: 'Great service.' },
    });

    expect(response.status).toBe(201);
    expect(feedbackCreateMock).toHaveBeenCalledWith({
      data: {
        interventionId: 42,
        userId: 10,
        rating: 5,
        comment: 'Great service.',
      },
      select: expect.any(Object),
    });
    expect(response.body).toMatchObject({ rating: 5, comment: 'Great service.' });
  });

  it('rejects rating outside the allowed 1-5 range', async () => {
    const response = await request('POST', '/feedback/42', {
      body: { rating: 6, comment: null },
    });

    expect(response.status).toBe(400);
    expect(feedbackCreateMock).not.toHaveBeenCalled();
  });

  it('rejects feedback before the intervention is resolved', async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 42,
      status: InterventionStatus.IN_PROGRESS,
      faultReport: { userId: 10 },
    });

    const response = await request('POST', '/feedback/42', {
      body: { rating: 4, comment: null },
    });

    expect(response.status).toBe(403);
  });

  it('allows coordinator to read feedback for an intervention', async () => {
    feedbackFindUniqueMock.mockResolvedValue(makeFeedback());

    const response = await request('GET', '/feedback/42', {
      roles: ['Koordinator'],
      localUserId: 3,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ userId: 10, rating: 5 });
  });

  it('does not expose feedback to another regular user', async () => {
    feedbackFindUniqueMock.mockResolvedValue(makeFeedback());

    const response = await request('GET', '/feedback/42', {
      localUserId: 99,
    });

    expect(response.status).toBe(403);
  });
});
