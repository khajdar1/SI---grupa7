import express from 'express';
import type { AddressInfo } from 'node:net';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InterventionStatus } from '@prisma/client';

const {
  interventionFindFirstMock,
  interventionFindUniqueMock,
  interventionUpdateMock,
  reopenFindManyMock,
  reopenFindUniqueMock,
  reopenFindFirstMock,
  reopenCreateMock,
  reopenUpdateMock,
  assignmentFindManyMock,
  statusHistoryCreateMock,
  notificationCreateMock,
  userFindFirstMock,
  userFindManyMock,
  auditRecordMock,
} = vi.hoisted(() => ({
  interventionFindFirstMock: vi.fn(),
  interventionFindUniqueMock: vi.fn(),
  interventionUpdateMock: vi.fn(),
  reopenFindManyMock: vi.fn(),
  reopenFindUniqueMock: vi.fn(),
  reopenFindFirstMock: vi.fn(),
  reopenCreateMock: vi.fn(),
  reopenUpdateMock: vi.fn(),
  assignmentFindManyMock: vi.fn(),
  statusHistoryCreateMock: vi.fn(),
  notificationCreateMock: vi.fn(),
  userFindFirstMock: vi.fn(),
  userFindManyMock: vi.fn(),
  auditRecordMock: vi.fn(),
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    intervention: {
      findFirst: interventionFindFirstMock,
      findUnique: interventionFindUniqueMock,
      update: interventionUpdateMock,
    },
    interventionReopenRequest: {
      findMany: reopenFindManyMock,
      findUnique: reopenFindUniqueMock,
      findFirst: reopenFindFirstMock,
      create: reopenCreateMock,
      update: reopenUpdateMock,
    },
    assignment: {
      findMany: assignmentFindManyMock,
    },
    statusHistory: {
      create: statusHistoryCreateMock,
    },
    notification: {
      create: notificationCreateMock,
    },
    user: {
      findFirst: userFindFirstMock,
      findMany: userFindManyMock,
    },
    $transaction: vi.fn(async (callback: any) =>
      callback({
        interventionReopenRequest: {
          update: reopenUpdateMock,
        },
        intervention: {
          update: interventionUpdateMock,
        },
        statusHistory: {
          create: statusHistoryCreateMock,
        },
      }),
    ),
  },
}));

vi.mock('../src/middleware/auth.middleware', () => ({
  authorizeRoles: (allowedRoles: string[]) => {
    const allowed = allowedRoles.map((role) => role.toLowerCase());
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const actual = (req.user?.roles ?? []).map((role) => role.toLowerCase());
      if (!actual.some((role) => allowed.includes(role))) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
      return next();
    };
  },
}));

vi.mock('../src/shared/audit.service', () => ({
  AuditService: {
    record: auditRecordMock,
  },
}));

vi.mock('../src/shared/notification-preferences', () => ({
  shouldNotifyUser: vi.fn().mockResolvedValue(true),
  getActiveUserIdsByKeycloakRole: vi.fn().mockResolvedValue([3, 4]),
}));

import interventionsRouter from '../src/modules/interventions/interventions.route';
import { AppError } from '../src/shared/errors';

type HttpMethod = 'GET' | 'POST' | 'PATCH';

const resolvedIntervention = {
  id: 42,
  name: 'Popravak lifta',
  status: InterventionStatus.RESOLVED,
  faultReport: { userId: 10 },
};

const pendingReopenRequest = {
  id: 7,
  interventionId: 42,
  requesterId: 10,
  reason: 'Kvar se ponovio nakon zatvaranja.',
  comment: 'Lift ponovo staje između spratova.',
  status: 'PENDING',
  createdAt: new Date('2026-06-07T12:00:00.000Z'),
  resolvedAt: null,
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = {
      id: req.header('x-test-user-id') ?? 'kc-user-001',
      localUserId: Number(req.header('x-test-local-user-id') ?? '10'),
      username: req.header('x-test-username') ?? 'korisnik1',
      roles: (req.header('x-test-roles') ?? 'Korisnik').split(',').map((role) => role.trim()),
    };
    next();
  });
  app.use('/interventions', interventionsRouter);
  app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: { code: error.code, message: error.message },
        path: req.originalUrl,
      });
    }
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unexpected test error' });
  });
  return app;
}

