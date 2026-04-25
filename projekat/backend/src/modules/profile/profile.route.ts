import { Router } from 'express';

const profileRouter = Router();

profileRouter.get('/', (_req, res) => {
  res.json({
    module: 'profile',
    endpoints: ['GET /me', 'PATCH /me'],
  });
});

export default profileRouter;