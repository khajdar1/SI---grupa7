import { Router } from 'express';

const ticketsRouter = Router();

ticketsRouter.get('/', (_req, res) => {
  res.json({
    module: 'tickets',
    endpoints: ['GET /', 'POST /', 'GET /:id', 'PATCH /:id/status', 'POST /:id/messages'],
  });
});

export default ticketsRouter;