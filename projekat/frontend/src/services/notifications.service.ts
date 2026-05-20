import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData, withServiceError } from './errors';

export type NotificationType =
  | 'NEW_REPORT'
  | 'INTERVENTION_ASSIGNED'
  | 'STATUS_CHANGED'
  | 'FEEDBACK_REQUEST'
  | 'AUTO_ASSIGNMENT'
  | 'NEW_TICKET'
  | 'TICKET_REPLY';

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  text: string;
  type: NotificationType;
  read: boolean;
  interventionId: number | null;
  ticketId: number | null;
  createdAt: string;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  return getResponseData(
    () => api.get<NotificationItem[]>(API_ENDPOINTS.NOTIFICATIONS.BASE),
    'Failed to load notifications.',
  );
}

export async function getUnreadCount(): Promise<number> {
  const data = await getResponseData(
    () => api.get<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS.UNREAD),
    'Failed to load unread count.',
  );
  return data.count;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  return withServiceError(
    async () => {
      await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {});
    },
    'Failed to mark notification as read.',
  );
}
