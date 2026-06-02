import { Router } from 'express';

import {
  findKeycloakUserIdByUsernameOrEmail,
  getKeycloakAdminToken,
  getKeycloakUserRoleNames,
} from '../../clients/keycloak.client';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { emitToRole, emitToUser, isUserViewingTicket } from '../../realtime/socket';
import { asyncHandler } from '../../shared/async-handler';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import { filterByPreferences, getActiveUserIdsByKeycloakRole, shouldNotifyUser } from '../../shared/notification-preferences';
import { TicketService, type TicketDetail, type TicketListItem, type TicketMessage, type TicketRepository } from './tickets.service';
import { addMessageSchema, blockTicketUserSchema, createTicketSchema, requestAdminReviewSchema } from './tickets.schema';

const ticketsRouter = Router();

type TicketRecord = Omit<TicketListItem, 'category'> & {
  category: {
    name: string;
  };
};

type TicketDetailRecord = Omit<TicketDetail, 'category'> & {
  category: {
    name: string;
  };
};

function mapTicketListItem(ticket: TicketRecord): TicketListItem {
  return {
    ...ticket,
    category: ticket.category.name,
  };
}

function mapTicketDetail(ticket: TicketDetailRecord): TicketDetail {
  return {
    ...ticket,
    category: ticket.category.name,
  };
}

const ticketRepository: TicketRepository = {
  create: async (input) =>
    prisma.ticket.create({
      data: {
        userId: input.userId,
        title: input.title,
        categoryId: input.categoryId,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        categoryId: true,
        category: {
          select: { name: true },
        },
        status: true,
        userBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    }).then(mapTicketListItem),

  createMessage: async (input) =>
    prisma.message.create({
      data: {
        ticketId: input.ticketId,
        authorId: input.authorId,
        text: input.text,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    }),

  findCategoryById: async (categoryId) =>
    prisma.ticketCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        active: true,
      },
    }),

  findAll: async () =>
    prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        categoryId: true,
        category: {
          select: { name: true },
        },
        status: true,
        userBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    }).then((tickets) => tickets.map(mapTicketListItem)),

  findByUserId: async (userId) =>
    prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        categoryId: true,
        category: {
          select: { name: true },
        },
        status: true,
        userBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    }).then((tickets) => tickets.map(mapTicketListItem)),

  findById: async (ticketId) =>
    prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        userId: true,
        title: true,
        categoryId: true,
        category: {
          select: { name: true },
        },
        status: true,
        userBlocked: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { active: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            text: true,
            createdAt: true,
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    }).then((ticket) => (ticket ? mapTicketDetail(ticket) : null)),
};

const ADMIN_ROLES = new Set(['admin', 'administrator']);
const SUPPORT_AGENT_ROLES = new Set(['supportagent', 'agentpodrske']);
const ADMIN_REVIEW_ROLE_LOOKUP_CONCURRENCY = 5;
const NEW_TICKET_ROLE_LOOKUP_CONCURRENCY = 5;

type KeycloakRoleCandidate = {
  id: number;
  username?: string | null;
  email?: string | null;
  externalIdentities: Array<{ providerSubject: string }>;
};

function hasAnyRole(req: { user?: { roles?: string[] } }, roles: Set<string>): boolean {
  return (req.user?.roles ?? []).some((role) => roles.has(role.toLowerCase()));
}

function isAdmin(req: { user?: { roles?: string[] } }): boolean {
  return hasAnyRole(req, ADMIN_ROLES);
}

function isSupportAgent(req: { user?: { roles?: string[] } }): boolean {
  return hasAnyRole(req, SUPPORT_AGENT_ROLES);
}

function canManageTickets(req: { user?: { roles?: string[] } }): boolean {
  return isAdmin(req) || isSupportAgent(req);
}

function hasAdminRole(roleNames: readonly string[]): boolean {
  return roleNames.some((role) => ADMIN_ROLES.has(role.toLowerCase()));
}

