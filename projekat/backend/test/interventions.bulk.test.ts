import express from 'express';
import type { AddressInfo } from 'node:net';
import assert from 'node:assert/strict';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { InterventionStatus } from '@prisma/client';

const {
  interventionFindManyMock,
  interventionUpdateMock,
  statusHistoryCreateMock,
  assignmentFindFirstMock,
  assignmentCreateMock,
  userFindUniqueMock,
  userFindFirstMock,
  transactionMock,
  auditLogMock,
} = vi.hoisted(() => ({
  interventionFindManyMock: vi.fn(),
  interventionUpdateMock: vi.fn(),
  statusHistoryCreateMock: vi.fn(),
  assignmentFindFirstMock: vi.fn(),
  assignmentCreateMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  userFindFirstMock: vi.fn(),
  transactionMock: vi.fn(),
  auditLogMock: vi.fn(),
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    intervention: {
      findMany: interventionFindManyMock,
      update: interventionUpdateMock,
    },
    statusHistory: {
      create: statusHistoryCreateMock,
    },
    assignment: {
      findFirst: assignmentFindFirstMock,
      create: assignmentCreateMock,
    },
    user: {
      findUnique: userFindUniqueMock,
      findFirst: userFindFirstMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock('../src/shared/audit.service', () => ({
  AuditService: {
    log: auditLogMock,
  },
}));

vi.mock('../src/middleware/auth.middleware', () => ({
  authorizeRoles: (allowedRoles: string[]) => {
    const normalized = allowedRoles.map((r) => r.toLowerCase());
    return (
      req: { user?: { roles: string[] } },
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
  authenticate: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  optionalAuthenticate: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock('../src/middleware/validate.middleware', () => ({
  validate: (schema: { parse: (v: unknown) => unknown }) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (err: unknown) {
        res.status(400).json({ message: 'Validation error.', error: err });
      }
    },
}));

vi.mock('../src/shared/async-handler', () => ({
  asyncHandler: (fn: Function) =>
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        await fn(req, res, next);
      } catch (err) {
        next(err);
      }
    },
}));

import interventionsRouter from '../src/modules/interventions/interventions.route';
import { AppError } from '../src/shared/errors';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type TestResponse = { status: number; body: unknown };

function createApp() {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    req.user = {
      id: req.header('x-test-subject') ?? 'kc-koordinator-001',
      localUserId: Number(req.header('x-test-local-user-id') ?? '1'),
      username: req.header('x-test-username') ?? 'koordinator',
      roles: (req.header('x-test-roles') ?? 'Koordinator')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
    };
    next();
  });

  app.use('/interventions', interventionsRouter);

  app.use(
    (err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          error: { code: err.code, message: err.message },
          path: req.originalUrl,
        });
      }
      return res.status(500).json({ message: 'Unexpected test error.' });
    },
  );

  return app;
}

async function request(
  method: HttpMethod,
  path: string,
  options: {
    body?: unknown;
    roles?: string[];
    subject?: string;
    username?: string;
    localUserId?: number;
  } = {},
): Promise<TestResponse> {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-test-roles': (options.roles ?? ['Koordinator']).join(','),
        'x-test-subject': options.subject ?? 'kc-koordinator-001',
        'x-test-username': options.username ?? 'koordinator',
        'x-test-local-user-id': String(options.localUserId ?? 1),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

const MOCK_ACTOR = { id: 1, username: 'koordinator' };

function seedActor() {
  userFindFirstMock.mockResolvedValue(MOCK_ACTOR);
}

function seedInterventions(
  records: { id: number; status: InterventionStatus; archived: boolean }[],
) {
  interventionFindManyMock.mockResolvedValue(records);
}

function seedServicer(active = true) {
  userFindUniqueMock.mockResolvedValue({ id: 5, active });
}

function seedTransaction() {
  transactionMock.mockImplementation((ops: unknown[]) => Promise.all(ops));
  interventionUpdateMock.mockResolvedValue({});
  statusHistoryCreateMock.mockResolvedValue({});
  assignmentCreateMock.mockResolvedValue({});
}

describe('POST /interventions/bulk-actions – schema validacija', () => {
  beforeEach(() => vi.clearAllMocks());

  test('odbija zahtjev bez action polja', async () => {
    seedActor();
    const res = await request('POST', '/interventions/bulk-actions', {
      body: { interventionIds: [1], payload: {} },
    });
    expect(res.status).toBe(400);
  });

  test('odbija STATUS_CHANGE s praznim nizom interventionIds', async () => {
    seedActor();
    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [], payload: { status: 'IN_PROGRESS' } },
    });
    expect(res.status).toBe(400);
  });

  test('odbija STATUS_CHANGE s više od 100 ID-ova', async () => {
    seedActor();
    const res = await request('POST', '/interventions/bulk-actions', {
      body: {
        action: 'STATUS_CHANGE',
        interventionIds: Array.from({ length: 101 }, (_, i) => i + 1),
        payload: { status: 'IN_PROGRESS' },
      },
    });
    expect(res.status).toBe(400);
  });

  test('odbija STATUS_CHANGE s nepostojećim statusom', async () => {
    seedActor();
    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'NEPOZNAT' } },
    });
    expect(res.status).toBe(400);
  });

  test('odbija ASSIGN_SERVICER bez userId u payloadu', async () => {
    seedActor();
    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [1], payload: {} },
    });
    expect(res.status).toBe(400);
  });

  test('odbija ASSIGN_SERVICER s negativnim userId', async () => {
    seedActor();
    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [1], payload: { userId: -1 } },
    });
    expect(res.status).toBe(400);
  });

  test('odbija nepoznatu action vrijednost', async () => {
    seedActor();
    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'DELETE_ALL', interventionIds: [1], payload: {} },
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /interventions/bulk-actions – provjera rola', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedActor();
    seedInterventions([{ id: 1, status: InterventionStatus.NEW, archived: false }]);
    seedTransaction();
  });

  test('Koordinator može izvršiti bulk akciju', async () => {
    const res = await request('POST', '/interventions/bulk-actions', {
      roles: ['Koordinator'],
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });
    expect(res.status).not.toBe(403);
  });

  test('Coordinator (engleski naziv) može izvršiti bulk akciju', async () => {
    const res = await request('POST', '/interventions/bulk-actions', {
      roles: ['Coordinator'],
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });
    expect(res.status).not.toBe(403);
  });

  test('Admin može izvršiti bulk akciju', async () => {
    const res = await request('POST', '/interventions/bulk-actions', {
      roles: ['Admin'],
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });
    expect(res.status).not.toBe(403);
  });

  test('administrator (malo slovo) može izvršiti bulk akciju', async () => {
    const res = await request('POST', '/interventions/bulk-actions', {
      roles: ['administrator'],
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });
    expect(res.status).not.toBe(403);
  });

  test('Serviser NEMA pravo na bulk akcije – vraća 403', async () => {
    const res = await request('POST', '/interventions/bulk-actions', {
      roles: ['Serviser'],
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });
    expect(res.status).toBe(403);
  });

  test('Menadzment NEMA pravo na bulk akcije – vraća 403', async () => {
    const res = await request('POST', '/interventions/bulk-actions', {
      roles: ['Menadzment'],
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });
    expect(res.status).toBe(403);
  });

  test('Korisnik NEMA pravo na bulk akcije – vraća 403', async () => {
    const res = await request('POST', '/interventions/bulk-actions', {
      roles: ['Korisnik'],
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });
    expect(res.status).toBe(403);
  });
});

