import { Router } from 'express';

const commentsRouter = Router();

commentsRouter.get('/', (_req, res) => {
  res.json({
    module: 'comments',
    endpoints: ['GET /:interventionId', 'POST /:interventionId'],
  });
});

export default commentsRouter;