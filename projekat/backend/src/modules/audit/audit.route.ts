import { Router } from 'express';

const auditRouter = Router();

auditRouter.get('/', (_req, res) => {
  res.json({
    module: 'audit',
    endpoints: ['GET /'],
  });
});

export default auditRouter;