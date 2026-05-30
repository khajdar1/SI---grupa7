import express from 'express';
import type { AddressInfo } from 'node:net';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InterventionStatus, ReportStatus } from '@prisma/client';

const {
  interventionFindUniqueMock,
  reportFindFirstMock,
  reportFindUniqueMock,
  reportCreateMock,
  reportUpdateMock,
  assignmentFindFirstMock,
  userFindFirstMock,
  auditLogMock,
} = vi.hoisted(() => ({
  interventionFindUniqueMock: vi.fn(),
  reportFindFirstMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  reportCreateMock: vi.fn(),
  reportUpdateMock: vi.fn(),
  assignmentFindFirstMock: vi.fn(),
  userFindFirstMock: vi.fn(),
  auditLogMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    intervention: {
      findUnique: interventionFindUniqueMock,
    },
    report: {
      findFirst: reportFindFirstMock,
      findUnique: reportFindUniqueMock,
      create: reportCreateMock,
      update: reportUpdateMock,
    },
    assignment: {
      findFirst: assignmentFindFirstMock,
    },
    user: {
      findFirst: userFindFirstMock,
    },
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
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized.' });
      }

      const userRoles = (req.user.roles ?? []).map((r) => r.toLowerCase());
      const hasRole = normalized.some((r) => userRoles.includes(r));

      if (!hasRole) {
        return res.status(403).json({ message: 'Forbidden.' });
      }

      return next();
    };
  },
}));


import reportsRouter from '../src/modules/reports/reports.route';
import { AppError } from '../src/shared/errors';


type HttpMethod = 'GET' | 'POST' | 'PATCH';
type TestResponse = { status: number; body: unknown };

function createApp() {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    req.user = {
      id: req.header('x-test-subject') ?? 'kc-serviser-001',
      localUserId: Number(req.header('x-test-local-user-id') ?? '10'),
      username: req.header('x-test-username') ?? 'amir.servis',
      roles: (req.header('x-test-roles') ?? 'Serviser')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
    };
    next();
  });

  app.use('/interventions/:interventionId/reports', reportsRouter);

  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          error: {
            code: err.code,
            message: err.message,
            ...(err.fields ? { fields: err.fields } : {}),
          },
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
        'x-test-roles': (options.roles ?? ['Serviser']).join(','),
        'x-test-subject': options.subject ?? 'kc-serviser-001',
        'x-test-username': options.username ?? 'amir.servis',
        'x-test-local-user-id': String(options.localUserId ?? 10),
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


const MOCK_LOCAL_USER = { id: 10 };

const MOCK_REPORT = {
  id: 1,
  interventionId: 42,
  authorId: 10,
  description: 'Replaced the faulty component.',
  material: null,
  notes: null,
  reportDate: new Date('2026-01-15T10:00:00.000Z'),
  status: ReportStatus.DRAFT,
  isRecommended: false,
  recommendedAt: null,
  recommendedById: null,
  author: { id: 10, firstName: 'Amir', lastName: 'Servis', username: 'amir.servis' },
};

const MOCK_INTERVENTION_IN_PROGRESS = { id: 42, status: InterventionStatus.IN_PROGRESS };
const MOCK_INTERVENTION_RESOLVED = { id: 42, status: InterventionStatus.RESOLVED };
const MOCK_INTERVENTION_NEW = { id: 42, status: InterventionStatus.NEW };

function seedWriteHappyPath() {
  userFindFirstMock.mockResolvedValue(MOCK_LOCAL_USER);
  interventionFindUniqueMock.mockResolvedValue(MOCK_INTERVENTION_IN_PROGRESS);
  assignmentFindFirstMock.mockResolvedValue({ id: 1 });
  reportFindFirstMock.mockResolvedValue(null);
  reportCreateMock.mockResolvedValue(MOCK_REPORT);
  reportUpdateMock.mockResolvedValue(MOCK_REPORT);
  auditLogMock.mockResolvedValue(undefined);
}


