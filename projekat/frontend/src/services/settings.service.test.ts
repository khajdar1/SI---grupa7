import { beforeEach, describe, expect, test, vi } from 'vitest';

import { API_ENDPOINTS } from '@/constants';
import { api } from '@/lib/api';

import {
  MANDATORY_NOTIFICATIONS,
  NOTIFICATION_LABELS,
  OPTIONAL_NOTIFICATION_LABELS,
  SUPPORTED_LANGUAGES,
  getUserPreferences,
  updateUserPreferences,
} from './settings.service';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApiGet = vi.mocked(api.get);
const mockedApiPut = vi.mocked(api.put);

const DEFAULT_PREFS = {
  language: 'en',
  notificationPreferences: {
    NEW_REPORT: true,
    INTERVENTION_ASSIGNED: true,
    STATUS_CHANGED: true,
    FEEDBACK_REQUEST: true,
    AUTO_ASSIGNMENT: true,
    NEW_TICKET: true,
    TICKET_REPLY: true,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SUPPORTED_LANGUAGES', () => {
  test('has English and Bosnian', () => {
    const values = SUPPORTED_LANGUAGES.map((l) => l.value);
    expect(values).toContain('en');
    expect(values).toContain('bs');
  });
});

describe('NOTIFICATION_LABELS', () => {
  test('has all notification types mapped to labels', () => {
    expect(NOTIFICATION_LABELS.NEW_REPORT).toBe('New fault report');
    expect(NOTIFICATION_LABELS.INTERVENTION_ASSIGNED).toBe('Intervention assigned');
    expect(NOTIFICATION_LABELS.NEW_TICKET).toBe('New support ticket');
  });
});

describe('MANDATORY_NOTIFICATIONS', () => {
  test('includes operational-critical types', () => {
    expect(MANDATORY_NOTIFICATIONS).toContain('INTERVENTION_ASSIGNED');
    expect(MANDATORY_NOTIFICATIONS).toContain('NEW_REPORT');
  });
});

describe('OPTIONAL_NOTIFICATION_LABELS', () => {
  test('excludes mandatory notifications', () => {
    expect(OPTIONAL_NOTIFICATION_LABELS.INTERVENTION_ASSIGNED).toBeUndefined();
    expect(OPTIONAL_NOTIFICATION_LABELS.NEW_REPORT).toBeUndefined();
  });

  test('includes optional notifications', () => {
    expect(OPTIONAL_NOTIFICATION_LABELS.FEEDBACK_REQUEST).toBe('Feedback request');
    expect(OPTIONAL_NOTIFICATION_LABELS.NEW_TICKET).toBe('New support ticket');
    expect(OPTIONAL_NOTIFICATION_LABELS.TICKET_REPLY).toBe('Ticket reply');
  });
});

describe('getUserPreferences', () => {
  test('returns preferences from API', async () => {
    mockedApiGet.mockResolvedValueOnce({ data: DEFAULT_PREFS });

    const result = await getUserPreferences();

    expect(result.language).toBe('en');
    expect(result.notificationPreferences.NEW_REPORT).toBe(true);
    expect(mockedApiGet).toHaveBeenCalledWith(API_ENDPOINTS.USER_PREFERENCES.BASE);
  });

  test('throws ServiceError on API failure', async () => {
    mockedApiGet.mockRejectedValueOnce(new Error('Network error'));

    await expect(getUserPreferences()).rejects.toThrow('Network error');
  });
});

describe('updateUserPreferences', () => {
  test('sends preferences to API and returns updated data', async () => {
    const updatedPrefs = { ...DEFAULT_PREFS, language: 'bs' };
    mockedApiPut.mockResolvedValueOnce({ data: updatedPrefs });

    const result = await updateUserPreferences({ language: 'bs' });

    expect(result.language).toBe('bs');
    expect(mockedApiPut).toHaveBeenCalledWith(
      API_ENDPOINTS.USER_PREFERENCES.BASE,
      { language: 'bs' },
    );
  });

  test('sends notification preferences update', async () => {
    mockedApiPut.mockResolvedValueOnce({
      data: {
        ...DEFAULT_PREFS,
        notificationPreferences: { ...DEFAULT_PREFS.notificationPreferences, FEEDBACK_REQUEST: false },
      },
    });

    await updateUserPreferences({
      notificationPreferences: { FEEDBACK_REQUEST: false },
    });

    expect(mockedApiPut).toHaveBeenCalledWith(
      API_ENDPOINTS.USER_PREFERENCES.BASE,
      { notificationPreferences: { FEEDBACK_REQUEST: false } },
    );
  });

  test('throws ServiceError on API failure', async () => {
    mockedApiPut.mockRejectedValueOnce(new Error('Server error'));

    await expect(updateUserPreferences({ language: 'en' })).rejects.toThrow(
      'Server error',
    );
  });
});
