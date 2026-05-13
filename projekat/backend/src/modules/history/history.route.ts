import { createModuleInfoRouter } from '../../shared/module-info-router';

const historyRouter = createModuleInfoRouter({
  module: 'history',
  endpoints: ['GET /status-changes', 'GET /interventions/:interventionId', 'GET /users/:userId'],
});

export default historyRouter;
