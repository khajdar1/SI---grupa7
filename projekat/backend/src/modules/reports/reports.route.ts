import { Router } from 'express';

import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { AuditService } from '../../shared/audit.service';
import { BadRequestError, ForbiddenError } from '../../shared/errors';
import { parseMaterialItems, serializeMaterialItems } from '../../shared/material-item';
import { createReportSchema, updateReportSchema } from './reports.schema';
import {
  ReportService,
  type CreateReportInput,
  type IReportRepository,
  type ReportRecord,
  type UpdateReportInput,
} from '../../services/reports.service';

const VIEW_ROLES = [
  'koordinator',
  'coordinator',
  'admin',
  'administrator',
  'serviser',
  'menadzment',
  'management',
  'supportagent',
  'agentpodrske',
];

const WRITE_ROLES = ['serviser'];

const REPORT_AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
} as const;

const REPORT_SELECT = {
  id: true,
  interventionId: true,
  authorId: true,
  description: true,
  material: true, 
  notes: true,
  reportDate: true,
  status: true,
  author: { select: REPORT_AUTHOR_SELECT },
} as const;

const prismaReportRepository: IReportRepository = {
  findInterventionById: (id) =>
    prisma.intervention.findUnique({
      where: { id },
      select: { id: true, status: true },
    }),

  findByInterventionId: (interventionId) =>
    prisma.report.findFirst({
      where: { interventionId },
      select: REPORT_SELECT,
    }),

  findById: (id) =>
    prisma.report.findUnique({
      where: { id },
      select: REPORT_SELECT,
    }),

  isUserAssignedToIntervention: async (interventionId, userId) => {
    const assignment = await prisma.assignment.findFirst({
      where: { interventionId, userId },
      select: { id: true },
    });
    return assignment !== null;
  },

  create: (interventionId, authorId, input) =>
    prisma.report.create({
      data: {
        interventionId,
        authorId,
        description: input.description,
        material: serializeMaterialItems(input.materialItems),
        notes: input.notes ?? null,
      },
      select: REPORT_SELECT,
    }),

  update: (id, input) =>
    prisma.report.update({
      where: { id },
      data: {
        ...(input.description !== undefined && { description: input.description }),
        ...(input.materialItems !== undefined && {
          material: serializeMaterialItems(input.materialItems),
        }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      select: REPORT_SELECT,
    }),

  finalizeReport: (id) =>
    prisma.report.update({
      where: { id },
      data: { status: 'FINALIZED' },
      select: REPORT_SELECT,
    }),
};

const reportService = new ReportService(prismaReportRepository);

function parseInterventionId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError('Invalid intervention identifier.');
  }
  return id;
}

function mapReport(record: ReportRecord) {
  return {
    id: record.id,
    interventionId: record.interventionId,
    description: record.description,
    materialItems: parseMaterialItems(record.material),
    notes: record.notes,
    status: record.status,
    author: {
      id: record.author.id,
      firstName: record.author.firstName,
      lastName: record.author.lastName,
      username: record.author.username,
    },
    reportDate: record.reportDate.toISOString(),
  };
}

async function resolveLocalUserId(req: import('express').Request): Promise<number> {
  const providerSubject = req.user?.id?.trim();
  const username = req.user?.username?.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(providerSubject
          ? [{ externalIdentities: { some: { provider: 'keycloak', providerSubject } } }]
          : []),
        ...(username ? [{ username }] : []),
      ],
    },
    select: { id: true },
  });

  if (!user) {
    throw new ForbiddenError('Authenticated user is not linked to a local user record.');
  }
  return user.id;
}

function buildUpdateDiff(input: UpdateReportInput): string {
  const changed = Object.keys(input) as (keyof UpdateReportInput)[];
  return changed.length > 0 ? `Fields updated: ${changed.join(', ')}.` : 'No fields changed.';
}

const reportsRouter = Router({ mergeParams: true });

reportsRouter.get(
  '/',
  authorizeRoles(VIEW_ROLES),
  asyncHandler(async (req, res) => {
    const interventionId = parseInterventionId(String(req.params.interventionId));
    const report = await reportService.getByInterventionId(interventionId);

    if (!report) {
      res.status(HTTP_STATUS.OK).json({ data: null });
      return;
    }

    res.json(mapReport(report));
  }),
);

reportsRouter.get(
  '/material-suggestions',
  authorizeRoles(VIEW_ROLES),
  asyncHandler(async (req, res) => {
    const interventionId = parseInterventionId(String(req.params.interventionId));

    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { companyId: true },
    });

    if (!intervention) {
      throw new BadRequestError('Intervention not found.');
    }

    const reports = await prisma.report.findMany({
      where: {
        material: { not: null },
        intervention: { companyId: intervention.companyId },
      },
      select: { material: true },
    });

    const nameCounts = new Map<string, number>();
    for (const report of reports) {
      const items = parseMaterialItems(report.material);
      for (const item of items) {
        nameCounts.set(item.name, (nameCounts.get(item.name) ?? 0) + 1);
      }
    }

    const suggestions = [...nameCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    res.status(HTTP_STATUS.OK).json({ data: suggestions });
  }),
);

reportsRouter.post(
  '/',
  authorizeRoles(WRITE_ROLES),
  validate(createReportSchema),
  asyncHandler(async (req, res) => {
    const interventionId = parseInterventionId(String(req.params.interventionId));
    const authorId = await resolveLocalUserId(req);
    const input = req.body as CreateReportInput;

    const report = await reportService.create(interventionId, authorId, input);

    await AuditService.log({
      action: 'REPORT_CREATED',
      entity: 'Report',
      entityId: report.id,
      userId: authorId,
      details: `Report created for intervention #${interventionId} by user #${authorId}. Materials recorded: ${parseMaterialItems(report.material).length}.`,
    });

    res.status(HTTP_STATUS.CREATED).json({
      message: 'Report submitted successfully.',
      data: mapReport(report),
    });
  }),
);

reportsRouter.patch(
  '/',
  authorizeRoles(WRITE_ROLES),
  validate(updateReportSchema),
  asyncHandler(async (req, res) => {
    const interventionId = parseInterventionId(String(req.params.interventionId));
    const actorId = await resolveLocalUserId(req);
    const input = req.body as UpdateReportInput;

    const report = await reportService.update(interventionId, actorId, input);

    await AuditService.log({
      action: 'REPORT_UPDATED',
      entity: 'Report',
      entityId: report.id,
      userId: actorId,
      details: `Report #${report.id} for intervention #${interventionId} updated by user #${actorId}. ${buildUpdateDiff(input)}`,
    });

    res.json({
      message: 'Report updated successfully.',
      data: mapReport(report),
    });
  }),
);

export default reportsRouter;