import type { Request, Response } from "express";
import {
  AssignmentService,
  type AssignmentRecord,
  type ServicerAvailabilityInfo,
} from "./assignment.service";
import {
  assignServicersSchema,
  type AssignServicersDto,
  type AssignmentResponseDto,
  type ServicerAvailabilityDto,
} from "./assignment.dto";
import { BadRequestError, NotFoundError } from "../../shared/errors";

/**
 * AssignmentController
 * Handles HTTP requests for servicer assignment operations
 */
export class AssignmentController {
  /**
   * POST /interventions/:interventionId/assignments
   * Assign one or more servicers to an intervention
   */
  static async assignServicers(req: Request, res: Response): Promise<void> {
    const rawInterventionId = req.params.interventionId;
    if (typeof rawInterventionId !== "string") {
      throw new BadRequestError("Invalid intervention ID.", [
        { field: "interventionId", message: "Intervention ID must be a positive integer." },
      ]);
    }

    const interventionId = parseInt(rawInterventionId, 10);
    const actorId = (req.user as any)?.id;
    const actorUsername = (req.user as any)?.username;

    if (!interventionId || isNaN(interventionId) || interventionId <= 0) {
      throw new BadRequestError("Invalid intervention ID.", [
        { field: "interventionId", message: "Intervention ID must be a positive integer." },
      ]);
    }

    if (!actorId || !actorUsername) {
      throw new BadRequestError("User context is missing.", [
        { field: "auth", message: "Authentication required." },
      ]);
    }

    // Validate request body
    const validation = assignServicersSchema.safeParse(req.body);
    if (!validation.success) {
      const fields = validation.error.issues.map((issue) => ({
        field: issue.path.join(".") || "userIds",
        message: issue.message,
      }));
      throw new BadRequestError("Validation failed.", fields);
    }

    const payload: AssignServicersDto = validation.data;

    // Call service to assign servicers
    const assignments = await AssignmentService.assignServicesToIntervention(
      interventionId,
      payload.userIds,
      actorId,
      actorUsername,
    );

    // Convert to response DTOs
    const responseData: AssignmentResponseDto[] = assignments.map((a) => ({
      id: a.id,
      interventionId: a.interventionId,
      userId: a.userId,
      assignedAt: a.assignedAt,
      user: {
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName,
        username: a.user.username,
        email: a.user.email,
      },
    }));

    res.status(201).json({
      success: true,
      data: responseData,
      message: `${responseData.length} servicer(s) assigned.`,
    });
  }

  /**
   * DELETE /interventions/:interventionId/assignments/:userId
   * Remove a servicer assignment from an intervention
   */
  static async removeServicer(req: Request, res: Response): Promise<void> {
    const rawInterventionId = req.params.interventionId;
    const rawUserId = req.params.userId;

    if (typeof rawInterventionId !== "string" || typeof rawUserId !== "string") {
      throw new BadRequestError("Invalid parameters.", [
        { field: "params", message: "Intervention ID and Servicer ID must be provided." },
      ]);
    }

    const interventionId = parseInt(rawInterventionId, 10);
    const userId = parseInt(rawUserId, 10);
    const actorId = (req.user as any)?.id;
    const actorUsername = (req.user as any)?.username;

    if (!interventionId || isNaN(interventionId) || interventionId <= 0) {
      throw new BadRequestError("Invalid intervention ID.", [
        { field: "interventionId", message: "Intervention ID must be a positive integer." },
      ]);
    }

    if (!userId || isNaN(userId) || userId <= 0) {
      throw new BadRequestError("Invalid servicer ID.", [
        { field: "userId", message: "Servicer ID must be a positive integer." },
      ]);
    }

    if (!actorId || !actorUsername) {
      throw new BadRequestError("User context is missing.", [
        { field: "auth", message: "Authentication required." },
      ]);
    }

    // Call service to remove servicer
    await AssignmentService.removeServicer(
      interventionId,
      userId,
      actorId,
      actorUsername,
    );

    res.status(200).json({
      success: true,
      message: "Servicer assignment removed.",
    });
  }

  /**
   * GET /interventions/:interventionId/assignments
   * Get all assignments for an intervention
   */
  static async getAssignments(req: Request, res: Response): Promise<void> {
    const rawInterventionId = req.params.interventionId;
    if (typeof rawInterventionId !== "string") {
      throw new BadRequestError("Invalid intervention ID.", [
        { field: "interventionId", message: "Intervention ID must be a positive integer." },
      ]);
    }

    const interventionId = parseInt(rawInterventionId, 10);

    if (!interventionId || isNaN(interventionId) || interventionId <= 0) {
      throw new BadRequestError("Invalid intervention ID.", [
        { field: "interventionId", message: "Intervention ID must be a positive integer." },
      ]);
    }

    // Call service to get assignments
    const assignments: AssignmentRecord[] =
      await AssignmentService.getInterventionAssignments(interventionId);

    // Convert to response DTOs
    const responseData: AssignmentResponseDto[] = assignments.map((a) => ({
      id: a.id,
      interventionId: a.interventionId,
      userId: a.userId,
      assignedAt: a.assignedAt,
      user: {
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName,
        username: a.user.username,
        email: a.user.email,
      },
    }));

    res.status(200).json({
      success: true,
      data: responseData,
    });
  }

  /**
   * GET /interventions/:interventionId/assignments/available
   * Get list of available servicers with their current load
   * Returns servicers sorted by active intervention count (least burdened first)
   */
  static async getAvailableServicers(req: Request, res: Response): Promise<void> {
    const rawInterventionId = req.params.interventionId;
    if (typeof rawInterventionId !== "string") {
      throw new BadRequestError("Invalid intervention ID.", [
        { field: "interventionId", message: "Intervention ID must be a positive integer." },
      ]);
    }

    const interventionId = parseInt(rawInterventionId, 10);

    if (!interventionId || isNaN(interventionId) || interventionId <= 0) {
      throw new BadRequestError("Invalid intervention ID.", [
        { field: "interventionId", message: "Intervention ID must be a positive integer." },
      ]);
    }

    // Get intervention to find company
    const { prisma } = await import("../../config/database.js");
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { companyId: true },
    });

    if (!intervention) {
      throw new NotFoundError("Intervention not found.");
    }

    // Call service to get available servicers with load
    const servicers: ServicerAvailabilityInfo[] =
      await AssignmentService.getAvailableServicersWithLoad(
        intervention.companyId,
      );

    // Convert to response DTOs
    const responseData: ServicerAvailabilityDto[] = servicers.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      username: s.username,
      email: s.email,
      active: s.active,
      activeInterventionCount: s.activeInterventionCount,
    }));

    res.status(200).json({
      success: true,
      data: responseData,
    });
  }
}
