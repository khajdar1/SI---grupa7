import { Router } from 'express';

const interventionsRouter = Router();

interventionsRouter.get('/', (_req, res) => {
  res.json({
    module: 'interventions',
    endpoints: ['GET /', 'POST /', 'GET /:id', 'PATCH /:id', 'PATCH /:id/status', 'PATCH /:id/priority', 'PATCH /:id/assignees'],
  });
});

export default interventionsRouter;