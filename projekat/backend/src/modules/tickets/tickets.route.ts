import { Router } from 'express';

import { getKeycloakAdminToken, getKeycloakUserRoleNames } from '../../clients/keycloak.client';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { emitToRole, emitToUser } from '../../realtime/socket';
import { asyncHandler } from '../../shared/async-handler';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import { TicketService, type TicketRepository } from './tickets.service';
import { addMessageSchema, blockTicketUserSchema, createTicketSchema, requestAdminReviewSchema } from './tickets.schema';

const ticketsRouter = Router();

const ticketRepository: TicketRepository = {
  create: async (input) =>
    prisma.ticket.create({
      data: {
        userId: input.userId,
        title: input.title,
        category: input.category,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        category: true,
        status: true,
        userBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

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

  findAll: async () =>
    prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        category: true,
        status: true,
        userBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

  findByUserId: async (userId) =>
    prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        category: true,
        status: true,
        userBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

  findById: async (ticketId) =>
    prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        userId: true,
        title: true,
        category: true,
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
    }),
};

const ADMIN_ROLES = new Set(['admin', 'administrator']);
const SUPPORT_AGENT_ROLES = new Set(['supportagent', 'agentpodrske']);

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
      category: req.body.category as string,
      message: req.body.message as string,
    });

    emitToRole('supportagent', 'notification:new', {
      id: -1,
      userId: null,
      title: 'New support ticket',
      text: `Ticket #${ticket.id}: ${ticket.title} (${ticket.category})`,
      type: 'NEW_TICKET',
      read: false,
      interventionId: null,
      ticketId: ticket.id,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(ticket);
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
    const admins = [];

    for (const user of users) {
      const keycloakSub = user.externalIdentities[0]?.providerSubject;
      if (!keycloakSub) {
        continue;
      }

      const roleNames = await getKeycloakUserRoleNames(adminToken, keycloakSub);
      if (!hasAdminRole(roleNames)) {
        continue;
      }

      admins.push({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
      });
    }

    res.json(admins);
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
      select: { id: true, userId: true, title: true, category: true, status: true, userBlocked: true, createdAt: true, updatedAt: true },
    });

    if (status === 'CLOSED') {
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
      emitToUser(ticket.userId, 'ticket:statusChanged', updated);
      emitToRole('supportagent', 'ticket:statusChanged', updated);
      emitToRole('admin', 'ticket:statusChanged', updated);
    }

    res.json(updated);
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

    if (authorIsAgent && ticket.userId !== userId) {
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
      // User replied -> notify support agents via socket.
      emitToRole('supportagent', 'notification:new', {
        id: -1,
        userId: null,
        title: 'New ticket reply',
        text: `The user replied to ticket #${ticketId}: ${ticket.title}`,
        type: 'TICKET_REPLY',
        read: false,
        interventionId: null,
        ticketId,
        createdAt: new Date().toISOString(),
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
        user: {
          select: {
            username: true,
            email: true,
          },
        },
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

    const keycloakSub = admin.externalIdentities[0]?.providerSubject;
    if (!keycloakSub) {
      throw new BadRequestError('Selected admin is missing a Keycloak identity.');
    }

    const adminToken = await getKeycloakAdminToken();
    const roleNames = await getKeycloakUserRoleNames(adminToken, keycloakSub);
    if (!hasAdminRole(roleNames)) {
      throw new BadRequestError('Selected user is not an admin.');
    }

    const reason = rawReason.trim();
    const notification = await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Admin review requested',
        text: `Ticket #${ticket.id}: ${ticket.title}. User: ${ticket.user.username} <${ticket.user.email}>. Reason: ${reason}`,
        type: 'TICKET_REPLY',
        ticketId,
      },
    });

    emitToUser(admin.id, 'notification:new', notification);

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

    emitToRole('admin', 'notification:new', {
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

    emitToRole('supportagent', 'notification:new', {
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

    emitToRole('admin', 'notification:new', {
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

    emitToRole('supportagent', 'notification:new', {
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

    res.json({ ...updatedUser, ticketUserBlocked: false });
  }),
);

export default ticketsRouter;
