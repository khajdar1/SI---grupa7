import type { Prisma } from "@prisma/client";

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
  actorId?: number;
  actorUsername?: string;
  details?: string;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
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

/**
 * Attachment deleted event
 * Logged when an admin or coordinator deletes a file attachment
 */
export interface AttachmentDeletedEvent extends AuditLogEntry {
  action: "ATTACHMENT_DELETED";
  entity: "Attachment";
  entityId: number;
  details: string;
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

  static async record(entry: AuditLogEntry): Promise<void> {
    this.log(entry);
    const { prisma } = await import("../config/database.js");

    await prisma.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId === undefined ? null : String(entry.entityId),
        actorId: entry.actorId ?? entry.userId ?? null,
        actorUsername: entry.actorUsername ?? null,
        details: entry.details ?? null,
        oldValues: entry.oldValues ?? undefined,
        newValues: entry.newValues ?? undefined,
        createdAt: entry.timestamp ?? new Date(),
      },
    });
  }

  /**
   * Log attachment deletion
   * Records who deleted which file and when
   */
  static logAttachmentDeleted(
    attachmentId: number,
    fileName: string,
    actorUsername: string,
  ): void {
    const event: AttachmentDeletedEvent = {
      action: "ATTACHMENT_DELETED",
      entity: "Attachment",
      entityId: attachmentId,
      details: `Attachment '${fileName}' (id=${attachmentId}) deleted by ${actorUsername}`,
    };

    this.log(event);
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
