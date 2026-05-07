import { createModuleInfoRouter } from '../../shared/module-info-router';

const messagesRouter = createModuleInfoRouter({
  module: 'messages',
  endpoints: ['GET /tickets/:ticketId', 'POST /tickets/:ticketId'],
});

export default messagesRouter;