describe('POST /interventions/bulk-actions – STATUS_CHANGE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedActor();
    seedTransaction();
  });

  test('uspješno mijenja status NEW → IN_PROGRESS', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.NEW, archived: false }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });

    expect(res.status).toBe(200);
    const body = res.body as { totalSucceeded: number; totalSkipped: number };
    expect(body.totalSucceeded).toBe(1);
    expect(body.totalSkipped).toBe(0);
  });

  test('uspješno mijenja status IN_PROGRESS → RESOLVED', async () => {
    seedInterventions([{ id: 2, status: InterventionStatus.IN_PROGRESS, archived: false }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [2], payload: { status: 'RESOLVED' } },
    });

    expect(res.status).toBe(200);
    const body = res.body as { totalSucceeded: number };
    expect(body.totalSucceeded).toBe(1);
  });

  test('atomarno odbija sve kada jedan prelaz nije dozvoljen – vraća 422', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.NEW, archived: false },
      { id: 2, status: InterventionStatus.RESOLVED, archived: false }, // terminal
    ]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: {
        action: 'STATUS_CHANGE',
        interventionIds: [1, 2],
        payload: { status: 'IN_PROGRESS' },
      },
    });

    expect(res.status).toBe(422);
    const body = res.body as { totalSucceeded: number; totalSkipped: number };
    expect(body.totalSucceeded).toBe(0);
    expect(body.totalSkipped).toBeGreaterThan(0);
  });

  test('atomarno odbija sve kada je intervencija arhivirana', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.NEW, archived: false },
      { id: 2, status: InterventionStatus.IN_PROGRESS, archived: true },
    ]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: {
        action: 'STATUS_CHANGE',
        interventionIds: [1, 2],
        payload: { status: 'IN_PROGRESS' },
      },
    });

    expect(res.status).toBe(422);
    const body = res.body as { totalSucceeded: number };
    expect(body.totalSucceeded).toBe(0);
  });

  test('results sadrži razlog za svaku preskočenu intervenciju', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.RESOLVED, archived: false }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });

    expect(res.status).toBe(422);
    const body = res.body as { results: { id: number; success: boolean; reason?: string }[] };
    const failed = body.results.filter((r) => !r.success);
    expect(failed.length).toBeGreaterThan(0);
    failed.forEach((r) => expect(typeof r.reason).toBe('string'));
  });

  test('odbija prelaz NEW → RESOLVED (nedozvoljen direktan skok)', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.NEW, archived: false }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'RESOLVED' } },
    });

    expect(res.status).toBe(422);
  });

  test('vraća 422 kada intervencija ne postoji u bazi', async () => {
    interventionFindManyMock.mockResolvedValue([]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [999], payload: { status: 'IN_PROGRESS' } },
    });

    expect(res.status).toBe(422);
    const body = res.body as { results: { reason?: string }[] };
    expect(body.results[0].reason).toMatch(/not found/i);
  });

  test('odgovor ima ispravnu strukturu (totalRequested, totalSucceeded, totalSkipped, results)', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.NEW, archived: false }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });

    const body = res.body as Record<string, unknown>;
    expect(body).toHaveProperty('totalRequested');
    expect(body).toHaveProperty('totalSucceeded');
    expect(body).toHaveProperty('totalSkipped');
    expect(body).toHaveProperty('results');
    expect(Array.isArray(body.results)).toBe(true);
  });
});

