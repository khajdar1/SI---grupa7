import { Router } from 'express';

const companiesRouter = Router();

companiesRouter.get('/', (_req, res) => {
  res.json({
    module: 'companies',
    endpoints: ['GET /', 'POST /', 'PATCH /:id'],
  });
});

export default companiesRouter;