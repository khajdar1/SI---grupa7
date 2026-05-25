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
  ticketCategoryFindManyMock,
  ticketCategoryFindUniqueMock,
  userFindManyMock,
  userFindUniqueMock,
} = vi.hoisted(() => ({
  ticketCreateMock: vi.fn(),
  ticketFindManyMock: vi.fn(),
  ticketFindUniqueMock: vi.fn(),
  ticketUpdateMock: vi.fn(),
  messageCreateMock: vi.fn(),
  notificationCreateMock: vi.fn(),
  ticketCategoryFindManyMock: vi.fn(),
  ticketCategoryFindUniqueMock: vi.fn(),
  userFindManyMock: vi.fn().mockResolvedValue([]),
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
    ticketCategory: {
      findMany: ticketCategoryFindManyMock,
      findUnique: ticketCategoryFindUniqueMock,
    },
    user: {
      findMany: userFindManyMock,
      findUnique: userFindUniqueMock,
    },
    userPreference: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
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
  isUserViewingTicket: vi.fn(),
}));

vi.mock('../src/clients/keycloak.client', () => ({
  findKeycloakUserIdByUsernameOrEmail: vi.fn(),
  getKeycloakAdminToken: vi.fn(),
  getKeycloakUserRoleNames: vi.fn(),
}));

import ticketsRouter from '../src/modules/tickets/tickets.route';
import {
  findKeycloakUserIdByUsernameOrEmail,
  getKeycloakAdminToken,
  getKeycloakUserRoleNames,
} from '../src/clients/keycloak.client';
import { emitToRole, emitToUser } from '../src/realtime/socket';
import { isUserViewingTicket } from '../src/realtime/socket';
import { AppError } from '../src/shared/errors';

type HttpMethod = 'GET' | 'POST';

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

const TICKET_RESPONSE = {
  id: 4,
  userId: 10,
  title: 'Login issue',
  categoryId: 1,
  category: { name: 'Tehničko pitanje' },
  status: 'OPEN',
  userBlocked: false,
  createdAt: new Date('2026-05-17T09:00:00.000Z'),
  updatedAt: new Date('2026-05-17T09:00:00.000Z'),
};

const getKeycloakAdminTokenMock = vi.mocked(getKeycloakAdminToken);
const getKeycloakUserRoleNamesMock = vi.mocked(getKeycloakUserRoleNames);
const findKeycloakUserIdByUsernameOrEmailMock = vi.mocked(findKeycloakUserIdByUsernameOrEmail);
const emitToRoleMock = vi.mocked(emitToRole);
const emitToUserMock = vi.mocked(emitToUser);
const isUserViewingTicketMock = vi.mocked(isUserViewingTicket);

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

describe('PBI-029 ticket creation notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUserViewingTicketMock.mockReturnValue(false);
    ticketCreateMock.mockResolvedValue(TICKET_RESPONSE);
    ticketCategoryFindUniqueMock.mockResolvedValue({
      id: 1,
      name: 'Tehničko pitanje',
      active: true,
    });
    messageCreateMock.mockResolvedValue({
      ...MESSAGE_RESPONSE,
      text: 'I cannot sign in.',
    });
    userFindManyMock.mockResolvedValue([
      { id: 1, externalIdentities: [{ providerSubject: 'kc-admin' }] },
      { id: 2, externalIdentities: [{ providerSubject: 'kc-agent' }] },
      { id: 3, externalIdentities: [{ providerSubject: 'kc-user' }] },
    ]);
    getKeycloakAdminTokenMock.mockResolvedValue('admin-token');
    findKeycloakUserIdByUsernameOrEmailMock.mockResolvedValue(null);
    getKeycloakUserRoleNamesMock.mockImplementation(async (_token, keycloakSub) => {
      if (keycloakSub === 'kc-admin') {
        return ['Admin'];
      }

      if (keycloakSub === 'kc-agent') {
        return ['SupportAgent'];
      }

      return ['Korisnik'];
    });
    notificationCreateMock.mockImplementation(async ({ data }) => ({
      id: Number(data.userId) + 100,
      userId: data.userId,
      title: data.title,
      text: data.text,
      type: data.type,
      read: false,
      interventionId: data.interventionId ?? null,
      ticketId: data.ticketId ?? null,
      createdAt: new Date('2026-05-17T09:01:00.000Z'),
    }));
  });

  it('creates persisted notifications for admins and support agents when a ticket is created', async () => {
    const response = await request('POST', '/tickets', {
      body: {
        title: 'Login issue',
        categoryId: 1,
        message: 'I cannot sign in.',
      },
      user: { localUserId: 10, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(201);
    expect(notificationCreateMock).toHaveBeenCalledTimes(2);
    expect(notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 1,
        title: 'New support ticket',
        text: 'Ticket #4: Login issue (Tehničko pitanje)',
        type: 'NEW_TICKET',
        ticketId: 4,
      }),
    });
    expect(notificationCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 2,
        title: 'New support ticket',
        text: 'Ticket #4: Login issue (Tehničko pitanje)',
        type: 'NEW_TICKET',
        ticketId: 4,
      }),
    });
    expect(emitToUserMock).toHaveBeenCalledWith(1, 'notification:new', expect.objectContaining({ userId: 1 }));
    expect(emitToUserMock).toHaveBeenCalledWith(2, 'notification:new', expect.objectContaining({ userId: 2 }));
  });
});