describe('POST /interventions/bulk-actions – ASSIGN_SERVICER', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedActor();
    seedTransaction();
    assignmentFindFirstMock.mockResolvedValue(null);
  });

  test('uspješno dodjeljuje servisera na NEW intervenciju', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.NEW, archived: false }]);
    seedServicer(true);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [1], payload: { userId: 5 } },
    });

    expect(res.status).toBe(200);
    const body = res.body as { totalSucceeded: number };
    expect(body.totalSucceeded).toBe(1);
  });

  test('uspješno dodjeljuje servisera na IN_PROGRESS intervenciju', async () => {
    seedInterventions([{ id: 2, status: InterventionStatus.IN_PROGRESS, archived: false }]);
    seedServicer(true);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [2], payload: { userId: 5 } },
    });

    expect(res.status).toBe(200);
  });

  test('odbija dodjelu neaktivnog servisera – vraća 400', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.NEW, archived: false }]);
    seedServicer(false);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [1], payload: { userId: 5 } },
    });

    expect(res.status).toBe(400);
  });

  test('odbija dodjelu nepostojećeg servisera – vraća 400', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.NEW, archived: false }]);
    userFindUniqueMock.mockResolvedValue(null);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [1], payload: { userId: 999 } },
    });

    expect(res.status).toBe(400);
  });

  test('atomarno odbija sve kada je serviser već dodijeljen na jednu intervenciju', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.NEW, archived: false },
      { id: 2, status: InterventionStatus.NEW, archived: false },
    ]);
    seedServicer(true);
    assignmentFindFirstMock
      .mockResolvedValueOnce(null)        // id=1 slobodan
      .mockResolvedValueOnce({ id: 99 }); // id=2 već dodijeljen

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [1, 2], payload: { userId: 5 } },
    });

    expect(res.status).toBe(422);
    const body = res.body as { totalSucceeded: number };
    expect(body.totalSucceeded).toBe(0);
  });

  test('atomarno odbija sve kada je jedna intervencija arhivirana', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.NEW, archived: false },
      { id: 2, status: InterventionStatus.NEW, archived: true },
    ]);
    seedServicer(true);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [1, 2], payload: { userId: 5 } },
    });

    expect(res.status).toBe(422);
    const body = res.body as { totalSucceeded: number };
    expect(body.totalSucceeded).toBe(0);
  });

  test('atomarno odbija sve kada je jedna intervencija u RESOLVED statusu', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.NEW, archived: false },
      { id: 2, status: InterventionStatus.RESOLVED, archived: false },
    ]);
    seedServicer(true);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [1, 2], payload: { userId: 5 } },
    });

    expect(res.status).toBe(422);
  });

  test('atomarno odbija sve kada je jedna intervencija u CANCELLED statusu', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.NEW, archived: false },
      { id: 2, status: InterventionStatus.CANCELLED, archived: false },
    ]);
    seedServicer(true);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ASSIGN_SERVICER', interventionIds: [1, 2], payload: { userId: 5 } },
    });

    expect(res.status).toBe(422);
  });
});

