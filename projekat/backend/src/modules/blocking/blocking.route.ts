import { createModuleInfoRouter } from '../../shared/module-info-router';

const blockingRouter = createModuleInfoRouter({
  module: 'blocking',
  endpoints: ['GET /', 'POST /', 'PATCH /:id/unblock', 'DELETE /:id'],
});

export default blockingRouter;
