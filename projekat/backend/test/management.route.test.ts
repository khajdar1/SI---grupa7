import express from 'express';
import type { AddressInfo } from 'node:net';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InterventionStatus, Priority } from '@prisma/client';

const {
  interventionCountMock,
  statusHistoryFindManyMock,
  interventionGroupByMock,
  reportFindManyMock,        
} = vi.hoisted(() => ({
  interventionCountMock: vi.fn(),
  statusHistoryFindManyMock: vi.fn(),
  interventionGroupByMock: vi.fn(),
  reportFindManyMock: vi.fn(),  
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    intervention: {
      count: interventionCountMock,
      groupBy: interventionGroupByMock,
    },
    statusHistory: {
      findMany: statusHistoryFindManyMock,
    },
    report: {                    
      findMany: reportFindManyMock,
    },
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
}));

import managementRouter from '../src/modules/management/management.route';
import { AppError } from '../src/shared/errors';

const DEFAULT_STATS_MOCK = {
  activeCount: 5,
  completedCount: 20,
  averageResolutionHours: 8,
  priorityDistribution: [
    { priority: Priority.CRITICAL, total: 1, active: 1, completed: 0 },
    { priority: Priority.HIGH, total: 10, active: 2, completed: 8 },
    { priority: Priority.MEDIUM, total: 10, active: 2, completed: 8 },
    { priority: Priority.LOW, total: 4, active: 0, completed: 4 },
  ],
};

function createApp() {
  const app = express();
  app.use(express.json());

  app.use((req, _res, next) => {
    req.user = {
      id: req.header('x-test-subject') ?? 'kc-mgmt-001',
      localUserId: Number(req.header('x-test-local-user-id') ?? '1'),
      username: req.header('x-test-username') ?? 'menadzment.user',
      roles: (req.header('x-test-roles') ?? 'Menadzment')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
    };
    next();
  });

  app.use('/management', managementRouter);

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

type HttpMethod = 'GET';
type TestResponse = { status: number; body: unknown };

async function request(
  method: HttpMethod,
  path: string,
  options: { roles?: string[] } = {},
): Promise<TestResponse> {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-test-roles': (options.roles ?? ['Menadzment']).join(','),
      },
    });

    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe('PBI-014 management dashboard route', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    interventionCountMock.mockResolvedValue(5);
    statusHistoryFindManyMock.mockResolvedValue([]);
    interventionGroupByMock.mockResolvedValue([
      { priority: Priority.HIGH, status: InterventionStatus.NEW, _count: { _all: 5 } },
      { priority: Priority.HIGH, status: InterventionStatus.RESOLVED, _count: { _all: 20 } },
    ]);
  });

  describe('GET /management/dashboard', () => {
    it('returns 200 with dashboard stats for Menadzment role', async () => {
      const { status, body } = await request('GET', '/management/dashboard', {
        roles: ['Menadzment'],
      });

      expect(status).toBe(200);
      const b = body as typeof DEFAULT_STATS_MOCK;
      expect(typeof b.activeCount).toBe('number');
      expect(typeof b.completedCount).toBe('number');
      expect(Array.isArray(b.priorityDistribution)).toBe(true);
    });

    it('returns 200 with dashboard stats for Management role (English variant)', async () => {
      const { status } = await request('GET', '/management/dashboard', {
        roles: ['Management'],
      });

      expect(status).toBe(200);
    });

    it('returns 200 with dashboard stats for Admin role', async () => {
      const { status } = await request('GET', '/management/dashboard', {
        roles: ['Admin'],
      });

      expect(status).toBe(200);
    });

    it('returns 200 with dashboard stats for Administrator role', async () => {
      const { status } = await request('GET', '/management/dashboard', {
        roles: ['Administrator'],
      });

      expect(status).toBe(200);
    });

    it('returns 403 for Serviser role', async () => {
      const { status } = await request('GET', '/management/dashboard', {
        roles: ['Serviser'],
      });

      expect(status).toBe(403);
    });

    it('returns 403 for Koordinator role', async () => {
      const { status } = await request('GET', '/management/dashboard', {
        roles: ['Koordinator'],
      });

      expect(status).toBe(403);
    });

    it('returns 403 for Korisnik role', async () => {
      const { status } = await request('GET', '/management/dashboard', {
        roles: ['Korisnik'],
      });

      expect(status).toBe(403);
    });

    it('response includes activeCount field', async () => {
      interventionCountMock.mockImplementation((args: { where: { status: { in: InterventionStatus[] } } }) =>
        Promise.resolve(args.where.status.in.includes(InterventionStatus.RESOLVED) ? 20 : 5),
      );

      const { body } = await request('GET', '/management/dashboard');

      expect((body as Record<string, unknown>).activeCount).toBe(5);
    });

    it('response includes completedCount field', async () => {
      interventionCountMock.mockImplementation((args: { where: { status: { in: InterventionStatus[] } } }) =>
        Promise.resolve(args.where.status.in.includes(InterventionStatus.RESOLVED) ? 20 : 5),
      );

      const { body } = await request('GET', '/management/dashboard');

      expect((body as Record<string, unknown>).completedCount).toBe(20);
    });

    it('response includes averageResolutionHours as null when no resolutions exist', async () => {
      statusHistoryFindManyMock.mockResolvedValue([]);

      const { body } = await request('GET', '/management/dashboard');

      expect((body as Record<string, unknown>).averageResolutionHours).toBeNull();
    });

    it('response includes averageResolutionHours computed from resolution records', async () => {
      const base = new Date('2026-01-01T00:00:00Z');
      const fourHoursLater = new Date('2026-01-01T04:00:00Z');
      statusHistoryFindManyMock.mockResolvedValue([
        { changedAt: fourHoursLater, intervention: { createdAt: base } },
      ]);

      const { body } = await request('GET', '/management/dashboard');

      expect((body as Record<string, unknown>).averageResolutionHours).toBe(4);
    });

    it('response includes priorityDistribution array with 4 rows', async () => {
      const { body } = await request('GET', '/management/dashboard');

      const dist = (body as Record<string, unknown>).priorityDistribution as unknown[];
      expect(Array.isArray(dist)).toBe(true);
      expect(dist).toHaveLength(4);
    });

    it('priorityDistribution rows contain priority, total, active, completed fields', async () => {
      const { body } = await request('GET', '/management/dashboard');

      const dist = (body as Record<string, unknown>).priorityDistribution as Record<string, unknown>[];
      expect(dist[0]).toHaveProperty('priority');
      expect(dist[0]).toHaveProperty('total');
      expect(dist[0]).toHaveProperty('active');
      expect(dist[0]).toHaveProperty('completed');
    });

    it('passes RESOLVED status filter to statusHistory query', async () => {
      await request('GET', '/management/dashboard');

      expect(statusHistoryFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { newStatus: InterventionStatus.RESOLVED },
        }),
      );
    });

    it('passes archived:false filter to intervention count query', async () => {
      await request('GET', '/management/dashboard');

      expect(interventionCountMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ archived: false }),
        }),
      );
    });
  });
});

