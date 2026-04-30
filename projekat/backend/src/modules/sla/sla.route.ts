import { Router } from "express";
import { prisma } from "../../config/database";
import { HTTP_STATUS } from "../../constants";
import { authorizeRoles } from "../../middleware/auth.middleware";
import { SlaService, ISlaRepository } from "./sla.service";
import { validateUpdateSlaRequest } from "./sla.request-validators";

const slaRouter = Router();
const ADMIN_ROLES = ["admin", "administrator"];

const prismaSlaRepository: ISlaRepository = {
  findAll: () =>
    prisma.slaConfiguration.findMany({
      orderBy: { priority: "asc" },
    }),
  findByPriority: (priority) =>
    prisma.slaConfiguration.findUnique({
      where: { priority },
    }),
  update: (priority, deadlineHours) =>
    prisma.slaConfiguration.upsert({
      where: { priority },
      update: { deadlineHours },
      create: { priority, deadlineHours },
    }),
};

const slaService = new SlaService(prismaSlaRepository);

slaRouter.get("/", authorizeRoles(ADMIN_ROLES), async (_req, res) => {
  try {
    const slaConfigs = await slaService.getAllSlaConfigurations();
    res.json(slaConfigs);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL).json({ message: "Failed to fetch SLA configurations" });
  }
});

slaRouter.put("/", authorizeRoles(ADMIN_ROLES), validateUpdateSlaRequest, async (req, res) => {
  try {
    const { configurations } = req.body;
    const rawUserId = (req as any).user?.id;
    const userId = typeof rawUserId === "number" ? rawUserId : undefined;

    const updated = await slaService.updateSlaConfigurations(
      configurations,
      userId,
    );

    res.json(updated);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL).json({
      message: "Failed to update SLA configurations",
      errors: {},
    });
  }
});

export default slaRouter;
