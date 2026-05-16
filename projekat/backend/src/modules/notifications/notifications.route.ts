import { Router } from 'express';

import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { BadRequestError, UnauthorizedError } from '../../shared/errors';
import { NotificationService, type NotificationRepository } from './notifications.service';

const notificationsRouter = Router();

const notificationRepository: NotificationRepository = {
  findByUserId: async (userId) =>
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        title: true,
        text: true,
        type: true,
        read: true,
        interventionId: true,
        ticketId: true,
        createdAt: true,
      },
    }) as ReturnType<NotificationRepository['findByUserId']>,

  countUnread: async (userId) =>
    prisma.notification.count({ where: { userId, read: false } }),

  findById: async (id) =>
    prisma.notification.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        text: true,
        type: true,
        read: true,
        interventionId: true,
        ticketId: true,
        createdAt: true,
      },
    }) as ReturnType<NotificationRepository['findById']>,

  markAsRead: async (id) => {
    await prisma.notification.update({ where: { id }, data: { read: true } });
  },

  create: async (input) =>
    prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        text: input.text,
        type: input.type,
        interventionId: input.interventionId ?? null,
        ticketId: input.ticketId ?? null,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        text: true,
        type: true,
        read: true,
        interventionId: true,
        ticketId: true,
        createdAt: true,
      },
    }) as ReturnType<NotificationRepository['create']>,
};

const notificationService = new NotificationService(notificationRepository);

notificationsRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user?.localUserId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const notifications = await notificationService.getUserNotifications(userId);
    res.json(notifications);
  }),
);

notificationsRouter.get(
  '/unread',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user?.localUserId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  }),
);

notificationsRouter.patch(
  '/:id/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user?.localUserId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      throw new BadRequestError('Invalid notification identifier.');
    }

    await notificationService.markAsRead(notificationId, userId);
    res.json({ message: 'Notification marked as read.' });
  }),
);

export default notificationsRouter;
