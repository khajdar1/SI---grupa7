import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    service: 'si-grupa7-backend',
    status: 'ok',
  });
});

export default healthRouter;