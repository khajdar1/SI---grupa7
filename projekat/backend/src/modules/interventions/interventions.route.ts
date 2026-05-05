import { Router } from 'express';
import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';
import { authorizeRoles } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../shared/async-handler';
import { BadRequestError, NotFoundError } from '../../shared/errors';

const interventionsRouter = Router();

const VIEW_ROLES = ['koordinator', 'admin', 'administrator'];

interventionsRouter.get('/', async (_req, res) => {
  try {
    const interventions = await prisma.intervention.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response = interventions.map((intervention: (typeof interventions)[number]) => ({
      id: String(intervention.id),
      title: intervention.name,
      categoryName: intervention.category.name,
      priority: intervention.priority,
      status: intervention.status,
      owner: intervention.creator.username,
    }));

    res.json(response);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL).json({ message: 'Failed to fetch interventions' });
  }
});

interventionsRouter.get(
  '/:id',
  authorizeRoles(VIEW_ROLES),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid intervention identifier.');
    }

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, username: true } },
        company: { select: { id: true, name: true } },
      },
    });

    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    res.json({
      id: intervention.id,
      name: intervention.name,
      description: intervention.description,
      location: intervention.location,
      priority: intervention.priority,
      status: intervention.status,
      type: intervention.type,
      createdAt: intervention.createdAt,
      startedAt: intervention.startedAt,
      dueAt: intervention.dueAt,
      category: intervention.category,
      creator: intervention.creator,
      company: intervention.company,
    });
  }),
);

interventionsRouter.get(
  '/:id/attachments',
  authorizeRoles(VIEW_ROLES),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid intervention identifier.');
    }

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      select: {
        id: true,
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            createdAt: true,
            storageKey: true,
            url: true,
          },
        },
        faultReport: {
          select: {
            attachments: {
              select: {
                id: true,
                fileName: true,
                mimeType: true,
                fileSize: true,
                createdAt: true,
                storageKey: true,
                url: true,
              },
            },
          },
        },
      },
    });

    if (!intervention) {
      throw new NotFoundError('Intervention not found.');
    }

    // Combine direct attachments with fault-report attachments, deduplicating by id
    const direct = intervention.attachments;
    const fromFaultReport = intervention.faultReport?.attachments ?? [];
    const seenIds = new Set<number>();

    const combined = [...direct, ...fromFaultReport].filter((att) => {
      if (seenIds.has(att.id)) return false;
      seenIds.add(att.id);
      return true;
    });

    res.json(combined);
  }),
);

export default interventionsRouter;
