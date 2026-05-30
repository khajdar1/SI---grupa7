export const PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

export const INTERVENTION_STATUS = {
  NEW: 'NEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  RESOLVED: 'RESOLVED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;

export type InterventionStatus =
  (typeof INTERVENTION_STATUS)[keyof typeof INTERVENTION_STATUS];

export const PRIORITY_OPTIONS = Object.values(PRIORITY);
export const INTERVENTION_STATUS_OPTIONS = Object.values(INTERVENTION_STATUS);
