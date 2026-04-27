import { Router } from 'express';
import { registerController, loginController, logoutController } from '../../controllers/auth.controller';
 
const authRouter = Router();
 
authRouter.get('/', (_req, res) => {
  res.json({
    module: 'auth',
    flow: 'local-profile-plus-external-identity',
    endpoints: ['POST /register', 'POST /login', 'POST /logout'],
  });
});
 
authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.post('/logout', logoutController);
 
export default authRouter;