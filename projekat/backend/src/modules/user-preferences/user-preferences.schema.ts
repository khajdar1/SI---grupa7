import { z } from "zod";

export const SUPPORTED_LANGUAGES = ["en", "bs"] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const NOTIFICATION_TYPES = [
  "NEW_REPORT",
  "INTERVENTION_ASSIGNED",
  "STATUS_CHANGED",
  "FEEDBACK_REQUEST",
  "AUTO_ASSIGNMENT",
  "NEW_TICKET",
  "TICKET_REPLY",
] as const;

export const MANDATORY_NOTIFICATIONS: readonly string[] = [
  "NEW_REPORT",
  "INTERVENTION_ASSIGNED",
  "AUTO_ASSIGNMENT",
  "STATUS_CHANGED",
];

export const updatePreferencesSchema = z
  .object({
    language: z.enum(SUPPORTED_LANGUAGES).optional(),
    notificationPreferences: z.record(z.string(), z.boolean()).optional(),
  })
  .strict();

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export interface UserPreferencesResponse {
  language: string;
  notificationPreferences: Record<string, boolean>;
}
