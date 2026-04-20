import { Router } from 'express';

const systemConfigRouter = Router();

systemConfigRouter.get('/', (_req, res) => {
  res.json({
    module: 'system-config',
    endpoints: ['GET /', 'PATCH /sla', 'PATCH /language', 'PATCH /notifications'],
  });
});

export default systemConfigRouter;