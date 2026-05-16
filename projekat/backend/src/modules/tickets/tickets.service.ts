import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors';

export const TICKET_CATEGORIES = [
  'Technical question',
  'Application bug report',
  'Other',
] as const;

export type TicketCategory = typeof TICKET_CATEGORIES[number];

export interface CreateTicketInput {
  userId: number;
  title: string;
  category: string;
  message: string;
}

export interface AddTicketMessageInput {
  ticketId: number;
  authorId: number;
  text: string;
}

export interface TicketListItem {
  id: number;
  userId: number;
  title: string;
  category: string;
  status: string;
  userBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessage {
  id: number;
  text: string;
  createdAt: Date;
  author: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface TicketDetail extends TicketListItem {
  user: {
    active: boolean;
  };
  messages: TicketMessage[];
}

export interface TicketRepository {
  create(input: { userId: number; title: string; category: string }): Promise<TicketListItem>;
  createMessage(input: { ticketId: number; authorId: number; text: string }): Promise<TicketMessage>;
  findAll(): Promise<TicketListItem[]>;
  findByUserId(userId: number): Promise<TicketListItem[]>;
  findById(ticketId: number): Promise<TicketDetail | null>;
}

export class TicketService {
  constructor(private readonly repository: TicketRepository) {}

  async createTicket(input: CreateTicketInput): Promise<TicketListItem> {
    if (!input.title || input.title.trim().length < 3) {
      throw new BadRequestError('Title must be at least 3 characters.', [
        { field: 'title', message: 'Title must be at least 3 characters.' },
      ]);
    }

    if (!TICKET_CATEGORIES.includes(input.category as TicketCategory)) {
      throw new BadRequestError(`Category must be one of: ${TICKET_CATEGORIES.join(', ')}.`, [
        { field: 'category', message: `Category must be one of: ${TICKET_CATEGORIES.join(', ')}.` },
      ]);
    }

    if (!input.message || input.message.trim().length === 0) {
      throw new BadRequestError('Description is required.', [
        { field: 'message', message: 'Description is required.' },
      ]);
    }

    const ticket = await this.repository.create({
      userId: input.userId,
      title: input.title.trim(),
      category: input.category,
    });

    await this.repository.createMessage({
      ticketId: ticket.id,
      authorId: input.userId,
      text: input.message.trim(),
    });

    return ticket;
  }

  async getUserTickets(userId: number, isAgent: boolean): Promise<TicketListItem[]> {
    return isAgent ? this.repository.findAll() : this.repository.findByUserId(userId);
  }

  async getTicketById(ticketId: number, userId: number, isAgent: boolean): Promise<TicketDetail> {
    const ticket = await this.repository.findById(ticketId);

    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    if (!isAgent && ticket.userId !== userId) {
      throw new ForbiddenError('You do not have access to this ticket.');
    }

    return ticket;
  }
}
