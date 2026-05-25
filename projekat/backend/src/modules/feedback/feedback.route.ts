import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { BadRequestError, UnauthorizedError } from '../../shared/errors';
import {
  FEEDBACK_COMMENT_MAX_LENGTH,
  FeedbackService,
  type CreateFeedbackInput,
  type FeedbackRecord,
  type FeedbackRepository,
} from './feedback.service';

const feedbackRouter = Router();

const MANAGE_FEEDBACK_ROLES = new Set([
  'koordinator',
  'coordinator',
  'admin',
  'administrator',
]);

const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(FEEDBACK_COMMENT_MAX_LENGTH)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

const FEEDBACK_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
} as const;

const FEEDBACK_SELECT = {
  id: true,
  interventionId: true,
  userId: true,
  rating: true,
  comment: true,
  createdAt: true,
  user: { select: FEEDBACK_USER_SELECT },
} as const;

const feedbackRepository: FeedbackRepository = {
  findInterventionById: (id) =>
    prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        faultReport: {
          select: {
            userId: true,
          },
        },
      },
    }),

  findByInterventionId: (interventionId) =>
    prisma.feedback.findUnique({
      where: { interventionId },
      select: FEEDBACK_SELECT,
    }),

  create: (interventionId, userId, input) =>
    prisma.feedback.create({
      data: {
        interventionId,
        userId,
        rating: input.rating,
        comment: input.comment,
      },
      select: FEEDBACK_SELECT,
    }),
};

const feedbackService = new FeedbackService(feedbackRepository);

function parseInterventionId(raw: string | string[] | undefined): number {
  if (typeof raw !== 'string') {
    throw new BadRequestError('Invalid intervention identifier.');
  }

  const id = Number(raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestError('Invalid intervention identifier.');
  }

  return id;
}

function canManageFeedback(roles: string[]): boolean {
  return roles.some((role) => MANAGE_FEEDBACK_ROLES.has(role.toLowerCase()));
}

function requireLocalUserId(req: import('express').Request): number {
  const userId = req.user?.localUserId;

  if (!userId) {
    throw new UnauthorizedError('Authenticated user is not linked to a local user record.');
  }

  return userId;
}

function mapFeedback(record: FeedbackRecord) {
  return {
    id: record.id,
    interventionId: record.interventionId,
    userId: record.userId,
    rating: record.rating,
    comment: record.comment,
    createdAt: record.createdAt.toISOString(),
    user: {
      id: record.user.id,
      firstName: record.user.firstName,
      lastName: record.user.lastName,
      username: record.user.username,
    },
  };
}

feedbackRouter.get(
  '/:interventionId',
  asyncHandler(async (req, res) => {
    const interventionId = parseInterventionId(req.params.interventionId);
    const userId = requireLocalUserId(req);
    const feedback = await feedbackService.getByInterventionId(interventionId, {
      userId,
      canManageFeedback: canManageFeedback(req.user?.roles ?? []),
    });

    res.json(feedback ? mapFeedback(feedback) : null);
  }),
);

feedbackRouter.post(
  '/:interventionId',
  validate(feedbackSchema),
  asyncHandler(async (req, res) => {
    const interventionId = parseInterventionId(req.params.interventionId);
    const userId = requireLocalUserId(req);
    const input = req.body as CreateFeedbackInput;

    const feedback = await feedbackService.create(interventionId, userId, input);

    res.status(HTTP_STATUS.CREATED).json(mapFeedback(feedback));
  }),
);

export default feedbackRouter;
