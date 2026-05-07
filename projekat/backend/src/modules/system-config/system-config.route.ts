import { createModuleInfoRouter } from '../../shared/module-info-router';

const systemConfigRouter = createModuleInfoRouter({
  module: 'system-config',
  endpoints: ['GET /', 'PATCH /sla', 'PATCH /language', 'PATCH /notifications'],
});

export default systemConfigRouter;
