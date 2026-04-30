import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  registerController,
  loginController,
  logoutController,
  resetPasswordController,
} from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema, resetPasswordSchema } from './auth.schema';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';

const authRouter = Router();

authRouter.get('/', authenticate, (req, res) => {
  res.json({
    module: 'auth',
    flow: 'local-profile-plus-external-identity',
    endpoints: ['POST /register', 'POST /login', 'POST /logout', 'POST /reset-password'],
  });
});

authRouter.get(
  '/admin',
  authenticate,
  (req, res) => {
    res.json({ message: 'Admin ruta radi' });
  }
);

authRouter.post('/register', authRateLimiter, validate(registerSchema), registerController);
authRouter.post('/login', authRateLimiter, validate(loginSchema), loginController);
authRouter.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPasswordController);
authRouter.post('/logout', logoutController);

export default authRouter;
