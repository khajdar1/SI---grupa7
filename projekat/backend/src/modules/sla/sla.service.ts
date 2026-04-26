import { Priority } from "@prisma/client";
import { AuditService } from "../../shared/audit.service";

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
    userId?: number,
  ): Promise<SlaConfiguration[]> {
    // Request validator has already checked:
    // - array format and non-empty
    // - each config is valid object with proper types
    // - all priorities are valid enum values
    // - all deadlineHours are positive integers within range
    //
    // Service only validates business invariants:

    // Check for duplicate priorities within this batch
    // (request validator checks this, but we validate as defensive measure for business logic consistency)
    const prioritySet = new Set<Priority>();
    for (const update of updates) {
      if (prioritySet.has(update.priority)) {
        throw new Error(
          `Business logic error: Duplicate priority "${update.priority}" in batch update`,
        );
      }
      prioritySet.add(update.priority);
    }

    // Fetch current values for audit logging before making changes
    const currentConfigs = await this.repository.findAll();
    const currentMap = new Map(
      currentConfigs.map((c) => [c.priority, c.deadlineHours]),
    );

    // Apply updates
    const results = await Promise.all(
      updates.map((update) =>
        this.repository.update(update.priority, update.deadlineHours),
      ),
    );

    // Audit log changes
    for (const config of results) {
      const oldValue = currentMap.get(config.priority) ?? 0;
      if (oldValue !== config.deadlineHours) {
        AuditService.logSlaConfigurationChange(
          config.priority,
          oldValue,
          config.deadlineHours,
          userId,
        );
      }
    }

    return results;
  }
}
