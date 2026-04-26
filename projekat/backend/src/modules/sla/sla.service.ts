import { Priority } from "@prisma/client";
import { AuditService } from "../../shared/audit.service";

export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export interface SlaConfiguration {
  id: number;
  priority: Priority;
  deadlineHours: number;
  updatedAt: Date;
}

export interface SlaData {
  priority: Priority;
  deadlineHours: number;
}

export interface ISlaRepository {
  findAll(): Promise<SlaConfiguration[]>;
  findByPriority(priority: Priority): Promise<SlaConfiguration | null>;
  update(priority: Priority, deadlineHours: number): Promise<SlaConfiguration>;
}

export class SlaService {
  constructor(private readonly repository: ISlaRepository) {}

  async getAllSlaConfigurations(): Promise<SlaConfiguration[]> {
    return this.repository.findAll();
  }

  async getSlaByPriority(priority: Priority): Promise<SlaConfiguration | null> {
    return this.repository.findByPriority(priority);
  }

  async updateSlaConfigurations(
    updates: SlaData[],
  ): Promise<SlaConfiguration[]> {
    const fieldErrors: Record<string, string> = {};

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ValidationError("Updates array cannot be empty", fieldErrors);
    }

    const prioritySet = new Set<Priority>();
    for (let i = 0; i < updates.length; i++) {
      if (prioritySet.has(updates[i].priority)) {
        fieldErrors[`duplicate_${i}`] =
          `Duplicate priority "${updates[i].priority}" at index ${i}. Each priority can only be updated once per request.`;
      }
      prioritySet.add(updates[i].priority);
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidationError(
        "Duplicate priorities detected in batch update",
        fieldErrors,
      );
    }

    const validPriorities = Object.values(Priority);
    for (const update of updates) {
      if (!validPriorities.includes(update.priority)) {
        fieldErrors[update.priority] = "Invalid priority level";
      }
    }

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

    const currentConfigs = await this.repository.findAll();
    const currentMap = new Map(
      currentConfigs.map((c) => [c.priority, c.deadlineHours]),
    );

    const results = await Promise.all(
      updates.map((update) =>
        this.repository.update(update.priority, update.deadlineHours),
      ),
    );

    for (const config of results) {
      const oldValue = currentMap.get(config.priority) ?? 0;
      if (oldValue !== config.deadlineHours) {
        AuditService.logSlaConfigurationChange(
          config.priority,
          oldValue,
          config.deadlineHours,
        );
      }
    }

    return results;
  }
}