async function request(
  method: HttpMethod,
  path: string,
  options: { body?: unknown; roles?: string[]; localUserId?: number; username?: string } = {},
) {
  const server = createApp().listen(0);
  const address = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-test-roles': (options.roles ?? ['Korisnik']).join(','),
        'x-test-local-user-id': String(options.localUserId ?? 10),
        'x-test-username': options.username ?? 'korisnik1',
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

describe('Final integration - PBI-059 reopen requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    interventionFindFirstMock.mockResolvedValue({ id: 42 });
    interventionFindUniqueMock.mockResolvedValue(resolvedIntervention);
    reopenFindFirstMock.mockResolvedValue(null);
    reopenCreateMock.mockResolvedValue(pendingReopenRequest);
    reopenFindUniqueMock.mockResolvedValue(pendingReopenRequest);
    reopenFindManyMock.mockResolvedValue([
      {
        ...pendingReopenRequest,
        intervention: { id: 42, name: 'Popravak lifta', status: InterventionStatus.RESOLVED },
        requester: { id: 10, firstName: 'Korisnik', lastName: 'Jedan', username: 'korisnik1' },
      },
    ]);
    reopenUpdateMock.mockResolvedValue({ ...pendingReopenRequest, status: 'APPROVED' });
    interventionUpdateMock.mockResolvedValue({ id: 42, status: InterventionStatus.ASSIGNED });
    statusHistoryCreateMock.mockResolvedValue({});
    notificationCreateMock.mockResolvedValue({});
    userFindFirstMock.mockResolvedValue({ id: 10, username: 'korisnik1' });
    userFindManyMock.mockResolvedValue([{ id: 3 }, { id: 4 }]);
    assignmentFindManyMock.mockResolvedValue([{ userId: 12 }, { userId: 13 }]);
    auditRecordMock.mockResolvedValue(undefined);
  });

  it('creates a reopen request only for the reporting user on a resolved intervention', async () => {
    const response = await request('POST', '/interventions/42/reopen-request', {
      body: {
        reason: 'Kvar se ponovio nakon zatvaranja.',
        comment: 'Lift ponovo staje između spratova.',
      },
    });

    expect(response.status).toBe(201);
    expect(reopenCreateMock).toHaveBeenCalledWith({
      data: {
        interventionId: 42,
        requesterId: 10,
        reason: 'Kvar se ponovio nakon zatvaranja.',
        comment: 'Lift ponovo staje između spratova.',
      },
    });
    expect(auditRecordMock).toHaveBeenCalledWith(expect.objectContaining({ action: 'REOPEN_REQUEST_CREATED' }));
    expect(notificationCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'REOPEN_REQUEST' }),
    }));
  });

  it('rejects duplicate active reopen requests', async () => {
    reopenFindFirstMock.mockResolvedValue({ id: 99 });

    const response = await request('POST', '/interventions/42/reopen-request', {
      body: {
        reason: 'Kvar se ponovio.',
      },
    });

    expect(response.status).toBe(400);
    expect(reopenCreateMock).not.toHaveBeenCalled();
  });

  it('lists reopen requests for coordinator roles', async () => {
    const response = await request('GET', '/interventions/reopen-requests', {
      roles: ['Koordinator'],
      localUserId: 3,
      username: 'koordinator1',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 7,
        intervention: expect.objectContaining({ name: 'Popravak lifta' }),
      }),
    ]));
  });

  it('approves a pending reopen request and returns the intervention to active work', async () => {
    const response = await request('PATCH', '/interventions/reopen-requests/7/approve', {
      roles: ['Koordinator'],
      localUserId: 3,
      username: 'koordinator1',
    });

    expect(response.status).toBe(200);
    expect(interventionUpdateMock).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { status: InterventionStatus.ASSIGNED },
    });
    expect(statusHistoryCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        interventionId: 42,
        oldStatus: InterventionStatus.RESOLVED,
        newStatus: InterventionStatus.ASSIGNED,
      }),
    });
    expect(auditRecordMock).toHaveBeenCalledWith(expect.objectContaining({ action: 'REOPEN_REQUEST_APPROVED' }));
  });

  it('rejects a pending reopen request with coordinator comment', async () => {
    const response = await request('PATCH', '/interventions/reopen-requests/7/reject', {
      roles: ['Koordinator'],
      localUserId: 3,
      username: 'koordinator1',
      body: { coordinatorComment: 'Problem nije potvrđen nakon provjere.' },
    });

    expect(response.status).toBe(200);
    expect(reopenUpdateMock).toHaveBeenCalledWith({
      where: { id: 7 },
      data: expect.objectContaining({
        status: 'REJECTED',
        coordinatorComment: 'Problem nije potvrđen nakon provjere.',
      }),
    });
    expect(notificationCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'REOPEN_REJECTED', userId: 10 }),
    }));
    expect(auditRecordMock).toHaveBeenCalledWith(expect.objectContaining({ action: 'REOPEN_REQUEST_REJECTED' }));
  });
});
