import { Router } from 'express';

import { prisma } from '../config/database';
import { asyncHandler } from '../shared/async-handler';
import { logger } from '../shared/logger';

const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const checks = {
      app: 'ok',
      database: 'unknown',
    };

    let status: 'ok' | 'degraded' = 'ok';

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch (error) {
      checks.database = 'down';
      status = 'degraded';

      logger.error('Health check database connection failed', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    res.status(status === 'ok' ? 200 : 503).json({
      service: 'si-grupa7-backend',
      status,
      timestamp: new Date().toISOString(),
      checks,
    });
  }),
);

export default healthRouter;
