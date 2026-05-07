import { prisma } from "../../config/database";
import { AuditService } from "../../shared/audit.service";
import { BadRequestError, NotFoundError } from "../../shared/errors";

export interface ServicerAvailabilityInfo {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  active: boolean;
  activeInterventionCount: number;
}

export interface AssignmentRecord {
  id: number;
  interventionId: number;
  userId: number;
  assignedAt: Date;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  };
}

/**
 * AssignmentService
 * Handles all assignment operations: creation, removal, and querying servicer availability
 * All operations are audit-logged
 */
export class AssignmentService {
  /**
   * Assign one or more servicers to an intervention
   * @param interventionId ID of the intervention
   * @param userIds Array of servicer user IDs to assign
   * @param actorId ID of the user performing the assignment (coordinator)
   * @param actorUsername Username of the actor
   * @throws BadRequestError if servicer is deactivated or intervention doesn't exist
   * @throws NotFoundError if intervention not found
   */
  static async assignServicesToIntervention(
    interventionId: number,
    userIds: number[],
    actorId: number,
    actorUsername: string,
  ): Promise<AssignmentRecord[]> {
    // Validate intervention exists
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { id: true, companyId: true },
    });

    if (!intervention) {
      throw new NotFoundError("Intervention not found.");
    }

    // Validate all users exist and are active servicers
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, active: true, firstName: true, lastName: true },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestError("One or more servicers not found.", [
        { field: "userIds", message: "Invalid servicer ID provided." },
      ]);
    }

    // Check for deactivated users
    const inactiveUsers = users.filter((u) => !u.active);
    if (inactiveUsers.length > 0) {
      throw new BadRequestError(
        "Cannot assign deactivated servicers.",
        inactiveUsers.map((u) => ({
          field: "userIds",
          message: `Servicer ${u.firstName} ${u.lastName} is deactivated.`,
        })),
      );
    }

    // Get existing assignments to calculate which are new
    const existingAssignments = await prisma.assignment.findMany({
      where: { interventionId },
      select: { userId: true },
    });

    const existingUserIds = new Set(existingAssignments.map((a) => a.userId));
    const newUserIds = userIds.filter((id) => !existingUserIds.has(id));

    // Create new assignments only
    const createdAssignments: AssignmentRecord[] = [];

    for (const userId of newUserIds) {
      const assignment = await prisma.assignment.create({
        data: {
          interventionId,
          userId,
          method: "MANUAL",
          assignedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
            },
          },
        },
      });

      createdAssignments.push(assignment);

      // Audit log each new assignment
      await AuditService.record({
        action: "ASSIGNMENT_CREATED",
        entity: "Assignment",
        entityId: assignment.id,
        actorId,
        actorUsername,
        details: `Assigned servicer ${assignment.user.firstName} ${assignment.user.lastName} to intervention ${interventionId}`,
        newValues: {
          interventionId,
          userId,
          method: "MANUAL",
          assignedAt: assignment.assignedAt.toISOString(),
        },
      });
    }

    return createdAssignments;
  }

  /**
   * Remove a servicer assignment from an intervention
   * @param interventionId ID of the intervention
   * @param userId ID of the servicer to unassign
   * @param actorId ID of the user performing the removal (coordinator)
   * @param actorUsername Username of the actor
   * @throws NotFoundError if assignment doesn't exist
   */
  static async removeServicer(
    interventionId: number,
    userId: number,
    actorId: number,
    actorUsername: string,
  ): Promise<void> {
    // Find and delete the assignment
    const assignment = await prisma.assignment.findUnique({
      where: {
        interventionId_userId: {
          interventionId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError("Assignment not found.");
    }

    await prisma.assignment.delete({
      where: {
        interventionId_userId: {
          interventionId,
          userId,
        },
      },
    });

    // Audit log the removal
    await AuditService.record({
      action: "ASSIGNMENT_REMOVED",
      entity: "Assignment",
      entityId: `${interventionId}-${userId}`,
      actorId,
      actorUsername,
      details: `Removed servicer ${assignment.user.firstName} ${assignment.user.lastName} from intervention ${interventionId}`,
      oldValues: {
        interventionId,
        userId,
        assignedAt: assignment.assignedAt.toISOString(),
      },
    });
  }

  /**
   * Get all assignments for an intervention with servicer details
   * @param interventionId ID of the intervention
   * @returns Array of assignments with full servicer details
   */
  static async getInterventionAssignments(
    interventionId: number,
  ): Promise<AssignmentRecord[]> {
    const assignments = await prisma.assignment.findMany({
      where: { interventionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { assignedAt: "asc" },
    });

    return assignments;
  }

  /**
   * Get all active servicers in a company, sorted by active intervention count (least burdened first)
   * Active interventions = NEW, ASSIGNED, IN_PROGRESS statuses
   * @param companyId ID of the company
   * @returns Array of servicers sorted by workload (ascending)
   */
  static async getAvailableServicersWithLoad(
    companyId: number,
  ): Promise<ServicerAvailabilityInfo[]> {
    const activeStatuses = ["NEW", "ASSIGNED", "IN_PROGRESS"];

    // Get all active users in the company
    const servicers = await prisma.user.findMany({
      where: {
        companyId,
        active: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        active: true,
      },
    });

    // Get assignment counts for each servicer, filtered to active interventions
    const servicersWithLoad: ServicerAvailabilityInfo[] = await Promise.all(
      servicers.map(async (servicer) => {
        const count = await prisma.assignment.count({
          where: {
            userId: servicer.id,
            intervention: {
              status: { in: activeStatuses as any },
              archived: false,
            },
          },
        });

        return {
          ...servicer,
          activeInterventionCount: count,
        };
      }),
    );

    // Sort by active intervention count (ascending) — least burdened first
    servicersWithLoad.sort(
      (a, b) => a.activeInterventionCount - b.activeInterventionCount,
    );

    return servicersWithLoad;
  }
}
