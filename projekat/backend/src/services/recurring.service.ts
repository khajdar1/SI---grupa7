import {
  InterventionStatus,
  InterventionType,
  RecurringPeriod,
} from '@prisma/client';

import { prisma } from '../config/database';
import { logger } from '../shared/logger';

export function computeNextGenerationAt(
  from: Date,
  period: RecurringPeriod,
): Date {
  const next = new Date(from);
  switch (period) {
    case RecurringPeriod.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case RecurringPeriod.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case RecurringPeriod.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
    case RecurringPeriod.YEARLY:
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function generateDueInterventions(): Promise<void> {
  const now = new Date();

  const due = await prisma.intervention.findMany({
    where: {
      recurringPeriod: { not: null },
      nextGenerationAt: { lte: now },
      archived: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
      location: true,
      latitude: true,
      longitude: true,
      priority: true,
      type: true,
      categoryId: true,
      companyId: true,
      creatorId: true,
      recurringPeriod: true,
      nextGenerationAt: true,
      startedAt: true,
      dueAt: true,
    },
  });

  if (due.length === 0) return;

  logger.info(`[Recurring] ${due.length} intervention(s) due for generation.`);

  for (const parent of due) {
    if (!parent.recurringPeriod || !parent.nextGenerationAt) continue;

    const newStartedAt = parent.nextGenerationAt;

    const durationMs =
      parent.dueAt && parent.startedAt
        ? parent.dueAt.getTime() - parent.startedAt.getTime()
        : null;

    const newDueAt = durationMs
      ? new Date(newStartedAt.getTime() + durationMs)
      : null;

    const nextGen = computeNextGenerationAt(
      parent.nextGenerationAt,
      parent.recurringPeriod,
    );

    try {
      await prisma.$transaction([
        prisma.intervention.create({
          data: {
            name: parent.name,
            description: parent.description,
            location: parent.location,
            latitude: parent.latitude,
            longitude: parent.longitude,
            priority: parent.priority,
            status: InterventionStatus.NEW,
            type: InterventionType.PREVENTIVE,
            categoryId: parent.categoryId,
            companyId: parent.companyId,
            creatorId: parent.creatorId,
            startedAt: newStartedAt,
            dueAt: newDueAt,
            recurringPeriod: null,
            nextGenerationAt: null,
            faultReportId: null,
          },
        }),
        prisma.intervention.update({
          where: { id: parent.id },
          data: { nextGenerationAt: nextGen },
        }),
      ]);

      logger.info(
        `[Recurring] Generated intervention from parent #${parent.id}, next at ${nextGen.toISOString()}`,
      );
    } catch (error) {
      logger.error(
        `[Recurring] Failed to generate from parent #${parent.id}`,
        {
          error:
            error instanceof Error ? error.message : String(error),
        },
      );
    }
  }
}

export function startRecurringScheduler(): void {
  const INTERVAL_MS = 60 * 1000;
  logger.info('[Recurring] Scheduler started, checking every 60 seconds.');

  setInterval(() => {
    generateDueInterventions().catch((error) => {
      logger.error('[Recurring] Scheduler run failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }, INTERVAL_MS);
}