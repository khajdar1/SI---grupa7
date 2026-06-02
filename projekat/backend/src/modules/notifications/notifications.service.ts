import { ForbiddenError, NotFoundError } from '../../shared/errors';

export type NotificationType =
  | 'NEW_REPORT'
  | 'INTERVENTION_ASSIGNED'
  | 'STATUS_CHANGED'
  | 'FEEDBACK_REQUEST'
  | 'AUTO_ASSIGNMENT'
  | 'NEW_TICKET'
  | 'TICKET_REPLY'
  | 'INTERVENTION_PAUSED'
  | 'EXECUTION_CONFIRMATION_REQUEST'
  | 'EXECUTION_CONFIRMATION_RESPONSE'
  | 'INTERVENTION_SCHEDULED'
  | 'APPOINTMENT_RESCHEDULE_REQUEST'
  | 'APPOINTMENT_RESCHEDULE_RESPONSE'
  | 'APPOINTMENT_RESCHEDULE_PROPOSED';

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  text: string;
  type: NotificationType;
  read: boolean;
  interventionId: number | null;
  ticketId: number | null;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: number;
  title: string;
  text: string;
  type: NotificationType;
  interventionId?: number | null;
  ticketId?: number | null;
}

export interface NotificationRepository {
  findByUserId(userId: number): Promise<NotificationItem[]>;
  countUnread(userId: number): Promise<number>;
  findById(id: number): Promise<NotificationItem | null>;
  markAsRead(id: number): Promise<void>;
  create(input: CreateNotificationInput): Promise<NotificationItem>;
}

export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  async getUserNotifications(userId: number): Promise<NotificationItem[]> {
    return this.repository.findByUserId(userId);
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.repository.countUnread(userId);
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await this.repository.findById(notificationId);

    if (!notification) {
      throw new NotFoundError('Notification not found.');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have access to this notification.');
    }

    await this.repository.markAsRead(notificationId);
  }

  async createNotification(input: CreateNotificationInput): Promise<NotificationItem> {
    return this.repository.create(input);
  }
}
