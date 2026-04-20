import { Router } from 'express';

const historyRouter = Router();

historyRouter.get('/', (_req, res) => {
  res.json({
    module: 'history',
    endpoints: ['GET /status-changes', 'GET /interventions/:interventionId', 'GET /users/:userId'],
  });
});

export default historyRouter;