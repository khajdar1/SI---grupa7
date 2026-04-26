import { Router } from "express";
import { prisma } from "../../config/database";
import { AuditService } from "../../shared/audit.service";
import { SlaService, ISlaRepository, ValidationError } from "./sla.service";

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
    prisma.slaConfiguration.update({
      where: { priority },
      data: { deadlineHours, updatedAt: new Date() },
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

slaRouter.put("/", async (req, res) => {
  try {
    const { configurations } = req.body;

    if (!Array.isArray(configurations) || configurations.length === 0) {
      res.status(400).json({
        message: "Invalid request format. Expected array of configurations.",
      });
      return;
    }

    // Get current values before update for audit logging
    const currentConfigs = await slaService.getAllSlaConfigurations();
    const currentMap = new Map(
      currentConfigs.map((c) => [c.priority, c.deadlineHours]),
    );

    // Update configurations
    const updated = await slaService.updateSlaConfigurations(configurations);

    // Log changes to audit log
    for (const config of updated) {
      const oldValue = currentMap.get(config.priority) || 0;
      if (oldValue !== config.deadlineHours) {
        AuditService.logSlaConfigurationChange(
          config.priority,
          oldValue,
          config.deadlineHours,
          // userId would come from auth middleware in future
        );
      }
    }

    res.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        message: error.message,
        errors: error.fieldErrors,
      });
      return;
    }
    res.status(500).json({ message: "Failed to update SLA configurations" });
  }
});

export default slaRouter;
