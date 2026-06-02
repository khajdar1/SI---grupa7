import { prisma } from "../../config/database";
import { AuditService } from "../../shared/audit.service";
import {
  MANDATORY_NOTIFICATIONS,
  type UpdatePreferencesInput,
  type UserPreferencesResponse,
} from "./user-preferences.schema";

export class UserPreferencesNotFoundError extends Error {
  constructor(message = "Preferences could not be found.") {
    super(message);
    this.name = "UserPreferencesNotFoundError";
  }
}

const DEFAULT_NOTIFICATION_PREFERENCES: Record<string, boolean> = {
  NEW_REPORT: true,
  INTERVENTION_ASSIGNED: true,
  STATUS_CHANGED: true,
  FEEDBACK_REQUEST: true,
  AUTO_ASSIGNMENT: true,
  NEW_TICKET: true,
  TICKET_REPLY: true,
  INTERVENTION_PAUSED: true,
  SERVICER_DISPATCHED: true,
  SERVICER_ARRIVED: true,
  EXECUTION_CONFIRMATION_REQUEST: true,
  EXECUTION_CONFIRMATION_RESPONSE: true,
  REOPEN_REQUEST: true,
  REOPEN_APPROVED: true,
  REOPEN_REJECTED: true,
};

const DEFAULT_LANGUAGE = "en";

function getDefaultPreferences(): UserPreferencesResponse {
  return {
    language: DEFAULT_LANGUAGE,
    notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
  };
}

export class UserPreferencesService {
  async getPreferences(localUserId?: number): Promise<UserPreferencesResponse> {
    if (!localUserId) {
      return getDefaultPreferences();
    }

    const prefs = await prisma.userPreference.findUnique({
      where: { userId: localUserId },
    });

    if (!prefs) {
      return getDefaultPreferences();
    }

    const stored = prefs.notificationPreferences as Record<string, boolean>;

    const merged = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...stored };

    return {
      language: prefs.language,
      notificationPreferences: merged,
    };
  }

  async updatePreferences(
    localUserId: number | undefined,
    input: UpdatePreferencesInput,
    isAdmin = false,
  ): Promise<UserPreferencesResponse> {
    if (!localUserId) {
      throw new UserPreferencesNotFoundError();
    }

    const existing = await this.getPreferences(localUserId);
    const language = input.language ?? existing.language;
    const incoming = input.notificationPreferences;
    const notificationPreferences = incoming
      ? { ...existing.notificationPreferences, ...incoming }
      : existing.notificationPreferences;

    if (!isAdmin) {
      for (const key of MANDATORY_NOTIFICATIONS) {
        if (notificationPreferences[key] === false) {
          throw new Error(
            `Notification "${key}" is mandatory and cannot be disabled.`,
          );
        }
      }
    }

    const updated = await prisma.userPreference.upsert({
      where: { userId: localUserId },
      update: {
        language,
        notificationPreferences,
      },
      create: {
        userId: localUserId,
        language,
        notificationPreferences,
      },
    });

    void AuditService.record({
      action: "USER_PREFERENCE_UPDATED",
      entity: "UserPreference",
      entityId: updated.id,
      actorId: localUserId,
      oldValues: {
        language: existing.language,
        notificationPreferences: existing.notificationPreferences,
      },
      newValues: {
        language: updated.language,
        notificationPreferences: updated.notificationPreferences as Record<string, boolean>,
      },
      details: "User preferences updated.",
    });

    return {
      language: updated.language,
      notificationPreferences: updated.notificationPreferences as Record<string, boolean>,
    };
  }
}
