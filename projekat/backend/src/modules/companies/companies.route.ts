import { Router } from 'express';

import { prisma } from '../../config/database';
import { asyncHandler } from '../../shared/async-handler';

const companiesRouter = Router();

companiesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        contact: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(companies);
  }),
);

export default companiesRouter;