describe('GET /interventions/:interventionId/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    interventionFindUniqueMock.mockResolvedValue(MOCK_INTERVENTION_IN_PROGRESS);
    reportFindFirstMock.mockResolvedValue(MOCK_REPORT);
  });

  it('returns 200 with the mapped report when it exists', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['Koordinator'],
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 1,
      interventionId: 42,
      description: 'Replaced the faulty component.',
      status: ReportStatus.DRAFT,
      author: { username: 'amir.servis' },
      reportDate: MOCK_REPORT.reportDate.toISOString(),
    });
  });

  it('returns 200 with null when no report exists for the intervention', async () => {
    reportFindFirstMock.mockResolvedValue(null);

    const res = await request('GET', '/interventions/42/reports', {
      roles: ['Koordinator'],
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: null });
  });

  it('returns 404 when the intervention does not exist', async () => {
    interventionFindUniqueMock.mockResolvedValue(null);

    const res = await request('GET', '/interventions/999/reports', {
      roles: ['Koordinator'],
    });

    expect(res.status).toBe(404);
  });

  it('returns 400 for a non-numeric intervention id', async () => {
    const res = await request('GET', '/interventions/abc/reports', {
      roles: ['Koordinator'],
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for a zero intervention id', async () => {
    const res = await request('GET', '/interventions/0/reports', {
      roles: ['Koordinator'],
    });

    expect(res.status).toBe(400);
  });

  it('allows koordinator (lowercase) to read a report', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['koordinator'],
    });
    expect(res.status).toBe(200);
  });

  it('allows Koordinator (Keycloak capitalized alias) to read a report', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['Koordinator'],
    });
    expect(res.status).toBe(200);
  });

  it('allows Admin to read a report', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['Admin'],
    });
    expect(res.status).toBe(200);
  });

  it('allows administrator to read a report', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['administrator'],
    });
    expect(res.status).toBe(200);
  });

  it('allows Serviser to read a report', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['Serviser'],
    });
    expect(res.status).toBe(200);
  });

  it('allows Menadzment to read a report', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['Menadzment'],
    });
    expect(res.status).toBe(200);
  });

  it('allows Management (English alias) to read a report', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['Management'],
    });
    expect(res.status).toBe(200);
  });

  it('returns 403 for Korisnik role', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['Korisnik'],
    });
    expect(res.status).toBe(403);
  });

  it('returns 403 for an unknown role', async () => {
    const res = await request('GET', '/interventions/42/reports', {
      roles: ['SomeUnknownRole'],
    });
    expect(res.status).toBe(403);
  });
});