function hasNewTicketNotificationRole(roleNames: readonly string[]): boolean {
  return roleNames.some((role) => {
    const normalizedRole = role.toLowerCase();
    return ADMIN_ROLES.has(normalizedRole) || SUPPORT_AGENT_ROLES.has(normalizedRole);
  });
}

async function getRoleNamesForCandidate(
  adminToken: string,
  user: KeycloakRoleCandidate,
  operation: string,
): Promise<string[]> {
  const keycloakSub = user.externalIdentities[0]?.providerSubject;

  if (keycloakSub) {
    try {
      return await getKeycloakUserRoleNames(adminToken, keycloakSub);
    } catch (error) {
      console.warn(`[TicketsRoute] Could not load Keycloak roles for local user ${user.id} during ${operation}.`, error);
    }
  }

  try {
    const resolvedKeycloakUserId = await findKeycloakUserIdByUsernameOrEmail(adminToken, {
      username: user.username,
      email: user.email,
    });

    if (!resolvedKeycloakUserId || resolvedKeycloakUserId === keycloakSub) {
      return [];
    }

    return await getKeycloakUserRoleNames(adminToken, resolvedKeycloakUserId);
  } catch (error) {
    console.warn(`[TicketsRoute] Could not resolve Keycloak roles for local user ${user.id} during ${operation}.`, error);
    return [];
  }
}

async function filterAdminsByKeycloakRole<T extends KeycloakRoleCandidate>(
  users: T[],
  adminToken: string,
): Promise<T[]> {
  // Run role checks in bounded batches to avoid overloading Keycloak with one request per user at once.
  const admins: T[] = [];

  for (let index = 0; index < users.length; index += ADMIN_REVIEW_ROLE_LOOKUP_CONCURRENCY) {
    const batch = users.slice(index, index + ADMIN_REVIEW_ROLE_LOOKUP_CONCURRENCY);
    const checkedBatch = await Promise.all(
      batch.map(async (user) => {
        const roleNames = await getRoleNamesForCandidate(adminToken, user, 'admin review candidate lookup');
        return hasAdminRole(roleNames) ? user : null;
      }),
    );

    for (const user of checkedBatch) {
      if (user) {
        admins.push(user);
      }
    }
  }

  return admins;
}

async function findNewTicketNotificationRecipients(): Promise<Array<{ id: number }>> {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: {
      id: true,
      username: true,
      email: true,
      externalIdentities: {
        where: { provider: 'keycloak' },
        select: { providerSubject: true },
        take: 1,
      },
    },
  });

  const adminToken = await getKeycloakAdminToken();
  const recipients: Array<{ id: number }> = [];

  for (let index = 0; index < users.length; index += NEW_TICKET_ROLE_LOOKUP_CONCURRENCY) {
    const batch = users.slice(index, index + NEW_TICKET_ROLE_LOOKUP_CONCURRENCY);
    const checkedBatch = await Promise.all(
      batch.map(async (user) => {
        const roleNames = await getRoleNamesForCandidate(adminToken, user, 'new ticket notification lookup');
        return hasNewTicketNotificationRole(roleNames) ? { id: user.id } : null;
      }),
    );

    for (const user of checkedBatch) {
      if (user) {
        recipients.push(user);
      }
    }
  }

  return recipients;
}

async function notifyTicketRecipients(
  recipients: Array<{ id: number }>,
  input: {
    title: string;
    text: string;
    type: 'NEW_TICKET' | 'TICKET_REPLY';
    ticketId: number;
  },
): Promise<void> {
  const recipientIds = recipients
    .filter((recipient) => !isUserViewingTicket(input.ticketId, recipient.id))
    .map((r) => r.id);

  const filteredIds = await filterByPreferences(recipientIds, input.type);

  const notifications = await Promise.all(
    filteredIds.map((userId) =>
      prisma.notification.create({
        data: {
          userId,
          title: input.title,
          text: input.text,
          type: input.type,
          ticketId: input.ticketId,
        },
      }),
    ),
  );

  for (const notification of notifications) {
    emitToUser(notification.userId, 'notification:new', notification);
  }
}

