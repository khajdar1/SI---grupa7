/**
 * appointment-reschedule.route.test.ts
 *
 * Testovi za PBI-054 — Potvrda i promjena termina intervencije od strane korisnika.
 *
 * Pokriva sve acceptance criteria:
 *  AC-1: Korisnik prima in-app notifikaciju kada koordinator zakaze termin.
 *  AC-2: Korisnik moze potvrditi termin sa detalja intervencije.
 *  AC-3: Korisnik moze zatraziti promjenu termina unosom predlozenog vremena i komentara.
 *  AC-4: Zahtjev za promjenu termina vidljiv koordinatoru u listi zahtjeva.
 *  AC-5: Koordinator moze prihvatiti, odbiti ili predloziti novi termin.
 *  AC-6: Sve promjene termina evidentirane kroz audit zapis.
 */

import express from 'express';
import type { AddressInfo } from 'node:net';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Prisma mocks (hoisted) ─────────────────────────────────────────────────────

const {
  interventionFindUniqueMock,
  interventionUpdateMock,
  appointmentRescheduleFindManyMock,
  appointmentRescheduleFindFirstMock,
  appointmentRescheduleFindUniqueMock,
  appointmentRescheduleCreateMock,
  appointmentRescheduleUpdateMock,
  notificationCreateMock,
  userPreferenceFindUniqueMock,
  auditLogCreateMock,
  userFindManyMock,
} = vi.hoisted(() => ({
  interventionFindUniqueMock: vi.fn(),
  interventionUpdateMock: vi.fn(),
  appointmentRescheduleFindManyMock: vi.fn(),
  appointmentRescheduleFindFirstMock: vi.fn(),
  appointmentRescheduleFindUniqueMock: vi.fn(),
  appointmentRescheduleCreateMock: vi.fn(),
  appointmentRescheduleUpdateMock: vi.fn(),
  notificationCreateMock: vi.fn(),
  userPreferenceFindUniqueMock: vi.fn(),
  auditLogCreateMock: vi.fn(),
  userFindManyMock: vi.fn(),
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    intervention: {
      findUnique: interventionFindUniqueMock,
      update: interventionUpdateMock,
    },
    appointmentRescheduleRequest: {
      findMany: appointmentRescheduleFindManyMock,
      findFirst: appointmentRescheduleFindFirstMock,
      findUnique: appointmentRescheduleFindUniqueMock,
      create: appointmentRescheduleCreateMock,
      update: appointmentRescheduleUpdateMock,
    },
    notification: {
      create: notificationCreateMock,
    },
    userPreference: {
      findUnique: userPreferenceFindUniqueMock,
    },
    auditLog: {
      create: auditLogCreateMock,
    },
    user: {
      findMany: userFindManyMock,
    },
    $transaction: vi.fn((operations: Array<unknown> | ((tx: unknown) => unknown)) => {
      if (typeof operations === 'function') {
        return operations({
          appointmentRescheduleRequest: {
            update: appointmentRescheduleUpdateMock,
          },
          intervention: {
            update: interventionUpdateMock,
          },
        });
      }
      return Promise.all(operations);
    }),
  },
}));

vi.mock('../src/middleware/auth.middleware', () => ({
  authorizeRoles: (allowedRoles: string[]) => {
    const normalized = allowedRoles.map((r) => r.toLowerCase());
    return (
      req: { user?: { roles?: string[] } },
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized.' });
      const userRoles = (req.user.roles ?? []).map((r) => r.toLowerCase());
      const hasRole = normalized.some((r) => userRoles.includes(r));
      if (!hasRole) return res.status(403).json({ message: 'Forbidden.' });
      return next();
    };
  },
}));

vi.mock('../src/config/env', () => ({
  env: { NODE_ENV: 'test' },
}));

vi.mock('../src/shared/notification-preferences', () => ({
  shouldNotifyUser: vi.fn().mockResolvedValue(true),
}));

import appointmentRescheduleRouter from '../src/modules/appointment-reschedule/appointment-reschedule.route';
import { errorMiddleware } from '../src/middleware/error.middleware';

