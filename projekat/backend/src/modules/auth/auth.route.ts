import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middleware/auth.middleware';
import {
  registerController,
  loginController,
  logoutController,
  resetPasswordController,
} from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema } from './auth.schema';
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
  authorizeRoles(['admin']),
  (req, res) => {
    res.json({ message: 'Admin ruta radi' });
  }
);

authRouter.post('/register', authRateLimiter, validate(registerSchema), registerController);
authRouter.post('/login', authRateLimiter, validate(loginSchema), loginController);
authRouter.post('/reset-password', authRateLimiter, resetPasswordController);
authRouter.post('/logout', logoutController);

export default authRouter;
