import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors';

export interface CreateTicketInput {
  userId: number;
  title: string;
  categoryId: number;
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
  categoryId: number;
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

export interface TicketCategoryRecord {
  id: number;
  name: string;
  active: boolean;
}

export interface TicketRepository {
  create(input: { userId: number; title: string; categoryId: number }): Promise<TicketListItem>;
  createMessage(input: { ticketId: number; authorId: number; text: string }): Promise<TicketMessage>;
  findCategoryById(categoryId: number): Promise<TicketCategoryRecord | null>;
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

    if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) {
      throw new BadRequestError('Category is required.', [
        { field: 'categoryId', message: 'Category is required.' },
      ]);
    }

    if (!input.message || input.message.trim().length === 0) {
      throw new BadRequestError('Description is required.', [
        { field: 'message', message: 'Description is required.' },
      ]);
    }

    const category = await this.repository.findCategoryById(input.categoryId);
    if (!category) {
      throw new BadRequestError('Selected category does not exist.', [
        { field: 'categoryId', message: 'Selected category does not exist.' },
      ]);
    }

    if (!category.active) {
      throw new BadRequestError('Selected category is inactive.', [
        { field: 'categoryId', message: 'Selected category is inactive.' },
      ]);
    }

    const ticket = await this.repository.create({
      userId: input.userId,
      title: input.title.trim(),
      categoryId: category.id,
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
