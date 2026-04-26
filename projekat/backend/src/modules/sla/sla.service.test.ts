import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { Priority } from "@prisma/client";
import { SlaService, ISlaRepository } from "./sla.service";

const mockRepository: ISlaRepository = {
  findAll: async () => [
    {
      id: 1,
      priority: Priority.URGENT,
      deadlineHours: 2,
      updatedAt: new Date(),
    },
    { id: 2, priority: Priority.HIGH, deadlineHours: 8, updatedAt: new Date() },
    {
      id: 3,
      priority: Priority.NORMAL,
      deadlineHours: 24,
      updatedAt: new Date(),
    },
    { id: 4, priority: Priority.LOW, deadlineHours: 72, updatedAt: new Date() },
  ],
  findByPriority: async (priority: Priority) => {
    const configs: Record<Priority, any> = {
      [Priority.URGENT]: {
        id: 1,
        priority: Priority.URGENT,
        deadlineHours: 2,
        updatedAt: new Date(),
      },
      [Priority.HIGH]: {
        id: 2,
        priority: Priority.HIGH,
        deadlineHours: 8,
        updatedAt: new Date(),
      },
      [Priority.NORMAL]: {
        id: 3,
        priority: Priority.NORMAL,
        deadlineHours: 24,
        updatedAt: new Date(),
      },
      [Priority.LOW]: {
        id: 4,
        priority: Priority.LOW,
        deadlineHours: 72,
        updatedAt: new Date(),
      },
    };
    return configs[priority] || null;
  },
  update: async (priority: Priority, deadlineHours: number) => ({
    id: 1,
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

  // Retrieval Tests
  it("should retrieve all SLA configurations", async () => {
    const configs = await slaService.getAllSlaConfigurations();
    assert.strictEqual(configs.length, 4);
    assert.strictEqual(configs[0].priority, Priority.URGENT);
    assert.strictEqual(configs[0].deadlineHours, 2);
  });

  it("should retrieve SLA configuration by priority", async () => {
    const config = await slaService.getSlaByPriority(Priority.URGENT);
    assert(config !== null, "Config should not be null");
    assert.strictEqual(config.priority, Priority.URGENT);
    assert.strictEqual(config.deadlineHours, 2);
  });

  // Business Logic - Update Tests
  // NOTE: Input validation (null, type, positive, integer, max hours) is performed at request layer.
  // The service trusts pre-validated input and focuses purely on business logic and data updates.
  it("should successfully update single SLA configuration", async () => {
    const updates = [{ priority: Priority.URGENT, deadlineHours: 3 }];
    const result = await slaService.updateSlaConfigurations(updates, 123);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].priority, Priority.URGENT);
    assert.strictEqual(result[0].deadlineHours, 3);
  });

  it("should successfully update multiple SLA configurations in batch", async () => {
    const updates = [
      { priority: Priority.URGENT, deadlineHours: 3 },
      { priority: Priority.HIGH, deadlineHours: 10 },
      { priority: Priority.NORMAL, deadlineHours: 30 },
    ];
    const result = await slaService.updateSlaConfigurations(updates, 123);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].deadlineHours, 3);
    assert.strictEqual(result[1].deadlineHours, 10);
    assert.strictEqual(result[2].deadlineHours, 30);
  });

  it("should accept update with minimum valid value (1 hour)", async () => {
    const updates = [{ priority: Priority.URGENT, deadlineHours: 1 }];
    const result = await slaService.updateSlaConfigurations(updates, 123);
    assert.strictEqual(result[0].deadlineHours, 1);
  });

  it("should accept update with maximum valid value (8760 hours = 365 days)", async () => {
    const updates = [{ priority: Priority.LOW, deadlineHours: 8760 }];
    const result = await slaService.updateSlaConfigurations(updates, 123);
    assert.strictEqual(result[0].deadlineHours, 8760);
  });

  it("should handle updates across all priority levels", async () => {
    const updates = [
      { priority: Priority.URGENT, deadlineHours: 1 },
      { priority: Priority.HIGH, deadlineHours: 8 },
      { priority: Priority.NORMAL, deadlineHours: 24 },
      { priority: Priority.LOW, deadlineHours: 72 },
    ];
    const result = await slaService.updateSlaConfigurations(updates, 123);
    assert.strictEqual(result.length, 4);
    assert.strictEqual(result[0].priority, Priority.URGENT);
    assert.strictEqual(result[1].priority, Priority.HIGH);
    assert.strictEqual(result[2].priority, Priority.NORMAL);
    assert.strictEqual(result[3].priority, Priority.LOW);
  });

  it("should accept update without userId (anonymous changes)", async () => {
    const updates = [{ priority: Priority.URGENT, deadlineHours: 5 }];
    const result = await slaService.updateSlaConfigurations(updates);
    assert.strictEqual(result[0].deadlineHours, 5);
  });

  // Business Invariant Tests
  it("should reject duplicate priorities within batch update", async () => {
    const updates = [
      { priority: Priority.URGENT, deadlineHours: 3 },
      { priority: Priority.URGENT, deadlineHours: 5 }, // Duplicate
    ];
    await assert.rejects(
      () => slaService.updateSlaConfigurations(updates, 123),
      (err: Error) =>
        err.message.includes("Duplicate priority") &&
        err.message.includes("URGENT"),
    );
  });
});
