import { Router } from 'express';

const notificationsRouter = Router();

notificationsRouter.get('/', (_req, res) => {
  res.json({
    module: 'notifications',
    endpoints: ['GET /', 'GET /unread', 'PATCH /:id/read'],
  });
});

export default notificationsRouter;