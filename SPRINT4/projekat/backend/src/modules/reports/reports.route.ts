import { Router } from 'express';

const reportsRouter = Router();

reportsRouter.get('/', (_req, res) => {
  res.json({
    module: 'reports',
    endpoints: ['GET /', 'GET /:interventionId', 'POST /:interventionId'],
  });
});

export default reportsRouter;