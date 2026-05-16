import { Router } from 'express';

import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { emitToRole, emitToUser } from '../../realtime/socket';
import { asyncHandler } from '../../shared/async-handler';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../shared/errors';
import { TicketService, type TicketRepository } from './tickets.service';
import { addMessageSchema, createTicketSchema } from './tickets.schema';

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
        createdAt: true,
        updatedAt: true,
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

const AGENT_ROLES = new Set(['admin', 'administrator', 'koordinator', 'coordinator']);

function isAgent(req: { user?: { roles?: string[] } }): boolean {
  return (req.user?.roles ?? []).some((r) => AGENT_ROLES.has(r.toLowerCase()));
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

    const tickets = await ticketService.getUserTickets(userId, isAgent(req));
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

    const ticket = await ticketService.createTicket({
      userId,
      title: req.body.title as string,
      category: req.body.category as string,
      message: req.body.message as string,
    });

    emitToRole('koordinator', 'notification:new', {
      id: -1,
      userId: null,
      title: 'Novi tiket za podršku',
      text: `Tiket #${ticket.id}: ${ticket.title} (${ticket.category})`,
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

    const ticket = await ticketService.getTicketById(ticketId, userId, isAgent(req));
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

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { userId: true } });
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    const roles = req.user?.roles?.map((r) => r.toLowerCase()) ?? [];
    const isAgent = roles.includes('admin') || roles.includes('administrator') || roles.includes('koordinator') || roles.includes('coordinator');
    if (!isAgent && ticket.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this ticket.');
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' },
      select: { id: true, userId: true, title: true, category: true, status: true, createdAt: true, updatedAt: true },
    });

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
      select: { userId: true, title: true },
    });
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    const roles = req.user?.roles?.map((r) => r.toLowerCase()) ?? [];
    const authorIsAgent = roles.includes('admin') || roles.includes('administrator') || roles.includes('koordinator') || roles.includes('coordinator');
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
          title: 'Odgovor na vaš tiket',
          text: `Agent je odgovorio na tiket #${ticketId}: ${ticket.title}`,
          type: 'TICKET_REPLY',
          ticketId,
        },
      });
      emitToUser(ticket.userId, 'notification:new', notification);
    } else if (!authorIsAgent) {
      // User replied → notify coordinators via socket
      emitToRole('koordinator', 'notification:new', {
        id: -1,
        userId: null,
        title: 'Novi odgovor na tiket',
        text: `Korisnik je odgovorio na tiket #${ticketId}: ${ticket.title}`,
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

export default ticketsRouter;
