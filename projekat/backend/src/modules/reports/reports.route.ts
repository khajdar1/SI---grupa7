import { createModuleInfoRouter } from '../../shared/module-info-router';

const reportsRouter = createModuleInfoRouter({
  module: 'reports',
  endpoints: ['GET /', 'GET /:interventionId', 'POST /:interventionId'],
});

export default reportsRouter;
