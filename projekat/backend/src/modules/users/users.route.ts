import { validate } from '../../middleware/validate.middleware';
import { updateUserSchema } from './users.schema';
import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware';

const usersRouter = Router();

usersRouter.get('/', authenticate, (_req, res) => {
  res.json({
    module: 'users',
    endpoints: ['GET /', 'GET /:id', 'PATCH /:id', 'PATCH /:id/activate', 'PATCH /:id/deactivate'],
  });
});

usersRouter.patch('/:id', validate(updateUserSchema), (req, res) => {
  res.json({
    message: 'User update valid',
    data: req.body,
  });
});

export default usersRouter;
