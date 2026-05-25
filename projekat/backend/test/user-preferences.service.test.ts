import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  userPreferenceFindUniqueMock,
  userPreferenceUpsertMock,
  auditRecordMock,
} = vi.hoisted(() => ({
  userPreferenceFindUniqueMock: vi.fn(),
  userPreferenceUpsertMock: vi.fn(),
  auditRecordMock: vi.fn(),
}));

vi.mock("../src/config/database", () => ({
  prisma: {
    userPreference: {
      findUnique: userPreferenceFindUniqueMock,
      upsert: userPreferenceUpsertMock,
    },
  },
}));

vi.mock("../src/shared/audit.service", () => ({
  AuditService: {
    record: auditRecordMock,
  },
}));

import {
  UserPreferencesNotFoundError,
  UserPreferencesService,
} from "../src/modules/user-preferences/user-preferences.service";

function preferencesService() {
  return new UserPreferencesService();
}

const DEFAULT_PREFS = {
  language: "en",
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

describe("UserPreferencesService", () => {
  describe("getPreferences", () => {
    test("returns defaults when user is not logged in", async () => {
      const result = await preferencesService().getPreferences(undefined);

      expect(result).toEqual(DEFAULT_PREFS);
      expect(userPreferenceFindUniqueMock).not.toHaveBeenCalled();
    });

    test("returns defaults when no preferences exist in database", async () => {
      userPreferenceFindUniqueMock.mockResolvedValueOnce(null);

      const result = await preferencesService().getPreferences(7);

      expect(result).toEqual(DEFAULT_PREFS);
      expect(userPreferenceFindUniqueMock).toHaveBeenCalledWith({
        where: { userId: 7 },
      });
    });

    test("returns stored preferences when they exist", async () => {
      userPreferenceFindUniqueMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "bs",
        notificationPreferences: {
          NEW_REPORT: true,
          INTERVENTION_ASSIGNED: true,
          STATUS_CHANGED: false,
          FEEDBACK_REQUEST: false,
          AUTO_ASSIGNMENT: true,
          NEW_TICKET: true,
          TICKET_REPLY: true,
        },
        updatedAt: new Date("2026-05-24T12:00:00Z"),
      });

      const result = await preferencesService().getPreferences(7);

      expect(result.language).toBe("bs");
      expect(result.notificationPreferences.STATUS_CHANGED).toBe(false);
      expect(result.notificationPreferences.FEEDBACK_REQUEST).toBe(false);
    });

    test("merges stored preferences with defaults for any missing keys", async () => {
      userPreferenceFindUniqueMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "en",
        notificationPreferences: {
          NEW_REPORT: true,
          INTERVENTION_ASSIGNED: true,
          STATUS_CHANGED: true,
          FEEDBACK_REQUEST: true,
          AUTO_ASSIGNMENT: false,
          NEW_TICKET: true,
          TICKET_REPLY: true,
        },
        updatedAt: new Date("2026-05-24T12:00:00Z"),
      });

      const result = await preferencesService().getPreferences(7);

      expect(result.notificationPreferences.AUTO_ASSIGNMENT).toBe(false);
      expect(result.notificationPreferences.FEEDBACK_REQUEST).toBe(true);
    });
  });

  describe("updatePreferences", () => {
    test("creates new preferences when none exist (upsert create)", async () => {
      userPreferenceFindUniqueMock.mockResolvedValueOnce(null);

      userPreferenceUpsertMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "bs",
        notificationPreferences: {
          ...DEFAULT_PREFS.notificationPreferences,
        },
        updatedAt: new Date("2026-05-24T12:00:00Z"),
      });

      const result = await preferencesService().updatePreferences(7, {
        language: "bs",
      });

      expect(result.language).toBe("bs");
      expect(userPreferenceUpsertMock).toHaveBeenCalledWith({
        where: { userId: 7 },
        update: {
          language: "bs",
          notificationPreferences: DEFAULT_PREFS.notificationPreferences,
        },
        create: {
          userId: 7,
          language: "bs",
          notificationPreferences: DEFAULT_PREFS.notificationPreferences,
        },
      });
      expect(auditRecordMock).toHaveBeenCalledOnce();
    });

    test("updates existing preferences (upsert update)", async () => {
      userPreferenceFindUniqueMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "en",
        notificationPreferences: DEFAULT_PREFS.notificationPreferences,
        updatedAt: new Date("2026-05-24T12:00:00Z"),
      });

      const updatedPrefs = {
        ...DEFAULT_PREFS.notificationPreferences,
        FEEDBACK_REQUEST: false,
      };

      userPreferenceUpsertMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "en",
        notificationPreferences: updatedPrefs,
        updatedAt: new Date("2026-05-24T12:30:00Z"),
      });

      const result = await preferencesService().updatePreferences(7, {
        notificationPreferences: { FEEDBACK_REQUEST: false },
      });

      expect(result.notificationPreferences.FEEDBACK_REQUEST).toBe(false);
    });

    test("rejects disabling a mandatory notification", async () => {
      userPreferenceFindUniqueMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "en",
        notificationPreferences: DEFAULT_PREFS.notificationPreferences,
        updatedAt: new Date("2026-05-24T12:00:00Z"),
      });

      await expect(
        preferencesService().updatePreferences(7, {
          notificationPreferences: { INTERVENTION_ASSIGNED: false },
        }),
      ).rejects.toThrow(
        'Notification "INTERVENTION_ASSIGNED" is mandatory and cannot be disabled.',
      );

      expect(userPreferenceUpsertMock).not.toHaveBeenCalled();
      expect(auditRecordMock).not.toHaveBeenCalled();
    });

    test("allows admin to disable a mandatory notification", async () => {
      userPreferenceFindUniqueMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "en",
        notificationPreferences: DEFAULT_PREFS.notificationPreferences,
        updatedAt: new Date("2026-05-24T12:00:00Z"),
      });

      const updatedPrefs = {
        ...DEFAULT_PREFS.notificationPreferences,
        INTERVENTION_ASSIGNED: false,
      };

      userPreferenceUpsertMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "en",
        notificationPreferences: updatedPrefs,
        updatedAt: new Date("2026-05-24T12:30:00Z"),
      });

      const result = await preferencesService().updatePreferences(
        7,
        { notificationPreferences: { INTERVENTION_ASSIGNED: false } },
        true,
      );

      expect(result.notificationPreferences.INTERVENTION_ASSIGNED).toBe(false);
      expect(userPreferenceUpsertMock).toHaveBeenCalled();
      expect(auditRecordMock).toHaveBeenCalled();
    });

    test("throws error when user is not logged in", async () => {
      await expect(
        preferencesService().updatePreferences(undefined, {
          language: "bs",
        }),
      ).rejects.toBeInstanceOf(UserPreferencesNotFoundError);
    });

    test("partial update: only changes provided fields", async () => {
      userPreferenceFindUniqueMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "en",
        notificationPreferences: DEFAULT_PREFS.notificationPreferences,
        updatedAt: new Date("2026-05-24T12:00:00Z"),
      });

      const updatedPrefs = {
        ...DEFAULT_PREFS.notificationPreferences,
      };

      userPreferenceUpsertMock.mockResolvedValueOnce({
        id: 1,
        userId: 7,
        language: "bs",
        notificationPreferences: updatedPrefs,
        updatedAt: new Date("2026-05-24T12:30:00Z"),
      });

      const result = await preferencesService().updatePreferences(7, {
        language: "bs",
      });

      expect(result.language).toBe("bs");
      expect(result.notificationPreferences).toEqual(
        DEFAULT_PREFS.notificationPreferences,
      );
    });
  });
});