async function notifyNewTicketRecipients(ticket: { id: number; title: string; category: string }): Promise<void> {
  const recipients = await findNewTicketNotificationRecipients();

  await notifyTicketRecipients(recipients, {
    title: 'New support ticket',
    text: `Ticket #${ticket.id}: ${ticket.title} (${ticket.category})`,
    type: 'NEW_TICKET',
    ticketId: ticket.id,
  });
}

function emitTicketMessage(ticketId: number, ticketUserId: number, message: TicketMessage): void {
  const payload = { ticketId, message };
  emitToUser(ticketUserId, 'ticket:messageCreated', payload);
  emitToRole('supportagent', 'ticket:messageCreated', payload);
  emitToRole('admin', 'ticket:messageCreated', payload);
}

const ticketService = new TicketService(ticketRepository);

ticketsRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user?.localUserId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const tickets = await ticketService.getUserTickets(userId, canManageTickets(req));
    res.json(tickets);
  }),
);

ticketsRouter.post(
  '/',
  authenticate,
  validate(createTicketSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.localUserId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    if (isSupportAgent(req) && !isAdmin(req)) {
      throw new ForbiddenError('Support agents cannot create support tickets.');
    }

    const ticket = await ticketService.createTicket({
      userId,
      title: req.body.title as string,
      categoryId: req.body.categoryId as number,
      message: req.body.message as string,
    });

    await notifyNewTicketRecipients(ticket);

    res.status(201).json(ticket);
  }),
);

ticketsRouter.get(
  '/categories',
  authenticate,
  asyncHandler(async (_req, res) => {
    const categories = await prisma.ticketCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        active: true,
      },
    });

    res.json(categories);
  }),
);

ticketsRouter.get(
  '/admin-review/admins',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!isSupportAgent(req)) {
      throw new ForbiddenError('Only support agents can list admins for ticket review.');
    }

    const users = await prisma.user.findMany({
      where: { active: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        externalIdentities: {
          where: { provider: 'keycloak' },
          select: { providerSubject: true },
          take: 1,
        },
      },
    });

    const adminToken = await getKeycloakAdminToken();
    const admins = await filterAdminsByKeycloakRole(users, adminToken);

    res.json(
      admins.map((admin) => ({
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        username: admin.username,
        email: admin.email,
      })),
    );
  }),
);

ticketsRouter.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user?.localUserId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      throw new BadRequestError('Invalid ticket identifier.');
    }

    const ticket = await ticketService.getTicketById(ticketId, userId, canManageTickets(req));
    res.json(ticket);
  }),
);

ticketsRouter.patch(
  '/:id/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user?.localUserId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      throw new BadRequestError('Invalid ticket identifier.');
    }

    const { status } = req.body as { status?: string };
    const ALLOWED_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      throw new BadRequestError(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { userId: true, title: true } });
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    if (!canManageTickets(req)) {
      throw new ForbiddenError('Only support agents and admins can update ticket status.');
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' },
      select: {
        id: true,
        userId: true,
        title: true,
        categoryId: true,
        category: { select: { name: true } },
        status: true,
        userBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const updatedTicket = mapTicketListItem(updated);

    if (
      status === 'CLOSED'
      && !isUserViewingTicket(ticketId, ticket.userId)
      && await shouldNotifyUser(ticket.userId, 'TICKET_REPLY')
    ) {
      const notification = await prisma.notification.create({
        data: {
          userId: ticket.userId,
          title: 'Ticket closed',
          text: `Ticket #${ticketId}: ${ticket.title} has been closed.`,
          type: 'TICKET_REPLY',
          ticketId,
        },
      });
      emitToUser(ticket.userId, 'notification:new', notification);
    }

    emitToUser(ticket.userId, 'ticket:statusChanged', updatedTicket);
    emitToRole('supportagent', 'ticket:statusChanged', updatedTicket);
    emitToRole('admin', 'ticket:statusChanged', updatedTicket);

    res.json(updatedTicket);
  }),
);