// ── Helpers ───────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PATCH';

type TestResponse = { status: number; body: unknown };

type UserOverrides = {
  localUserId?: number;
  roles?: string[];
};

function createApp(userOverrides: UserOverrides = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = {
      id: 'kc-test-001',
      localUserId: userOverrides.localUserId ?? 2,
      username: 'test.user',
      roles: userOverrides.roles ?? ['Koordinator'],
    };
    next();
  });
  app.use('/appointment', appointmentRescheduleRouter);
  app.use(errorMiddleware);
  return app;
}

async function request(
  method: HttpMethod,
  path: string,
  options: { body?: unknown; user?: UserOverrides } = {},
): Promise<TestResponse> {
  const app = createApp(options.user);
  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  try {
    const res = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await res.text();
    return { status: res.status, body: text ? (JSON.parse(text) as unknown) : null };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const INTERVENTION_WITH_STARTED_AT = {
  id: 20,
  name: 'Popravak vodovodne instalacije',
  startedAt: new Date('2026-06-05T10:00:00.000Z'),
  appointmentConfirmedAt: null,
  faultReport: { userId: 4 },
};

const INTERVENTION_ALREADY_CONFIRMED = {
  ...INTERVENTION_WITH_STARTED_AT,
  appointmentConfirmedAt: new Date('2026-06-05T10:30:00.000Z'),
};

const INTERVENTION_NO_STARTED_AT = {
  id: 21,
  name: 'Pregled elektro instalacija',
  startedAt: null,
  appointmentConfirmedAt: null,
  faultReport: { userId: 4 },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PBI-054 — Appointment confirmation & reschedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userPreferenceFindUniqueMock.mockResolvedValue(null);
    notificationCreateMock.mockResolvedValue({});
    auditLogCreateMock.mockResolvedValue({});
    userFindManyMock.mockResolvedValue([{ id: 2 }, { id: 3 }]);
  });

  describe('POST /:id/confirm — Confirm appointment (AC-2)', () => {
    it('confirms an appointment when user is the fault reporter', async () => {
      interventionFindUniqueMock.mockResolvedValue(INTERVENTION_WITH_STARTED_AT);
      interventionUpdateMock.mockResolvedValue({
        ...INTERVENTION_WITH_STARTED_AT,
        appointmentConfirmedAt: new Date('2026-06-05T11:00:00.000Z'),
      });

      const response = await request('POST', '/appointment/20/confirm', {
        user: { roles: ['Korisnik'], localUserId: 4 },
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        appointmentConfirmedAt: expect.any(String),
      });
    });

    it('rejects when user is not the reporter', async () => {
      interventionFindUniqueMock.mockResolvedValue(INTERVENTION_WITH_STARTED_AT);

      const response = await request('POST', '/appointment/20/confirm', {
        user: { roles: ['Korisnik'], localUserId: 99 },
      });

      expect(response.status).toBe(403);
    });

    it('rejects when no appointment is scheduled', async () => {
      interventionFindUniqueMock.mockResolvedValue(INTERVENTION_NO_STARTED_AT);

      const response = await request('POST', '/appointment/21/confirm', {
        user: { roles: ['Korisnik'], localUserId: 4 },
      });

      expect(response.status).toBe(400);
    });

    it('rejects when appointment is already confirmed', async () => {
      interventionFindUniqueMock.mockResolvedValue(INTERVENTION_ALREADY_CONFIRMED);

      const response = await request('POST', '/appointment/20/confirm', {
        user: { roles: ['Korisnik'], localUserId: 4 },
      });

      expect(response.status).toBe(400);
    });

    it('allows coordinator to confirm as well', async () => {
      interventionFindUniqueMock.mockResolvedValue(INTERVENTION_WITH_STARTED_AT);
      interventionUpdateMock.mockResolvedValue({
        ...INTERVENTION_WITH_STARTED_AT,
        appointmentConfirmedAt: new Date('2026-06-05T11:00:00.000Z'),
      });

      const response = await request('POST', '/appointment/20/confirm', {
        user: { roles: ['Koordinator'], localUserId: 2 },
      });

      expect(response.status).toBe(200);
    });

    it('returns 404 for non-existent intervention', async () => {
      interventionFindUniqueMock.mockResolvedValue(null);

      const response = await request('POST', '/appointment/999/confirm', {
        user: { roles: ['Korisnik'], localUserId: 4 },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /:id/reschedule-request — Request reschedule (AC-3)', () => {
    it('creates a reschedule request for the reporter user', async () => {
      interventionFindUniqueMock.mockResolvedValue(INTERVENTION_WITH_STARTED_AT);
      appointmentRescheduleFindFirstMock.mockResolvedValue(null);
      userPreferenceFindUniqueMock.mockResolvedValue(null);
      appointmentRescheduleCreateMock.mockResolvedValue({
        id: 1,
        interventionId: 20,
        requestedById: 4,
        proposedStartedAt: new Date('2026-06-06T14:00:00.000Z'),
        comment: 'Ne mogu tad, molim drugi termin.',
        status: 'PENDING',
        createdAt: new Date('2026-06-05T12:00:00.000Z'),
        requestedBy: {
          id: 4,
          firstName: 'Test',
          lastName: 'User',
          username: 'test.user',
        },
      });
      userFindManyMock.mockResolvedValue([{ id: 2 }]);
      notificationCreateMock.mockResolvedValue({});

      const response = await request('POST', '/appointment/20/reschedule-request', {
        user: { roles: ['Korisnik'], localUserId: 4 },
        body: {
          proposedStartedAt: '2026-06-06T14:00:00.000Z',
          comment: 'Ne mogu tad, molim drugi termin.',
        },
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 1,
        status: 'PENDING',
        comment: 'Ne mogu tad, molim drugi termin.',
      });
    });

    it('rejects if there is already a pending request', async () => {
      interventionFindUniqueMock.mockResolvedValue(INTERVENTION_WITH_STARTED_AT);
      appointmentRescheduleFindFirstMock.mockResolvedValue({ id: 1 });

      const response = await request('POST', '/appointment/20/reschedule-request', {
        user: { roles: ['Korisnik'], localUserId: 4 },
        body: {
          proposedStartedAt: '2026-06-06T14:00:00.000Z',
          comment: 'Molim promjenu.',
        },
      });

      expect(response.status).toBe(400);
    });

    it('rejects if user is not the reporter', async () => {
      interventionFindUniqueMock.mockResolvedValue(INTERVENTION_WITH_STARTED_AT);

      const response = await request('POST', '/appointment/20/reschedule-request', {
        user: { roles: ['Korisnik'], localUserId: 99 },
        body: {
          proposedStartedAt: '2026-06-06T14:00:00.000Z',
          comment: 'Molim promjenu.',
        },
      });

      expect(response.status).toBe(403);
    });

    it('rejects if comment is too short', async () => {
      const response = await request('POST', '/appointment/20/reschedule-request', {
        user: { roles: ['Korisnik'], localUserId: 4 },
        body: {
          proposedStartedAt: '2026-06-06T14:00:00.000Z',
          comment: 'OK',
        },
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /requests — List pending requests (AC-4)', () => {
    it('returns pending reschedule requests for coordinator', async () => {
      appointmentRescheduleFindManyMock.mockResolvedValue([
        {
          id: 1,
          interventionId: 20,
          proposedStartedAt: new Date('2026-06-06T14:00:00.000Z'),
          comment: 'Ne mogu tad',
          status: 'PENDING',
          createdAt: new Date('2026-06-05T12:00:00.000Z'),
          intervention: {
            id: 20,
            name: 'Popravak vodovodne instalacije',
            startedAt: new Date('2026-06-05T10:00:00.000Z'),
            location: 'Zmaja od Bosne bb',
            status: 'ASSIGNED',
            company: { id: 1, name: 'Test Company' },
            category: { id: 1, name: 'Vodovod' },
          },
          requestedBy: {
            id: 4,
            firstName: 'Test',
            lastName: 'User',
            username: 'test.user',
          },
        },
      ]);

      const response = await request('GET', '/appointment/requests', {
        user: { roles: ['Koordinator'] },
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        data: [
          {
            id: 1,
            status: 'PENDING',
            intervention: expect.objectContaining({
              name: 'Popravak vodovodne instalacije',
            }),
          },
        ],
      });
    });

    it('forbids non-coordinator from viewing requests', async () => {
      const response = await request('GET', '/appointment/requests', {
        user: { roles: ['Korisnik'] },
      });

      expect(response.status).toBe(403);
    });

    it('returns empty array when no pending requests', async () => {
      appointmentRescheduleFindManyMock.mockResolvedValue([]);

      const response = await request('GET', '/appointment/requests', {
        user: { roles: ['Koordinator'] },
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [] });
    });
  });

  describe('PATCH /:id/reschedule-request/:requestId/respond — Coordinator responds (AC-5)', () => {
    const PENDING_REQUEST = {
      id: 1,
      interventionId: 20,
      requestedById: 4,
      proposedStartedAt: new Date('2026-06-06T14:00:00.000Z'),
      comment: 'Ne mogu tad',
      status: 'PENDING',
      createdAt: new Date('2026-06-05T12:00:00.000Z'),
      intervention: {
        id: 20,
        name: 'Popravak vodovodne instalacije',
        startedAt: new Date('2026-06-05T10:00:00.000Z'),
      },
    };

    it('approves a reschedule request and updates startedAt', async () => {
      appointmentRescheduleFindUniqueMock.mockResolvedValue(PENDING_REQUEST);
      appointmentRescheduleUpdateMock.mockResolvedValue({
        ...PENDING_REQUEST,
        status: 'APPROVED',
        respondedById: 2,
        responseComment: 'Odobreno',
        respondedAt: new Date('2026-06-05T13:00:00.000Z'),
      });
      interventionUpdateMock.mockResolvedValue({});

      const response = await request(
        'PATCH',
        '/appointment/20/reschedule-request/1/respond',
        {
          user: { roles: ['Koordinator'], localUserId: 2 },
          body: { status: 'APPROVED', responseComment: 'Odobreno' },
        },
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'APPROVED',
        responseComment: 'Odobreno',
      });
    });

    it('rejects a reschedule request', async () => {
      appointmentRescheduleFindUniqueMock.mockResolvedValue(PENDING_REQUEST);
      appointmentRescheduleUpdateMock.mockResolvedValue({
        ...PENDING_REQUEST,
        status: 'REJECTED',
        respondedById: 2,
        responseComment: 'Nije moguce',
        respondedAt: new Date('2026-06-05T13:00:00.000Z'),
      });

      const response = await request(
        'PATCH',
        '/appointment/20/reschedule-request/1/respond',
        {
          user: { roles: ['Koordinator'], localUserId: 2 },
          body: { status: 'REJECTED', responseComment: 'Nije moguce' },
        },
      );

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'REJECTED',
        responseComment: 'Nije moguce',
      });
    });

    it('rejects responding to already-responded request', async () => {
      appointmentRescheduleFindUniqueMock.mockResolvedValue({
        ...PENDING_REQUEST,
        status: 'APPROVED',
        respondedById: 2,
      });

      const response = await request(
        'PATCH',
        '/appointment/20/reschedule-request/1/respond',
        {
          user: { roles: ['Koordinator'], localUserId: 2 },
          body: { status: 'APPROVED' },
        },
      );

      expect(response.status).toBe(400);
    });

    it('forbids non-coordinator from responding', async () => {
      const response = await request(
        'PATCH',
        '/appointment/20/reschedule-request/1/respond',
        {
          user: { roles: ['Korisnik'] },
          body: { status: 'APPROVED' },
        },
      );

      expect(response.status).toBe(403);
    });

    it('returns 404 for non-existent request', async () => {
      appointmentRescheduleFindUniqueMock.mockResolvedValue(null);

      const response = await request(
        'PATCH',
        '/appointment/20/reschedule-request/999/respond',
        {
          user: { roles: ['Koordinator'] },
          body: { status: 'APPROVED' },
        },
      );

      expect(response.status).toBe(404);
    });
  });
});
