import { Router } from 'express';
import { authenticate, authorizeRoles } from "../../middleware/auth.middleware";

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

export default authRouter;