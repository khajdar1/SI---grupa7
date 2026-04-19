import { Router } from 'express';

const attachmentsRouter = Router();

attachmentsRouter.get('/', (_req, res) => {
  res.json({
    module: 'attachments',
    endpoints: ['POST /', 'GET /:id', 'DELETE /:id'],
  });
});

export default attachmentsRouter;