describe('POST /interventions/bulk-actions – ARCHIVE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedActor();
    interventionUpdateMock.mockResolvedValue({});
  });

  test('uspješno arhivira RESOLVED intervenciju', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.RESOLVED, archived: false }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ARCHIVE', interventionIds: [1], payload: {} },
    });

    expect(res.status).toBe(200);
    const body = res.body as { totalSucceeded: number; totalSkipped: number };
    expect(body.totalSucceeded).toBe(1);
    expect(body.totalSkipped).toBe(0);
  });

  test('uspješno arhivira CANCELLED intervenciju', async () => {
    seedInterventions([{ id: 2, status: InterventionStatus.CANCELLED, archived: false }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ARCHIVE', interventionIds: [2], payload: {} },
    });

    expect(res.status).toBe(200);
    const body = res.body as { totalSucceeded: number };
    expect(body.totalSucceeded).toBe(1);
  });

  test('uspješno arhivira više intervencija odjednom', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.RESOLVED, archived: false },
      { id: 2, status: InterventionStatus.CANCELLED, archived: false },
      { id: 3, status: InterventionStatus.RESOLVED, archived: false },
    ]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ARCHIVE', interventionIds: [1, 2, 3], payload: {} },
    });

    expect(res.status).toBe(200);
    const body = res.body as { totalSucceeded: number; totalRequested: number };
    expect(body.totalSucceeded).toBe(3);
    expect(body.totalRequested).toBe(3);
  });

  test('atomarno odbija sve kada je jedna intervencija već arhivirana', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.RESOLVED, archived: false },
      { id: 2, status: InterventionStatus.RESOLVED, archived: true },
    ]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ARCHIVE', interventionIds: [1, 2], payload: {} },
    });

    expect(res.status).toBe(422);
    const body = res.body as { totalSucceeded: number };
    expect(body.totalSucceeded).toBe(0);
  });

  test('atomarno odbija sve kada je jedna intervencija u NEW statusu', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.RESOLVED, archived: false },
      { id: 2, status: InterventionStatus.NEW, archived: false },
    ]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ARCHIVE', interventionIds: [1, 2], payload: {} },
    });

    expect(res.status).toBe(422);
    const body = res.body as { totalSucceeded: number };
    expect(body.totalSucceeded).toBe(0);
  });

  test('atomarno odbija sve kada je jedna intervencija u IN_PROGRESS statusu', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.RESOLVED, archived: false },
      { id: 2, status: InterventionStatus.IN_PROGRESS, archived: false },
    ]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ARCHIVE', interventionIds: [1, 2], payload: {} },
    });

    expect(res.status).toBe(422);
  });

  test('results sadrži razlog zašto je IN_PROGRESS preskočena', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.IN_PROGRESS, archived: false }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ARCHIVE', interventionIds: [1], payload: {} },
    });

    expect(res.status).toBe(422);
    const body = res.body as { results: { id: number; success: boolean; reason?: string }[] };
    const failed = body.results.find((r) => r.id === 1);
    expect(failed?.success).toBe(false);
    expect(failed?.reason).toBeTruthy();
  });

  test('results sadrži razlog "already archived" za već arhiviranu intervenciju', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.RESOLVED, archived: true }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ARCHIVE', interventionIds: [1], payload: {} },
    });

    expect(res.status).toBe(422);
    const body = res.body as { results: { reason?: string }[] };
    expect(body.results[0].reason).toMatch(/already archived/i);
  });
});

