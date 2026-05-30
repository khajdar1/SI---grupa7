import { z } from "zod";

/**
 * DTO for assigning servicers to an intervention
 */
export const assignServicersSchema = z.object({
  userIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "At least one servicer must be assigned.")
    .max(100, "Cannot assign more than 100 servicers."),
  unavailableOverrideReason: z.string().trim().min(5).max(1000).optional(),
});

export type AssignServicersDto = z.infer<typeof assignServicersSchema>;

/**
 * DTO for a servicer assignment response
 */
export const assignmentResponseSchema = z.object({
  id: z.number(),
  interventionId: z.number(),
  userId: z.number(),
  assignedAt: z.date(),
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    username: z.string(),
    email: z.string().email(),
  }),
});

export type AssignmentResponseDto = z.infer<typeof assignmentResponseSchema>;

/**
 * DTO for servicer availability info (load)
 */
export const servicerAvailabilitySchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  email: z.string().email(),
  active: z.boolean(),
  activeInterventionCount: z.number().int().nonnegative(),
  sameCompany: z.boolean().optional(),
  unavailable: z.boolean().optional(),
  unavailableReason: z.string().nullable().optional(),
  unavailableFrom: z.date().nullable().optional(),
  unavailableTo: z.date().nullable().optional(),
});

export type ServicerAvailabilityDto = z.infer<
  typeof servicerAvailabilitySchema
>;
