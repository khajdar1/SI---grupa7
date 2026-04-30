import { Router } from 'express';
import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';

const companiesRouter = Router();

companiesRouter.get('/', async (_req, res) => {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(companies);
  } catch {
    res.status(HTTP_STATUS.INTERNAL).json({ message: 'Failed to fetch companies' });
  }
});

export default companiesRouter;
