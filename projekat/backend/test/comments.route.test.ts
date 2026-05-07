import express from 'express';
import type { AddressInfo } from 'node:net';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Prisma mocks (hoisted so vi.mock can reference them) ────────────────────

const {
  interventionCommentFindManyMock,
  interventionCommentCreateMock,
  interventionFindUniqueMock,
  interventionFindFirstMock,
} = vi.hoisted(() => ({
  interventionCommentFindManyMock: vi.fn(),
  interventionCommentCreateMock: vi.fn(),
  interventionFindUniqueMock: vi.fn(),
  interventionFindFirstMock: vi.fn(),
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    interventionComment: {
      findMany: interventionCommentFindManyMock,
      create: interventionCommentCreateMock,
    },
    intervention: {
      findUnique: interventionFindUniqueMock,
      findFirst: interventionFindFirstMock,
    },
  },
}));

// ─── Import router AFTER mocks ───────────────────────────────────────────────

import commentsRouter from '../src/modules/comments/comments.route';

// ─── Types ───────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST';

type TestResponse = {
  status: number;
  body: unknown;
};

type UserOverrides = {
  localUserId?: number;
  roles?: string[];
};

// ─── Test app factory ────────────────────────────────────────────────────────

function createApp(userOverrides: UserOverrides = {}) {
  const app = express();
  app.use(express.json());

  // Simulate auth middleware — mirrors what interventions.route.test.ts does
  app.use((req, _res, next) => {
    req.user = {
      id: 'kc-coordinator-001',
      localUserId: userOverrides.localUserId ?? 2,
      username: 'milan.koordinator',
      roles: userOverrides.roles ?? ['Koordinator'],
    };
    next();
  });

  app.use('/comments', commentsRouter);
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
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    return {
      status: response.status,
      body: text ? (JSON.parse(text) as unknown) : null,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const AUTHOR_FIXTURE = {
  firstName: 'Milan',
  lastName: 'Koordinator',
  username: 'milan.koordinator',
};

const COMMENT_FIXTURE = {
  id: 1,
  interventionId: 5,
  authorId: 2,
  text: 'Kvar lociran, servisiranje u toku.',
  createdAt: new Date('2026-05-06T10:00:00.000Z'),
  author: AUTHOR_FIXTURE,
};

const INTERVENTION_FIXTURE = { id: 5 };

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /comments/intervention/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    interventionFindFirstMock.mockResolvedValue(null);
  });

  it('vraca listu komentara za validnu intervenciju', async () => {
    interventionCommentFindManyMock.mockResolvedValue([COMMENT_FIXTURE]);

    const response = await request('GET', '/comments/intervention/5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      expect.objectContaining({
        id: 1,
        text: 'Kvar lociran, servisiranje u toku.',
        author: expect.objectContaining({ username: 'milan.koordinator' }),
      }),
    ]);
  });

  it('vraca praznu listu kada intervencija nema komentara', async () => {
    interventionCommentFindManyMock.mockResolvedValue([]);

    const response = await request('GET', '/comments/intervention/5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('sortira komentare kronoloski uzlazno', async () => {
    interventionCommentFindManyMock.mockResolvedValue([COMMENT_FIXTURE]);

    await request('GET', '/comments/intervention/5');

    expect(interventionCommentFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'asc' },
      }),
    );
  });

  it('filtrira komentare po interventionId', async () => {
    interventionCommentFindManyMock.mockResolvedValue([]);

    await request('GET', '/comments/intervention/42');

    expect(interventionCommentFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { interventionId: 42 },
      }),
    );
  });

  it('vraca 400 za nevazeci interventionId (string)', async () => {
    const response = await request('GET', '/comments/intervention/nije-broj');

    expect(response.status).toBe(400);
    expect(interventionCommentFindManyMock).not.toHaveBeenCalled();
  });

  it('vraca 400 za interventionId 0', async () => {
    const response = await request('GET', '/comments/intervention/0');

    expect(response.status).toBe(400);
    expect(interventionCommentFindManyMock).not.toHaveBeenCalled();
  });

  it('vraca 400 za negativan interventionId', async () => {
    const response = await request('GET', '/comments/intervention/-1');

    expect(response.status).toBe(400);
    expect(interventionCommentFindManyMock).not.toHaveBeenCalled();
  });

  it('vraca 500 kada baza podataka baci gresku', async () => {
    interventionCommentFindManyMock.mockRejectedValue(new Error('DB connection lost'));

    const response = await request('GET', '/comments/intervention/5');

    expect(response.status).toBe(500);
  });

  it('ukljucuje ime, prezime i username autora u odgovoru', async () => {
    interventionCommentFindManyMock.mockResolvedValue([COMMENT_FIXTURE]);

    const response = await request('GET', '/comments/intervention/5');

    expect(interventionCommentFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          author: expect.objectContaining({
            select: expect.objectContaining({
              firstName: true,
              lastName: true,
              username: true,
            }),
          }),
        }),
      }),
    );
  });

  it('dozvoljava korisniku citanje komentara na intervenciji koju je prijavio', async () => {
    interventionFindFirstMock.mockResolvedValue({ id: 5 });
    interventionCommentFindManyMock.mockResolvedValue([COMMENT_FIXTURE]);

    const response = await request('GET', '/comments/intervention/5', {
      user: { localUserId: 4, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(200);
    expect(interventionFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: 5,
        faultReport: {
          is: {
            userId: 4,
          },
        },
      },
      select: { id: true },
    });
  });

  it('odbija korisniku citanje komentara na tudjoj intervenciji', async () => {
    interventionFindFirstMock.mockResolvedValue(null);

    const response = await request('GET', '/comments/intervention/5', {
      user: { localUserId: 4, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(403);
    expect(interventionCommentFindManyMock).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /comments/intervention/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    interventionFindFirstMock.mockResolvedValue(null);
    interventionFindUniqueMock.mockResolvedValue(INTERVENTION_FIXTURE);
    interventionCommentCreateMock.mockResolvedValue(COMMENT_FIXTURE);
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it('koordinator moze uspjesno dodati komentar', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Komentar koordinatora.' },
      user: { localUserId: 2, roles: ['Koordinator'] },
    });

    expect(response.status).toBe(201);
    expect(interventionCommentCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          text: 'Komentar koordinatora.',
          interventionId: 5,
          authorId: 2,
        }),
      }),
    );
  });

  it('serviser moze uspjesno dodati komentar', async () => {
    interventionCommentCreateMock.mockResolvedValue({
      ...COMMENT_FIXTURE,
      authorId: 3,
      text: 'Serviser je stigao na teren.',
      author: { firstName: 'Marko', lastName: 'Serviser', username: 'marko.serviser' },
    });

    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Serviser je stigao na teren.' },
      user: { localUserId: 3, roles: ['Serviser'] },
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      text: 'Serviser je stigao na teren.',
    });
  });

  it('odgovor sadrzi kreirani komentar s podacima autora', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Test komentar.' },
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      text: expect.any(String),
      author: expect.objectContaining({
        firstName: expect.any(String),
        lastName: expect.any(String),
        username: expect.any(String),
      }),
    });
  });

  it('trimuje whitespace s pocetka i kraja teksta komentara', async () => {
    await request('POST', '/comments/intervention/5', {
      body: { text: '   Komentar sa razmacima.   ' },
    });

    expect(interventionCommentCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          text: 'Komentar sa razmacima.',
        }),
      }),
    );
  });

  it('prihvata komentar s tacno jednim karakterom', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'X' },
    });

    expect(response.status).toBe(201);
  });

  // ── Validation — prazni komentari ───────────────────────────────────────────

  it('odbija prazan tekst komentara (prazni string)', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: '' },
    });

    expect(response.status).toBe(400);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  it('odbija komentar koji sadrzi samo razmake', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: '   ' },
    });

    expect(response.status).toBe(400);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  it('odbija zahtjev bez text polja', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: {},
    });

    expect(response.status).toBe(400);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  it('odbija text koji nije string (broj)', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 123 },
    });

    expect(response.status).toBe(400);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  // ── Autorizacija ─────────────────────────────────────────────────────────────

  it('dozvoljava korisniku komentar na intervenciji koju je prijavio', async () => {
    interventionFindFirstMock.mockResolvedValue({ id: 5 });

    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Komentar obicnog korisnika.' },
      user: { localUserId: 4, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(201);
    expect(interventionCommentCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          text: 'Komentar obicnog korisnika.',
          interventionId: 5,
          authorId: 4,
        }),
      }),
    );
  });

  it('odbija korisnikov komentar na tudjoj intervenciji', async () => {
    interventionFindFirstMock.mockResolvedValue(null);

    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Komentar obicnog korisnika.' },
      user: { localUserId: 4, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(403);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  it('odbija korisnika s ulogom Menadzment', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Komentar menadzmenta.' },
      user: { localUserId: 5, roles: ['Menadzment'] },
    });

    expect(response.status).toBe(403);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  it('admin moze dodati komentar', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Admin komentar.' },
      user: { localUserId: 1, roles: ['Admin'] },
    });

    expect(response.status).toBe(201);
    expect(interventionCommentCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          text: 'Admin komentar.',
          interventionId: 5,
          authorId: 1,
        }),
      }),
    );
  });

  it('odbija korisnika bez uloga (prazna lista)', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Komentar bez uloge.' },
      user: { localUserId: 9, roles: [] },
    });

    expect(response.status).toBe(403);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  it('prihvata koordinator ulogu malim slovima', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Test.' },
      user: { localUserId: 2, roles: ['koordinator'] },
    });

    expect(response.status).toBe(201);
  });

  it('prihvata serviser ulogu malim slovima', async () => {
    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Test.' },
      user: { localUserId: 3, roles: ['serviser'] },
    });

    expect(response.status).toBe(201);
  });

  it('vraca 401 kada req.user nema localUserId', async () => {
    const app = express();
    app.use(express.json());
    // Auth middleware bez localUserId
    app.use((req, _res, next) => {
      req.user = { id: 'kc-xyz', roles: ['Koordinator'] };
      next();
    });
    app.use('/comments', commentsRouter);

    const server = app.listen(0);
    const address = server.address() as AddressInfo;

    try {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/comments/intervention/5`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Test bez localUserId.' }),
        },
      );
      expect(response.status).toBe(401);
      expect(interventionCommentCreateMock).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  // ── Validacija ID-a ──────────────────────────────────────────────────────────

  it('vraca 400 za nevazeci interventionId (string) pri POST-u', async () => {
    const response = await request('POST', '/comments/intervention/nije-broj', {
      body: { text: 'Komentar.' },
    });

    expect(response.status).toBe(400);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  it('vraca 400 za interventionId 0 pri POST-u', async () => {
    const response = await request('POST', '/comments/intervention/0', {
      body: { text: 'Komentar.' },
    });

    expect(response.status).toBe(400);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  // ── Intervencija ne postoji ──────────────────────────────────────────────────

  it('vraca 404 kada intervencija ne postoji', async () => {
    interventionFindUniqueMock.mockResolvedValue(null);

    const response = await request('POST', '/comments/intervention/999', {
      body: { text: 'Komentar za nepostojecu intervenciju.' },
    });

    expect(response.status).toBe(404);
    expect(interventionCommentCreateMock).not.toHaveBeenCalled();
  });

  it('provjerava postojanje intervencije po ispravnom ID-u', async () => {
    await request('POST', '/comments/intervention/5', {
      body: { text: 'Komentar.' },
    });

    expect(interventionFindUniqueMock).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { id: true },
    });
  });

  // ── DB greska ────────────────────────────────────────────────────────────────

  it('vraca 500 kada baza podataka baci gresku pri kreiranju', async () => {
    interventionCommentCreateMock.mockRejectedValue(new Error('Deadlock detected'));

    const response = await request('POST', '/comments/intervention/5', {
      body: { text: 'Komentar.' },
    });

    expect(response.status).toBe(500);
  });
});

// ─── GET / (module info endpoint) ────────────────────────────────────────────

describe('GET /comments', () => {
  it('vraca info o modulu i dostupnim endpointima', async () => {
    const response = await request('GET', '/comments/');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      module: 'comments',
      endpoints: expect.arrayContaining([
        expect.stringContaining('GET'),
        expect.stringContaining('POST'),
      ]),
    });
  });
});
