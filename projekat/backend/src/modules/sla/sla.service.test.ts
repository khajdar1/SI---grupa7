import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { Priority } from "@prisma/client";
import { SlaService, ValidationError, ISlaRepository } from "./sla.service";

const mockRepository: ISlaRepository = {
  findAll: async () => [
    { priority: Priority.URGENT, deadlineHours: 2, updatedAt: new Date() },
    { priority: Priority.HIGH, deadlineHours: 8, updatedAt: new Date() },
    { priority: Priority.NORMAL, deadlineHours: 24, updatedAt: new Date() },
    { priority: Priority.LOW, deadlineHours: 72, updatedAt: new Date() },
  ],
  findByPriority: async (priority: Priority) => {
    const configs: Record<Priority, any> = {
      [Priority.URGENT]: {
        priority: Priority.URGENT,
        deadlineHours: 2,
        updatedAt: new Date(),
      },
      [Priority.HIGH]: {
        priority: Priority.HIGH,
        deadlineHours: 8,
        updatedAt: new Date(),
      },
      [Priority.NORMAL]: {
        priority: Priority.NORMAL,
        deadlineHours: 24,
        updatedAt: new Date(),
      },
      [Priority.LOW]: {
        priority: Priority.LOW,
        deadlineHours: 72,
        updatedAt: new Date(),
      },
    };
    return configs[priority] || null;
  },
  update: async (priority: Priority, deadlineHours: number) => ({
    priority,
    deadlineHours,
    updatedAt: new Date(),
  }),
};

let slaService: SlaService;

