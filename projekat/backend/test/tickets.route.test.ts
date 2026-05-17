import express from 'express';
import type { AddressInfo } from 'node:net';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  ticketCreateMock,
  ticketFindManyMock,
  ticketFindUniqueMock,
  ticketUpdateMock,
  messageCreateMock,
  notificationCreateMock,
  userFindManyMock,
  userFindUniqueMock,
} = vi.hoisted(() => ({
  ticketCreateMock: vi.fn(),
  ticketFindManyMock: vi.fn(),
  ticketFindUniqueMock: vi.fn(),
  ticketUpdateMock: vi.fn(),
  messageCreateMock: vi.fn(),
  notificationCreateMock: vi.fn(),
  userFindManyMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}));

vi.mock('../src/config/database', () => ({
  prisma: {
    ticket: {
      create: ticketCreateMock,
      findMany: ticketFindManyMock,
      findUnique: ticketFindUniqueMock,
      update: ticketUpdateMock,
    },
    message: {
      create: messageCreateMock,
    },
    notification: {
      create: notificationCreateMock,
    },
    user: {
      findMany: userFindManyMock,
      findUnique: userFindUniqueMock,
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../src/middleware/auth.middleware', () => ({
  authenticate: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock('../src/realtime/socket', () => ({
  emitToRole: vi.fn(),
  emitToUser: vi.fn(),
}));

vi.mock('../src/clients/keycloak.client', () => ({
  getKeycloakAdminToken: vi.fn(),
  getKeycloakUserRoleNames: vi.fn(),
}));

import ticketsRouter from '../src/modules/tickets/tickets.route';
import { AppError } from '../src/shared/errors';

type HttpMethod = 'POST';

type TestResponse = {
  status: number;
  body: unknown;
};

type UserOverrides = {
  localUserId?: number;
  roles?: string[];
};

const MESSAGE_RESPONSE = {
  id: 11,
  text: 'Follow-up message',
  createdAt: new Date('2026-05-17T10:00:00.000Z'),
  author: {
    id: 10,
    firstName: 'Nedim',
    lastName: 'Omanovic',
  },
};

function makeTicket(overrides: Record<string, unknown> = {}) {
  return {
    userId: 10,
    title: 'Login issue',
    status: 'OPEN',
    userBlocked: false,
    user: { active: true },
    ...overrides,
  };
}

function createApp(userOverrides: UserOverrides = {}) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = {
      id: 'kc-test-user',
      localUserId: userOverrides.localUserId ?? 10,
      username: 'test.user',
      roles: userOverrides.roles ?? ['Korisnik'],
    };
    next();
  });
  app.use('/tickets', ticketsRouter);
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code });
    }

    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unexpected test error.' });
  });
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

describe('PBI-028 ticket message route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ticketFindUniqueMock.mockResolvedValue(makeTicket());
    messageCreateMock.mockResolvedValue(MESSAGE_RESPONSE);
    notificationCreateMock.mockResolvedValue({
      id: 1,
      userId: 10,
      title: 'Ticket reply',
      text: 'An agent replied',
      type: 'TICKET_REPLY',
      read: false,
      interventionId: null,
      ticketId: 4,
      createdAt: new Date('2026-05-17T10:00:00.000Z'),
    });
  });

  it('allows the ticket owner to send a message to support', async () => {
    const response = await request('POST', '/tickets/4/messages', {
      body: { text: 'Can you help me with this?' },
      user: { localUserId: 10, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(201);
    expect(messageCreateMock).toHaveBeenCalledWith({
      data: {
        ticketId: 4,
        authorId: 10,
        text: 'Can you help me with this?',
      },
      select: expect.any(Object),
    });
  });

  it('allows a support agent to reply to the ticket owner', async () => {
    const response = await request('POST', '/tickets/4/messages', {
      body: { text: 'We are checking this now.' },
      user: { localUserId: 2, roles: ['SupportAgent'] },
    });

    expect(response.status).toBe(201);
    expect(messageCreateMock).toHaveBeenCalledWith({
      data: {
        ticketId: 4,
        authorId: 2,
        text: 'We are checking this now.',
      },
      select: expect.any(Object),
    });
    expect(notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 10,
        title: 'Ticket reply',
        ticketId: 4,
      }),
    });
  });

  it('allows an admin to reply to the ticket owner', async () => {
    const response = await request('POST', '/tickets/4/messages', {
      body: { text: 'Admin reviewed the ticket.' },
      user: { localUserId: 1, roles: ['Admin'] },
    });

    expect(response.status).toBe(201);
    expect(messageCreateMock).toHaveBeenCalledWith({
      data: {
        ticketId: 4,
        authorId: 1,
        text: 'Admin reviewed the ticket.',
      },
      select: expect.any(Object),
    });
  });

  it.each([
    ['ticket owner', { localUserId: 10, roles: ['Korisnik'] }],
    ['support agent', { localUserId: 2, roles: ['SupportAgent'] }],
    ['admin', { localUserId: 1, roles: ['Admin'] }],
  ])('blocks new messages from the %s when the ticket is blocked', async (_label, user) => {
    ticketFindUniqueMock.mockResolvedValue(makeTicket({ userBlocked: true }));

    const response = await request('POST', '/tickets/4/messages', {
      body: { text: 'This should not be sent.' },
      user,
    });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      code: 'FORBIDDEN',
      message: 'This ticket is blocked. New messages are not allowed.',
    });
    expect(messageCreateMock).not.toHaveBeenCalled();
  });
});
