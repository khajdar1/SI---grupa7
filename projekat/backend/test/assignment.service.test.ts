import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  auditRecordMock,
  resetState,
  seedAssignment,
  seedCompany,
  seedIntervention,
  seedUser,
  prismaMock,
  getKeycloakAdminTokenMock,
  getKeycloakUserRoleNamesMock,
} = vi.hoisted(() => {
  type TestExternalIdentity = {
    provider: string;
    providerSubject: string;
  };

  type TestUser = {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    active: boolean;
    companyId: number | null;
    externalIdentities: TestExternalIdentity[];
    keycloakRoles: string[];
  };

  type TestIntervention = {
    id: number;
    companyId: number;
    status: string;
    archived: boolean;
    name: string;
    priority: string;
    location: string;
  };

  type TestAssignment = {
    id: number;
    interventionId: number;
    userId: number;
    method: string;
    assignedAt: Date;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
      email: string;
    };
  };

  const state: {
    companies: Array<{ id: number; name: string }>;
    interventions: TestIntervention[];
    users: TestUser[];
    assignments: TestAssignment[];
    nextAssignmentId: number;
  } = {
    companies: [],
    interventions: [],
    users: [],
    assignments: [],
    nextAssignmentId: 1,
  };

  const cloneUser = (user: TestUser) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    active: user.active,
    companyId: user.companyId,
    externalIdentities: user.externalIdentities.map((identity) => ({ ...identity })),
  });

  const cloneAssignment = (assignment: TestAssignment) => ({
    id: assignment.id,
    interventionId: assignment.interventionId,
    userId: assignment.userId,
    assignedAt: assignment.assignedAt,
    user: { ...assignment.user },
  });

  const applyUserSelect = (user: TestUser, select?: Record<string, unknown>) => {
    if (!select) {
      return cloneUser(user);
    }

    const selected: Record<string, unknown> = {};
    for (const [key, enabled] of Object.entries(select)) {
      if (!enabled) {
        continue;
      }

      if (key in user) {
        const value = user[key as keyof TestUser];
        selected[key] = Array.isArray(value)
          ? value.map((item: unknown) => (typeof item === 'object' && item !== null ? { ...item as Record<string, unknown> } : item))
          : value;
      }
    }

    return selected;
  };

  const resolveUser = (userId: number) => state.users.find((user) => user.id === userId) ?? null;
  const resolveIntervention = (interventionId: number) =>
    state.interventions.find((intervention) => intervention.id === interventionId) ?? null;

  const resetState = () => {
    state.companies = [];
    state.interventions = [];
    state.users = [];
    state.assignments = [];
    state.nextAssignmentId = 1;
  };

  const seedCompany = (id: number, name = `Company ${id}`) => {
    state.companies.push({ id, name });
    return { id, name };
  };

  const seedIntervention = (
    id: number,
    overrides: Partial<Omit<TestIntervention, "id">> = {},
  ) => {
    const intervention: TestIntervention = {
      id,
      companyId: overrides.companyId ?? 1,
      status: overrides.status ?? "NEW",
      archived: overrides.archived ?? false,
      name: overrides.name ?? `Intervention ${id}`,
      priority: overrides.priority ?? "MEDIUM",
      location: overrides.location ?? `Location ${id}`,
    };

    state.interventions.push(intervention);
    return intervention;
  };

  const seedUser = (
    id: number,
    overrides: Partial<Omit<TestUser, "id">> = {},
  ) => {
    const user: TestUser = {
      id,
      firstName: overrides.firstName ?? `First${id}`,
      lastName: overrides.lastName ?? `Last${id}`,
      username: overrides.username ?? `user.${id}`,
      email: overrides.email ?? `user.${id}@example.com`,
      active: overrides.active ?? true,
      companyId: Object.prototype.hasOwnProperty.call(overrides, "companyId")
        ? overrides.companyId ?? null
        : 1,
      externalIdentities: overrides.externalIdentities ?? [
        { provider: "keycloak", providerSubject: `keycloak-user-${id}` },
      ],
      keycloakRoles: overrides.keycloakRoles ?? ["Serviser"],
    };

    state.users.push(user);
    return cloneUser(user);
  };

  const seedAssignment = (
    interventionId: number,
    userId: number,
    overrides: Partial<Pick<TestAssignment, "assignedAt">> = {},
  ) => {
    const user = resolveUser(userId);

    if (!user) {
      throw new Error(`Cannot seed assignment for missing user ${userId}`);
    }

    const assignment: TestAssignment = {
      id: state.nextAssignmentId++,
      interventionId,
      userId,
      method: "MANUAL",
      assignedAt: overrides.assignedAt ?? new Date(`2026-05-07T0${state.nextAssignmentId}:00:00.000Z`),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
      },
    };

    state.assignments.push(assignment);
    return cloneAssignment(assignment);
  };

  const prismaMock = {
    intervention: {
      findUnique: vi.fn(async ({ where }: { where: { id: number } }) => {
        const intervention = resolveIntervention(where.id);
        return intervention
          ? {
              id: intervention.id,
              companyId: intervention.companyId,
              status: intervention.status,
              name: intervention.name,
              priority: intervention.priority,
              location: intervention.location,
            }
          : null;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: number };
          data: { status?: string };
        }) => {
          const intervention = resolveIntervention(where.id);
          if (!intervention) {
            return null;
          }

          if (data.status) {
            intervention.status = data.status;
          }

          return {
            id: intervention.id,
            companyId: intervention.companyId,
            status: intervention.status,
          };
        },
      ),
    },
    user: {
      findMany: vi.fn(
        async ({
          where,
          select,
        }: {
          where?: {
            id?: number | { in: number[] };
            active?: boolean;
            companyId?: number;
          };
          select?: Record<string, unknown>;
        }) => {
          let users = [...state.users];

          const idFilter = where?.id;
          if (idFilter && typeof idFilter === "object" && "in" in idFilter) {
            users = users.filter((user) => idFilter.in.includes(user.id));
          } else if (typeof where?.id === "number") {
            users = users.filter((user) => user.id === where.id);
          }

          if (where?.active !== undefined) {
            users = users.filter((user) => user.active === where.active);
          }

          if (where?.companyId !== undefined) {
            users = users.filter((user) => user.companyId === where.companyId);
          }

          return users.map((user) => applyUserSelect(user, select));
        },
      ),
      findFirst: vi.fn(
        async ({
          where,
          select,
        }: {
          where?: {
            id?: number;
            active?: boolean;
            companyId?: number;
          };
          select?: Record<string, unknown>;
        }) => {
          let users = [...state.users];

          if (where?.id !== undefined) {
            users = users.filter((user) => user.id === where.id);
          }

          if (where?.active !== undefined) {
            users = users.filter((user) => user.active === where.active);
          }

          if (where?.companyId !== undefined) {
            users = users.filter((user) => user.companyId === where.companyId);
          }

          const user = users[0];
          return user ? applyUserSelect(user, select) : null;
        },
      ),
    },
    assignment: {
      findMany: vi.fn(
        async ({
          where,
          select,
          include,
          orderBy,
        }: {
          where?: { interventionId?: number };
          select?: Record<string, unknown>;
          include?: { user?: { select?: Record<string, unknown> } };
          orderBy?: { assignedAt?: "asc" | "desc" };
        }) => {
          let assignments = [...state.assignments];

          if (where?.interventionId !== undefined) {
            assignments = assignments.filter(
              (assignment) => assignment.interventionId === where.interventionId,
            );
          }

          if (orderBy?.assignedAt === "asc") {
            assignments.sort((a, b) => a.assignedAt.getTime() - b.assignedAt.getTime());
          }

          return assignments.map((assignment) => {
            if (select) {
              const selected: Record<string, unknown> = {};
              for (const [key, enabled] of Object.entries(select)) {
                if (enabled) {
                  selected[key] = assignment[key as keyof TestAssignment];
                }
              }
              return selected;
            }

            const result: Record<string, unknown> = {
              id: assignment.id,
              interventionId: assignment.interventionId,
              userId: assignment.userId,
              assignedAt: assignment.assignedAt,
            };

            if (include?.user) {
              result.user = applyUserSelect(
                {
                  id: assignment.user.id,
                  firstName: assignment.user.firstName,
                  lastName: assignment.user.lastName,
                  username: assignment.user.username,
                  email: assignment.user.email,
                  active: true,
                  companyId: null,
                  externalIdentities: [],
                  keycloakRoles: [],
                },
                include.user.select,
              );
            }

            return result;
          });
        },
      ),
      findUnique: vi.fn(
        async ({
          where,
          include,
        }: {
          where: { interventionId_userId: { interventionId: number; userId: number } };
          include?: { user?: { select?: Record<string, unknown> } };
        }) => {
          const assignment = state.assignments.find(
            (item) =>
              item.interventionId === where.interventionId_userId.interventionId &&
              item.userId === where.interventionId_userId.userId,
          );

          if (!assignment) {
            return null;
          }

          if (!include?.user) {
            return cloneAssignment(assignment);
          }

          return {
            ...cloneAssignment(assignment),
            user: applyUserSelect(
              {
                id: assignment.user.id,
                firstName: assignment.user.firstName,
                lastName: assignment.user.lastName,
                username: assignment.user.username,
                email: assignment.user.email,
                active: true,
                companyId: null,
                externalIdentities: [],
                keycloakRoles: [],
              },
              include.user.select,
            ),
          };
        },
      ),
      create: vi.fn(
        async ({
          data,
        }: {
          data: { interventionId: number; userId: number; method: string; assignedAt: Date };
        }) => {
          const user = resolveUser(data.userId);

          if (!user) {
            throw new Error(`Missing user ${data.userId}`);
          }

          const assignment: TestAssignment = {
            id: state.nextAssignmentId++,
            interventionId: data.interventionId,
            userId: data.userId,
            method: data.method,
            assignedAt: data.assignedAt,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
              email: user.email,
            },
          };

          state.assignments.push(assignment);
          return cloneAssignment(assignment);
        },
      ),
      delete: vi.fn(
        async ({
          where,
        }: {
          where: { interventionId_userId: { interventionId: number; userId: number } };
        }) => {
          const index = state.assignments.findIndex(
            (item) =>
              item.interventionId === where.interventionId_userId.interventionId &&
              item.userId === where.interventionId_userId.userId,
          );

          if (index !== -1) {
            state.assignments.splice(index, 1);
          }
        },
      ),
      count: vi.fn(
        async ({
          where,
        }: {
          where: {
            userId: number;
            intervention: {
              status: { in: string[] };
              archived: boolean;
            };
          };
        }) => {
          return state.assignments.filter((assignment) => {
            if (assignment.userId !== where.userId) {
              return false;
            }

            const intervention = resolveIntervention(assignment.interventionId);
            if (!intervention) {
              return false;
            }

            return (
              intervention.archived === where.intervention.archived &&
              where.intervention.status.in.includes(intervention.status)
            );
          }).length;
        },
      ),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: 1 }),
    },
    userPreference: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };

  const auditRecordMock = vi.fn().mockResolvedValue(undefined);
  const getKeycloakAdminTokenMock = vi.fn().mockResolvedValue("admin-token");
  const getKeycloakUserRoleNamesMock = vi.fn(
    async (_token: string, keycloakSubject: string) => {
      const user = state.users.find((item) =>
        item.externalIdentities.some(
          (identity) =>
            identity.provider === "keycloak" &&
            identity.providerSubject === keycloakSubject,
        ),
      );

      return user?.keycloakRoles ?? [];
    },
  );

  return {
    auditRecordMock,
    resetState,
    seedAssignment,
    seedCompany,
    seedIntervention,
    seedUser,
    prismaMock,
    getKeycloakAdminTokenMock,
    getKeycloakUserRoleNamesMock,
  };
});

