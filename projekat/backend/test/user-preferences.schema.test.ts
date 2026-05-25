import { describe, expect, test } from "vitest";

import {
  MANDATORY_NOTIFICATIONS,
  SUPPORTED_LANGUAGES,
  updatePreferencesSchema,
} from "../src/modules/user-preferences/user-preferences.schema";

describe("UserPreferencesSchema", () => {
  describe("SUPPORTED_LANGUAGES", () => {
    test("includes English and Bosnian", () => {
      expect(SUPPORTED_LANGUAGES).toContain("en");
      expect(SUPPORTED_LANGUAGES).toContain("bs");
    });

    test("has exactly two languages", () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(2);
    });
  });

  describe("MANDATORY_NOTIFICATIONS", () => {
    test("includes operational-critical notification types", () => {
      expect(MANDATORY_NOTIFICATIONS).toContain("NEW_REPORT");
      expect(MANDATORY_NOTIFICATIONS).toContain("INTERVENTION_ASSIGNED");
      expect(MANDATORY_NOTIFICATIONS).toContain("AUTO_ASSIGNMENT");
      expect(MANDATORY_NOTIFICATIONS).toContain("STATUS_CHANGED");
    });

    test("does not include optional notifications", () => {
      expect(MANDATORY_NOTIFICATIONS).not.toContain("FEEDBACK_REQUEST");
      expect(MANDATORY_NOTIFICATIONS).not.toContain("NEW_TICKET");
      expect(MANDATORY_NOTIFICATIONS).not.toContain("TICKET_REPLY");
    });
  });

  describe("updatePreferencesSchema", () => {
    test("accepts valid language", () => {
      const result = updatePreferencesSchema.parse({ language: "en" });
      expect(result.language).toBe("en");
    });

    test("accepts Bosnian language", () => {
      const result = updatePreferencesSchema.parse({ language: "bs" });
      expect(result.language).toBe("bs");
    });

    test("rejects unsupported language", () => {
      expect(() =>
        updatePreferencesSchema.parse({ language: "fr" }),
      ).toThrow();
    });

    test("accepts valid notification preferences", () => {
      const result = updatePreferencesSchema.parse({
        notificationPreferences: {
          NEW_REPORT: false,
          FEEDBACK_REQUEST: true,
        },
      });
      expect(result.notificationPreferences?.NEW_REPORT).toBe(false);
      expect(result.notificationPreferences?.FEEDBACK_REQUEST).toBe(true);
    });

    test("accepts empty body", () => {
      const result = updatePreferencesSchema.parse({});
      expect(result.language).toBeUndefined();
      expect(result.notificationPreferences).toBeUndefined();
    });

    test("rejects extra fields (strict mode)", () => {
      expect(() =>
        updatePreferencesSchema.parse({ unknownField: "hello" }),
      ).toThrow();
    });

    test("rejects non-boolean notification values", () => {
      expect(() =>
        updatePreferencesSchema.parse({
          notificationPreferences: { NEW_REPORT: "yes" },
        }),
      ).toThrow();
    });
  });
});
