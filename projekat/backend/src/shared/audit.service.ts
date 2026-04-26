/**
 * Audit Service
 * Responsible for logging significant system events
 * Currently logs to console; can be extended to use a database table
 */

export interface AuditLogEntry {
  action: string;
  entity: string;
  entityId?: number | string;
  userId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  details?: string;
  timestamp?: Date;
}

export class AuditService {
  /**
   * Log an audit entry
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
    //     oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
    //     newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
    //     details: entry.details,
    //     createdAt: timestamp,
    //   },
    // });
  }

  /**
   * Log SLA configuration change
   */
  static logSlaConfigurationChange(
    priority: string,
    oldValue: number,
    newValue: number,
    userId?: number,
  ): void {
    this.log({
      action: "SLA_CONFIGURATION_UPDATED",
      entity: "SlaConfiguration",
      entityId: priority,
      userId,
      oldValues: { deadlineHours: oldValue },
      newValues: { deadlineHours: newValue },
      details: `SLA for ${priority} priority changed from ${oldValue}h to ${newValue}h`,
    });
  }
}
