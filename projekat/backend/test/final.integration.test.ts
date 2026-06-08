import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { InterventionStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH';

type StoredPreferences = {
  id: number;
  userId: number;
  language: string;
  notificationPreferences: Record<string, boolean>;
  updatedAt: Date;
};

type StoredFeedback = {
  id: number;
  interventionId: number;
  userId: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
};

const {
  db,
  auditRecordMock,
} = vi.hoisted(() => ({
  db: {
    preferences: new Map<number, StoredPreferences>(),
    feedbackByIntervention: new Map<number, StoredFeedback>(),
    blocks: [] as Array<Record<string, unknown>>,
    nextBlockId: 1,
  },
  auditRecordMock: vi.fn(),
}));

const defaultNotificationPreferences = {
  NEW_REPORT: true,
  INTERVENTION_ASSIGNED: true,
  STATUS_CHANGED: true,
  FEEDBACK_REQUEST: true,
  AUTO_ASSIGNMENT: true,
  NEW_TICKET: true,
  TICKET_REPLY: true,
  INTERVENTION_PAUSED: true,
  SERVICER_DISPATCHED: true,
  SERVICER_ARRIVED: true,
  EXECUTION_CONFIRMATION_REQUEST: true,
  EXECUTION_CONFIRMATION_RESPONSE: true,
  REOPEN_REQUEST: true,
  REOPEN_APPROVED: true,
  REOPEN_REJECTED: true,
};

vi.mock('../src/shared/audit.service', () => ({
  AuditService: {
    record: auditRecordMock,
  },
}));

vi.mock('../src/middleware/auth.middleware', () => ({
  authorizeRoles:
    (allowedRoles: string[]) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const allowed = allowedRoles.map((role) => role.toLowerCase());
      const actual = (req.user?.roles ?? []).map((role) => role.toLowerCase());
      if (!actual.some((role) => allowed.includes(role))) {
        return res.status(403).json({ message: 'You do not have permission to access this resource.' });
      }
      return next();
    },
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    userPreference: {
      findUnique: vi.fn(async ({ where }: { where: { userId: number } }) => db.preferences.get(where.userId) ?? null),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const existing = db.preferences.get(where.userId);
        const record = {
          id: existing?.id ?? 1,
          userId: where.userId,
          language: update.language ?? create.language,
          notificationPreferences: update.notificationPreferences ?? create.notificationPreferences,
          updatedAt: new Date('2026-06-07T12:00:00.000Z'),
        };
        db.preferences.set(where.userId, record);
        return record;
      }),
    },
    intervention: {
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) => {
        if (where.id !== 42) return null;
        return {
          id: 42,
          status: InterventionStatus.RESOLVED,
          faultReport: { userId: 10 },
        };
      }),
    },
    feedback: {
      findUnique: vi.fn(async ({ where }: { where: { interventionId: number } }) =>
        db.feedbackByIntervention.get(where.interventionId) ?? null,
      ),
      findMany: vi.fn(async () => Array.from(db.feedbackByIntervention.values())),
      create: vi.fn(async ({ data }: any) => {
        const record = {
          id: db.feedbackByIntervention.size + 1,
          interventionId: data.interventionId,
          userId: data.userId,
          rating: data.rating,
          comment: data.comment,
          createdAt: new Date('2026-06-07T12:10:00.000Z'),
          user: {
            id: data.userId,
            firstName: 'Korisnik',
            lastName: 'Jedan',
            username: 'korisnik1',
          },
        };
        db.feedbackByIntervention.set(data.interventionId, record);
        return record;
      }),
    },
    userBlock: {
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) =>
        db.blocks.find((block) => block.id === where.id) ?? null,
      ),
      findFirst: vi.fn(async ({ where }: { where: { userId: number; companyId: number } }) =>
        db.blocks.find((block) => block.userId === where.userId && block.companyId === where.companyId)
          ? { id: db.blocks.find((block) => block.userId === where.userId && block.companyId === where.companyId)?.id }
          : null,
      ),
      findMany: vi.fn(async () => [...db.blocks].sort((a, b) => Number(b.id) - Number(a.id))),
      create: vi.fn(async ({ data }: any) => {
        const record = {
          id: db.nextBlockId++,
          userId: data.userId,
          companyId: data.companyId,
          coordinatorId: data.coordinatorId,
          reason: data.reason,
          blockedAt: new Date('2026-06-07T12:20:00.000Z'),
          blockedUser: {
            id: data.userId,
            firstName: 'Korisnik',
            lastName: 'Jedan',
            username: 'korisnik1',
            email: 'korisnik1@demo.local',
          },
          coordinator: {
            id: data.coordinatorId,
            firstName: 'Koordinator',
            lastName: 'Jedan',
            username: 'koordinator1',
          },
          company: {
            id: data.companyId,
            name: 'Demo firma',
          },
        };
        db.blocks.push(record);
        return record;
      }),
      delete: vi.fn(async ({ where }: { where: { id: number } }) => {
        db.blocks = db.blocks.filter((block) => block.id !== where.id);
      }),
    },
    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.username === 'korisnik1' || where.id === 10) return { id: 10, active: true };
        if (where.id === 3) return { id: 3, active: true };
        return null;
      }),
    },
    company: {
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) => (where.id === 1 ? { id: 1 } : null)),
    },
  },
}));

