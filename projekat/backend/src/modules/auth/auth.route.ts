import { Router } from 'express';
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";
import { registerController } from '../../controllers/auth.controller';

import { registerController, loginController, logoutController, resetPasswordController } from '../../controllers/auth.controller';
 
const authRouter = Router();

authRouter.get('/', authenticate, (req, res) => {
  res.json({
    module: 'auth',
    flow: 'local-profile-plus-external-identity',
    endpoints: ['POST /register', 'POST /login', 'POST /logout'],
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
 
authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.post('/logout', logoutController);
authRouter.post('/reset-password', resetPasswordController);
 
export default authRouter;