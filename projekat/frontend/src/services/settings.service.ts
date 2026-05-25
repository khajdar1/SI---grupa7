import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import { getResponseData } from './errors';

export interface UserPreferences {
  language: string;
  notificationPreferences: Record<string, boolean>;
}

export interface UpdatePreferencesInput {
  language?: string;
  notificationPreferences?: Record<string, boolean>;
}

const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bs', label: 'Bosanski' },
] as const;

const NOTIFICATION_LABELS: Record<string, string> = {
  NEW_REPORT: 'New fault report',
  INTERVENTION_ASSIGNED: 'Intervention assigned',
  STATUS_CHANGED: 'Status changed',
  FEEDBACK_REQUEST: 'Feedback request',
  AUTO_ASSIGNMENT: 'Auto assignment',
  NEW_TICKET: 'New support ticket',
  TICKET_REPLY: 'Ticket reply',
};

const MANDATORY_NOTIFICATIONS: readonly string[] = [
  'NEW_REPORT',
  'INTERVENTION_ASSIGNED',
  'AUTO_ASSIGNMENT',
  'STATUS_CHANGED',
];

const OPTIONAL_NOTIFICATION_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(NOTIFICATION_LABELS).filter(
    ([key]) => !MANDATORY_NOTIFICATIONS.includes(key),
  ),
);

export {
  SUPPORTED_LANGUAGES,
  NOTIFICATION_LABELS,
  OPTIONAL_NOTIFICATION_LABELS,
  MANDATORY_NOTIFICATIONS,
};

export async function getUserPreferences(): Promise<UserPreferences> {
  return getResponseData(
    () => api.get<UserPreferences>(API_ENDPOINTS.USER_PREFERENCES.BASE),
    'Failed to load preferences.',
  );
}

export async function updateUserPreferences(input: UpdatePreferencesInput): Promise<UserPreferences> {
  return getResponseData(
    () => api.put<UserPreferences>(API_ENDPOINTS.USER_PREFERENCES.BASE, input),
    'Failed to save preferences.',
  );
}
