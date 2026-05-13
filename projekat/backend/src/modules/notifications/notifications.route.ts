import { createModuleInfoRouter } from '../../shared/module-info-router';

const notificationsRouter = createModuleInfoRouter({
  module: 'notifications',
  endpoints: ['GET /', 'GET /unread', 'PATCH /:id/read'],
});

export default notificationsRouter;
