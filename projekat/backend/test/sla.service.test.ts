import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { Priority, SlaService, ISlaRepository } from "../src/modules/sla/sla.service";

const mockRepository: ISlaRepository = {
  findAll: async () => [
    {
      id: 1,
      priority: Priority.CRITICAL,
      deadlineHours: 2,
      updatedAt: new Date(),
    },
    { id: 2, priority: Priority.HIGH, deadlineHours: 8, updatedAt: new Date() },
    {
      id: 3,
      priority: Priority.MEDIUM,
      deadlineHours: 24,
      updatedAt: new Date(),
    },
    { id: 4, priority: Priority.LOW, deadlineHours: 72, updatedAt: new Date() },
  ],
  findByPriority: async (priority: Priority) => {
    const configurations: Record<Priority, any> = {
      [Priority.CRITICAL]: {
        id: 1,
        priority: Priority.CRITICAL,
        deadlineHours: 2,
        updatedAt: new Date(),
      },
      [Priority.HIGH]: {
        id: 2,
        priority: Priority.HIGH,
        deadlineHours: 8,
        updatedAt: new Date(),
      },
      [Priority.MEDIUM]: {
        id: 3,
        priority: Priority.MEDIUM,
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

    return configurations[priority] || null;
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

  it("should retrieve all SLA configurations", async () => {
    const configurations = await slaService.getAllSlaConfigurations();
    assert.strictEqual(configurations.length, 4);
    assert.strictEqual(configurations[0].priority, Priority.CRITICAL);
    assert.strictEqual(configurations[0].deadlineHours, 2);
  });

  it("should retrieve SLA configuration by priority", async () => {
    const configuration = await slaService.getSlaByPriority(Priority.CRITICAL);
    assert(configuration !== null, "Config should not be null");
    assert.strictEqual(configuration.priority, Priority.CRITICAL);
    assert.strictEqual(configuration.deadlineHours, 2);
  });

  it("should successfully update single SLA configuration", async () => {
    const updates = [{ priority: Priority.CRITICAL, deadlineHours: 3 }];
    const result = await slaService.updateSlaConfigurations(updates, 123);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].priority, Priority.CRITICAL);
    assert.strictEqual(result[0].deadlineHours, 3);
  });

  it("should successfully update multiple SLA configurations in batch", async () => {
    const updates = [
      { priority: Priority.CRITICAL, deadlineHours: 3 },
      { priority: Priority.HIGH, deadlineHours: 10 },
      { priority: Priority.MEDIUM, deadlineHours: 30 },
    ];
    const result = await slaService.updateSlaConfigurations(updates, 123);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].deadlineHours, 3);
    assert.strictEqual(result[1].deadlineHours, 10);
    assert.strictEqual(result[2].deadlineHours, 30);
  });

  it("should accept update with minimum valid value (1 hour)", async () => {
    const updates = [{ priority: Priority.CRITICAL, deadlineHours: 1 }];
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
      { priority: Priority.CRITICAL, deadlineHours: 1 },
      { priority: Priority.HIGH, deadlineHours: 8 },
      { priority: Priority.MEDIUM, deadlineHours: 24 },
      { priority: Priority.LOW, deadlineHours: 72 },
    ];
    const result = await slaService.updateSlaConfigurations(updates, 123);
    assert.strictEqual(result.length, 4);
    assert.strictEqual(result[0].priority, Priority.CRITICAL);
    assert.strictEqual(result[1].priority, Priority.HIGH);
    assert.strictEqual(result[2].priority, Priority.MEDIUM);
    assert.strictEqual(result[3].priority, Priority.LOW);
  });

  it("should accept update without userId (anonymous changes)", async () => {
    const updates = [{ priority: Priority.CRITICAL, deadlineHours: 5 }];
    const result = await slaService.updateSlaConfigurations(updates);
    assert.strictEqual(result[0].deadlineHours, 5);
  });

  it("should reject duplicate priorities within batch update", async () => {
    const updates = [
      { priority: Priority.CRITICAL, deadlineHours: 3 },
      { priority: Priority.CRITICAL, deadlineHours: 5 },
    ];
    await assert.rejects(
      () => slaService.updateSlaConfigurations(updates, 123),
      (err: Error) =>
        err.message.includes("Duplicate priority") && err.message.includes("CRITICAL"),
    );
  });
});

