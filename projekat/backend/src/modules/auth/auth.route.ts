import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middleware/auth.middleware';
import {
  registerController,
  loginController,
  logoutController,
  resetPasswordController,
  confirmPasswordResetController,
} from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { confirmPasswordResetSchema, registerSchema, loginSchema, resetPasswordSchema } from './auth.schema';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';

const authRouter = Router();
const ADMIN_ROLES = ['admin', 'administrator'];

authRouter.get('/', authenticate, (req, res) => {
  res.json({
    module: 'auth',
    flow: 'local-profile-plus-external-identity',
    endpoints: ['POST /register', 'POST /login', 'POST /logout', 'POST /reset-password', 'POST /reset-password/confirm'],
  });
});

authRouter.get(
  '/admin',
  authenticate,
  authorizeRoles(ADMIN_ROLES),
  (req, res) => {
    res.json({ message: 'Admin ruta radi' });
  }
);

authRouter.post('/register', authRateLimiter, validate(registerSchema), registerController);
authRouter.post('/login', authRateLimiter, validate(loginSchema), loginController);
authRouter.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPasswordController);
authRouter.post('/reset-password/confirm', authRateLimiter, validate(confirmPasswordResetSchema), confirmPasswordResetController);
authRouter.post('/logout', logoutController);

export default authRouter;
