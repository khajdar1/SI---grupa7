import { Router } from 'express';
import {
  registerController,
  loginController,
  logoutController,
  resetPasswordController,
} from '../../controllers/auth.controller';

import { authRateLimiter } from '../../middleware/rateLimit.middleware';

const authRouter = Router();

authRouter.get('/', (_req, res) => {
  res.json({
    module: 'auth',
    flow: 'local-profile-plus-external-identity',
    endpoints: ['POST /register', 'POST /login', 'POST /logout', 'POST /reset-password'],
  });
});

authRouter.post('/register', authRateLimiter, registerController);
authRouter.post('/login', authRateLimiter, loginController);
authRouter.post('/reset-password', authRateLimiter, resetPasswordController);
authRouter.post('/logout', logoutController);

export default authRouter;