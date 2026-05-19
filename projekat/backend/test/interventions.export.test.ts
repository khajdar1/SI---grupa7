import express from 'express';
import type { AddressInfo } from 'node:net';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InterventionStatus, Priority } from '@prisma/client';

const { generateInterventionsPdfMock, interventionFindManyMock } = vi.hoisted(() => ({
  generateInterventionsPdfMock: vi.fn().mockResolvedValue(Buffer.from('%PDF-1.4')),
  interventionFindManyMock: vi.fn(),
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    intervention: {
      findMany: interventionFindManyMock,
    },
  },
}));

vi.mock('../src/shared/pdf.service', () => ({
  generateInterventionsPdf: generateInterventionsPdfMock,
}));

import interventionsRouter from '../src/modules/interventions/interventions.route';
import { AppError } from '../src/shared/errors';

function dateMinutesFromNow(minutes: number): Date {
  const d = new Date(Date.now() + minutes * 60_000);
  d.setSeconds(0, 0);
  return d;
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = {
      id: req.header('x-test-subject') ?? 'kc-coordinator-001',
      localUserId: Number(req.header('x-test-local-user-id') ?? '3'),
      username: req.header('x-test-username') ?? 'milan.koordinator',
      roles: (req.header('x-test-roles') ?? 'Koordinator').split(',').map((r) => r.trim()).filter(Boolean),
    };
    next();
  });
  app.use('/interventions', interventionsRouter);
  app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message } });
    }
    return res.status(500).json({ message: 'Unexpected test error' });
  });
  return app;
}

async function request(path: string, options: { roles?: string[]; localUserId?: number } = {}) {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: 'GET',
      headers: {
        'x-test-roles': (options.roles ?? ['Koordinator']).join(','),
        'x-test-local-user-id': String(options.localUserId ?? 3),
      },
    });

    const buffer = await response.arrayBuffer();
    return { status: response.status, headers: response.headers, body: Buffer.from(buffer) };
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

describe('Interventions PDF export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns PDF for coordinator', async () => {
    interventionFindManyMock.mockResolvedValue([
      {
        id: 1,
        name: 'Test intervention',
        priority: Priority.MEDIUM,
        status: InterventionStatus.NEW,
        location: 'Objekat A',
        createdAt: dateMinutesFromNow(-10),
        startedAt: dateMinutesFromNow(60),
        dueAt: dateMinutesFromNow(180),
        assignments: [{ user: { firstName: 'Petar', lastName: 'Petrovic' } }],
      },
    ]);

    const res = await request('/interventions/export/pdf');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/pdf/);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('passes valid latin extended characters to PDF generation unchanged', async () => {
    interventionFindManyMock.mockResolvedValue([
      {
        id: 1,
        name: 'Čišćenje uređaja',
        priority: Priority.HIGH,
        status: InterventionStatus.ASSIGNED,
        location: 'Šaht kod škole, Čelić',
        createdAt: dateMinutesFromNow(-10),
        startedAt: dateMinutesFromNow(60),
        dueAt: dateMinutesFromNow(180),
        assignments: [{ user: { firstName: 'Dženan', lastName: 'Đurić' } }],
      },
    ]);

    const res = await request('/interventions/export/pdf');

    expect(res.status).toBe(200);
    expect(generateInterventionsPdfMock).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          name: 'Čišćenje uređaja',
          location: 'Šaht kod škole, Čelić',
          servicers: 'Dženan Đurić',
        }),
      ],
      { title: 'Interventions Export' },
    );
  });

  it('forbids export when user has no access', async () => {
    interventionFindManyMock.mockResolvedValue([]);

    const res = await request('/interventions/export/pdf', { roles: [], localUserId: 0 });

    expect(res.status).toBe(403);
  });
});
