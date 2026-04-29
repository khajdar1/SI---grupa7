/**
 * Audit Service
 * Responsible for logging significant system events
 * Currently logs to console; can be extended to use a database table (AuditLog)
 *
 * Audit events are typed per domain entity to ensure consistency and catch errors early.
 * New event types must be added here as new features are implemented.
 */

/**
 * Base audit log entry interface - all audit events extend this
 */
export interface AuditLogEntry {
  action: string;
  entity: string;
  entityId?: number | string;
  userId?: number;
  details?: string;
  timestamp?: Date;
}

/**
 * SLA Configuration change event
 * Logged when a priority's response deadline is modified
 */
export interface SlaConfigurationChangeEvent extends AuditLogEntry {
  action: "SLA_CONFIGURATION_UPDATED";
  entity: "SlaConfiguration";
  entityId: string; // Priority name (LOW, MEDIUM, HIGH, CRITICAL)
  oldValues: {
    deadlineHours: number;
  };
  newValues: {
    deadlineHours: number;
  };
}

export class AuditService {
  /**
   * Log a generic audit entry
   * @param entry The audit log entry to record
   */
  static log(entry: AuditLogEntry): void {
    const timestamp = entry.timestamp || new Date();
    const logEntry = {
      ...entry,
      timestamp: timestamp.toISOString(),
    };

    // Log to console as single-line JSON for production log aggregation
    console.log(JSON.stringify({ level: "info", ...logEntry }));

    // TODO: In future sprints, persist this to AuditLog table in database
    // await prisma.auditLog.create({
    //   data: {
    //     action: entry.action,
    //     entity: entry.entity,
    //     entityId: entry.entityId,
    //     userId: entry.userId,
    //     details: entry.details,
    //     createdAt: timestamp,
    //   },
    // });
  }

  /**
   * Log SLA configuration change
   * Typed to match domain Konfiguracija_sistema entity
   */
  static logSlaConfigurationChange(
    priority: string,
    oldValue: number,
    newValue: number,
    userId?: number,
  ): void {
    const event: SlaConfigurationChangeEvent = {
      action: "SLA_CONFIGURATION_UPDATED",
      entity: "SlaConfiguration",
      entityId: priority,
      userId,
      oldValues: { deadlineHours: oldValue },
      newValues: { deadlineHours: newValue },
      details: `SLA for ${priority} priority changed from ${oldValue}h to ${newValue}h`,
    };

    this.log(event);
  }
}
