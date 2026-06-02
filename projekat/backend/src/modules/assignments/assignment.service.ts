import { prisma } from "../../config/database";
import {
  getKeycloakAdminToken,
  getKeycloakUserRoleNames,
  MANAGED_KEYCLOAK_ROLE_ALIASES,
} from "../../clients/keycloak.client";
import { emitToUser } from "../../realtime/socket";
import { AuditService } from "../../shared/audit.service";
import { BadRequestError, NotFoundError } from "../../shared/errors";
import { shouldNotifyUser } from "../../shared/notification-preferences";

export interface ServicerAvailabilityInfo {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  active: boolean;
  activeInterventionCount: number;
  sameCompany?: boolean;
  companyId?: number | null;
  unavailable?: boolean;
  unavailableReason?: string | null;
  unavailableFrom?: Date | null;
  unavailableTo?: Date | null;
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

type RoleCheckedUser = Omit<ServicerAvailabilityInfo, "activeInterventionCount"> & {
  externalIdentities: Array<{
    provider: string;
    providerSubject: string;
  }>;
};

const SERVICER_ROLE_ALIASES = new Set(
  MANAGED_KEYCLOAK_ROLE_ALIASES.SERVISER.map((role) => role.toLowerCase()),
);

function getKeycloakSubject(user: RoleCheckedUser): string | null {
  const identity = user.externalIdentities.find(
    (item) => item.provider === "keycloak",
  );

  return identity?.providerSubject ?? null;
}

async function filterServicersByRole<TUser extends RoleCheckedUser>(
  users: TUser[],
): Promise<TUser[]> {
  const usersWithKeycloakIdentity = users
    .map((user) => ({
      user,
      keycloakSubject: getKeycloakSubject(user),
    }))
    .filter((item): item is { user: TUser; keycloakSubject: string } =>
      Boolean(item.keycloakSubject),
    );

  if (usersWithKeycloakIdentity.length === 0) {
    return [];
  }

  const adminToken = await getKeycloakAdminToken();
  const roleChecks = await Promise.all(
    usersWithKeycloakIdentity.map(async ({ user, keycloakSubject }) => {
      const roles = await getKeycloakUserRoleNames(adminToken, keycloakSubject);
      const hasServicerRole = roles.some((role) =>
        SERVICER_ROLE_ALIASES.has(role.toLowerCase()),
      );

      return hasServicerRole ? user : null;
    }),
  );

  const servicers: TUser[] = [];
  for (const user of roleChecks) {
    if (user) {
      servicers.push(user);
    }
  }

  return servicers;
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
    unavailableOverrideReason?: string,
  ): Promise<AssignmentRecord[]> {
    // Validate intervention exists
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { id: true, companyId: true, status: true, name: true, priority: true, location: true, startedAt: true, dueAt: true },
    });

    if (!intervention) {
      throw new NotFoundError("Intervention not found.");
    }

    // Validate all users exist and are active servicers
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        active: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        externalIdentities: {
          select: {
            provider: true,
            providerSubject: true,
          },
        },
      },
    }) as RoleCheckedUser[];

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

    const servicerUsers = await filterServicersByRole(users);
    if (servicerUsers.length !== users.length) {
      throw new BadRequestError("Only users with the Technician role can be assigned.", [
        { field: "userIds", message: "Selected users must have the Technician role." },
      ]);
    }

    const windowStart = intervention.startedAt ?? new Date();
    const windowEnd = intervention.dueAt ?? windowStart;
    const unavailablePeriods = await prisma.servicerUnavailability.findMany({
      where: {
        userId: { in: userIds },
        canceledAt: null,
        startAt: { lt: windowEnd },
        endAt: { gt: windowStart },
      },
      select: {
        userId: true,
        reason: true,
        startAt: true,
        endAt: true,
      },
    });

    if (unavailablePeriods.length > 0 && !unavailableOverrideReason?.trim()) {
      throw new BadRequestError("Selected servicer is unavailable for the planned intervention window.", [
        {
          field: "unavailableOverrideReason",
          message: "Manual assignment of an unavailable servicer requires a confirmation reason.",
        },
      ]);
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

      // Notify the newly assigned servicer in real time
      if (await shouldNotifyUser(userId, 'INTERVENTION_ASSIGNED')) {
        const notificationText = `Intervention: ${intervention.name}, Priority: ${intervention.priority}, Location: ${intervention.location}`;
        const notification = await prisma.notification.create({
          data: {
            userId,
            title: 'You have been assigned a new intervention',
            text: notificationText,
            type: 'INTERVENTION_ASSIGNED',
            interventionId,
          },
        });
        emitToUser(userId, 'notification:new', notification);
      }

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

    if (unavailablePeriods.length > 0 && unavailableOverrideReason?.trim()) {
      await AuditService.record({
        action: "UNAVAILABLE_SERVICER_ASSIGNMENT_OVERRIDDEN",
        entity: "Assignment",
        entityId: interventionId,
        actorId,
        actorUsername,
        details: `Manual assignment continued despite servicer unavailability. Reason: ${unavailableOverrideReason.trim()}`,
        newValues: {
          interventionId,
          userIds,
          unavailableUserIds: Array.from(new Set(unavailablePeriods.map((period) => period.userId))),
          overrideReason: unavailableOverrideReason.trim(),
        },
      });
    }

    if (
      intervention.status === "NEW" &&
      (newUserIds.length > 0 || existingAssignments.length > 0)
    ) {
      await prisma.intervention.update({
        where: { id: interventionId },
        data: { status: "ASSIGNED" },
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

    const [intervention, remainingAssignments] = await Promise.all([
      prisma.intervention.findUnique({
        where: { id: interventionId },
        select: { status: true },
      }),
      prisma.assignment.findMany({
        where: { interventionId },
        select: { userId: true },
      }),
    ]);

    if (intervention?.status === "ASSIGNED" && remainingAssignments.length === 0) {
      await prisma.intervention.update({
        where: { id: interventionId },
        data: { status: "NEW" },
      });
    }

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
   * Get all active servicers sorted by current workload.
   * Active interventions = NEW, ASSIGNED, IN_PROGRESS, ON_HOLD statuses.
   * Servicers from the intervention company are shown first, but older
   * interventions can still assign valid technicians from other companies.
   */
  static async getAvailableServicersWithLoad(
    companyId: number,
    plannedWindow?: { startAt: Date; endAt: Date },
  ): Promise<ServicerAvailabilityInfo[]> {
    const activeStatuses = ["NEW", "ASSIGNED", "IN_PROGRESS", "ON_HOLD"];

    // Get all active users; role filtering below keeps only real servicers.
    const users = await prisma.user.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        active: true,
        companyId: true,
        externalIdentities: {
          select: {
            provider: true,
            providerSubject: true,
          },
        },
      },
    }) as RoleCheckedUser[];

    const servicers = await filterServicersByRole(users);
    const unavailableByUserId = new Map<number, { reason: string; startAt: Date; endAt: Date }>();

    if (plannedWindow && servicers.length > 0) {
      const unavailablePeriods = await prisma.servicerUnavailability.findMany({
        where: {
          userId: { in: servicers.map((servicer) => servicer.id) },
          canceledAt: null,
          startAt: { lt: plannedWindow.endAt },
          endAt: { gt: plannedWindow.startAt },
        },
        select: {
          userId: true,
          reason: true,
          startAt: true,
          endAt: true,
        },
        orderBy: { startAt: "asc" },
      });

      unavailablePeriods.forEach((period) => {
        if (!unavailableByUserId.has(period.userId)) {
          unavailableByUserId.set(period.userId, period);
        }
      });
    }

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

        const unavailablePeriod = unavailableByUserId.get(servicer.id);

        return {
          id: servicer.id,
          firstName: servicer.firstName,
          lastName: servicer.lastName,
          username: servicer.username,
          email: servicer.email,
          active: servicer.active,
          activeInterventionCount: count,
          sameCompany: servicer.companyId === companyId,
          unavailable: Boolean(unavailablePeriod),
          unavailableReason: unavailablePeriod?.reason ?? null,
          unavailableFrom: unavailablePeriod?.startAt ?? null,
          unavailableTo: unavailablePeriod?.endAt ?? null,
        };
      }),
    );

    // Sort by active intervention count (ascending) — least burdened first
    servicersWithLoad.sort(
      (a, b) =>
        Number(b.sameCompany) - Number(a.sameCompany) ||
        Number(a.unavailable) - Number(b.unavailable) ||
        a.activeInterventionCount - b.activeInterventionCount,
    );

    return servicersWithLoad;
  }
}
