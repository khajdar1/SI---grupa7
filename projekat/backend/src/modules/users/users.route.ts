import { Router } from 'express';

import { authenticate, authorizeRoles } from '../../middleware/auth.middleware';

const usersRouter = Router();

usersRouter.get('/', authenticate, authorizeRoles(['admin']), (_req, res) => {
  res.json({
    module: 'users',
    endpoints: ['GET /', 'GET /:id', 'PATCH /:id', 'PATCH /:id/activate', 'PATCH /:id/deactivate'],
  });
});

export default usersRouter;