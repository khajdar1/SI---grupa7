import type { Response } from 'express';
import { Router } from 'express';

import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { AuditService } from '../../shared/audit.service';
import {
  BlockingConflictError,
  BlockingForbiddenError,
  BlockingNotFoundError,
  BlockingService,
  BlockingValidationError,
  type BlockRecord,
  type IBlockingAuditLogger,
  type IBlockingRepository,
} from './blocking.service';
import { blockUserSchema } from './blocking.schema';

const blockingRouter = Router();

const COORDINATOR_ROLES = ['Koordinator', 'koordinator', 'Coordinator', 'coordinator'];
const ADMIN_ROLES = ['admin', 'administrator'];
const COORDINATOR_OR_ADMIN_ROLES = [...COORDINATOR_ROLES, ...ADMIN_ROLES];

const blockSelect = {
  id: true,
  userId: true,
  companyId: true,
  coordinatorId: true,
  reason: true,
  blockedAt: true,
  blockedUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
    },
  },
  coordinator: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
    },
  },
} as const;

const prismaBlockingRepository: IBlockingRepository = {
  findBlockById: async (blockId) =>
    prisma.userBlock.findUnique({
      where: { id: blockId },
      select: blockSelect,
    }) as Promise<BlockRecord | null>,

  findExistingBlock: async (userId, companyId) =>
    prisma.userBlock.findFirst({
      where: { userId, companyId },
      select: { id: true },
    }),

  findUserById: async (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, active: true },
    }),

  findUserByUsername: async (username) =>
    prisma.user.findUnique({
      where: { username },
      select: { id: true, active: true },
    }),

  getCoordinatorCompanyId: async (coordinatorId) => {
    const user = await prisma.user.findUnique({
      where: { id: coordinatorId },
      select: { companyId: true },
    });
    return user?.companyId ?? null;
  },

  listBlocksByCompany: async (companyId) =>
    prisma.userBlock.findMany({
      where: { companyId },
      select: blockSelect,
      orderBy: { blockedAt: 'desc' },
    }) as Promise<BlockRecord[]>,

  createBlock: async (input) =>
    prisma.userBlock.create({
      data: {
        userId: input.userId,
        companyId: input.companyId,
        coordinatorId: input.coordinatorId,
        reason: input.reason,
      },
      select: blockSelect,
    }) as Promise<BlockRecord>,

  deleteBlock: async (blockId) => {
    await prisma.userBlock.delete({ where: { id: blockId } });
  },
};

const auditLogger: IBlockingAuditLogger = {
  record: (entry) =>
    AuditService.record({
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      actorId: entry.actorId,
      actorUsername: entry.actorUsername,
      details: entry.details,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
    }),
};

const blockingService = new BlockingService(prismaBlockingRepository, auditLogger);

function getActor(user: Express.Request['user']): { id: number; username: string } | null {
  if (!user?.localUserId || !user.username) return null;
  return { id: user.localUserId, username: user.username };
}

function parseBlockId(raw: string | string[] | undefined): number | null {
  if (typeof raw !== 'string') return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendMappedError(res: Response, error: unknown): void {
  if (error instanceof BlockingValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ message: error.message });
    return;
  }
  if (error instanceof BlockingConflictError) {
    res.status(HTTP_STATUS.CONFLICT).json({ message: error.message });
    return;
  }
  if (error instanceof BlockingForbiddenError) {
    res.status(HTTP_STATUS.FORBIDDEN).json({ message: error.message });
    return;
  }
  if (error instanceof BlockingNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({ message: error.message });
    return;
  }
  console.error('[BlockingRoute] Unexpected error:', error);
  res.status(HTTP_STATUS.INTERNAL).json({ message: 'Blocking request failed.' });
}

blockingRouter.get(
  '/',
  authorizeRoles(COORDINATOR_OR_ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const coordinatorId = req.user?.localUserId;
    if (!coordinatorId) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated context is missing.' });
      return;
    }

    const companyId = await prismaBlockingRepository.getCoordinatorCompanyId(coordinatorId);
    if (!companyId) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'You are not associated with a company.' });
      return;
    }

    const blocks = await blockingService.listBlockedUsers(companyId);
    res.json(blocks);
  }),
);

blockingRouter.post(
  '/',
  authorizeRoles(COORDINATOR_OR_ADMIN_ROLES),
  validate(blockUserSchema),
  asyncHandler(async (req, res) => {
    const actor = getActor(req.user);
    if (!actor) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated context is missing.' });
      return;
    }

    const { username, reason } = req.body as { username: string; reason: string };

    const targetUser = await prismaBlockingRepository.findUserByUsername(username);
    if (!targetUser) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: `Korisnik "${username}" nije pronađen.` });
      return;
    }

    try {
      const block = await blockingService.blockUser({ userId: targetUser.id, reason }, actor.id, actor);
      res.status(HTTP_STATUS.CREATED).json(block);
    } catch (error) {
      sendMappedError(res, error);
    }
  }),
);

blockingRouter.patch(
  '/:id/unblock',
  authorizeRoles(COORDINATOR_OR_ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const blockId = parseBlockId(req.params.id);
    if (!blockId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Block id must be a positive integer.' });
      return;
    }

    const actor = getActor(req.user);
    if (!actor) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated context is missing.' });
      return;
    }

    try {
      await blockingService.unblockUser(blockId, actor.id, actor);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      sendMappedError(res, error);
    }
  }),
);

blockingRouter.delete(
  '/:id',
  authorizeRoles(COORDINATOR_OR_ADMIN_ROLES),
  asyncHandler(async (req, res) => {
    const blockId = parseBlockId(req.params.id);
    if (!blockId) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Block id must be a positive integer.' });
      return;
    }

    const actor = getActor(req.user);
    if (!actor) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated context is missing.' });
      return;
    }

    try {
      await blockingService.unblockUser(blockId, actor.id, actor);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      sendMappedError(res, error);
    }
  }),
);

export default blockingRouter;
