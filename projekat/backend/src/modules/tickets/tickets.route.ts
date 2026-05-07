import { createModuleInfoRouter } from '../../shared/module-info-router';

const ticketsRouter = createModuleInfoRouter({
  module: 'tickets',
  endpoints: ['GET /', 'POST /', 'GET /:id', 'PATCH /:id/status', 'POST /:id/messages'],
});

export default ticketsRouter;
