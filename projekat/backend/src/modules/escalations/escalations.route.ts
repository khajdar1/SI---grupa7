import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors';

const escalationsRouter = Router();

const COORDINATOR_ROLES = ['koordinator', 'coordinator', 'admin', 'administrator'];
const MANAGEMENT_ROLES = ['menadzment', 'management', 'admin', 'administrator'];
const ESCALATION_VIEW_ROLES = [
  'koordinator',
  'coordinator',
  'menadzment',
  'management',
  'admin',
  'administrator',
];

const createEscalationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Reason must be at least 5 characters.')
    .max(1000, 'Reason must be at most 1000 characters.'),
  comment: z
    .string()
    .trim()
    .min(1, 'Comment is required.')
    .max(5000, 'Comment must be at most 5000 characters.'),
});

const reviewEscalationSchema = z.object({});

/**
 * POST /api/v1/escalations/:interventionId
 * Coordinator escalates an intervention. Requires coordinator/admin role.
 */
escalationsRouter.post(
  '/:interventionId',
  authorizeRoles(COORDINATOR_ROLES),
  validate(createEscalationSchema),
  asyncHandler(async (req, res) => {
    const interventionId = Number(req.params.interventionId);
    if (!Number.isInteger(interventionId) || interventionId <= 0) {
      throw new BadRequestError('Invalid intervention ID.');
    }

    const escalatedById = req.user?.localUserId;
    if (!escalatedById) {
      throw new ForbiddenError('Authenticated user not found in local database.');
    }

    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { id: true, name: true },
    });

    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    const { reason, comment } = req.body as z.infer<typeof createEscalationSchema>;

    const escalation = await prisma.interventionEscalation.create({
      data: {
        interventionId,
        escalatedById,
        reason,
        comment,
      },
      include: {
        escalatedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
    });

    return res.status(HTTP_STATUS.CREATED).json(escalation);
  }),
);

/**
 * GET /api/v1/escalations/:interventionId
 * Get all escalations for an intervention. Visible to coordinator, management, admin.
 */
escalationsRouter.get(
  '/:interventionId',
  authorizeRoles(ESCALATION_VIEW_ROLES),
  asyncHandler(async (req, res) => {
    const interventionId = Number(req.params.interventionId);
    if (!Number.isInteger(interventionId) || interventionId <= 0) {
      throw new BadRequestError('Invalid intervention ID.');
    }

    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { id: true },
    });

    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    const escalations = await prisma.interventionEscalation.findMany({
      where: { interventionId },
      include: {
        escalatedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(HTTP_STATUS.OK).json(escalations);
  }),
);

/**
 * PATCH /api/v1/escalations/:escalationId/review
 * Management marks an escalation as reviewed.
 */
escalationsRouter.patch(
  '/:escalationId/review',
  authorizeRoles(MANAGEMENT_ROLES),
  asyncHandler(async (req, res) => {
    const escalationId = Number(req.params.escalationId);
    if (!Number.isInteger(escalationId) || escalationId <= 0) {
      throw new BadRequestError('Invalid escalation ID.');
    }

    const reviewedById = req.user?.localUserId;
    if (!reviewedById) {
      throw new ForbiddenError('Authenticated user not found in local database.');
    }

    const escalation = await prisma.interventionEscalation.findUnique({
      where: { id: escalationId },
      select: { id: true, reviewedAt: true },
    });

    if (!escalation) {
      throw new NotFoundError('Escalation not found.');
    }

    if (escalation.reviewedAt) {
      throw new BadRequestError('Escalation has already been reviewed.');
    }

    const updated = await prisma.interventionEscalation.update({
      where: { id: escalationId },
      data: {
        reviewedAt: new Date(),
        reviewedById,
      },
      include: {
        escalatedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
      },
    });

    return res.status(HTTP_STATUS.OK).json(updated);
  }),
);

/**
 * GET /api/v1/escalations
 * Management dashboard: list all open (unreviewed) escalations with intervention info.
 */
escalationsRouter.get(
  '/',
  authorizeRoles(MANAGEMENT_ROLES),
  asyncHandler(async (req, res) => {
    const includeReviewed = req.query.includeReviewed === 'true';

    const escalations = await prisma.interventionEscalation.findMany({
      where: includeReviewed ? {} : { reviewedAt: null },
      include: {
        escalatedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        intervention: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            companyId: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(HTTP_STATUS.OK).json(escalations);
  }),
);

export default escalationsRouter;
