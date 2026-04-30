import { Router } from 'express';
import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';

const interventionsRouter = Router();

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

    const response = interventions.map((intervention) => ({
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

export default interventionsRouter;
