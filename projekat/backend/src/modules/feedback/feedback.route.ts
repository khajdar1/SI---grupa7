import { createModuleInfoRouter } from '../../shared/module-info-router';

const feedbackRouter = createModuleInfoRouter({
  module: 'feedback',
  endpoints: ['GET /:interventionId', 'POST /:interventionId'],
});

export default feedbackRouter;
