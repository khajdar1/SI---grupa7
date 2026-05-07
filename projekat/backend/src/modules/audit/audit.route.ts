import { createModuleInfoRouter } from '../../shared/module-info-router';

const auditRouter = createModuleInfoRouter({
  module: 'audit',
  endpoints: ['GET /'],
});

export default auditRouter;