describe('PBI-056 GET /management/materials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    interventionCountMock.mockResolvedValue(0);
    statusHistoryFindManyMock.mockResolvedValue([]);
    interventionGroupByMock.mockResolvedValue([]);
    reportFindManyMock.mockResolvedValue([]);
  });

  it('returns 200 for Menadzment role', async () => {
    const { status } = await request('GET', '/management/materials', { roles: ['Menadzment'] });
    expect(status).toBe(200);
  });

  it('returns 200 for Management role (English variant)', async () => {
    const { status } = await request('GET', '/management/materials', { roles: ['Management'] });
    expect(status).toBe(200);
  });

  it('returns 200 for Admin role', async () => {
    const { status } = await request('GET', '/management/materials', { roles: ['Admin'] });
    expect(status).toBe(200);
  });

  it('returns 200 for Administrator role', async () => {
    const { status } = await request('GET', '/management/materials', { roles: ['Administrator'] });
    expect(status).toBe(200);
  });

  it('returns 403 for Serviser role', async () => {
    const { status } = await request('GET', '/management/materials', { roles: ['Serviser'] });
    expect(status).toBe(403);
  });

  it('returns 403 for Koordinator role', async () => {
    const { status } = await request('GET', '/management/materials', { roles: ['Koordinator'] });
    expect(status).toBe(403);
  });

  it('returns 403 for Korisnik role', async () => {
    const { status } = await request('GET', '/management/materials', { roles: ['Korisnik'] });
    expect(status).toBe(403);
  });

  it('response includes topMaterials, byPeriod, byCompany fields', async () => {
    const { body } = await request('GET', '/management/materials');
    expect(body).toHaveProperty('topMaterials');
    expect(body).toHaveProperty('byPeriod');
    expect(body).toHaveProperty('byCompany');
  });

  it('response includes totalReportsWithMaterials, totalQuantity, totalDistinctMaterials', async () => {
    const { body } = await request('GET', '/management/materials');
    expect(body).toHaveProperty('totalReportsWithMaterials');
    expect(body).toHaveProperty('totalQuantity');
    expect(body).toHaveProperty('totalDistinctMaterials');
  });

  it('returns 400 for an invalid from date', async () => {
    const { status } = await request('GET', '/management/materials?from=not-a-date');
    expect(status).toBe(400);
  });

  it('returns 400 for an invalid to date', async () => {
    const { status } = await request('GET', '/management/materials?to=not-a-date');
    expect(status).toBe(400);
  });

  it('returns 400 for a non-integer companyId', async () => {
    const { status } = await request('GET', '/management/materials?companyId=abc');
    expect(status).toBe(400);
  });

  it('returns 400 for a non-integer categoryId', async () => {
    const { status } = await request('GET', '/management/materials?categoryId=abc');
    expect(status).toBe(400);
  });

  it('returns 200 with valid from and to date filters', async () => {
    const { status } = await request('GET', '/management/materials?from=2026-01-01&to=2026-01-31');
    expect(status).toBe(200);
  });

  it('returns 200 with companyId filter', async () => {
    const { status } = await request('GET', '/management/materials?companyId=5');
    expect(status).toBe(200);
  });

  it('returns 200 with categoryId filter', async () => {
    const { status } = await request('GET', '/management/materials?categoryId=3');
    expect(status).toBe(200);
  });

  it('response does not include price or cost fields', async () => {
    const { body } = await request('GET', '/management/materials');
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toMatch(/price/i);
    expect(bodyStr).not.toMatch(/cost/i);
    expect(bodyStr).not.toMatch(/cijena/i);
    expect(bodyStr).not.toMatch(/faktur/i);
  });
});
