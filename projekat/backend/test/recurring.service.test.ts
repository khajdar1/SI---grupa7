import { describe, expect, it } from "vitest";
import { RecurringPeriod } from "@prisma/client";
import { computeNextGenerationAt } from "../src/services/recurring.service";

describe("PBI-022 recurring.service", () => {
  describe("computeNextGenerationAt", () => {
    it("adds one day for DAILY period", () => {
      const from = new Date("2026-05-16T10:00:00.000Z");
      const result = computeNextGenerationAt(from, RecurringPeriod.DAILY);
      expect(result).toEqual(new Date("2026-05-17T10:00:00.000Z"));
    });

    it("adds seven days for WEEKLY period", () => {
      const from = new Date("2026-05-16T10:00:00.000Z");
      const result = computeNextGenerationAt(from, RecurringPeriod.WEEKLY);
      expect(result).toEqual(new Date("2026-05-23T10:00:00.000Z"));
    });

    it("adds one month for MONTHLY period", () => {
      const from = new Date("2026-05-16T10:00:00.000Z");
      const result = computeNextGenerationAt(from, RecurringPeriod.MONTHLY);
      expect(result).toEqual(new Date("2026-06-16T10:00:00.000Z"));
    });

    it("adds one year for YEARLY period", () => {
      const from = new Date("2026-05-16T10:00:00.000Z");
      const result = computeNextGenerationAt(from, RecurringPeriod.YEARLY);
      expect(result).toEqual(new Date("2027-05-16T10:00:00.000Z"));
    });

    it("does not mutate the original date", () => {
      const from = new Date("2026-05-16T10:00:00.000Z");
      const original = from.getTime();
      computeNextGenerationAt(from, RecurringPeriod.DAILY);
      expect(from.getTime()).toBe(original);
    });
  });
});