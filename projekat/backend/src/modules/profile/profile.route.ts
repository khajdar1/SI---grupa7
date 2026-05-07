import { createModuleInfoRouter } from '../../shared/module-info-router';

const profileRouter = createModuleInfoRouter({
  module: 'profile',
  endpoints: ['GET /me', 'PATCH /me'],
});

export default profileRouter;
