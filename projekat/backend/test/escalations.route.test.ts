/**
 * escalations.route.test.ts
 *
 * Testovi za PBI-058 — Eskalacije i komentari ka menadžmentu za rizične intervencije.
 *
 * Pokriva sve acceptance criteria:
 *  AC-1: Koordinator može označiti intervenciju kao rizičnu uz obavezan razlog.
 *  AC-2: Eskalirana intervencija vidljiva menadžmentu u posebnom pregledu.
 *  AC-3: Eskalacijski komentari odvojeni od običnih komentara.
 *  AC-4: Menadžment može označiti eskalaciju kao pregledanu.
 *  AC-5: Historijska vidljivost — eskalacije ostaju i nakon završetka/otkazivanja.
 *  AC-6: Korisnici bez koordinator/menadžment/admin uloge ne vide eskalacijske komentare.
 */

import express from 'express';
import type { AddressInfo } from 'node:net';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Prisma mocks (hoisted) ─────────────────────────────────────────────────────

const {
  escalationFindManyMock,
  escalationFindUniqueMock,
  escalationCreateMock,
  escalationUpdateMock,
  interventionFindUniqueMock,
} = vi.hoisted(() => ({
  escalationFindManyMock: vi.fn(),
  escalationFindUniqueMock: vi.fn(),
  escalationCreateMock: vi.fn(),
  escalationUpdateMock: vi.fn(),
  interventionFindUniqueMock: vi.fn(),
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    interventionEscalation: {
      findMany: escalationFindManyMock,
      findUnique: escalationFindUniqueMock,
      create: escalationCreateMock,
      update: escalationUpdateMock,
    },
    intervention: {
      findUnique: interventionFindUniqueMock,
    },
  },
}));

// authorizeRoles mock — provjerava role bez stvarnog Keycloaka

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

// ── Import router NAKON mockova ───────────────────────────────────────────────

import escalationsRouter from '../src/modules/escalations/escalations.route';
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
  app.use('/escalations', escalationsRouter);
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

const COORDINATOR_USER = { id: 2, firstName: 'Milan', lastName: 'Koordinator', username: 'milan.koordinator' };
const MANAGEMENT_USER  = { id: 4, firstName: 'Lejla',  lastName: 'Menadzment',  username: 'lejla.menadzment' };

const INTERVENTION_FIXTURE = { id: 20, name: 'Popravak vodovodne instalacije' };

const ESCALATION_FIXTURE = {
  id: 1,
  interventionId: 20,
  escalatedById: 2,
  reason: 'Kašnjenje SLA roka',
  comment: 'Intervencija kasni više od 8 sati. Potrebna hitna akcija.',
  reviewedAt: null,
  reviewedById: null,
  createdAt: new Date('2026-05-31T09:00:00.000Z'),
  escalatedBy: COORDINATOR_USER,
  reviewedBy: null,
};

const REVIEWED_ESCALATION_FIXTURE = {
  ...ESCALATION_FIXTURE,
  id: 2,
  reviewedAt: new Date('2026-05-31T11:00:00.000Z'),
  reviewedById: 4,
  reviewedBy: MANAGEMENT_USER,
};

