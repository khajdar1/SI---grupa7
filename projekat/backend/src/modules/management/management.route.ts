import { Router } from 'express';
import { InterventionStatus } from '@prisma/client';

import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../shared/async-handler';
import {
  ManagementService,
  type IManagementRepository,
  type PriorityStatusCount,
} from './management.service';

const DASHBOARD_ROLES = [
  'menadzment',
  'management',
  'admin',
  'administrator',
];

const prismaManagementRepository: IManagementRepository = {
  countInterventionsByStatuses: (statuses) =>
    prisma.intervention.count({
      where: { status: { in: statuses as InterventionStatus[] }, archived: false },
    }),

  getResolutionRecords: () =>
    prisma.statusHistory.findMany({
      where: { newStatus: InterventionStatus.RESOLVED },
      select: {
        changedAt: true,
        intervention: { select: { createdAt: true } },
      },
    }),

  getInterventionCountsByPriorityAndStatus: () =>
    (prisma.intervention.groupBy({
      by: ['priority', 'status'],
      _count: { _all: true },
    }) as unknown) as Promise<PriorityStatusCount[]>,
};

const managementService = new ManagementService(prismaManagementRepository);

const managementRouter = Router();

managementRouter.get(
  '/dashboard',
  authorizeRoles(DASHBOARD_ROLES),
  asyncHandler(async (_req, res) => {
    const stats = await managementService.getDashboardStats();
    res.status(HTTP_STATUS.OK).json(stats);
  }),
);

export default managementRouter;
