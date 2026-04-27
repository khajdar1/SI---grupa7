import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema } from './auth.schema';

const authRouter = Router();

authRouter.get('/', (_req, res) => {
  res.json({
    module: 'auth',
    flow: 'local-profile-plus-external-identity',
    endpoints: ['POST /register', 'POST /login', 'POST /logout'],
  });
});

authRouter.post('/register', validate(registerSchema), (req, res) => {
  res.json({
    message: 'Register data valid',
    data: req.body,
  });
});

authRouter.post('/login', validate(loginSchema), (req, res) => {
  res.json({
    message: 'Login data valid',
    data: req.body,
  });
});

export default authRouter;