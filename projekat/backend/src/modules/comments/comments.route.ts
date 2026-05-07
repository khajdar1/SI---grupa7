import { Router } from 'express';
import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';

const commentsRouter = Router();

commentsRouter.get('/', (_req, res) => {
  res.json({
    module: 'comments',
    endpoints: ['GET /intervention/:id', 'POST /intervention/:id'],
  });
});

commentsRouter.get('/intervention/:id', async (req, res) => {
  try {
    const interventionId = Number(req.params.id);

    if (!Number.isInteger(interventionId) || interventionId <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid intervention ID' });
    }

    const comments = await prisma.interventionComment.findMany({
      where: { interventionId },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(comments);
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL).json({ message: 'Failed to fetch comments' });
  }
});

commentsRouter.post('/intervention/:id', async (req, res) => {
  try {
    const interventionId = Number(req.params.id);

    if (!Number.isInteger(interventionId) || interventionId <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Invalid intervention ID' });
    }

    // Use req.user set by auth middleware — don't trust client-supplied authorId/role
    const authorId = req.user?.localUserId;
    const userRoles = req.user?.roles ?? [];

    if (!authorId) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'Authenticated user not found in local database' });
    }

    const ALLOWED_ROLES = ['coordinator', 'koordinator', 'servicer', 'serviser'];
    const hasAllowedRole = userRoles.some((r) => ALLOWED_ROLES.includes(r.toLowerCase()));

    if (!hasAllowedRole) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ message: 'Only coordinators and servicers can add comments' });
    }

    const { text } = req.body as { text?: unknown };

    if (typeof text !== 'string' || text.trim().length < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Comment text cannot be empty' });
    }

    // Verify intervention exists
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
      select: { id: true },
    });

    if (!intervention) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Intervention not found' });
    }

    const comment = await prisma.interventionComment.create({
      data: {
        text: text.trim(),
        interventionId,
        authorId,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    return res.status(HTTP_STATUS.CREATED).json(comment);
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL).json({ message: 'Failed to create comment' });
  }
});

export default commentsRouter;
