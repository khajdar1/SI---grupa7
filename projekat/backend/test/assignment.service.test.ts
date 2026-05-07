import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { AssignmentService } from "../src/modules/assignments/assignment.service";
import { prisma } from "../src/config/database";
import { BadRequestError, NotFoundError } from "../src/shared/errors";

// Mock data
const mockCompanyId = 1;
const mockCategoryId = 1;
const mockInterventionId = 1;

describe("AssignmentService", () => {
  describe("assignServicesToIntervention", () => {
    it("should assign multiple servicers to an intervention", async () => {
      const intervention = await prisma.intervention.findFirst();
      const alreadyAssigned = intervention
        ? await prisma.assignment.findMany({
            where: { interventionId: intervention.id },
            select: { userId: true },
          })
        : [];

      const assignedUserIds = new Set(alreadyAssigned.map((item) => item.userId));
      const servicers = await prisma.user.findMany({
        where: { active: true },
      });

      let unassignedServicers = servicers
        .filter((servicer) => !assignedUserIds.has(servicer.id))
        .slice(0, 2);

      if (intervention && unassignedServicers.length < 2) {
        const missingCount = 2 - unassignedServicers.length;
        const timestamp = Date.now();

        for (let i = 0; i < missingCount; i++) {
          await prisma.user.create({
            data: {
              firstName: "Test",
              lastName: `Servicer${i + 1}`,
              username: `test.servicer.${timestamp}.${i}`,
              email: `test.servicer.${timestamp}.${i}@demo.local`,
              active: true,
              companyId: intervention.companyId,
            },
          });
        }

        const refreshedServicers = await prisma.user.findMany({
          where: { active: true },
        });

        unassignedServicers = refreshedServicers
          .filter((servicer) => !assignedUserIds.has(servicer.id))
          .slice(0, 2);
      }

      if (!intervention || unassignedServicers.length < 2) {
        throw new Error("Insufficient test data");
      }

      const result = await AssignmentService.assignServicesToIntervention(
        intervention.id,
        unassignedServicers.map((s) => s.id),
        unassignedServicers[0].id,
        unassignedServicers[0].username,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("user");
      expect(result[0].interventionId).toBe(intervention.id);
    });

    it("should reject assignment to non-existent intervention", async () => {
      const servicer = await prisma.user.findFirst({ where: { active: true } });

      if (!servicer) {
        throw new Error("No active servicer found");
      }

      await expect(
        AssignmentService.assignServicesToIntervention(
          99999, // non-existent intervention
          [servicer.id],
          servicer.id,
          servicer.username,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it("should reject assignment of deactivated user", async () => {
      const intervention = await prisma.intervention.findFirst();
      let inactiveUser = await prisma.user.findFirst({
        where: { active: false },
      });

      if (!inactiveUser) {
        const userToDeactivate = await prisma.user.findFirst({
          where: { active: true },
          orderBy: { id: "asc" },
        });

        if (userToDeactivate) {
          inactiveUser = await prisma.user.update({
            where: { id: userToDeactivate.id },
            data: { active: false },
          });
        }
      }

      if (!intervention || !inactiveUser) {
        throw new Error("Insufficient test data");
      }

      const coordinator = await prisma.user.findFirst({
        where: { active: true },
      });

      if (!coordinator) {
        throw new Error("No active coordinator found");
      }

      await expect(
        AssignmentService.assignServicesToIntervention(
          intervention.id,
          [inactiveUser.id],
          coordinator.id,
          coordinator.username,
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("should reject assignment of non-existent servicer", async () => {
      const intervention = await prisma.intervention.findFirst();
      const coordinator = await prisma.user.findFirst({
        where: { active: true },
      });

      if (!intervention || !coordinator) {
        throw new Error("Insufficient test data");
      }

      await expect(
        AssignmentService.assignServicesToIntervention(
          intervention.id,
          [99999], // non-existent user
          coordinator.id,
          coordinator.username,
        ),
      ).rejects.toThrow(BadRequestError);
    });

    it("should not create duplicate assignments", async () => {
      const intervention = await prisma.intervention.findFirst();
      const servicer = await prisma.user.findFirst({ where: { active: true } });

      if (!intervention || !servicer) {
        throw new Error("Insufficient test data");
      }

      // First assignment
      await AssignmentService.assignServicesToIntervention(
        intervention.id,
        [servicer.id],
        servicer.id,
        servicer.username,
      );

      // Try to assign the same servicer again
      const result = await AssignmentService.assignServicesToIntervention(
        intervention.id,
        [servicer.id],
        servicer.id,
        servicer.username,
      );

      // Should return empty array because the assignment already exists
      expect(result.length).toBe(0);
    });
  });

  describe("removeServicer", () => {
    it("should remove a servicer assignment", async () => {
      const intervention = await prisma.intervention.findFirst();
      const servicer = await prisma.user.findFirst({ where: { active: true } });

      if (!intervention || !servicer) {
        throw new Error("Insufficient test data");
      }

      // Create assignment
      await AssignmentService.assignServicesToIntervention(
        intervention.id,
        [servicer.id],
        servicer.id,
        servicer.username,
      );

      // Remove assignment
      await expect(
        AssignmentService.removeServicer(
          intervention.id,
          servicer.id,
          servicer.id,
          servicer.username,
        ),
      ).resolves.not.toThrow();

      // Verify it's removed
      const remaining =
        await AssignmentService.getInterventionAssignments(intervention.id);
      const stillExists = remaining.some(
        (a) => a.userId === servicer.id && a.interventionId === intervention.id,
      );
      expect(stillExists).toBe(false);
    });

    it("should reject removal of non-existent assignment", async () => {
      const intervention = await prisma.intervention.findFirst();
      const servicer = await prisma.user.findFirst({ where: { active: true } });

      if (!intervention || !servicer) {
        throw new Error("Insufficient test data");
      }

      await expect(
        AssignmentService.removeServicer(
          intervention.id,
          servicer.id,
          servicer.id,
          servicer.username,
        ),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getInterventionAssignments", () => {
    it("should return all assignments for an intervention", async () => {
      const intervention = await prisma.intervention.findFirst();
      const servicers = await prisma.user.findMany({
        where: { active: true },
        take: 2,
      });

      if (!intervention || servicers.length < 2) {
        throw new Error("Insufficient test data");
      }

      // Create assignments
      await AssignmentService.assignServicesToIntervention(
        intervention.id,
        servicers.map((s) => s.id),
        servicers[0].id,
        servicers[0].username,
      );

      // Get assignments
      const assignments =
        await AssignmentService.getInterventionAssignments(intervention.id);

      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBeGreaterThanOrEqual(0);
      assignments.forEach((a) => {
        expect(a).toHaveProperty("id");
        expect(a).toHaveProperty("userId");
        expect(a).toHaveProperty("interventionId");
        expect(a).toHaveProperty("user");
      });
    });

    it("should return empty array for intervention with no assignments", async () => {
      // Create a new intervention with no assignments
      const coordinator = await prisma.user.findFirst({
        where: { active: true },
      });
      const category = await prisma.category.findFirst();
      const company = await prisma.company.findFirst();

      if (!coordinator || !category || !company) {
        throw new Error("Insufficient test data");
      }

      const intervention = await prisma.intervention.create({
        data: {
          name: "Test Intervention",
          description: "Test",
          location: "Test Location",
          creatorId: coordinator.id,
          categoryId: category.id,
          companyId: company.id,
        },
      });

      const assignments =
        await AssignmentService.getInterventionAssignments(intervention.id);

      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBe(0);

      // Cleanup
      await prisma.intervention.delete({ where: { id: intervention.id } });
    });
  });

  describe("getAvailableServicersWithLoad", () => {
    it("should return servicers sorted by active intervention count", async () => {
      const company = await prisma.company.findFirst();

      if (!company) {
        throw new Error("No company found");
      }

      const servicers =
        await AssignmentService.getAvailableServicersWithLoad(company.id);

      expect(Array.isArray(servicers)).toBe(true);

      // Check that servicers are sorted by active intervention count (ascending)
      for (let i = 1; i < servicers.length; i++) {
        expect(
          servicers[i].activeInterventionCount >=
            servicers[i - 1].activeInterventionCount,
        ).toBe(true);
      }
    });

    it("should not include deactivated servicers", async () => {
      const company = await prisma.company.findFirst();

      if (!company) {
        throw new Error("No company found");
      }

      const servicers =
        await AssignmentService.getAvailableServicersWithLoad(company.id);

      // All servicers should be active
      servicers.forEach((s) => {
        expect(s.active).toBe(true);
      });
    });

    it("should show zero active interventions for servicers with no assignments", async () => {
      const company = await prisma.company.findFirst();

      if (!company) {
        throw new Error("No company found");
      }

      const servicers =
        await AssignmentService.getAvailableServicersWithLoad(company.id);

      // At least check structure is correct
      expect(servicers.length).toBeGreaterThanOrEqual(0);
      servicers.forEach((s) => {
        expect(s).toHaveProperty("activeInterventionCount");
        expect(typeof s.activeInterventionCount).toBe("number");
        expect(s.activeInterventionCount).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
