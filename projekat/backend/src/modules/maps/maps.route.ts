import { createModuleInfoRouter } from '../../shared/module-info-router';

const mapsRouter = createModuleInfoRouter({
  module: 'maps',
  endpoints: ['GET /interventions', 'GET /interventions/:id', 'GET /locations'],
});

export default mapsRouter;
