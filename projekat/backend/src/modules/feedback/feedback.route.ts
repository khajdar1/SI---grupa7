import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
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
  'menadzment',
  'management',
]);

const FEEDBACK_ANALYTICS_ROLES = [
  'Koordinator',
  'Coordinator',
  'koordinator',
  'coordinator',
  'Admin',
  'Administrator',
  'admin',
  'administrator',
  'Menadzment',
  'Management',
  'menadzment',
  'management',
];

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

const feedbackAnalyticsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  companyId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  servicerId: z.coerce.number().int().positive().optional(),
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

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

feedbackRouter.get(
  '/analytics',
  authorizeRoles(FEEDBACK_ANALYTICS_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = feedbackAnalyticsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new BadRequestError('Invalid feedback analytics filters.');
    }

    const input = parsed.data;
    const negativeThreshold = 2;
    const createdAt =
      input.from || input.to
        ? {
            ...(input.from ? { gte: input.from } : {}),
            ...(input.to ? { lte: input.to } : {}),
          }
        : undefined;

    const records = await prisma.feedback.findMany({
      where: {
        ...(createdAt ? { createdAt } : {}),
        intervention: {
          ...(input.companyId ? { companyId: input.companyId } : {}),
          ...(input.categoryId ? { categoryId: input.categoryId } : {}),
          ...(input.servicerId
            ? {
                assignments: {
                  some: {
                    userId: input.servicerId,
                  },
                },
              }
            : {}),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        intervention: {
          select: {
            id: true,
            name: true,
            status: true,
            company: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            assignments: {
              select: {
                userId: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
              },
            },
            reports: {
              select: {
                authorId: true,
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
              },
              orderBy: { reportDate: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const trends = new Map<string, typeof records>();
    const byCompany = new Map<number, typeof records>();
    const byCategory = new Map<number, typeof records>();
    const byServicer = new Map<number, typeof records>();

    records.forEach((record) => {
      const period = monthKey(record.createdAt);
      trends.set(period, [...(trends.get(period) ?? []), record]);
      byCompany.set(record.intervention.company.id, [...(byCompany.get(record.intervention.company.id) ?? []), record]);
      byCategory.set(record.intervention.category.id, [...(byCategory.get(record.intervention.category.id) ?? []), record]);
      if (record.intervention.assignments.length > 0) {
        record.intervention.assignments.forEach((assignment) => {
          byServicer.set(assignment.userId, [...(byServicer.get(assignment.userId) ?? []), record]);
        });
      } else if (record.intervention.reports[0]) {
        const reportAuthorId = record.intervention.reports[0].authorId;
        byServicer.set(reportAuthorId, [...(byServicer.get(reportAuthorId) ?? []), record]);
      } else {
        byServicer.set(0, [...(byServicer.get(0) ?? []), record]);
      }
    });

    const summarize = (items: typeof records) => ({
      feedbackCount: items.length,
      averageRating: average(items.map((item) => item.rating)),
      negativeCount: items.filter((item) => item.rating <= negativeThreshold).length,
    });

    const ratingDistribution = Array.from({ length: 5 }, (_, index) => {
      const rating = index + 1;
      const count = records.filter((record) => record.rating === rating).length;

      return {
        rating,
        count,
        percentage: records.length > 0 ? Number(((count / records.length) * 100).toFixed(1)) : 0,
      };
    });

    res.json({
      summary: {
        ...summarize(records),
        negativeThreshold,
      },
      ratingDistribution,
      trends: Array.from(trends.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, items]) => ({ period, ...summarize(items) })),
      byCompany: Array.from(byCompany.entries()).map(([companyId, items]) => ({
        companyId,
        companyName: items[0]?.intervention.company.name ?? '',
        ...summarize(items),
      })),
      byCategory: Array.from(byCategory.entries()).map(([categoryId, items]) => ({
        categoryId,
        categoryName: items[0]?.intervention.category.name ?? '',
        ...summarize(items),
      })),
      byServicer: Array.from(byServicer.entries()).map(([servicerId, items]) => {
        if (servicerId === 0) {
          return {
            servicerId: null,
            servicerName: 'Unassigned',
            ...summarize(items),
          };
        }

        const assignment = items.flatMap((item) => item.intervention.assignments).find((item) => item.userId === servicerId);
        const report = items.flatMap((item) => item.intervention.reports).find((item) => item.authorId === servicerId);
        const user = assignment?.user ?? report?.author;
        return {
          servicerId,
          servicerName: user ? `${user.firstName} ${user.lastName}`.trim() || user.username : '',
          ...summarize(items),
        };
      }),
      negativeFeedback: records
        .filter((record) => record.rating <= negativeThreshold)
        .map((record) => ({
          id: record.id,
          interventionId: record.interventionId,
          interventionName: record.intervention.name,
          rating: record.rating,
          comment: record.comment,
          createdAt: record.createdAt.toISOString(),
          companyName: record.intervention.company.name,
          categoryName: record.intervention.category.name,
          user: record.user,
        })),
    });
  }),
);

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
