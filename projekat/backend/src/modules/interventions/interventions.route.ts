import { Router } from 'express';

import { prisma } from '../../config/database';
import { asyncHandler } from '../../shared/async-handler';

const interventionsRouter = Router();

interventionsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const interventions = await prisma.intervention.findMany({
      where: {
        archived: false,
      },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        faultReport: {
          select: {
            id: true,
            description: true,
            location: true,
            reportedAt: true,
          },
        },
      },
    });

    res.json(interventions);
  }),
);

export default interventionsRouter;