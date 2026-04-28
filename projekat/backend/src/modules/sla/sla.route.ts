import { Router } from "express";
import { prisma } from "../../config/database";
import { SlaService, ISlaRepository } from "./sla.service";
import { validateUpdateSlaRequest } from "./sla.request-validators";

const slaRouter = Router();

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

slaRouter.get("/", async (_req, res) => {
  try {
    const slaConfigs = await slaService.getAllSlaConfigurations();
    res.json(slaConfigs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch SLA configurations" });
  }
});

slaRouter.put("/", validateUpdateSlaRequest, async (req, res) => {
  try {
    const { configurations } = req.body;
    const userId = (req as any).user?.id;

    const updated = await slaService.updateSlaConfigurations(
      configurations,
      userId,
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update SLA configurations",
      errors: {},
    });
  }
});

export default slaRouter;
