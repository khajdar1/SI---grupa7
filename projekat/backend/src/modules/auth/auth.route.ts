import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema } from './auth.schema';

import { registerController, loginController, logoutController, resetPasswordController } from '../../controllers/auth.controller';
 
const authRouter = Router();

authRouter.get('/', (_req, res) => {
  res.json({
    module: 'auth',
    flow: 'local-profile-plus-external-identity',
    endpoints: ['POST /register', 'POST /login', 'POST /logout'],
  });
});
 
authRouter.post('/register', validate(registerSchema), registerController);
authRouter.post('/login', validate(loginSchema), loginController);
authRouter.post('/logout', logoutController);
authRouter.post('/reset-password', resetPasswordController);
 
export default authRouter;