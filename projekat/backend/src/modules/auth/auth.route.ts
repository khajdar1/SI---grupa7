import { Router } from 'express';

const authRouter = Router();

authRouter.get('/', (_req, res) => {
  res.json({
    module: 'auth',
    endpoints: ['POST /login', 'POST /register', 'POST /logout', 'POST /forgot-password', 'POST /reset-password'],
  });
});

export default authRouter;