vi.mock("../src/config/database", () => ({
  prisma: prismaMock,
}));

vi.mock("../src/shared/audit.service", () => ({
  AuditService: {
    record: auditRecordMock,
  },
}));

vi.mock("../src/clients/keycloak.client", () => ({
  getKeycloakAdminToken: getKeycloakAdminTokenMock,
  getKeycloakUserRoleNames: getKeycloakUserRoleNamesMock,
  MANAGED_KEYCLOAK_ROLE_ALIASES: {
    SERVISER: ["Serviser", "serviser"],
  },
}));

vi.mock("../src/realtime/socket", () => ({
  emitToUser: vi.fn(),
  emitToRole: vi.fn(),
}));

import { AssignmentService } from "../src/modules/assignments/assignment.service";
import { BadRequestError, NotFoundError } from "../src/shared/errors";

beforeEach(() => {
  resetState();
  vi.clearAllMocks();
});

describe("AssignmentService", () => {
  describe("assignServicesToIntervention", () => {
    it("should assign multiple servicers to an intervention", async () => {
      seedCompany(1, "Servis Alfa");
      seedIntervention(1, { companyId: 1 });
      const firstServicer = seedUser(1, {
        firstName: "Amir",
        lastName: "Hasic",
        username: "amir.hasic",
        email: "amir.hasic@example.com",
        active: true,
      });
      const secondServicer = seedUser(2, {
        firstName: "Lejla",
        lastName: "Basic",
        username: "lejla.basic",
        email: "lejla.basic@example.com",
        active: true,
      });

      const result = await AssignmentService.assignServicesToIntervention(
        1,
        [firstServicer.id, secondServicer.id],
        firstServicer.id,
        firstServicer.username,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("user");
      expect(result[0].interventionId).toBe(1);
      expect(auditRecordMock).toHaveBeenCalledTimes(2);
    });

    it("should reject assignment to non-existent intervention", async () => {
      const servicer = seedUser(1, { active: true });

      await expect(
        AssignmentService.assignServicesToIntervention(99999, [servicer.id], servicer.id, servicer.username),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should reject assignment of deactivated user", async () => {
      seedIntervention(1, { companyId: 1 });
      const inactiveUser = seedUser(1, { active: false });
      const coordinator = seedUser(2, { active: true });

      await expect(
        AssignmentService.assignServicesToIntervention(
          1,
          [inactiveUser.id],
          coordinator.id,
          coordinator.username,
        ),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it("should reject assignment of non-existent servicer", async () => {
      seedIntervention(1, { companyId: 1 });
      const coordinator = seedUser(1, { active: true });

      await expect(
        AssignmentService.assignServicesToIntervention(1, [99999], coordinator.id, coordinator.username),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it("should reject assignment of a user without the Serviser role", async () => {
      seedIntervention(1, { companyId: 1 });
      const coordinator = seedUser(1, {
        active: true,
        username: "coordinator.user",
        keycloakRoles: ["Koordinator"],
      });

      await expect(
        AssignmentService.assignServicesToIntervention(
          1,
          [coordinator.id],
          coordinator.id,
          coordinator.username,
        ),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it("should not create duplicate assignments", async () => {
      seedIntervention(1, { companyId: 1 });
      const servicer = seedUser(1, { active: true });

      await AssignmentService.assignServicesToIntervention(1, [servicer.id], servicer.id, servicer.username);

      const result = await AssignmentService.assignServicesToIntervention(
        1,
        [servicer.id],
        servicer.id,
        servicer.username,
      );

      expect(result).toHaveLength(0);
      expect(prismaMock.assignment.create).toHaveBeenCalledTimes(1);
    });

    it("should move a newly assigned open intervention to assigned status", async () => {
      seedIntervention(1, { companyId: 1, status: "NEW" });
      const servicer = seedUser(1, { active: true });

      await AssignmentService.assignServicesToIntervention(
        1,
        [servicer.id],
        servicer.id,
        servicer.username,
      );

      expect(prismaMock.intervention.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "ASSIGNED" },
      });
    });

    it("should keep an in-progress intervention in progress when assigning servicers", async () => {
      seedIntervention(1, { companyId: 1, status: "IN_PROGRESS" });
      const servicer = seedUser(1, { active: true });

      await AssignmentService.assignServicesToIntervention(
        1,
        [servicer.id],
        servicer.id,
        servicer.username,
      );

      expect(prismaMock.intervention.update).not.toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "ASSIGNED" },
      });
    });
  });

  describe("removeServicer", () => {
    it("should remove a servicer assignment", async () => {
      seedIntervention(1, { companyId: 1 });
      const servicer = seedUser(1, { active: true });
      seedAssignment(1, servicer.id);

      await expect(
        AssignmentService.removeServicer(1, servicer.id, servicer.id, servicer.username),
      ).resolves.not.toThrow();

      const remaining = await AssignmentService.getInterventionAssignments(1);
      const stillExists = remaining.some((assignment) => assignment.userId === servicer.id);

      expect(stillExists).toBe(false);
      expect(auditRecordMock).toHaveBeenCalledTimes(1);
    });

    it("should reject removal of non-existent assignment", async () => {
      seedIntervention(1, { companyId: 1 });
      const servicer = seedUser(1, { active: true });

      await expect(
        AssignmentService.removeServicer(1, servicer.id, servicer.id, servicer.username),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("should move an assigned intervention back to open when the last servicer is removed", async () => {
      seedIntervention(1, { companyId: 1, status: "ASSIGNED" });
      const servicer = seedUser(1, { active: true });
      seedAssignment(1, servicer.id);

      await AssignmentService.removeServicer(1, servicer.id, servicer.id, servicer.username);

      expect(prismaMock.intervention.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "NEW" },
      });
    });

    it("should keep assigned status while another servicer remains assigned", async () => {
      seedIntervention(1, { companyId: 1, status: "ASSIGNED" });
      const firstServicer = seedUser(1, { active: true });
      const secondServicer = seedUser(2, { active: true });
      seedAssignment(1, firstServicer.id);
      seedAssignment(1, secondServicer.id);

      await AssignmentService.removeServicer(
        1,
        firstServicer.id,
        firstServicer.id,
        firstServicer.username,
      );

      expect(prismaMock.intervention.update).not.toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "NEW" },
      });
    });
  });

  describe("getInterventionAssignments", () => {
    it("should return all assignments for an intervention", async () => {
      seedIntervention(1, { companyId: 1 });
      const firstServicer = seedUser(1, { active: true, username: "servicer.one" });
      const secondServicer = seedUser(2, { active: true, username: "servicer.two" });

      await AssignmentService.assignServicesToIntervention(
        1,
        [firstServicer.id, secondServicer.id],
        firstServicer.id,
        firstServicer.username,
      );

      const assignments = await AssignmentService.getInterventionAssignments(1);

      expect(assignments).toHaveLength(2);
      expect(assignments[0]).toHaveProperty("id");
      expect(assignments[0]).toHaveProperty("userId");
      expect(assignments[0]).toHaveProperty("interventionId");
      expect(assignments[0]).toHaveProperty("user");
    });

    it("should return empty array for intervention with no assignments", async () => {
      seedIntervention(1, { companyId: 1 });

      const assignments = await AssignmentService.getInterventionAssignments(1);

      expect(assignments).toEqual([]);
    });
  });

  describe("getAvailableServicersWithLoad", () => {
    it("should return servicers sorted by active intervention count", async () => {
      seedCompany(1, "Servis Alfa");
      seedIntervention(1, { companyId: 1, status: "NEW", archived: false });
      seedIntervention(2, { companyId: 1, status: "ASSIGNED", archived: false });
      seedIntervention(3, { companyId: 1, status: "RESOLVED", archived: false });
      const lightServicer = seedUser(1, { active: true, companyId: 1, username: "light.servicer" });
      const mediumServicer = seedUser(2, { active: true, companyId: 1, username: "medium.servicer" });
      const freeServicer = seedUser(3, { active: true, companyId: 1, username: "free.servicer" });

      seedAssignment(1, lightServicer.id);
      seedAssignment(1, lightServicer.id);
      seedAssignment(2, mediumServicer.id);

      const servicers = await AssignmentService.getAvailableServicersWithLoad(1);

      expect(servicers.map((servicer) => servicer.username)).toEqual([
        freeServicer.username,
        mediumServicer.username,
        lightServicer.username,
      ]);
      expect(servicers.map((servicer) => servicer.activeInterventionCount)).toEqual([0, 1, 2]);
    });

    it("should not include deactivated servicers", async () => {
      seedCompany(1, "Servis Alfa");
      seedUser(1, { active: true, companyId: 1 });
      seedUser(2, { active: false, companyId: 1 });

      const servicers = await AssignmentService.getAvailableServicersWithLoad(1);

      expect(servicers).toHaveLength(1);
      expect(servicers[0].active).toBe(true);
    });

    it("should only include users with the Serviser role", async () => {
      seedCompany(1, "Servis Alfa");
      const servicer = seedUser(1, {
        active: true,
        companyId: 1,
        username: "real.servicer",
        keycloakRoles: ["Serviser"],
      });
      seedUser(2, {
        active: true,
        companyId: 1,
        username: "coordinator.user",
        keycloakRoles: ["Koordinator"],
      });
      seedUser(3, {
        active: true,
        companyId: 1,
        username: "customer.user",
        keycloakRoles: ["Korisnik"],
      });

      const servicers = await AssignmentService.getAvailableServicersWithLoad(1);

      expect(servicers.map((item) => item.username)).toEqual([servicer.username]);
    });

    it("should show zero active interventions for servicers with no assignments", async () => {
      seedCompany(1, "Servis Alfa");
      const servicer = seedUser(1, { active: true, companyId: 1 });

      const servicers = await AssignmentService.getAvailableServicersWithLoad(1);

      expect(servicers).toHaveLength(1);
      expect(servicers[0].username).toBe(servicer.username);
      expect(servicers[0].activeInterventionCount).toBe(0);
    });
  });
});
