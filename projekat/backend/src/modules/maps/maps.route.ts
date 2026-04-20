import { Router } from 'express';

const mapsRouter = Router();

mapsRouter.get('/', (_req, res) => {
  res.json({
    module: 'maps',
    endpoints: ['GET /interventions', 'GET /interventions/:id', 'GET /locations'],
  });
});

export default mapsRouter;