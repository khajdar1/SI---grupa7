import { Router } from 'express';

const slaRouter = Router();

slaRouter.get('/', (_req, res) => {
  res.json({
    module: 'sla',
    endpoints: ['GET /', 'PUT /'],
  });
});

export default slaRouter;