describe('PBI-029 ticket category route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUserViewingTicketMock.mockReturnValue(false);
    ticketCategoryFindManyMock.mockResolvedValue([
      { id: 1, name: 'Ostalo', active: true },
      { id: 2, name: 'Tehničko pitanje', active: true },
    ]);
  });

  it('returns active ticket categories from the database', async () => {
    const response = await request('GET', '/tickets/categories', {
      user: { localUserId: 10, roles: ['Korisnik'] },
    });

    expect(response.status).toBe(200);
    expect(ticketCategoryFindManyMock).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });
    expect(response.body).toEqual([
      { id: 1, name: 'Ostalo', active: true },
      { id: 2, name: 'Tehničko pitanje', active: true },
    ]);
  });
});

describe('PBI-029 admin review candidate route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUserViewingTicketMock.mockReturnValue(false);
    userFindManyMock.mockResolvedValue([
      {
        id: 1,
        firstName: 'Aida',
        lastName: 'Admin',
        username: 'aida.admin',
        email: 'aida@example.com',
        externalIdentities: [{ providerSubject: 'kc-admin' }],
      },
      {
        id: 2,
        firstName: 'Stale',
        lastName: 'Identity',
        username: 'stale.identity',
        email: 'stale@example.com',
        externalIdentities: [{ providerSubject: 'kc-stale' }],
      },
      {
        id: 3,
        firstName: 'Regular',
        lastName: 'User',
        username: 'regular.user',
        email: 'regular@example.com',
        externalIdentities: [{ providerSubject: 'kc-user' }],
      },
    ]);
    getKeycloakAdminTokenMock.mockResolvedValue('admin-token');
    findKeycloakUserIdByUsernameOrEmailMock.mockImplementation(async (_token, input) => {
      if (input.username === 'stale.identity') {
        return 'kc-admin-resolved';
      }

      return null;
    });
    getKeycloakUserRoleNamesMock.mockImplementation(async (_token, keycloakSub) => {
      if (keycloakSub === 'kc-admin') {
        return ['Admin'];
      }

      if (keycloakSub === 'kc-stale') {
        throw new Error('Failed to load Keycloak role mappings for user.');
      }

      if (keycloakSub === 'kc-admin-resolved') {
        return ['Admin'];
      }

      return ['Korisnik'];
    });
  });

  it('resolves stale Keycloak identities by username or email when listing admins', async () => {
    const response = await request('GET', '/tickets/admin-review/admins', {
      user: { localUserId: 2, roles: ['SupportAgent'] },
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 1,
        firstName: 'Aida',
        lastName: 'Admin',
        username: 'aida.admin',
        email: 'aida@example.com',
      },
      {
        id: 2,
        firstName: 'Stale',
        lastName: 'Identity',
        username: 'stale.identity',
        email: 'stale@example.com',
      },
    ]);
  });

  it('does not notify an admin review recipient who is already viewing the chat', async () => {
    ticketFindUniqueMock.mockResolvedValue({ id: 4, title: 'Login issue' });
    userFindUniqueMock.mockResolvedValue({
      id: 1,
      username: 'aida.admin',
      email: 'aida@example.com',
      active: true,
      externalIdentities: [{ providerSubject: 'kc-admin' }],
    });
    isUserViewingTicketMock.mockImplementation((ticketId, userId) => ticketId === 4 && userId === 1);

    const response = await request('POST', '/tickets/4/admin-review', {
      body: { adminUserId: 1, reason: 'Please review this conversation.' },
      user: { localUserId: 2, roles: ['SupportAgent'] },
    });

    expect(response.status).toBe(201);
    expect(notificationCreateMock).not.toHaveBeenCalled();
    expect(emitToUserMock).not.toHaveBeenCalledWith(1, 'notification:new', expect.anything());
  });
});

describe('PBI-028 ticket message route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isUserViewingTicketMock.mockReturnValue(false);
    ticketFindUniqueMock.mockResolvedValue(makeTicket());
    messageCreateMock.mockResolvedValue(MESSAGE_RESPONSE);
    userFindManyMock.mockResolvedValue([
      { id: 1, externalIdentities: [{ providerSubject: 'kc-admin' }] },
      { id: 2, externalIdentities: [{ providerSubject: 'kc-agent' }] },
    ]);
    getKeycloakAdminTokenMock.mockResolvedValue('admin-token');
    findKeycloakUserIdByUsernameOrEmailMock.mockResolvedValue(null);
    getKeycloakUserRoleNamesMock.mockImplementation(async (_token, keycloakSub) =>
      keycloakSub === 'kc-admin' ? ['Admin'] : ['SupportAgent'],
    );
    notificationCreateMock.mockImplementation(async ({ data }) => ({
      id: Number(data.userId) + 100,
      userId: data.userId,
      title: data.title,
      text: data.text,
      type: data.type,
      read: false,
      interventionId: data.interventionId ?? null,
      ticketId: data.ticketId ?? null,
      createdAt: new Date('2026-05-17T10:00:00.000Z'),
    }));
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
    expect(emitToUserMock).toHaveBeenCalledWith(10, 'ticket:messageCreated', {
      ticketId: 4,
      message: MESSAGE_RESPONSE,
    });
    expect(emitToRoleMock).toHaveBeenCalledWith('supportagent', 'ticket:messageCreated', {
      ticketId: 4,
      message: MESSAGE_RESPONSE,
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

  it('does not notify the ticket owner when they are already viewing the chat', async () => {
    isUserViewingTicketMock.mockImplementation((ticketId, userId) => ticketId === 4 && userId === 10);

    const response = await request('POST', '/tickets/4/messages', {
      body: { text: 'We are checking this now.' },
      user: { localUserId: 2, roles: ['SupportAgent'] },
    });

    expect(response.status).toBe(201);
    expect(notificationCreateMock).not.toHaveBeenCalled();
    expect(emitToUserMock).not.toHaveBeenCalledWith(10, 'notification:new', expect.anything());
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
