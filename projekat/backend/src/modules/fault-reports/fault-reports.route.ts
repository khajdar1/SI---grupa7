import { Router } from 'express';

const faultReportsRouter = Router();

faultReportsRouter.get('/', (_req, res) => {
  res.json({
    module: 'fault-reports',
    endpoints: ['GET /', 'POST /', 'GET /:id', 'PATCH /:id', 'DELETE /:id'],
  });
});

export default faultReportsRouter;