describe("SlaService", () => {
  beforeEach(() => {
    slaService = new SlaService(mockRepository);
  });

  // Happy Path Tests
  it("should retrieve all SLA configurations", async () => {
    const configs = await slaService.getAllSlaConfigurations();
    assert.strictEqual(configs.length, 4);
    assert.strictEqual(configs[0].priority, Priority.URGENT);
    assert.strictEqual(configs[0].deadlineHours, 2);
  });

  it("should retrieve SLA configuration by priority", async () => {
    const config = await slaService.getSlaByPriority(Priority.URGENT);
    assert.strictEqual(config.priority, Priority.URGENT);
    assert.strictEqual(config.deadlineHours, 2);
  });

  it("should successfully update SLA configurations with valid data", async () => {
    const updates = [
      { priority: Priority.URGENT, deadlineHours: 3 },
      { priority: Priority.HIGH, deadlineHours: 10 },
    ];
    const result = await slaService.updateSlaConfigurations(updates);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].deadlineHours, 3);
    assert.strictEqual(result[1].deadlineHours, 10);
  });

  // Empty/Zero/Negative Value Tests
  it("should reject update when hours is zero", async () => {
    const updates = [{ priority: Priority.URGENT, deadlineHours: 0 }];
    try {
      await slaService.updateSlaConfigurations(updates);
      assert.fail("Should have thrown ValidationError");
    } catch (error) {
      assert(error instanceof ValidationError);
      assert(Object.keys((error as ValidationError).fieldErrors).length > 0);
      assert.match(
        Object.values((error as ValidationError).fieldErrors)[0],
        /greater than zero/i,
      );
    }
  });

  it("should reject update when hours is negative", async () => {
    const updates = [{ priority: Priority.HIGH, deadlineHours: -5 }];
    try {
      await slaService.updateSlaConfigurations(updates);
      assert.fail("Should have thrown ValidationError");
    } catch (error) {
      assert(error instanceof ValidationError);
      assert(Object.keys((error as ValidationError).fieldErrors).length > 0);
    }
  });

  it("should reject update when hours is null", async () => {
    const updates = [{ priority: Priority.URGENT, deadlineHours: null as any }];
    try {
      await slaService.updateSlaConfigurations(updates);
      assert.fail("Should have thrown ValidationError");
    } catch (error) {
      assert(error instanceof ValidationError);
      assert(Object.keys((error as ValidationError).fieldErrors).length > 0);
      assert.match(
        Object.values((error as ValidationError).fieldErrors)[0],
        /cannot be empty/i,
      );
    }
  });

  it("should reject update when hours is undefined", async () => {
    const updates = [
      { priority: Priority.HIGH, deadlineHours: undefined as any },
    ];
    try {
      await slaService.updateSlaConfigurations(updates);
      assert.fail("Should have thrown ValidationError");
    } catch (error) {
      assert(error instanceof ValidationError);
      assert(Object.keys((error as ValidationError).fieldErrors).length > 0);
    }
  });

  // Non-Integer Values
  it("should reject update when hours is not a whole number", async () => {
    const updates = [{ priority: Priority.NORMAL, deadlineHours: 5.5 }];
    try {
      await slaService.updateSlaConfigurations(updates);
      assert.fail("Should have thrown ValidationError");
    } catch (error) {
      assert(error instanceof ValidationError);
      assert(Object.keys((error as ValidationError).fieldErrors).length > 0);
      assert.match(
        Object.values((error as ValidationError).fieldErrors)[0],
        /whole number/i,
      );
    }
  });

  // Invalid Priority
  it("should reject update with invalid priority", async () => {
    const updates = [{ priority: "INVALID" as any, deadlineHours: 24 }];
    try {
      await slaService.updateSlaConfigurations(updates);
      assert.fail("Should have thrown ValidationError");
    } catch (error) {
      assert(error instanceof ValidationError);
      assert(Object.keys((error as ValidationError).fieldErrors).length > 0);
      assert.match(
        Object.values((error as ValidationError).fieldErrors)[0],
        /Invalid priority/i,
      );
    }
  });

  // Boundary Tests
  it("should accept update at boundary value (8760 hours = 365 days)", async () => {
    const updates = [{ priority: Priority.LOW, deadlineHours: 8760 }];
    const result = await slaService.updateSlaConfigurations(updates);
    assert.strictEqual(result[0].deadlineHours, 8760);
  });

  it("should reject update exceeding maximum allowed hours", async () => {
    const updates = [{ priority: Priority.LOW, deadlineHours: 8761 }];
    try {
      await slaService.updateSlaConfigurations(updates);
      assert.fail("Should have thrown ValidationError");
    } catch (error) {
      assert(error instanceof ValidationError);
      assert(Object.keys((error as ValidationError).fieldErrors).length > 0);
      assert.match(
        Object.values((error as ValidationError).fieldErrors)[0],
        /too large/i,
      );
    }
  });

  it("should accept minimum valid value (1 hour)", async () => {
    const updates = [{ priority: Priority.URGENT, deadlineHours: 1 }];
    const result = await slaService.updateSlaConfigurations(updates);
    assert.strictEqual(result[0].deadlineHours, 1);
  });

  // Multiple Updates with Mixed Validity
  it("should reject batch update if any value is invalid", async () => {
    const updates = [
      { priority: Priority.URGENT, deadlineHours: 2 },
      { priority: Priority.HIGH, deadlineHours: 0 }, // Invalid
      { priority: Priority.NORMAL, deadlineHours: 24 },
    ];
    try {
      await slaService.updateSlaConfigurations(updates);
      assert.fail("Should have thrown ValidationError");
    } catch (error) {
      assert(error instanceof ValidationError);
      const fieldErrors = (error as ValidationError).fieldErrors;
      assert(Object.keys(fieldErrors).length > 0);
    }
  });

  it("should include field names in error response for all invalid fields", async () => {
    const updates = [
      { priority: Priority.URGENT, deadlineHours: -1 },
      { priority: Priority.HIGH, deadlineHours: 0 },
      { priority: Priority.NORMAL, deadlineHours: null as any },
    ];
    try {
      await slaService.updateSlaConfigurations(updates);
      assert.fail("Should have thrown ValidationError");
    } catch (error) {
      assert(error instanceof ValidationError);
      const fieldErrors = (error as ValidationError).fieldErrors;
      assert(Object.keys(fieldErrors).length >= 3);
      assert("URGENT_hours" in fieldErrors);
      assert("HIGH_hours" in fieldErrors);
      assert("NORMAL_hours" in fieldErrors);
    }
  });
});
