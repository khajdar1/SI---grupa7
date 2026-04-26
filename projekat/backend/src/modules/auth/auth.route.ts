import { Router } from 'express';
import { registerController } from '../../controllers/auth.controller';

const authRouter = Router();

authRouter.get('/', (_req, res) => {
  res.json({
    module: 'auth',
    flow: 'local-profile-plus-external-identity',
    endpoints: ['POST /register', 'POST /login', 'POST /logout'],
  });
});

authRouter.post('/register', registerController);

export default authRouter;