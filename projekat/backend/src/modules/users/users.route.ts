import { Router } from 'express';

const usersRouter = Router();

usersRouter.get('/', (_req, res) => {
  res.json({
    module: 'users',
    endpoints: ['GET /', 'GET /:id', 'PATCH /:id', 'PATCH /:id/activate', 'PATCH /:id/deactivate'],
  });
});

export default usersRouter;