import { Router } from 'express';
import { InterventionStatus } from '@prisma/client';

import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { BadRequestError } from '../../shared/errors';
import {
  ManagementService,
  type GetMaterialsReportParams,
  type IManagementRepository,
  type PriorityStatusCount,
  type ReportMaterialRow,
} from './management.service';


const DASHBOARD_ROLES = ['menadzment', 'management', 'admin', 'administrator'];

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

  getReportsWithMaterials: (params: GetMaterialsReportParams) => {
    const { from, to, companyId, categoryId } = params;
    return prisma.report.findMany({
      where: {
        material: { not: null },
        ...(from !== undefined || to !== undefined
          ? {
              reportDate: {
                ...(from !== undefined && { gte: from }),
                ...(to !== undefined && { lte: to }),
              },
            }
          : {}),
        intervention: {
          archived: false,
          ...(companyId !== undefined && { companyId }),
          ...(categoryId !== undefined && { categoryId }),
        },
      },
      select: {
        material: true,
        reportDate: true,
        intervention: {
          select: {
            companyId: true,
            company: { select: { name: true } },
          },
        },
      },
    }) as Promise<ReportMaterialRow[]>;
  },
};

const managementService = new ManagementService(prismaManagementRepository);

function parseOptionalDate(raw: unknown, label: string): Date | undefined {
  if (raw === undefined || raw === '') return undefined;
  const d = new Date(String(raw));
  if (isNaN(d.getTime())) throw new BadRequestError(`Invalid ${label} date.`);
  return d;
}

function parseOptionalPositiveInt(raw: unknown, label: string): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequestError(`Invalid ${label}.`);
  return n;
}

const managementRouter = Router();

managementRouter.get(
  '/dashboard',
  authorizeRoles(DASHBOARD_ROLES),
  asyncHandler(async (_req, res) => {
    const stats = await managementService.getDashboardStats();
    res.status(HTTP_STATUS.OK).json(stats);
  }),
);

managementRouter.get(
  '/materials',
  authorizeRoles(DASHBOARD_ROLES),
  asyncHandler(async (req, res) => {
    const params: GetMaterialsReportParams = {
      from: parseOptionalDate(req.query.from, 'from'),
      to: parseOptionalDate(req.query.to, 'to'),
      companyId: parseOptionalPositiveInt(req.query.companyId, 'companyId'),
      categoryId: parseOptionalPositiveInt(req.query.categoryId, 'categoryId'),
    };

    const report = await managementService.getMaterialsReport(params);
    res.status(HTTP_STATUS.OK).json(report);
  }),
);

export default managementRouter;