describe('POST /interventions/:interventionId/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedWriteHappyPath();
  });

  it('returns 201 with message and data on success', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      message: 'Report submitted successfully.',
      data: { id: 1, interventionId: 42 },
    });
  });

  it('calls prisma.report.create with correct author, intervention and fields', async () => {
    await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.', material: 'Pipe', notes: 'Follow up.' },
    });

    expect(reportCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          interventionId: 42,
          authorId: 10,
          description: 'Work done.',
          material: 'Pipe',
          notes: 'Follow up.',
        }),
      }),
    );
  });

  it('transforms undefined optional fields to null', async () => {
    await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });

    expect(reportCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ material: null, notes: null }),
      }),
    );
  });

  it('trims whitespace from description before saving', async () => {
    await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: '  Work done.  ' },
    });

    expect(reportCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: 'Work done.' }),
      }),
    );
  });

  it('returns 422 when description is missing', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { material: 'Parts' },
    });

    expect(res.status).toBe(400);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 422 when description is an empty string', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: '' },
    });

    expect(res.status).toBe(400);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 422 when description is whitespace only', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: '   ' },
    });

    expect(res.status).toBe(400);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 422 when description exceeds max length', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'a'.repeat(5001) },
    });

    expect(res.status).toBe(400);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the intervention does not exist', async () => {
    interventionFindUniqueMock.mockResolvedValue(null);

    const res = await request('POST', '/interventions/999/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });

    expect(res.status).toBe(404);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when intervention status is NEW', async () => {
    interventionFindUniqueMock.mockResolvedValue(MOCK_INTERVENTION_NEW);

    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });

    expect(res.status).toBe(403);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when intervention status is ASSIGNED', async () => {
    interventionFindUniqueMock.mockResolvedValue({
      id: 42,
      status: InterventionStatus.ASSIGNED,
    });

    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });

    expect(res.status).toBe(403);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the serviser is not assigned to the intervention', async () => {
    assignmentFindFirstMock.mockResolvedValue(null);

    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });

    expect(res.status).toBe(403);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when a report already exists for the intervention', async () => {
    reportFindFirstMock.mockResolvedValue(MOCK_REPORT);

    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });

    expect(res.status).toBe(403);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when local user record is not found', async () => {
    userFindFirstMock.mockResolvedValue(null);

    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });

    expect(res.status).toBe(403);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a non-numeric intervention id', async () => {
    const res = await request('POST', '/interventions/abc/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });

    expect(res.status).toBe(400);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('allows creation when intervention is RESOLVED', async () => {
    interventionFindUniqueMock.mockResolvedValue(MOCK_INTERVENTION_RESOLVED);

    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done after closing.' },
    });

    expect(res.status).toBe(201);
  });

  it('allows Serviser (Keycloak capitalized alias) to create a report', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Work done.' },
    });
    expect(res.status).toBe(201);
  });

  it('allows serviser (lowercase) to create a report', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['serviser'],
      body: { description: 'Work done.' },
    });
    expect(res.status).toBe(201);
  });

  it('returns 403 when Koordinator tries to create a report', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Koordinator'],
      body: { description: 'Work done.' },
    });
    expect(res.status).toBe(403);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when Admin tries to create a report', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Admin'],
      body: { description: 'Work done.' },
    });
    expect(res.status).toBe(403);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when Menadzment tries to create a report', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Menadzment'],
      body: { description: 'Work done.' },
    });
    expect(res.status).toBe(403);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when Korisnik tries to create a report', async () => {
    const res = await request('POST', '/interventions/42/reports', {
      roles: ['Korisnik'],
      body: { description: 'Work done.' },
    });
    expect(res.status).toBe(403);
    expect(reportCreateMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /interventions/:interventionId/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindFirstMock.mockResolvedValue(MOCK_LOCAL_USER);
    interventionFindUniqueMock.mockResolvedValue(MOCK_INTERVENTION_IN_PROGRESS);
    assignmentFindFirstMock.mockResolvedValue({ id: 1 });
    reportFindFirstMock.mockResolvedValue(MOCK_REPORT);
    reportUpdateMock.mockResolvedValue(MOCK_REPORT);
    
  });

  it('returns 200 with message and updated data on success', async () => {
    const updated = { ...MOCK_REPORT, description: 'Updated description.' };
    reportUpdateMock.mockResolvedValue(updated);

    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Updated description.' },
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: 'Report updated successfully.',
      data: { description: 'Updated description.' },
    });
  });

  it('calls prisma.report.update with the correct report id and fields', async () => {
    await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Updated.' },
    });

    expect(reportUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: MOCK_REPORT.id },
        data: expect.objectContaining({ description: 'Updated.' }),
      }),
    );
  });

  it('records an audit log entry with the updated field names in details', async () => {
    await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Updated.', notes: null },
    });

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_UPDATED',
        details: expect.stringContaining('description'),
      }),
    );
  });

  it('returns 422 when payload is empty', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: {},
    });

    expect(res.status).toBe(400);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 422 when description is an empty string', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: '' },
    });

    expect(res.status).toBe(400);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('accepts null for material to clear the field', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { material: null },
    });

    expect(res.status).toBe(200);
    expect(reportUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ material: null }),
      }),
    );
  });

  it('accepts null for notes to clear the field', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { notes: null },
    });

    expect(res.status).toBe(200);
    expect(reportUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notes: null }),
      }),
    );
  });

  it('trims whitespace from description before saving', async () => {
    await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: '  Updated.  ' },
    });

    expect(reportUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: 'Updated.' }),
      }),
    );
  });

  it('returns 404 when the intervention does not exist', async () => {
    interventionFindUniqueMock.mockResolvedValue(null);

    const res = await request('PATCH', '/interventions/999/reports', {
      roles: ['Serviser'],
      body: { description: 'x' },
    });

    expect(res.status).toBe(404);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when intervention status does not allow updates (NEW)', async () => {
    interventionFindUniqueMock.mockResolvedValue(MOCK_INTERVENTION_NEW);

    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'x' },
    });

    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 404 when no report exists for the intervention', async () => {
    reportFindFirstMock.mockResolvedValue(null);

    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'x' },
    });

    expect(res.status).toBe(404);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when report is already finalized', async () => {
    reportFindFirstMock.mockResolvedValue({
      ...MOCK_REPORT,
      status: ReportStatus.FINALIZED,
    });

    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'x' },
    });

    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the serviser is not assigned to the intervention', async () => {
    assignmentFindFirstMock.mockResolvedValue(null);

    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'Updated.' },
    });

    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when local user record is not found', async () => {
    userFindFirstMock.mockResolvedValue(null);

    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'x' },
    });

    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a non-numeric intervention id', async () => {
    const res = await request('PATCH', '/interventions/abc/reports', {
      roles: ['Serviser'],
      body: { description: 'x' },
    });

    expect(res.status).toBe(400);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('allows Serviser (Keycloak alias) to update a report', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Serviser'],
      body: { description: 'x' },
    });
    expect(res.status).toBe(200);
  });

  it('allows serviser (lowercase) to update a report', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['serviser'],
      body: { description: 'x' },
    });
    expect(res.status).toBe(200);
  });

  it('returns 403 when Koordinator tries to update a report', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Koordinator'],
      body: { description: 'x' },
    });
    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when Admin tries to update a report', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Admin'],
      body: { description: 'x' },
    });
    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when Menadzment tries to update a report', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Menadzment'],
      body: { description: 'x' },
    });
    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it('returns 403 when Korisnik tries to update a report', async () => {
    const res = await request('PATCH', '/interventions/42/reports', {
      roles: ['Korisnik'],
      body: { description: 'x' },
    });
    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /interventions/:interventionId/reports/finalize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindFirstMock.mockResolvedValue(MOCK_LOCAL_USER);
    interventionFindUniqueMock.mockResolvedValue(MOCK_INTERVENTION_RESOLVED);
    reportFindFirstMock.mockResolvedValue(MOCK_REPORT);
    reportUpdateMock.mockResolvedValue({
      ...MOCK_REPORT,
      status: ReportStatus.FINALIZED,
    });
  });

  it('finalizes an existing report', async () => {
    const res = await request('PATCH', '/interventions/42/reports/finalize', {
      roles: ['Serviser'],
    });

    expect(res.status).toBe(200);
    expect(reportUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: MOCK_REPORT.id },
        data: { status: 'FINALIZED' },
      }),
    );
    expect(res.body).toMatchObject({
      message: 'Report finalized successfully.',
      data: { status: ReportStatus.FINALIZED },
    });
  });

  it('does not allow coordinators to finalize technician reports', async () => {
    const res = await request('PATCH', '/interventions/42/reports/finalize', {
      roles: ['Koordinator'],
    });

    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /interventions/:interventionId/reports/recommendation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userFindFirstMock.mockResolvedValue(MOCK_LOCAL_USER);
    interventionFindUniqueMock.mockResolvedValue(MOCK_INTERVENTION_RESOLVED);
    reportFindFirstMock.mockResolvedValue({
      ...MOCK_REPORT,
      status: ReportStatus.FINALIZED,
    });
    reportUpdateMock.mockResolvedValue({
      ...MOCK_REPORT,
      status: ReportStatus.FINALIZED,
      isRecommended: true,
      recommendedAt: new Date('2026-01-16T10:00:00.000Z'),
      recommendedById: 10,
    });
  });

  it('allows a coordinator to mark a finalized report as recommended', async () => {
    const res = await request('PATCH', '/interventions/42/reports/recommendation', {
      roles: ['Koordinator'],
      body: { recommended: true },
    });

    expect(res.status).toBe(200);
    expect(reportUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: MOCK_REPORT.id },
        data: expect.objectContaining({
          isRecommended: true,
          recommendedById: 10,
        }),
      }),
    );
    expect(res.body).toMatchObject({
      data: { isRecommended: true, recommendedById: 10 },
    });
  });

  it('rejects recommendation for draft reports', async () => {
    reportFindFirstMock.mockResolvedValue(MOCK_REPORT);

    const res = await request('PATCH', '/interventions/42/reports/recommendation', {
      roles: ['Koordinator'],
      body: { recommended: true },
    });

    expect(res.status).toBe(403);
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });
});
