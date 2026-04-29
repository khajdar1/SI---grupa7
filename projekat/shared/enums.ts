import { InterventionStatus, Priority } from '@prisma/client';

export type { InterventionStatus, Priority };

export const PRIORITY = {
  LOW: Priority.LOW,
  MEDIUM: Priority.MEDIUM,
  HIGH: Priority.HIGH,
  CRITICAL: Priority.CRITICAL,
} as const satisfies Record<Priority, Priority>;

export const INTERVENTION_STATUS = {
  NEW: InterventionStatus.NEW,
  ASSIGNED: InterventionStatus.ASSIGNED,
  IN_PROGRESS: InterventionStatus.IN_PROGRESS,
  RESOLVED: InterventionStatus.RESOLVED,
  CANCELLED: InterventionStatus.CANCELLED,
  REJECTED: InterventionStatus.REJECTED,
} as const satisfies Record<InterventionStatus, InterventionStatus>;

export const PRIORITY_OPTIONS = Object.values(PRIORITY);
export const INTERVENTION_STATUS_OPTIONS = Object.values(INTERVENTION_STATUS);