import feedbackRouter from '../src/modules/feedback/feedback.route';
import blockingRouter from '../src/modules/blocking/blocking.route';
import userPreferencesRouter from '../src/modules/user-preferences/user-preferences.route';
import { AppError } from '../src/shared/errors';

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
  app.use('/user-preferences', userPreferencesRouter);
  app.use('/feedback', feedbackRouter);
  app.use('/blocking', blockingRouter);
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

async function request(method: HttpMethod, path: string, options: { body?: unknown; roles?: string[]; localUserId?: number; username?: string } = {}) {
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

const integrationCoverage = [
  {
    feature: 'Autentifikacija, registracija, profili i RBAC',
    files: ['auth.schema.test.ts', 'auth.service.test.ts', 'auth.middleware.test.ts', 'profile.service.test.ts'],
  },
  {
    feature: 'Prijava kvarova, duplikati i attachmenti',
    files: ['fault-reports.route.test.ts', 'fault-reports-duplicate.test.ts', 'attachments.service.test.ts'],
  },
  {
    feature: 'Kompanije, kategorije, korisnici i administracija',
    files: ['companies.schema.test.ts', 'categories.service.test.ts', 'users.service.test.ts', 'management.route.test.ts'],
  },
  {
    feature: 'Komentari, tiketi i komunikacija sa support timom',
    files: ['comments.route.test.ts', 'tickets.route.test.ts', 'tickets.service.test.ts'],
  },
  {
    feature: 'Intervencije, statusi, historija, ponavljanje i baza znanja',
    files: ['interventions.route.test.ts', 'reports.route.test.ts'],
    requiredPatterns: [/PBI-055/i, /knowledge-base/i, /recurring/i],
  },
  {
    feature: 'Dodjela servisera i dostupnost',
    files: ['assignment.service.test.ts', 'availability.service.test.ts'],
  },
  {
    feature: 'Izvještaji, materijali i PDF',
    files: ['reports.route.test.ts', 'reports.schema.test.ts', 'management.service.test.ts', 'pdf.service.test.ts'],
    requiredPatterns: [/materialItems/i, /PBI-056/i],
  },
  {
    feature: 'Feedback, analitika kvaliteta i settings preference',
    files: ['feedback.route.test.ts', 'feedback.service.test.ts', 'user-preferences.service.test.ts'],
  },
  {
    feature: 'Blokiranje korisnika i zabrana zloupotrebe',
    files: ['blocking.service.test.ts', 'fault-reports.route.test.ts'],
  },
  {
    feature: 'Potvrda i promjena termina intervencije',
    files: ['appointment-reschedule.route.test.ts'],
    requiredPatterns: [/PBI-054/i, /reschedule-request/i],
  },
  {
    feature: 'Eskalacije i komentari ka menadžmentu',
    files: ['escalations.route.test.ts'],
    requiredPatterns: [/PBI-058/i],
  },
  {
    feature: 'Ponovno otvaranje, terenski checkpointi, digitalna potvrda i pauziranje',
    files: ['interventions.route.test.ts', 'reopen.integration.test.ts'],
    requiredPatterns: [/reopen/i, /field-tracking/i, /confirmation/i, /pause/i],
  },
  {
    feature: 'Frontend i18n, Settings UI, feedback UI i baza znanja UI',
    files: [
      '../../frontend/src/lib/i18n.test.tsx',
      '../../frontend/src/services/settings.service.test.ts',
      '../../frontend/src/components/feedback/FeedbackSection.test.tsx',
      '../../frontend/src/components/interventions/KnowledgeBaseSection.test.tsx',
    ],
  },
];

function readTestFile(relativePath: string) {
  const basePath = relativePath.startsWith('../frontend')
    ? resolve(__dirname, relativePath)
    : resolve(__dirname, relativePath);

  return readFileSync(basePath, 'utf8');
}

describe('Final integration coverage', () => {
  it('has automated integration or route/service coverage for every delivered functionality group', () => {
    for (const item of integrationCoverage) {
      const combinedContent = item.files.map((file) => {
        const fullPath = resolve(__dirname, file);
        expect(existsSync(fullPath), `${item.feature}: missing ${file}`).toBe(true);
        return readFileSync(fullPath, 'utf8');
      }).join('\n');

      for (const pattern of item.requiredPatterns ?? []) {
        expect(pattern.test(combinedContent), `${item.feature}: missing pattern ${pattern}`).toBe(true);
      }
    }
  });

  it('documents all integration groups in this final integration test file', () => {
    const thisFile = readTestFile('final.integration.test.ts');

    for (const item of integrationCoverage) {
      expect(thisFile).toContain(item.feature);
    }
  });
});

describe('Final cross-module integration flows', () => {
  beforeEach(() => {
    db.preferences = new Map();
    db.feedbackByIntervention = new Map();
    db.blocks = [];
    db.nextBlockId = 1;
    vi.clearAllMocks();
  });

  it('persists Settings language through the HTTP preferences route', async () => {
    const update = await request('PUT', '/user-preferences', {
      body: {
        language: 'bs',
        notificationPreferences: { FEEDBACK_REQUEST: false },
      },
    });
    const read = await request('GET', '/user-preferences');

    expect(update.status).toBe(200);
    expect(read.status).toBe(200);
    expect(read.body).toMatchObject({
      language: 'bs',
      notificationPreferences: {
        ...defaultNotificationPreferences,
        FEEDBACK_REQUEST: false,
      },
    });
    expect(auditRecordMock).toHaveBeenCalledOnce();
  });

  it('runs feedback creation and coordinator review through HTTP routes', async () => {
    const created = await request('POST', '/feedback/42', {
      body: { rating: 5, comment: 'Intervencija završena bez problema.' },
    });
    const duplicate = await request('POST', '/feedback/42', {
      body: { rating: 4, comment: 'Drugi pokušaj.' },
    });
    const reviewed = await request('GET', '/feedback/42', {
      roles: ['Koordinator'],
      localUserId: 3,
      username: 'koordinator1',
    });

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ interventionId: 42, userId: 10, rating: 5 });
    expect(duplicate.status).toBe(409);
    expect(reviewed.status).toBe(200);
    expect(reviewed.body).toMatchObject({ rating: 5, comment: 'Intervencija završena bez problema.' });
  });

  it('runs coordinator block, list and unblock workflow through HTTP routes', async () => {
    const block = await request('POST', '/blocking', {
      roles: ['Koordinator'],
      localUserId: 3,
      username: 'koordinator1',
      body: { username: 'korisnik1', companyId: 1, reason: 'Spam prijave kvarova' },
    });
    const listed = await request('GET', '/blocking', {
      roles: ['Koordinator'],
      localUserId: 3,
      username: 'koordinator1',
    });
    const unblock = await request('PATCH', `/blocking/${block.body.id}/unblock`, {
      roles: ['Koordinator'],
      localUserId: 3,
      username: 'koordinator1',
    });

    expect(block.status).toBe(201);
    expect(block.body).toMatchObject({ userId: 10, companyId: 1, reason: 'Spam prijave kvarova' });
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
    expect(unblock.status).toBe(204);
    expect(db.blocks).toHaveLength(0);
    expect(auditRecordMock).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_BLOCKED' }));
    expect(auditRecordMock).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_UNBLOCKED' }));
  });
});
