import type { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { AuditService } from '../../shared/audit.service';
import {
  AvailabilityForbiddenError,
  AvailabilityNotFoundError,
  AvailabilityService,
  AvailabilityValidationError,
  type AvailabilityActor,
  type AvailabilityAuditLogger,
  type AvailabilityRepository,
} from './availability.service';

const availabilityRouter = Router();

const SERVICER_ROLES = ['Serviser', 'serviser'];
const availabilitySchema = z.object({
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  reason: z.string().trim().min(3).max(500),
});

const periodSelect = {
  id: true,
  userId: true,
  startAt: true,
  endAt: true,
  reason: true,
  canceledAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const repository: AvailabilityRepository = {
  findById: (id) =>
    prisma.servicerUnavailability.findUnique({
      where: { id },
      select: periodSelect,
    }),
  listByUser: (userId) =>
    prisma.servicerUnavailability.findMany({
      where: { userId },
      orderBy: { startAt: 'asc' },
      select: periodSelect,
    }),
  create: (userId, input) =>
    prisma.servicerUnavailability.create({
      data: {
        userId,
        startAt: input.startAt,
        endAt: input.endAt,
        reason: input.reason,
      },
      select: periodSelect,
    }),
  update: (id, input) =>
    prisma.servicerUnavailability.update({
      where: { id },
      data: {
        startAt: input.startAt,
        endAt: input.endAt,
        reason: input.reason,
      },
      select: periodSelect,
    }),
  cancel: (id, canceledAt) =>
    prisma.servicerUnavailability.update({
      where: { id },
      data: { canceledAt },
      select: periodSelect,
    }),
};

const auditLogger: AvailabilityAuditLogger = {
  record: (entry) =>
    AuditService.record({
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      actorId: entry.actorId,
      actorUsername: entry.actorUsername,
      details: entry.details,
      oldValues: entry.oldValues as any,
      newValues: entry.newValues as any,
    }),
};

const service = new AvailabilityService(repository, auditLogger);

function getActor(user: Express.Request['user']): AvailabilityActor {
  if (!user?.localUserId || !user.username) {
    throw new AvailabilityForbiddenError('Authenticated user context is missing.');
  }

  return {
    id: user.localUserId,
    username: user.username,
  };
}

function parsePeriodId(raw: string | string[] | undefined): number | null {
  if (typeof raw !== 'string') return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function mapPeriod(record: Awaited<ReturnType<AvailabilityService['createMine']>>) {
  return {
    id: record.id,
    userId: record.userId,
    startAt: record.startAt.toISOString(),
    endAt: record.endAt.toISOString(),
    reason: record.reason,
    canceledAt: record.canceledAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function sendMappedError(res: Response, error: unknown): void {
  if (error instanceof AvailabilityValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
    return;
  }
  if (error instanceof AvailabilityForbiddenError) {
    res.status(HTTP_STATUS.FORBIDDEN).json({ message: error.message });
    return;
  }
  if (error instanceof AvailabilityNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: error.message });
    return;
  }
  console.error('[AvailabilityRoute] Unexpected error:', error);
  res.status(HTTP_STATUS.INTERNAL).json({ message: 'Availability request failed.' });
}

availabilityRouter.get(
  '/me',
  authorizeRoles(SERVICER_ROLES),
  asyncHandler(async (req, res) => {
    try {
      const records = await service.listMine(getActor(req.user));
      res.json(records.map(mapPeriod));
    } catch (error) {
      sendMappedError(res, error);
    }
  }),
);

availabilityRouter.post(
  '/me',
  authorizeRoles(SERVICER_ROLES),
  validate(availabilitySchema),
  asyncHandler(async (req, res) => {
    try {
      const record = await service.createMine(getActor(req.user), req.body);
      res.status(HTTP_STATUS.CREATED).json(mapPeriod(record));
    } catch (error) {
      sendMappedError(res, error);
    }
  }),
);

availabilityRouter.patch(
  '/me/:id',
  authorizeRoles(SERVICER_ROLES),
  validate(availabilitySchema),
  asyncHandler(async (req, res) => {
    const id = parsePeriodId(req.params.id);
    if (!id) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Period id must be a positive integer.' });
      return;
    }

    try {
      const record = await service.updateMine(getActor(req.user), id, req.body);
      res.json(mapPeriod(record));
    } catch (error) {
      sendMappedError(res, error);
    }
  }),
);

availabilityRouter.delete(
  '/me/:id',
  authorizeRoles(SERVICER_ROLES),
  asyncHandler(async (req, res) => {
    const id = parsePeriodId(req.params.id);
    if (!id) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Period id must be a positive integer.' });
      return;
    }

    try {
      const record = await service.cancelMine(getActor(req.user), id);
      res.json(mapPeriod(record));
    } catch (error) {
      sendMappedError(res, error);
    }
  }),
);

export default availabilityRouter;
