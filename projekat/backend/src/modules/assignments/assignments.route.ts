import { Router } from 'express';

const assignmentsRouter = Router();

assignmentsRouter.get('/', (_req, res) => {
  res.json({
    module: 'assignments',
    endpoints: ['GET /available-servicers', 'POST /:interventionId', 'PATCH /:interventionId', 'DELETE /:interventionId/:userId'],
  });
});

export default assignmentsRouter;