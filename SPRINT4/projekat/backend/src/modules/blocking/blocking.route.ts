import { Router } from 'express';

const blockingRouter = Router();

blockingRouter.get('/', (_req, res) => {
  res.json({
    module: 'blocking',
    endpoints: ['GET /', 'POST /', 'PATCH /:id/unblock', 'DELETE /:id'],
  });
});

export default blockingRouter;