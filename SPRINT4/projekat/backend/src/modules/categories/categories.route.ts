import { Router } from 'express';

const categoriesRouter = Router();

categoriesRouter.get('/', (_req, res) => {
  res.json({
    module: 'categories',
    endpoints: ['GET /', 'POST /', 'PATCH /:id', 'PATCH /:id/deactivate'],
  });
});

export default categoriesRouter;