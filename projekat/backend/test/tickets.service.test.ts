import { beforeEach, describe, expect, it } from 'vitest';

import {
  TICKET_CATEGORIES,
  TicketService,
  type CreateTicketInput,
  type TicketDetail,
  type TicketListItem,
  type TicketMessage,
  type TicketRepository,
} from '../src/modules/tickets/tickets.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../src/shared/errors';

const NOW = new Date('2026-05-15T10:00:00.000Z');

function makeMessage(overrides: Partial<TicketMessage> = {}): TicketMessage {
  return {
    id: 1,
    text: 'Opis problema',
    createdAt: NOW,
    author: { id: 10, firstName: 'Nedim', lastName: 'Omanovic' },
    ...overrides,
  };
}

function makeTicket(overrides: Partial<TicketListItem> = {}): TicketListItem {
  return {
    id: 1,
    userId: 10,
    title: 'Problem sa prijavom',
    category: 'Technical question',
    status: 'OPEN',
    userBlocked: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeDetail(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    ...makeTicket(),
    user: { active: true },
    messages: [makeMessage()],
    ...overrides,
  };
}

function createRepository(overrides: Partial<TicketRepository> = {}): TicketRepository {
  return {
    create: async (input) =>
      makeTicket({ title: input.title, category: input.category, userId: input.userId }),
    createMessage: async () => makeMessage(),
    findByUserId: async () => [],
    findById: async () => null,
    ...overrides,
  };
}

const baseInput: CreateTicketInput = {
  userId: 10,
  title: 'Problem sa prijavom',
  category: 'Technical question',
  message: 'Aplikacija ne reaguje na klik na dugme za prijavu.',
};

beforeEach(() => {});

describe('TicketService.createTicket', () => {
  it('should create a ticket and attach the opening message', async () => {
    let createdTicketInput: { userId: number; title: string; category: string } | undefined;
    let createdMessageInput: { ticketId: number; authorId: number; text: string } | undefined;

    const repository = createRepository({
      create: async (input) => {
        createdTicketInput = input;
        return makeTicket({ userId: input.userId, title: input.title, category: input.category });
      },
      createMessage: async (input) => {
        createdMessageInput = input;
        return makeMessage({ text: input.text });
      },
    });

    const service = new TicketService(repository);
    const result = await service.createTicket(baseInput);

    expect(result.status).toBe('OPEN');
    expect(createdTicketInput?.title).toBe('Problem sa prijavom');
    expect(createdTicketInput?.category).toBe('Technical question');
    expect(createdTicketInput?.userId).toBe(10);
    expect(createdMessageInput?.authorId).toBe(10);
    expect(createdMessageInput?.text).toBe('Aplikacija ne reaguje na klik na dugme za prijavu.');
  });

  it('should trim whitespace from title and message before saving', async () => {
    let capturedTitle = '';
    let capturedMessage = '';

    const repository = createRepository({
      create: async (input) => {
        capturedTitle = input.title;
        return makeTicket({ title: input.title });
      },
      createMessage: async (input) => {
        capturedMessage = input.text;
        return makeMessage({ text: input.text });
      },
    });

    const service = new TicketService(repository);
    await service.createTicket({ ...baseInput, title: '  Problem  ', message: '  Detalji  ' });

    expect(capturedTitle).toBe('Problem');
    expect(capturedMessage).toBe('Detalji');
  });

  it('should create the message linked to the created ticket id', async () => {
    let capturedTicketId = 0;

    const repository = createRepository({
      create: async () => makeTicket({ id: 42 }),
      createMessage: async (input) => {
        capturedTicketId = input.ticketId;
        return makeMessage();
      },
    });

    const service = new TicketService(repository);
    await service.createTicket(baseInput);

    expect(capturedTicketId).toBe(42);
  });

  it('should reject a title shorter than 3 characters', async () => {
    const service = new TicketService(createRepository());

    await expect(service.createTicket({ ...baseInput, title: 'AB' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('should reject an empty title', async () => {
    const service = new TicketService(createRepository());

    await expect(service.createTicket({ ...baseInput, title: '' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('should reject a title that is only whitespace', async () => {
    const service = new TicketService(createRepository());

    await expect(service.createTicket({ ...baseInput, title: '   ' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('should reject an empty message', async () => {
    const service = new TicketService(createRepository());

    await expect(service.createTicket({ ...baseInput, message: '' })).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });

  it('should reject a category not in the predefined list', async () => {
    const service = new TicketService(createRepository());

    await expect(
      service.createTicket({ ...baseInput, category: 'Nepostojeca kategorija' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should accept all three predefined categories', async () => {
    const repository = createRepository({
      create: async (input) => makeTicket({ category: input.category }),
    });
    const service = new TicketService(repository);

    for (const category of TICKET_CATEGORIES) {
      await expect(service.createTicket({ ...baseInput, category })).resolves.not.toThrow();
    }
  });

  it('should not create a repository message when ticket creation fails', async () => {
    let messageCreated = false;

    const repository = createRepository({
      create: async () => {
        throw new Error('DB failure');
      },
      createMessage: async () => {
        messageCreated = true;
        return makeMessage();
      },
    });

    const service = new TicketService(repository);

    await expect(service.createTicket(baseInput)).rejects.toThrow('DB failure');
    expect(messageCreated).toBe(false);
  });

  it('should not call repository.create when validation fails', async () => {
    let createCalled = false;

    const repository = createRepository({
      create: async () => {
        createCalled = true;
        return makeTicket();
      },
    });

    const service = new TicketService(repository);

    await expect(
      service.createTicket({ ...baseInput, category: 'Nevalidna' }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(createCalled).toBe(false);
  });
});

describe('TicketService.getUserTickets', () => {
  it('should return all tickets belonging to the user', async () => {
    const tickets = [makeTicket({ id: 1 }), makeTicket({ id: 2 })];
    const repository = createRepository({ findByUserId: async () => tickets });
    const service = new TicketService(repository);

    const result = await service.getUserTickets(10);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('should return an empty array when the user has no tickets', async () => {
    const service = new TicketService(createRepository({ findByUserId: async () => [] }));

    const result = await service.getUserTickets(10);

    expect(result).toEqual([]);
  });

  it('should query tickets only for the given userId', async () => {
    let capturedUserId = 0;

    const repository = createRepository({
      findByUserId: async (userId) => {
        capturedUserId = userId;
        return [];
      },
    });

    const service = new TicketService(repository);
    await service.getUserTickets(7);

    expect(capturedUserId).toBe(7);
  });
});

describe('TicketService.getTicketById', () => {
  it('should return the ticket when it belongs to the requesting user', async () => {
    const detail = makeDetail({ id: 5, userId: 10 });
    const repository = createRepository({ findById: async () => detail });
    const service = new TicketService(repository);

    const result = await service.getTicketById(5, 10);

    expect(result.id).toBe(5);
    expect(result.messages).toHaveLength(1);
  });

  it('should throw NotFoundError when the ticket does not exist', async () => {
    const service = new TicketService(createRepository({ findById: async () => null }));

    await expect(service.getTicketById(99, 10)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw ForbiddenError when the ticket belongs to a different user', async () => {
    const detail = makeDetail({ userId: 99 });
    const repository = createRepository({ findById: async () => detail });
    const service = new TicketService(repository);

    await expect(service.getTicketById(1, 10)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should not expose another user ticket even if the ticket exists', async () => {
    const detail = makeDetail({ id: 1, userId: 200 });
    const repository = createRepository({ findById: async () => detail });
    const service = new TicketService(repository);

    await expect(service.getTicketById(1, 10)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should return full message history with the ticket', async () => {
    const messages = [makeMessage({ id: 1, text: 'Prva poruka' }), makeMessage({ id: 2, text: 'Druga poruka' })];
    const detail = makeDetail({ userId: 10, messages });
    const repository = createRepository({ findById: async () => detail });
    const service = new TicketService(repository);

    const result = await service.getTicketById(1, 10);

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].text).toBe('Prva poruka');
    expect(result.messages[1].text).toBe('Druga poruka');
  });
});
