import { beforeEach, describe, expect, it } from 'vitest';

import {
  NotificationService,
  type CreateNotificationInput,
  type NotificationItem,
  type NotificationRepository,
} from '../src/modules/notifications/notifications.service';
import { ForbiddenError, NotFoundError } from '../src/shared/errors';

const NOW = new Date('2026-05-15T10:00:00.000Z');

function makeNotification(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 1,
    userId: 10,
    title: 'Nova dodjela',
    text: 'Dodijeljena vam je intervencija INT-001.',
    type: 'INTERVENTION_ASSIGNED',
    read: false,
    interventionId: 5,
    ticketId: null,
    createdAt: NOW,
    ...overrides,
  };
}

function createRepository(overrides: Partial<NotificationRepository> = {}): NotificationRepository {
  return {
    findByUserId: async () => [],
    countUnread: async () => 0,
    findById: async () => null,
    markAsRead: async () => {},
    create: async (input) =>
      makeNotification({
        userId: input.userId,
        title: input.title,
        text: input.text,
        type: input.type,
        interventionId: input.interventionId ?? null,
        ticketId: input.ticketId ?? null,
      }),
    ...overrides,
  };
}

beforeEach(() => {});

describe('NotificationService.getUserNotifications', () => {
  it('should return all notifications for the user', async () => {
    const notifications = [makeNotification({ id: 1 }), makeNotification({ id: 2 })];
    const repository = createRepository({ findByUserId: async () => notifications });
    const service = new NotificationService(repository);

    const result = await service.getUserNotifications(10);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  it('should return an empty array when the user has no notifications', async () => {
    const service = new NotificationService(createRepository());

    const result = await service.getUserNotifications(10);

    expect(result).toEqual([]);
  });

  it('should query notifications only for the given userId', async () => {
    let capturedUserId = 0;

    const repository = createRepository({
      findByUserId: async (userId) => {
        capturedUserId = userId;
        return [];
      },
    });

    const service = new NotificationService(repository);
    await service.getUserNotifications(7);

    expect(capturedUserId).toBe(7);
  });

  it('should return both read and unread notifications', async () => {
    const notifications = [
      makeNotification({ id: 1, read: false }),
      makeNotification({ id: 2, read: true }),
    ];
    const repository = createRepository({ findByUserId: async () => notifications });
    const service = new NotificationService(repository);

    const result = await service.getUserNotifications(10);

    expect(result.some((n) => n.read === true)).toBe(true);
    expect(result.some((n) => n.read === false)).toBe(true);
  });
});

describe('NotificationService.getUnreadCount', () => {
  it('should return the count of unread notifications', async () => {
    const repository = createRepository({ countUnread: async () => 3 });
    const service = new NotificationService(repository);

    const count = await service.getUnreadCount(10);

    expect(count).toBe(3);
  });

  it('should return zero when all notifications are read', async () => {
    const repository = createRepository({ countUnread: async () => 0 });
    const service = new NotificationService(repository);

    const count = await service.getUnreadCount(10);

    expect(count).toBe(0);
  });

  it('should query unread count only for the given userId', async () => {
    let capturedUserId = 0;

    const repository = createRepository({
      countUnread: async (userId) => {
        capturedUserId = userId;
        return 0;
      },
    });

    const service = new NotificationService(repository);
    await service.getUnreadCount(5);

    expect(capturedUserId).toBe(5);
  });
});

describe('NotificationService.markAsRead', () => {
  it('should mark a notification as read when it belongs to the user', async () => {
    let markedId = 0;

    const repository = createRepository({
      findById: async () => makeNotification({ id: 1, userId: 10, read: false }),
      markAsRead: async (id) => {
        markedId = id;
      },
    });

    const service = new NotificationService(repository);
    await service.markAsRead(1, 10);

    expect(markedId).toBe(1);
  });

  it('should throw NotFoundError when the notification does not exist', async () => {
    const service = new NotificationService(createRepository({ findById: async () => null }));

    await expect(service.markAsRead(99, 10)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should throw ForbiddenError when the notification belongs to a different user', async () => {
    const repository = createRepository({
      findById: async () => makeNotification({ id: 1, userId: 99 }),
    });
    const service = new NotificationService(repository);

    await expect(service.markAsRead(1, 10)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should not call markAsRead when the notification is not found', async () => {
    let markCalled = false;

    const repository = createRepository({
      findById: async () => null,
      markAsRead: async () => {
        markCalled = true;
      },
    });

    const service = new NotificationService(repository);

    await expect(service.markAsRead(99, 10)).rejects.toBeInstanceOf(NotFoundError);
    expect(markCalled).toBe(false);
  });

  it('should not call markAsRead when the user does not own the notification', async () => {
    let markCalled = false;

    const repository = createRepository({
      findById: async () => makeNotification({ userId: 200 }),
      markAsRead: async () => {
        markCalled = true;
      },
    });

    const service = new NotificationService(repository);

    await expect(service.markAsRead(1, 10)).rejects.toBeInstanceOf(ForbiddenError);
    expect(markCalled).toBe(false);
  });
});

describe('NotificationService.createNotification', () => {
  it('should create a notification linked to an intervention', async () => {
    const input: CreateNotificationInput = {
      userId: 5,
      title: 'Dodijeljena intervencija',
      text: 'INT-001, prioritet: Hitan, lokacija: Sarajevo',
      type: 'INTERVENTION_ASSIGNED',
      interventionId: 10,
    };

    const service = new NotificationService(createRepository());
    const result = await service.createNotification(input);

    expect(result.userId).toBe(5);
    expect(result.type).toBe('INTERVENTION_ASSIGNED');
    expect(result.interventionId).toBe(10);
    expect(result.ticketId).toBeNull();
  });

  it('should create a notification linked to a ticket', async () => {
    const input: CreateNotificationInput = {
      userId: 3,
      title: 'Nova poruka na tiketu',
      text: 'Dobili ste odgovor na vaš tiket.',
      type: 'TICKET_REPLY',
      ticketId: 7,
    };

    const service = new NotificationService(createRepository());
    const result = await service.createNotification(input);

    expect(result.type).toBe('TICKET_REPLY');
    expect(result.ticketId).toBe(7);
    expect(result.interventionId).toBeNull();
  });

  it('should pass the full input to the repository', async () => {
    let capturedInput: CreateNotificationInput | undefined;

    const repository = createRepository({
      create: async (input) => {
        capturedInput = input;
        return makeNotification(input);
      },
    });

    const service = new NotificationService(repository);
    const input: CreateNotificationInput = {
      userId: 8,
      title: 'Nova prijava kvara',
      text: '15.05.2026. 10:00, lokacija: Mostar',
      type: 'NEW_REPORT',
      interventionId: 3,
    };

    await service.createNotification(input);

    expect(capturedInput).toMatchObject(input);
  });

  it('should create a NEW_REPORT notification for coordinator when a fault is reported', async () => {
    const repository = createRepository({
      create: async (input) => makeNotification({ ...input, id: 20 }),
    });
    const service = new NotificationService(repository);

    const result = await service.createNotification({
      userId: 2,
      title: 'Nova prijava kvara',
      text: '15.05.2026. 10:15, lokacija: Banja Luka',
      type: 'NEW_REPORT',
      interventionId: 15,
    });

    expect(result.type).toBe('NEW_REPORT');
    expect(result.id).toBe(20);
  });

  it('should create an INTERVENTION_ASSIGNED notification for servicer when assigned', async () => {
    const repository = createRepository({
      create: async (input) => makeNotification({ ...input, id: 21 }),
    });
    const service = new NotificationService(repository);

    const result = await service.createNotification({
      userId: 6,
      title: 'Nova dodjela',
      text: 'Zamjena pumpe, prioritet: Srednji, lokacija: Zenica',
      type: 'INTERVENTION_ASSIGNED',
      interventionId: 8,
    });

    expect(result.type).toBe('INTERVENTION_ASSIGNED');
    expect(result.interventionId).toBe(8);
  });
});
