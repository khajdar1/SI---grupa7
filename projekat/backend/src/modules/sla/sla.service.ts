import { Priority } from "@prisma/client";

export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export interface SlaData {
  priority: Priority;
  deadlineHours: number;
}

export interface ISlaRepository {
  findAll(): Promise<any[]>;
  findByPriority(priority: Priority): Promise<any | null>;
  update(priority: Priority, deadlineHours: number): Promise<any>;
}

export class SlaService {
  constructor(private readonly repository: ISlaRepository) {}

  async getAllSlaConfigurations() {
    return this.repository.findAll();
  }

  async getSlaByPriority(priority: Priority) {
    return this.repository.findByPriority(priority);
  }

  async updateSlaConfigurations(updates: SlaData[]) {
    const fieldErrors: Record<string, string> = {};

    // Validate all priorities
    const validPriorities = Object.values(Priority);
    for (const update of updates) {
      if (!validPriorities.includes(update.priority)) {
        fieldErrors[update.priority] = "Invalid priority level";
      }
    }

    // Validate all hours are positive integers
    for (const update of updates) {
      const fieldKey = `${update.priority}_hours`;

      if (update.deadlineHours === null || update.deadlineHours === undefined) {
        fieldErrors[fieldKey] = "Hours value cannot be empty";
        continue;
      }

      if (!Number.isInteger(update.deadlineHours)) {
        fieldErrors[fieldKey] = "Hours must be a whole number";
        continue;
      }

      if (update.deadlineHours <= 0) {
        fieldErrors[fieldKey] = "Hours must be greater than zero";
        continue;
      }

      if (update.deadlineHours > 8760) {
        // 365 * 24 hours = max reasonable value
        fieldErrors[fieldKey] =
          "Hours value is too large (max 8760 hours = 365 days)";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidationError(
        "SLA configuration validation failed",
        fieldErrors,
      );
    }

    // Update all configurations
    const results = await Promise.all(
      updates.map((update) =>
        this.repository.update(update.priority, update.deadlineHours),
      ),
    );

    return results;
  }
}