describe('POST /interventions/bulk-actions – DEARCHIVE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedActor();
    interventionUpdateMock.mockResolvedValue({});
  });

  test('uspješno dearhivira arhiviranu intervenciju', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.RESOLVED, archived: true }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'DEARCHIVE', interventionIds: [1], payload: {} },
    });

    expect(res.status).toBe(200);
    expect(interventionUpdateMock).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { archived: false },
    });
    const body = res.body as { totalSucceeded: number; totalSkipped: number };
    expect(body.totalSucceeded).toBe(1);
    expect(body.totalSkipped).toBe(0);
  });

  test('atomarno odbija dearhiviranje ako intervencija nije arhivirana', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.RESOLVED, archived: false }]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: { action: 'DEARCHIVE', interventionIds: [1], payload: {} },
    });

    expect(res.status).toBe(422);
    expect(interventionUpdateMock).not.toHaveBeenCalled();
    const body = res.body as { results: { reason?: string }[] };
    expect(body.results[0].reason).toMatch(/not archived/i);
  });
});

describe('Atomarnost i audit log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedActor();
    seedTransaction();
  });

  test('totalRequested odgovara broju poslanih interventionIds', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.NEW, archived: false },
      { id: 2, status: InterventionStatus.NEW, archived: false },
      { id: 3, status: InterventionStatus.NEW, archived: false },
    ]);

    const res = await request('POST', '/interventions/bulk-actions', {
      body: {
        action: 'STATUS_CHANGE',
        interventionIds: [1, 2, 3],
        payload: { status: 'IN_PROGRESS' },
      },
    });

    const body = res.body as { totalRequested: number };
    expect(body.totalRequested).toBe(3);
  });

  test('kada preflight ne prođe, $transaction se ne poziva (STATUS_CHANGE)', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.NEW, archived: false },
      { id: 2, status: InterventionStatus.RESOLVED, archived: false },
    ]);

    await request('POST', '/interventions/bulk-actions', {
      body: {
        action: 'STATUS_CHANGE',
        interventionIds: [1, 2],
        payload: { status: 'IN_PROGRESS' },
      },
    });

    expect(transactionMock).not.toHaveBeenCalled();
  });

  test('kada preflight ne prođe, intervention.update se ne poziva (ARCHIVE)', async () => {
    seedInterventions([
      { id: 1, status: InterventionStatus.RESOLVED, archived: false },
      { id: 2, status: InterventionStatus.IN_PROGRESS, archived: false },
    ]);

    await request('POST', '/interventions/bulk-actions', {
      body: { action: 'ARCHIVE', interventionIds: [1, 2], payload: {} },
    });

    expect(interventionUpdateMock).not.toHaveBeenCalled();
  });

  test('audit log se poziva čak i kada preflight ne prođe', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.RESOLVED, archived: false }]);

    await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });

    expect(auditLogMock).toHaveBeenCalled();
  });

  test('audit log se poziva i kada su sve akcije uspješne', async () => {
    seedInterventions([{ id: 1, status: InterventionStatus.NEW, archived: false }]);

    await request('POST', '/interventions/bulk-actions', {
      body: { action: 'STATUS_CHANGE', interventionIds: [1], payload: { status: 'IN_PROGRESS' } },
    });

    expect(auditLogMock).toHaveBeenCalled();
  });
});

describe('formatBulkResultSummary – unit', () => {
  function formatBulkResultSummary(result: {
    totalRequested: number;
    totalSucceeded: number;
    totalSkipped: number;
  }): string {
    if (result.totalSkipped === 0) {
      return `${result.totalSucceeded} of ${result.totalRequested} interventions successfully updated.`;
    }
    return `${result.totalSucceeded} of ${result.totalRequested} interventions updated. ${result.totalSkipped} skipped.`;
  }

  test('potpuni uspjeh – poruka bez "skipped"', () => {
    assert.equal(
      formatBulkResultSummary({ totalRequested: 5, totalSucceeded: 5, totalSkipped: 0 }),
      '5 of 5 interventions successfully updated.',
    );
  });

  test('parcijalni uspjeh – poruka sa brojem preskočenih', () => {
    assert.equal(
      formatBulkResultSummary({ totalRequested: 10, totalSucceeded: 7, totalSkipped: 3 }),
      '7 of 10 interventions updated. 3 skipped.',
    );
  });

  test('sve preskočene – totalSucceeded je 0', () => {
    assert.equal(
      formatBulkResultSummary({ totalRequested: 3, totalSucceeded: 0, totalSkipped: 3 }),
      '0 of 3 interventions updated. 3 skipped.',
    );
  });
});