const ESCALATION_WITH_INTERVENTION = {
  ...ESCALATION_FIXTURE,
  intervention: {
    id: 20,
    name: INTERVENTION_FIXTURE.name,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    companyId: 1,
    company: { name: 'Servis Alfa d.o.o.' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /escalations/:interventionId
// AC-1: Koordinator može označiti intervenciju kao rizičnu uz obavezan razlog.
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /escalations/:interventionId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    interventionFindUniqueMock.mockResolvedValue(INTERVENTION_FIXTURE);
    escalationCreateMock.mockResolvedValue(ESCALATION_FIXTURE);
  });

  // ── Happy path ───────────────────────────────────────────────────────────────

  it('koordinator uspješno kreira eskalaciju (201)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Kašnjenje SLA roka', comment: 'Detalji eskalacije.' },
      user: { localUserId: 2, roles: ['Koordinator'] },
    });

    expect(response.status).toBe(201);
    expect(escalationCreateMock).toHaveBeenCalledOnce();
  });

  it('odgovor sadrži kreiran objekat eskalacije s podacima eskalatora', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Kašnjenje SLA roka', comment: 'Detalji eskalacije.' },
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      reason: expect.any(String),
      comment: expect.any(String),
      escalatedBy: expect.objectContaining({ username: 'milan.koordinator' }),
    });
  });

  it('sprema ispravne podatke u bazu — interventionId, escalatedById, reason, comment', async () => {
    await request('POST', '/escalations/20', {
      body: { reason: 'Rizik gubitka klijenta', comment: 'Klijent prijeti raskidom.' },
      user: { localUserId: 2, roles: ['Koordinator'] },
    });

    expect(escalationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          interventionId: 20,
          escalatedById: 2,
          reason: 'Rizik gubitka klijenta',
          comment: 'Klijent prijeti raskidom.',
        }),
      }),
    );
  });

  it('trimuje whitespace iz razloga i komentara', async () => {
    await request('POST', '/escalations/20', {
      body: { reason: '  Kašnjenje SLA roka  ', comment: '  Detalji.  ' },
    });

    expect(escalationCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: 'Kašnjenje SLA roka',
          comment: 'Detalji.',
        }),
      }),
    );
  });

  it('admin može eskalirati intervenciju', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Sistemski problem', comment: 'Admin detalji.' },
      user: { localUserId: 1, roles: ['Admin'] },
    });

    expect(response.status).toBe(201);
  });

  // AC-1: obavezan razlog
  it('odbija eskalaciju bez razloga (400)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { comment: 'Komentar bez razloga.' },
    });

    expect(response.status).toBe(400);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('odbija eskalaciju bez komentara (400)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Razlog bez komentara' },
    });

    expect(response.status).toBe(400);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('odbija razlog koji je kraći od 5 karaktera (400)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Kk', comment: 'Komentar.' },
    });

    expect(response.status).toBe(400);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('odbija prazan komentar (400)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Validan razlog', comment: '' },
    });

    expect(response.status).toBe(400);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('odbija komentar koji sadrži samo razmake (400)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Validan razlog', comment: '   ' },
    });

    expect(response.status).toBe(400);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('odbija razlog koji je duži od 1000 karaktera (400)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'a'.repeat(1001), comment: 'Komentar.' },
    });

    expect(response.status).toBe(400);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  // ── Autorizacija — AC-6 ──────────────────────────────────────────────────────

  it('serviser ne može eskalirati intervenciju (403)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Razlog serviser', comment: 'Komentar.' },
      user: { localUserId: 3, roles: ['Serviser'] },
    });

    expect(response.status).toBe(403);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('korisnik (Korisnik uloga) ne može eskalirati intervenciju (403)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Razlog korisnik', comment: 'Komentar.' },
      user: { localUserId: 5, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(403);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('menadžment ne može eskalirati intervenciju (403)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Razlog menadzment', comment: 'Komentar.' },
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(403);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('korisnik bez uloga ne može eskalirati (403)', async () => {
    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Razlog bez uloge', comment: 'Komentar.' },
      user: { localUserId: 9, roles: [] },
    });

    expect(response.status).toBe(403);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  // ── Provjera intervencije ────────────────────────────────────────────────────

  it('vraca 404 kada intervencija ne postoji', async () => {
    interventionFindUniqueMock.mockResolvedValue(null);

    const response = await request('POST', '/escalations/999', {
      body: { reason: 'Razlog nepostojece', comment: 'Komentar.' },
    });

    expect(response.status).toBe(404);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('vraca 400 za nevažeći interventionId (string)', async () => {
    const response = await request('POST', '/escalations/nije-broj', {
      body: { reason: 'Razlog', comment: 'Komentar.' },
    });

    expect(response.status).toBe(400);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('vraca 400 za interventionId 0', async () => {
    const response = await request('POST', '/escalations/0', {
      body: { reason: 'Razlog', comment: 'Komentar.' },
    });

    expect(response.status).toBe(400);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  it('vraca 400 za negativan interventionId', async () => {
    const response = await request('POST', '/escalations/-5', {
      body: { reason: 'Razlog', comment: 'Komentar.' },
    });

    expect(response.status).toBe(400);
    expect(escalationCreateMock).not.toHaveBeenCalled();
  });

  // ── Greška baze ──────────────────────────────────────────────────────────────

  it('vraca 500 kada baza baci grešku pri kreiranju', async () => {
    escalationCreateMock.mockRejectedValue(new Error('DB connection lost'));

    const response = await request('POST', '/escalations/20', {
      body: { reason: 'Razlog validan', comment: 'Komentar validan.' },
    });

    expect(response.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /escalations/:interventionId
// AC-2: Eskalirana intervencija vidljiva menadžmentu.
// AC-3: Eskalacijski komentari odvojeni od običnih komentara intervencije.
// AC-6: Korisnici bez dozvoljene uloge ne vide eskalacijske komentare.
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /escalations/:interventionId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    interventionFindUniqueMock.mockResolvedValue(INTERVENTION_FIXTURE);
    escalationFindManyMock.mockResolvedValue([ESCALATION_FIXTURE]);
  });

  // ── Happy path ───────────────────────────────────────────────────────────────

  it('koordinator može dohvatiti eskalacije (200)', async () => {
    const response = await request('GET', '/escalations/20', {
      user: { localUserId: 2, roles: ['Koordinator'] },
    });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('menadžment može dohvatiti eskalacije (200)', async () => {
    const response = await request('GET', '/escalations/20', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(200);
  });

  it('admin može dohvatiti eskalacije (200)', async () => {
    const response = await request('GET', '/escalations/20', {
      user: { localUserId: 1, roles: ['Administrator'] },
    });

    expect(response.status).toBe(200);
  });

  it('vraca eskalacije sortirane kronološki uzlazno', async () => {
    await request('GET', '/escalations/20');

    expect(escalationFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'asc' },
      }),
    );
  });

  it('vraca praznu listu kada nema eskalacija', async () => {
    escalationFindManyMock.mockResolvedValue([]);

    const response = await request('GET', '/escalations/20');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('odgovor sadrži razlog, komentar i podatke eskalatora', async () => {
    const response = await request('GET', '/escalations/20');

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: 'Kašnjenje SLA roka',
          comment: 'Intervencija kasni više od 8 sati. Potrebna hitna akcija.',
          escalatedBy: expect.objectContaining({ username: 'milan.koordinator' }),
        }),
      ]),
    );
  });

  it('filtrira eskalacije po interventionId', async () => {
    await request('GET', '/escalations/20');

    expect(escalationFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { interventionId: 20 },
      }),
    );
  });

  // AC-6: rolne koje NE smiju vidjeti eskalacijske komentare
  it('serviser ne može dohvatiti eskalacije (403)', async () => {
    const response = await request('GET', '/escalations/20', {
      user: { localUserId: 3, roles: ['Serviser'] },
    });

    expect(response.status).toBe(403);
    expect(escalationFindManyMock).not.toHaveBeenCalled();
  });

  it('obični korisnik ne može dohvatiti eskalacije (403)', async () => {
    const response = await request('GET', '/escalations/20', {
      user: { localUserId: 5, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(403);
    expect(escalationFindManyMock).not.toHaveBeenCalled();
  });

  it('agentPodrske ne može dohvatiti eskalacije (403)', async () => {
    const response = await request('GET', '/escalations/20', {
      user: { localUserId: 6, roles: ['AgentPodrske'] },
    });

    expect(response.status).toBe(403);
    expect(escalationFindManyMock).not.toHaveBeenCalled();
  });

  it('korisnik bez uloga ne može dohvatiti eskalacije (403)', async () => {
    const response = await request('GET', '/escalations/20', {
      user: { localUserId: 9, roles: [] },
    });

    expect(response.status).toBe(403);
    expect(escalationFindManyMock).not.toHaveBeenCalled();
  });

  // ── Provjera intervencije ────────────────────────────────────────────────────

  it('vraca 404 kada intervencija ne postoji', async () => {
    interventionFindUniqueMock.mockResolvedValue(null);

    const response = await request('GET', '/escalations/999');

    expect(response.status).toBe(404);
    expect(escalationFindManyMock).not.toHaveBeenCalled();
  });

  it('vraca 400 za nevažeći interventionId', async () => {
    const response = await request('GET', '/escalations/nije-broj');

    expect(response.status).toBe(400);
    expect(escalationFindManyMock).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /escalations/:escalationId/review
// AC-4: Menadžment može označiti eskalaciju kao pregledanu.
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /escalations/:escalationId/review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    escalationFindUniqueMock.mockResolvedValue({ id: 1, reviewedAt: null });
    escalationUpdateMock.mockResolvedValue({
      ...ESCALATION_FIXTURE,
      reviewedAt: new Date('2026-05-31T12:00:00.000Z'),
      reviewedById: 4,
      reviewedBy: MANAGEMENT_USER,
    });
  });

  // ── Happy path ───────────────────────────────────────────────────────────────

  it('menadžment može uspješno pregledati eskalaciju (200)', async () => {
    const response = await request('PATCH', '/escalations/1/review', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(200);
    expect(escalationUpdateMock).toHaveBeenCalledOnce();
  });

  it('admin može pregledati eskalaciju (200)', async () => {
    const response = await request('PATCH', '/escalations/1/review', {
      user: { localUserId: 1, roles: ['Administrator'] },
    });

    expect(response.status).toBe(200);
  });

  it('update postavlja reviewedAt i reviewedById', async () => {
    await request('PATCH', '/escalations/1/review', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(escalationUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          reviewedAt: expect.any(Date),
          reviewedById: 4,
        }),
      }),
    );
  });

  it('odgovor sadrži ažuriranu eskalaciju s reviewedBy podacima', async () => {
    const response = await request('PATCH', '/escalations/1/review', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.body).toMatchObject({
      id: 1,
      reviewedBy: expect.objectContaining({ username: 'lejla.menadzment' }),
    });
  });

  // ── Idempotencija ────────────────────────────────────────────────────────────

  it('odbija pregled već pregledane eskalacije (400)', async () => {
    escalationFindUniqueMock.mockResolvedValue({
      id: 1,
      reviewedAt: new Date('2026-05-31T10:00:00.000Z'),
    });

    const response = await request('PATCH', '/escalations/1/review', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(400);
    expect(escalationUpdateMock).not.toHaveBeenCalled();
  });

  // ── Autorizacija — AC-6 ──────────────────────────────────────────────────────

  it('koordinator ne može pregledati eskalaciju (403)', async () => {
    const response = await request('PATCH', '/escalations/1/review', {
      user: { localUserId: 2, roles: ['Koordinator'] },
    });

    expect(response.status).toBe(403);
    expect(escalationUpdateMock).not.toHaveBeenCalled();
  });

  it('serviser ne može pregledati eskalaciju (403)', async () => {
    const response = await request('PATCH', '/escalations/1/review', {
      user: { localUserId: 3, roles: ['Serviser'] },
    });

    expect(response.status).toBe(403);
    expect(escalationUpdateMock).not.toHaveBeenCalled();
  });

  it('obični korisnik ne može pregledati eskalaciju (403)', async () => {
    const response = await request('PATCH', '/escalations/1/review', {
      user: { localUserId: 5, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(403);
    expect(escalationUpdateMock).not.toHaveBeenCalled();
  });

  // ── Provjera eskalacije ──────────────────────────────────────────────────────

  it('vraca 404 kada eskalacija ne postoji', async () => {
    escalationFindUniqueMock.mockResolvedValue(null);

    const response = await request('PATCH', '/escalations/999/review', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(404);
    expect(escalationUpdateMock).not.toHaveBeenCalled();
  });

  it('vraca 400 za nevažeći escalationId (string)', async () => {
    const response = await request('PATCH', '/escalations/nije-broj/review', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(400);
    expect(escalationUpdateMock).not.toHaveBeenCalled();
  });

  it('vraca 400 za escalationId 0', async () => {
    const response = await request('PATCH', '/escalations/0/review', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(400);
    expect(escalationUpdateMock).not.toHaveBeenCalled();
  });

  it('vraca 500 kada baza baci grešku pri ažuriranju', async () => {
    escalationUpdateMock.mockRejectedValue(new Error('Constraint violation'));

    const response = await request('PATCH', '/escalations/1/review', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /escalations
// AC-2: Menadžment dashboard — poseban pregled svih eskaliranih intervencija.
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /escalations (management dashboard list)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    escalationFindManyMock.mockResolvedValue([ESCALATION_WITH_INTERVENTION]);
  });

  // ── Happy path ───────────────────────────────────────────────────────────────

  it('menadžment može dohvatiti sve eskalacije (200)', async () => {
    const response = await request('GET', '/escalations', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('admin može dohvatiti sve eskalacije (200)', async () => {
    const response = await request('GET', '/escalations', {
      user: { localUserId: 1, roles: ['Admin'] },
    });

    expect(response.status).toBe(200);
  });

  it('podrazumijevano dohvata samo nepregledane eskalacije', async () => {
    await request('GET', '/escalations', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(escalationFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { reviewedAt: null },
      }),
    );
  });

  it('uključuje i pregledane eskalacije uz ?includeReviewed=true', async () => {
    escalationFindManyMock.mockResolvedValue([
      ESCALATION_WITH_INTERVENTION,
      { ...ESCALATION_WITH_INTERVENTION, ...REVIEWED_ESCALATION_FIXTURE },
    ]);

    const response = await request('GET', '/escalations?includeReviewed=true', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(200);
    expect(escalationFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('odgovor uključuje podatke o intervenciji za svaku eskalaciju', async () => {
    const response = await request('GET', '/escalations', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          intervention: expect.objectContaining({
            id: 20,
            name: 'Popravak vodovodne instalacije',
            company: expect.objectContaining({ name: 'Servis Alfa d.o.o.' }),
          }),
        }),
      ]),
    );
  });

  it('sortira eskalacije po datumu kreiranja silazno (najnovije prve)', async () => {
    await request('GET', '/escalations', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(escalationFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('vraca praznu listu kada nema nepregledanih eskalacija', async () => {
    escalationFindManyMock.mockResolvedValue([]);

    const response = await request('GET', '/escalations', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  // AC-6 — Rolne koje ne smiju vidjeti eskalacije

  it('koordinator ne može pristupiti listi svih eskalacija (403)', async () => {
    const response = await request('GET', '/escalations', {
      user: { localUserId: 2, roles: ['Koordinator'] },
    });

    expect(response.status).toBe(403);
    expect(escalationFindManyMock).not.toHaveBeenCalled();
  });

  it('serviser ne može pristupiti listi svih eskalacija (403)', async () => {
    const response = await request('GET', '/escalations', {
      user: { localUserId: 3, roles: ['Serviser'] },
    });

    expect(response.status).toBe(403);
    expect(escalationFindManyMock).not.toHaveBeenCalled();
  });

  it('obični korisnik ne može pristupiti listi svih eskalacija (403)', async () => {
    const response = await request('GET', '/escalations', {
      user: { localUserId: 5, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(403);
    expect(escalationFindManyMock).not.toHaveBeenCalled();
  });

  // ── AC-5: Historijska vidljivost ─────────────────────────────────────────────

  it('eskalacije su vidljive i za završene (RESOLVED) intervencije', async () => {
    escalationFindManyMock.mockResolvedValue([
      {
        ...ESCALATION_WITH_INTERVENTION,
        intervention: { ...ESCALATION_WITH_INTERVENTION.intervention, status: 'RESOLVED' },
      },
    ]);

    const response = await request('GET', '/escalations?includeReviewed=true', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(200);
    const body = response.body as Array<{ intervention: { status: string } }>;
    expect(body[0].intervention.status).toBe('RESOLVED');
  });

  it('eskalacije su vidljive i za otkazane (CANCELLED) intervencije', async () => {
    escalationFindManyMock.mockResolvedValue([
      {
        ...ESCALATION_WITH_INTERVENTION,
        intervention: { ...ESCALATION_WITH_INTERVENTION.intervention, status: 'CANCELLED' },
      },
    ]);

    const response = await request('GET', '/escalations?includeReviewed=true', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(200);
    const body = response.body as Array<{ intervention: { status: string } }>;
    expect(body[0].intervention.status).toBe('CANCELLED');
  });

  // ── DB greška ────────────────────────────────────────────────────────────────

  it('vraca 500 kada baza baci grešku', async () => {
    escalationFindManyMock.mockRejectedValue(new Error('DB timeout'));

    const response = await request('GET', '/escalations', {
      user: { localUserId: 4, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(500);
  });
});