ticketsRouter.post(
  '/:id/messages',
  authenticate,
  validate(addMessageSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.localUserId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      throw new BadRequestError('Invalid ticket identifier.');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        userId: true,
        title: true,
        status: true,
        userBlocked: true,
        user: {
          select: { active: true },
        },
      },
    });
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    if (ticket.status === 'CLOSED') {
      throw new BadRequestError('Ticket is closed. New messages are not allowed.');
    }

    if (ticket.userBlocked) {
      throw new ForbiddenError('This ticket is blocked. New messages are not allowed.');
    }

    const authorIsAgent = canManageTickets(req);
    if (!authorIsAgent && ticket.userId !== userId) {
      throw new ForbiddenError('You do not have access to this ticket.');
    }

    const message = await ticketRepository.createMessage({
      ticketId,
      authorId: userId,
      text: (req.body as { text: string }).text,
    });

    emitTicketMessage(ticketId, ticket.userId, message);

    if (
      authorIsAgent && ticket.userId !== userId
      && !isUserViewingTicket(ticketId, ticket.userId)
      && await shouldNotifyUser(ticket.userId, 'TICKET_REPLY')
    ) {
      // Agent replied → notify ticket owner via DB + socket
      const notification = await prisma.notification.create({
        data: {
          userId: ticket.userId,
          title: 'Ticket reply',
          text: `An agent replied to ticket #${ticketId}: ${ticket.title}`,
          type: 'TICKET_REPLY',
          ticketId,
        },
      });
      emitToUser(ticket.userId, 'notification:new', notification);
    } else if (!authorIsAgent) {
      const recipients = (await findNewTicketNotificationRecipients()).filter((recipient) => recipient.id !== userId);
      await notifyTicketRecipients(recipients, {
        title: 'New ticket reply',
        text: `The user replied to ticket #${ticketId}: ${ticket.title}`,
        type: 'TICKET_REPLY',
        ticketId,
      });
    }

    res.status(201).json(message);
  }),
);

ticketsRouter.post(
  '/:id/admin-review',
  authenticate,
  validate(requestAdminReviewSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user?.localUserId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    if (!isSupportAgent(req)) {
      throw new ForbiddenError('Only support agents can request admin review.');
    }

    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      throw new BadRequestError('Invalid ticket identifier.');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        title: true,
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    const { adminUserId, reason: rawReason } = req.body as { adminUserId: number; reason: string };
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: {
        id: true,
        username: true,
        email: true,
        active: true,
        externalIdentities: {
          where: { provider: 'keycloak' },
          select: { providerSubject: true },
          take: 1,
        },
      },
    });

    if (!admin?.active) {
      throw new NotFoundError('Selected admin was not found.');
    }

    const adminToken = await getKeycloakAdminToken();
    const roleNames = await getRoleNamesForCandidate(adminToken, admin, 'admin review request validation');
    if (!hasAdminRole(roleNames)) {
      throw new BadRequestError('Selected user is not an admin.');
    }

    const reason = rawReason.trim();
    if (
      !isUserViewingTicket(ticketId, admin.id)
      && await shouldNotifyUser(admin.id, 'TICKET_REPLY')
    ) {
      const notification = await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Admin review requested',
          text: `Ticket #${ticket.id}: ${ticket.title}. Reason: ${reason}`,
          type: 'TICKET_REPLY',
          ticketId,
        },
      });

      emitToUser(admin.id, 'notification:new', notification);
    }

    res.status(201).json({ message: 'Admin review requested.' });
  }),
);

