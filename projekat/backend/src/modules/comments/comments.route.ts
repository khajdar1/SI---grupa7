import { Router } from 'express';
import { prisma } from '../../config/database';
import { HTTP_STATUS } from '../../constants';

const commentsRouter = Router();

commentsRouter.get('/', (_req, res) => {
  res.json({
    module: 'comments',
    endpoints: ['GET /:interventionId', 'POST /:interventionId'],
  });
});


commentsRouter.get('/intervention/:id', async (req, res) => {
  try {
    const interventionId = Number(req.params.id);

    const comments = await prisma.interventionComment.findMany({
      where: {
        interventionId,
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(comments);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL).json({
      message: 'Failed to fetch comments',
    });
  }
});

commentsRouter.post('/intervention/:id', async (req, res) => {
  try {
    const interventionId = Number(req.params.id);
    const { text, authorId, role } = req.body;

    if (!text || text.trim().length < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Comment cannot be empty',
      });
    }

    const allowedRoles = ['COORDINATOR', 'SERVICER'];

    if (!allowedRoles.includes(role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You are not allowed to comment',
      });
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

    res.status(HTTP_STATUS.CREATED).json(comment);
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL).json({
      message: 'Failed to create comment',
    });
  }
});




export default commentsRouter;