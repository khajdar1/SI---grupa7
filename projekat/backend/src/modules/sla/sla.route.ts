import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../../config/database";
import { HTTP_STATUS } from "../../constants";
import { authorizeRoles } from "../../middleware/auth.middleware";
import { SlaService, ISlaRepository, type SlaData } from "./sla.service";
import {
  getSlaConfigurationsFromBody,
  validateUpdateSlaRequest,
} from "./sla.request-validators";

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

const updateSlaConfigurations = async (req: Request, res: Response) => {
  try {
    const configurations = getSlaConfigurationsFromBody(req.body);

    if (!Array.isArray(configurations)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Invalid request format. Expected array of configurations.",
        errors: {},
      });
      return;
    }

    const rawUserId = req.user?.localUserId;
    const userId = typeof rawUserId === "number" ? rawUserId : undefined;

    const updated = await slaService.updateSlaConfigurations(
      configurations as SlaData[],
      userId,
    );

    res.json(updated);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL).json({
      message: "Failed to update SLA configurations",
      errors: {},
    });
  }
};

slaRouter.put("/", authorizeRoles(ADMIN_ROLES), validateUpdateSlaRequest, updateSlaConfigurations);
slaRouter.patch("/", authorizeRoles(ADMIN_ROLES), validateUpdateSlaRequest, updateSlaConfigurations);

export default slaRouter;
