export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const InterventionStatus = {
  NEW: "NEW",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  ON_HOLD: "ON_HOLD",
  RESOLVED: "RESOLVED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
} as const;
export type InterventionStatus = (typeof InterventionStatus)[keyof typeof InterventionStatus];

export const InterventionType = {
  ISSUE: "ISSUE",
  PREVENTIVE: "PREVENTIVE",
} as const;
export type InterventionType = (typeof InterventionType)[keyof typeof InterventionType];

export const AssignmentMethod = {
  MANUAL: "MANUAL",
  AUTOMATIC: "AUTOMATIC",
} as const;
export type AssignmentMethod = (typeof AssignmentMethod)[keyof typeof AssignmentMethod];

export const CompanyStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  INACTIVE: "INACTIVE",
} as const;
export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus];