ticketsRouter.post(
  '/:id/block-user',
  authenticate,
  validate(blockTicketUserSchema),
  asyncHandler(async (req, res) => {
    const actorId = req.user?.localUserId;
    if (!actorId) {
      throw new UnauthorizedError();
    }

    if (!isAdmin(req)) {
      throw new ForbiddenError('Only admins can block ticket users.');
    }

    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      throw new BadRequestError('Invalid ticket identifier.');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        title: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            active: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    if (ticket.userId === actorId) {
      throw new ForbiddenError('You cannot block your own account from a ticket.');
    }

    const reason = (req.body as { reason: string }).reason.trim();

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        userBlocked: true,
        userBlockedReason: reason,
        userBlockedAt: new Date(),
        userBlockedById: actorId,
      },
    });

    const updatedUser = ticket.user;

    const blockedAdminIds = await filterByPreferences(
      await getActiveUserIdsByKeycloakRole('admin'),
      'TICKET_REPLY',
    );
    for (const uid of blockedAdminIds) {
      emitToUser(uid, 'notification:new', {
        id: -1,
        userId: null,
        title: 'User blocked',
        text: `User ${updatedUser.username} (${updatedUser.email}) was blocked from ticket #${ticket.id}: ${ticket.title}. Reason: ${reason}`,
        type: 'TICKET_REPLY',
        read: false,
        interventionId: null,
        ticketId,
        createdAt: new Date().toISOString(),
      });
    }

    const blockedAgentIds = await filterByPreferences(
      await getActiveUserIdsByKeycloakRole('supportagent'),
      'TICKET_REPLY',
    );
    for (const uid of blockedAgentIds) {
      emitToUser(uid, 'notification:new', {
        id: -1,
        userId: null,
        title: 'User blocked',
        text: `User ${updatedUser.username} was blocked from ticket #${ticket.id}.`,
        type: 'TICKET_REPLY',
        read: false,
        interventionId: null,
        ticketId,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json({ ...updatedUser, ticketUserBlocked: true });
  }),
);

ticketsRouter.post(
  '/:id/unblock-user',
  authenticate,
  asyncHandler(async (req, res) => {
    const actorId = req.user?.localUserId;
    if (!actorId) {
      throw new UnauthorizedError();
    }

    if (!isAdmin(req)) {
      throw new ForbiddenError('Only admins can unblock ticket users.');
    }

    const ticketId = Number(req.params.id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      throw new BadRequestError('Invalid ticket identifier.');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        title: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            active: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    if (ticket.userId === actorId) {
      throw new ForbiddenError('You cannot unblock your own account from a ticket.');
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        userBlocked: false,
        userBlockedReason: null,
        userBlockedAt: null,
        userBlockedById: null,
      },
    });

    const updatedUser = ticket.user;

    const unblockedAdminIds = await filterByPreferences(
      await getActiveUserIdsByKeycloakRole('admin'),
      'TICKET_REPLY',
    );
    for (const uid of unblockedAdminIds) {
      emitToUser(uid, 'notification:new', {
        id: -1,
        userId: null,
        title: 'User unblocked',
        text: `User ${updatedUser.username} (${updatedUser.email}) was unblocked from ticket #${ticket.id}: ${ticket.title}.`,
        type: 'TICKET_REPLY',
        read: false,
        interventionId: null,
        ticketId,
        createdAt: new Date().toISOString(),
      });
    }

    const unblockedAgentIds = await filterByPreferences(
      await getActiveUserIdsByKeycloakRole('supportagent'),
      'TICKET_REPLY',
    );
    for (const uid of unblockedAgentIds) {
      emitToUser(uid, 'notification:new', {
        id: -1,
        userId: null,
        title: 'User unblocked',
        text: `User ${updatedUser.username} was unblocked from ticket #${ticket.id}.`,
        type: 'TICKET_REPLY',
        read: false,
        interventionId: null,
        ticketId,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ ...updatedUser, ticketUserBlocked: false });
  }),
);

export default ticketsRouter;
