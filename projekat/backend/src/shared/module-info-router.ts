import { Router } from 'express';

export interface ModuleInfo {
  module: string;
  endpoints: string[];
}

export function createModuleInfoRouter(info: ModuleInfo) {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(info);
  });

  return router;
}
