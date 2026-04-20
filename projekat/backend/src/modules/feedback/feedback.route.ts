import { Router } from 'express';

const feedbackRouter = Router();

feedbackRouter.get('/', (_req, res) => {
  res.json({
    module: 'feedback',
    endpoints: ['GET /:interventionId', 'POST /:interventionId'],
  });
});

export default feedbackRouter;